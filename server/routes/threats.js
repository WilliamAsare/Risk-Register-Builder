const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { verifyRegisterOwnership } = require('../middleware/verifyOwnership');
const { asyncHandler } = require('../middleware/asyncHandler');

const db = () => global.__db;

const router = express.Router({ mergeParams: true });
router.use(requireAuth);
router.use(verifyRegisterOwnership);

router.get('/', asyncHandler((req, res) => {
  const threats = db().prepare('SELECT * FROM threats WHERE register_id = ? ORDER BY id').all(req.params.id);
  res.json(threats);
}));

router.post('/', asyncHandler((req, res) => {

  const { name, category, source, description } = req.body;
  if (!name || !category) {
    return res.status(400).json({ error: 'Name and category are required' });
  }
  const result = db().prepare(
    'INSERT INTO threats (register_id, name, category, source, description) VALUES (?, ?, ?, ?, ?)'
  ).run(req.params.id, name, category, source || null, description || null);

  db().prepare('UPDATE registers SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);
  const threat = db().prepare('SELECT * FROM threats WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(threat);
}));

router.put('/:threatId', asyncHandler((req, res) => {

  const threat = db().prepare('SELECT * FROM threats WHERE id = ? AND register_id = ?').get(req.params.threatId, req.params.id);
  if (!threat) return res.status(404).json({ error: 'Threat not found' });

  const { name, category, source, description } = req.body;
  db().prepare(
    'UPDATE threats SET name = ?, category = ?, source = ?, description = ? WHERE id = ?'
  ).run(name || threat.name, category || threat.category, source ?? threat.source, description ?? threat.description, threat.id);

  db().prepare('UPDATE registers SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);
  const updated = db().prepare('SELECT * FROM threats WHERE id = ?').get(threat.id);
  res.json(updated);
}));

router.delete('/:threatId', asyncHandler((req, res) => {

  const threat = db().prepare('SELECT * FROM threats WHERE id = ? AND register_id = ?').get(req.params.threatId, req.params.id);
  if (!threat) return res.status(404).json({ error: 'Threat not found' });

  db().prepare('DELETE FROM threats WHERE id = ?').run(threat.id);
  db().prepare('UPDATE registers SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);
  res.json({ message: 'Threat deleted' });
}));

module.exports = router;
