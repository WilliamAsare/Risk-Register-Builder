const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { verifyRegisterOwnership } = require('../middleware/verifyOwnership');
const { asyncHandler } = require('../middleware/asyncHandler');
const { getRisksWithControls, getSingleRiskWithControls } = require('../db/queries');

const db = () => global.__db;

const router = express.Router({ mergeParams: true });
router.use(requireAuth);
router.use(verifyRegisterOwnership);

router.get('/', asyncHandler((req, res) => {
  const risks = getRisksWithControls(req.params.id);
  res.json(risks);
}));

router.post('/', asyncHandler((req, res) => {
  const {
    risk_id_label, title, description, asset_id, threat_id, risk_category,
    inherent_likelihood, inherent_impact, residual_likelihood, residual_impact,
    treatment, treatment_plan, risk_owner, due_date, status, control_ids
  } = req.body;

  if (!risk_id_label || !title || !risk_category || !inherent_likelihood || !inherent_impact || !residual_likelihood || !residual_impact) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const iScore = inherent_likelihood * inherent_impact;
  const rScore = residual_likelihood * residual_impact;

  const result = db().prepare(`
    INSERT INTO risks (register_id, risk_id_label, title, description, asset_id, threat_id, risk_category,
      inherent_likelihood, inherent_impact, inherent_risk_score, residual_likelihood, residual_impact, residual_risk_score,
      treatment, treatment_plan, risk_owner, due_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.params.id, risk_id_label, title, description || null,
    asset_id || null, threat_id || null, risk_category,
    inherent_likelihood, inherent_impact, iScore, residual_likelihood, residual_impact, rScore,
    treatment || 'mitigate', treatment_plan || null, risk_owner || null, due_date || null, status || 'open'
  );

  if (control_ids && Array.isArray(control_ids)) {
    const linkStmt = db().prepare('INSERT OR IGNORE INTO risk_controls (risk_id, control_id) VALUES (?, ?)');
    for (const cid of control_ids) {
      linkStmt.run(result.lastInsertRowid, cid);
    }
  }

  db().prepare('UPDATE registers SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);

  // Audit trail
  db().prepare(
    'INSERT INTO risk_history (risk_id, register_id, user_id, action, new_value) VALUES (?, ?, ?, ?, ?)'
  ).run(result.lastInsertRowid, req.params.id, req.session.userId, 'created', `${risk_id_label}: ${title}`);

  const risk = getSingleRiskWithControls(result.lastInsertRowid);
  res.status(201).json(risk);
}));

router.put('/:riskId', asyncHandler((req, res) => {
  const risk = db().prepare('SELECT * FROM risks WHERE id = ? AND register_id = ?').get(req.params.riskId, req.params.id);
  if (!risk) return res.status(404).json({ error: 'Risk not found' });

  const {
    risk_id_label, title, description, asset_id, threat_id, risk_category,
    inherent_likelihood, inherent_impact, residual_likelihood, residual_impact,
    treatment, treatment_plan, risk_owner, due_date, status, control_ids
  } = req.body;

  // Use ?? (nullish coalescing) to correctly handle falsy values like 0 or empty strings
  const finalIL = inherent_likelihood ?? risk.inherent_likelihood;
  const finalII = inherent_impact ?? risk.inherent_impact;
  const finalRL = residual_likelihood ?? risk.residual_likelihood;
  const finalRI = residual_impact ?? risk.residual_impact;

  // Track field changes for audit trail
  const trackFields = {
    title: [risk.title, title ?? risk.title],
    status: [risk.status, status ?? risk.status],
    treatment: [risk.treatment, treatment ?? risk.treatment],
    risk_owner: [risk.risk_owner, risk_owner ?? risk.risk_owner],
    inherent_risk_score: [risk.inherent_risk_score, finalIL * finalII],
    residual_risk_score: [risk.residual_risk_score, finalRL * finalRI],
  };
  const histStmt = db().prepare(
    'INSERT INTO risk_history (risk_id, register_id, user_id, action, field_name, old_value, new_value) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  for (const [field, [oldVal, newVal]] of Object.entries(trackFields)) {
    if (String(oldVal || '') !== String(newVal || '')) {
      histStmt.run(risk.id, req.params.id, req.session.userId, 'updated', field, String(oldVal || ''), String(newVal || ''));
    }
  }

  db().prepare(`
    UPDATE risks SET risk_id_label = ?, title = ?, description = ?, asset_id = ?, threat_id = ?,
      risk_category = ?, inherent_likelihood = ?, inherent_impact = ?, inherent_risk_score = ?,
      residual_likelihood = ?, residual_impact = ?, residual_risk_score = ?, treatment = ?, treatment_plan = ?,
      risk_owner = ?, due_date = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    risk_id_label ?? risk.risk_id_label, title ?? risk.title, description ?? risk.description,
    asset_id !== undefined ? asset_id : risk.asset_id,
    threat_id !== undefined ? threat_id : risk.threat_id,
    risk_category ?? risk.risk_category,
    finalIL, finalII, finalIL * finalII,
    finalRL, finalRI, finalRL * finalRI,
    treatment ?? risk.treatment, treatment_plan ?? risk.treatment_plan,
    risk_owner ?? risk.risk_owner, due_date !== undefined ? due_date : risk.due_date,
    status ?? risk.status, risk.id
  );

  if (control_ids && Array.isArray(control_ids)) {
    db().prepare('DELETE FROM risk_controls WHERE risk_id = ?').run(risk.id);
    const linkStmt = db().prepare('INSERT OR IGNORE INTO risk_controls (risk_id, control_id) VALUES (?, ?)');
    for (const cid of control_ids) {
      linkStmt.run(risk.id, cid);
    }
  }

  db().prepare('UPDATE registers SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);

  const updated = getSingleRiskWithControls(risk.id);
  res.json(updated);
}));

router.delete('/:riskId', asyncHandler((req, res) => {
  const risk = db().prepare('SELECT * FROM risks WHERE id = ? AND register_id = ?').get(req.params.riskId, req.params.id);
  if (!risk) return res.status(404).json({ error: 'Risk not found' });

  // Audit trail before delete
  db().prepare(
    'INSERT INTO risk_history (risk_id, register_id, user_id, action, old_value) VALUES (?, ?, ?, ?, ?)'
  ).run(risk.id, req.params.id, req.session.userId, 'deleted', `${risk.risk_id_label}: ${risk.title}`);

  db().prepare('DELETE FROM risks WHERE id = ?').run(risk.id);
  db().prepare('UPDATE registers SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);
  res.json({ message: 'Risk deleted' });
}));

// Bulk update risks (status, treatment, owner)
router.put('/', asyncHandler((req, res) => {
  const { risk_ids, updates } = req.body;
  if (!Array.isArray(risk_ids) || risk_ids.length === 0) {
    return res.status(400).json({ error: 'risk_ids array is required' });
  }
  if (!updates || (!updates.status && !updates.treatment && !updates.risk_owner)) {
    return res.status(400).json({ error: 'At least one update field is required (status, treatment, risk_owner)' });
  }

  const fields = [];
  const values = [];
  if (updates.status) { fields.push('status = ?'); values.push(updates.status); }
  if (updates.treatment) { fields.push('treatment = ?'); values.push(updates.treatment); }
  if (updates.risk_owner !== undefined) { fields.push('risk_owner = ?'); values.push(updates.risk_owner); }
  fields.push('updated_at = CURRENT_TIMESTAMP');

  let updated = 0;
  const stmt = db().prepare(`UPDATE risks SET ${fields.join(', ')} WHERE id = ? AND register_id = ?`);
  const histStmt = db().prepare(
    'INSERT INTO risk_history (risk_id, register_id, user_id, action, field_name, old_value, new_value) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );

  for (const riskId of risk_ids) {
    const risk = db().prepare('SELECT * FROM risks WHERE id = ? AND register_id = ?').get(riskId, req.params.id);
    if (!risk) continue;
    stmt.run(...values, riskId, req.params.id);
    // Audit trail for each field changed
    if (updates.status && updates.status !== risk.status) {
      histStmt.run(riskId, req.params.id, req.session.userId, 'updated', 'status', risk.status, updates.status);
    }
    if (updates.treatment && updates.treatment !== risk.treatment) {
      histStmt.run(riskId, req.params.id, req.session.userId, 'updated', 'treatment', risk.treatment, updates.treatment);
    }
    if (updates.risk_owner !== undefined && updates.risk_owner !== risk.risk_owner) {
      histStmt.run(riskId, req.params.id, req.session.userId, 'updated', 'risk_owner', risk.risk_owner || '', updates.risk_owner);
    }
    updated++;
  }

  db().prepare('UPDATE registers SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);
  res.json({ message: `${updated} risks updated` });
}));

// Link control to risk
router.post('/:riskId/controls', asyncHandler((req, res) => {
  const risk = db().prepare('SELECT * FROM risks WHERE id = ? AND register_id = ?').get(req.params.riskId, req.params.id);
  if (!risk) return res.status(404).json({ error: 'Risk not found' });

  const { control_id } = req.body;
  if (!control_id) return res.status(400).json({ error: 'control_id is required' });

  const control = db().prepare('SELECT * FROM controls WHERE id = ? AND register_id = ?').get(control_id, req.params.id);
  if (!control) return res.status(404).json({ error: 'Control not found' });

  db().prepare('INSERT OR IGNORE INTO risk_controls (risk_id, control_id) VALUES (?, ?)').run(risk.id, control_id);
  res.status(201).json({ message: 'Control linked' });
}));

// Unlink control from risk
router.delete('/:riskId/controls/:controlId', asyncHandler((req, res) => {
  db().prepare('DELETE FROM risk_controls WHERE risk_id = ? AND control_id = ?').run(req.params.riskId, req.params.controlId);
  res.json({ message: 'Control unlinked' });
}));

module.exports = router;
