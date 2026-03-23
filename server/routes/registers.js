const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/asyncHandler');
const { getRisksWithControls } = require('../db/queries');
const { getRiskLevel } = require('../utils/riskLevel');

const db = () => global.__db;

const router = express.Router();
router.use(requireAuth);

// Search across all user's risks
router.get('/search', asyncHandler((req, res) => {
  const q = req.query.q;
  if (!q || q.trim().length < 2) return res.json([]);

  const term = `%${q.trim()}%`;
  const results = db().prepare(`
    SELECT r.*, reg.name as register_name, reg.id as register_id
    FROM risks r
    JOIN registers reg ON r.register_id = reg.id
    LEFT JOIN register_collaborators rc ON reg.id = rc.register_id AND rc.user_id = ?
    WHERE (reg.user_id = ? OR rc.user_id = ?)
      AND (r.title LIKE ? OR r.risk_id_label LIKE ? OR r.description LIKE ? OR r.risk_owner LIKE ?)
    ORDER BY r.inherent_risk_score DESC
    LIMIT 50
  `).all(req.session.userId, req.session.userId, req.session.userId, term, term, term, term);

  res.json(results);
}));

router.get('/', asyncHandler((req, res) => {
  // Own registers + shared registers
  const registers = db().prepare(`
    SELECT r.*,
      (SELECT COUNT(*) FROM risks WHERE register_id = r.id) as risk_count,
      (SELECT COUNT(*) FROM risks WHERE register_id = r.id AND inherent_risk_score >= 16) as critical_count,
      (SELECT COUNT(*) FROM risks WHERE register_id = r.id AND status = 'open') as open_count,
      CASE WHEN r.user_id = ? THEN 'owner' ELSE rc.role END as user_role
    FROM registers r
    LEFT JOIN register_collaborators rc ON r.id = rc.register_id AND rc.user_id = ?
    WHERE r.user_id = ? OR rc.user_id = ?
    ORDER BY r.updated_at DESC
  `).all(req.session.userId, req.session.userId, req.session.userId, req.session.userId);
  res.json(registers);
}));

