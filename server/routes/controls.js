const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { verifyRegisterOwnership } = require('../middleware/verifyOwnership');
const { asyncHandler } = require('../middleware/asyncHandler');

const db = () => global.__db;

const router = express.Router({ mergeParams: true });
router.use(requireAuth);
router.use(verifyRegisterOwnership);

router.get('/', asyncHandler((req, res) => {
  const controls = db().prepare('SELECT * FROM controls WHERE register_id = ? ORDER BY id').all(req.params.id);
  res.json(controls);
}));

router.post('/', asyncHandler((req, res) => {

  const { name, type, category, effectiveness, owner, description } = req.body;
  if (!name || !type) {
    return res.status(400).json({ error: 'Name and type are required' });
  }
  const result = db().prepare(
    'INSERT INTO controls (register_id, name, type, category, effectiveness, owner, description) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(req.params.id, name, type, category || null, effectiveness || 'moderate', owner || null, description || null);

  db().prepare('UPDATE registers SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);
  const control = db().prepare('SELECT * FROM controls WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(control);
}));

router.put('/:controlId', asyncHandler((req, res) => {

  const control = db().prepare('SELECT * FROM controls WHERE id = ? AND register_id = ?').get(req.params.controlId, req.params.id);
  if (!control) return res.status(404).json({ error: 'Control not found' });

  const { name, type, category, effectiveness, owner, description } = req.body;
  db().prepare(
    'UPDATE controls SET name = ?, type = ?, category = ?, effectiveness = ?, owner = ?, description = ? WHERE id = ?'
  ).run(
    name || control.name, type || control.type, category ?? control.category,
    effectiveness || control.effectiveness, owner ?? control.owner, description ?? control.description, control.id
  );

  db().prepare('UPDATE registers SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);
  const updated = db().prepare('SELECT * FROM controls WHERE id = ?').get(control.id);
  res.json(updated);
}));

router.delete('/:controlId', asyncHandler((req, res) => {

  const control = db().prepare('SELECT * FROM controls WHERE id = ? AND register_id = ?').get(req.params.controlId, req.params.id);
  if (!control) return res.status(404).json({ error: 'Control not found' });

  db().prepare('DELETE FROM controls WHERE id = ?').run(control.id);
  db().prepare('UPDATE registers SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);
  res.json({ message: 'Control deleted' });
}));

module.exports = router;