router.post('/', asyncHandler((req, res) => {
  const { name, description, framework } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  const result = db().prepare(
    'INSERT INTO registers (user_id, name, description, framework) VALUES (?, ?, ?, ?)'
  ).run(req.session.userId, name, description || null, framework || 'general');

  const register = db().prepare('SELECT * FROM registers WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(register);
}));

router.get('/:id', asyncHandler((req, res) => {
  const register = db().prepare('SELECT * FROM registers WHERE id = ?').get(req.params.id);

  // Check owner or collaborator
  if (register && register.user_id !== req.session.userId) {
    const collab = db().prepare('SELECT 1 FROM register_collaborators WHERE register_id = ? AND user_id = ?').get(req.params.id, req.session.userId);
    if (!collab) {
      return res.status(404).json({ error: 'Register not found' });
    }
  }

  if (!register) {
    return res.status(404).json({ error: 'Register not found' });
  }

  const assets = db().prepare('SELECT * FROM assets WHERE register_id = ?').all(register.id);
  const threats = db().prepare('SELECT * FROM threats WHERE register_id = ?').all(register.id);
  const controls = db().prepare('SELECT * FROM controls WHERE register_id = ?').all(register.id);
  const risks = getRisksWithControls(register.id);

  res.json({ ...register, assets, threats, controls, risks });
}));

router.put('/:id', asyncHandler((req, res) => {
  const register = db().prepare('SELECT * FROM registers WHERE id = ?').get(req.params.id);
  if (!register) return res.status(404).json({ error: 'Register not found' });

  // Allow owner or editor
  if (register.user_id !== req.session.userId) {
    const collab = db().prepare('SELECT role FROM register_collaborators WHERE register_id = ? AND user_id = ?').get(req.params.id, req.session.userId);
    if (!collab || collab.role === 'viewer') {
      return res.status(403).json({ error: 'Edit access required' });
    }
  }

  const { name, description, framework } = req.body;
  db().prepare(
    'UPDATE registers SET name = ?, description = ?, framework = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).run(name || register.name, description ?? register.description, framework || register.framework, register.id);

  const updated = db().prepare('SELECT * FROM registers WHERE id = ?').get(register.id);
  res.json(updated);
}));

router.delete('/:id', asyncHandler((req, res) => {
  const register = db().prepare(
    'SELECT * FROM registers WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.session.userId);

  if (!register) {
    return res.status(404).json({ error: 'Register not found' });
  }

  db().prepare('DELETE FROM registers WHERE id = ?').run(register.id);
  res.json({ message: 'Register deleted' });
}));

router.get('/:id/stats', asyncHandler((req, res) => {
  const register = db().prepare(
    'SELECT * FROM registers WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.session.userId);

  if (!register) {
    return res.status(404).json({ error: 'Register not found' });
  }

  const risks = db().prepare('SELECT * FROM risks WHERE register_id = ?').all(register.id);
  const totalRisks = risks.length;

  const distribution = { critical: 0, high: 0, medium: 0, low: 0 };
  let totalInherent = 0;
  let totalResidual = 0;

  for (const r of risks) {
    distribution[getRiskLevel(r.inherent_risk_score)]++;
    totalInherent += r.inherent_risk_score;
    totalResidual += r.residual_risk_score;
  }

  const controlCount = db().prepare('SELECT COUNT(*) as count FROM controls WHERE register_id = ?').get(register.id).count;
  const linkedControls = db().prepare(`
    SELECT COUNT(DISTINCT rc.control_id) as count FROM risk_controls rc
    JOIN risks r ON rc.risk_id = r.id WHERE r.register_id = ?
  `).get(register.id).count;

  res.json({
    totalRisks,
    distribution,
    averageInherentScore: totalRisks ? (totalInherent / totalRisks).toFixed(1) : 0,
    averageResidualScore: totalRisks ? (totalResidual / totalRisks).toFixed(1) : 0,
    controlCoverage: controlCount ? Math.round((linkedControls / controlCount) * 100) : 0,
    openRisks: risks.filter(r => r.status === 'open').length,
    inProgressRisks: risks.filter(r => r.status === 'in_progress').length,
  });
}));

// Clone a register
router.post('/:id/clone', asyncHandler((req, res) => {
  const register = db().prepare(
    'SELECT * FROM registers WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.session.userId);
  if (!register) return res.status(404).json({ error: 'Register not found' });

  const { name } = req.body;
  const newName = name || `${register.name} (Copy)`;

  const regResult = db().prepare(
    'INSERT INTO registers (user_id, name, description, framework) VALUES (?, ?, ?, ?)'
  ).run(req.session.userId, newName, register.description, register.framework);
  const newRegId = regResult.lastInsertRowid;

  // Clone assets
  const assets = db().prepare('SELECT * FROM assets WHERE register_id = ?').all(register.id);
  const assetMap = {};
  for (const a of assets) {
    const r = db().prepare(
      'INSERT INTO assets (register_id, name, type, owner, criticality, description) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(newRegId, a.name, a.type, a.owner, a.criticality, a.description);
    assetMap[a.id] = r.lastInsertRowid;
  }

  // Clone threats
  const threats = db().prepare('SELECT * FROM threats WHERE register_id = ?').all(register.id);
  const threatMap = {};
  for (const t of threats) {
    const r = db().prepare(
      'INSERT INTO threats (register_id, name, category, source, description) VALUES (?, ?, ?, ?, ?)'
    ).run(newRegId, t.name, t.category, t.source, t.description);
    threatMap[t.id] = r.lastInsertRowid;
  }

  // Clone controls
  const controls = db().prepare('SELECT * FROM controls WHERE register_id = ?').all(register.id);
  const controlMap = {};
  for (const c of controls) {
    const r = db().prepare(
      'INSERT INTO controls (register_id, name, type, category, effectiveness, owner, description) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(newRegId, c.name, c.type, c.category, c.effectiveness, c.owner, c.description);
    controlMap[c.id] = r.lastInsertRowid;
  }

  // Clone risks
  const risks = db().prepare('SELECT * FROM risks WHERE register_id = ?').all(register.id);
  for (const risk of risks) {
    const rr = db().prepare(`
      INSERT INTO risks (register_id, risk_id_label, title, description, asset_id, threat_id, risk_category,
        inherent_likelihood, inherent_impact, inherent_risk_score, residual_likelihood, residual_impact, residual_risk_score,
        treatment, treatment_plan, risk_owner, due_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      newRegId, risk.risk_id_label, risk.title, risk.description,
      risk.asset_id ? assetMap[risk.asset_id] : null,
      risk.threat_id ? threatMap[risk.threat_id] : null,
      risk.risk_category, risk.inherent_likelihood, risk.inherent_impact, risk.inherent_risk_score,
      risk.residual_likelihood, risk.residual_impact, risk.residual_risk_score,
      risk.treatment, risk.treatment_plan, risk.risk_owner, risk.due_date, risk.status
    );
    // Clone risk-control links
    const rcs = db().prepare('SELECT * FROM risk_controls WHERE risk_id = ?').all(risk.id);
    for (const rc of rcs) {
      if (controlMap[rc.control_id]) {
        db().prepare('INSERT OR IGNORE INTO risk_controls (risk_id, control_id) VALUES (?, ?)').run(rr.lastInsertRowid, controlMap[rc.control_id]);
      }
    }
  }

  const newReg = db().prepare('SELECT * FROM registers WHERE id = ?').get(newRegId);
  res.status(201).json(newReg);
}));

// CSV Import risks
router.post('/:id/import/csv', asyncHandler((req, res) => {
  const register = db().prepare(
    'SELECT * FROM registers WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.session.userId);
  if (!register) return res.status(404).json({ error: 'Register not found' });

  const rows = req.body.rows || req.body.risks;
  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'No data provided' });
  }

  // Limit import size to prevent abuse
  if (rows.length > 500) {
    return res.status(400).json({ error: 'Maximum 500 risks per import' });
  }

  let imported = 0;
  const existingRiskCount = db().prepare('SELECT COUNT(*) as count FROM risks WHERE register_id = ?').get(register.id).count;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (!r.title) continue;

    const label = r.risk_id_label || `R-${String(existingRiskCount + imported + 1).padStart(3, '0')}`;
    const iL = Math.min(5, Math.max(1, parseInt(r.inherent_likelihood, 10) || 3));
    const iI = Math.min(5, Math.max(1, parseInt(r.inherent_impact, 10) || 3));
    const rL = Math.min(5, Math.max(1, parseInt(r.residual_likelihood, 10) || 2));
    const rI = Math.min(5, Math.max(1, parseInt(r.residual_impact, 10) || 2));

    db().prepare(`
      INSERT INTO risks (register_id, risk_id_label, title, description, risk_category,
        inherent_likelihood, inherent_impact, inherent_risk_score,
        residual_likelihood, residual_impact, residual_risk_score,
        treatment, treatment_plan, risk_owner, due_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      register.id, label, r.title, r.description || null,
      r.risk_category || 'cyber',
      iL, iI, iL * iI, rL, rI, rL * rI,
      r.treatment || 'mitigate', r.treatment_plan || null,
      r.risk_owner || null, r.due_date || null, r.status || 'open'
    );
    imported++;
  }

  db().prepare('UPDATE registers SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(register.id);
  res.json({ imported, message: `${imported} risks imported` });
}));

module.exports = router;
