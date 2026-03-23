const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { verifyRegisterOwnership } = require('../middleware/verifyOwnership');
const { asyncHandler } = require('../middleware/asyncHandler');

const db = () => global.__db;

const router = express.Router({ mergeParams: true });
router.use(requireAuth);
router.use(verifyRegisterOwnership);

router.get('/', asyncHandler((req, res) => {
  const assets = db().prepare('SELECT * FROM assets WHERE register_id = ? ORDER BY id').all(req.params.id);
  res.json(assets);
}));

router.post('/', asyncHandler((req, res) => {

  const { name, type, owner, criticality, description } = req.body;
  if (!name || !type) {
    return res.status(400).json({ error: 'Name and type are required' });
  }
  const result = db().prepare(
    'INSERT INTO assets (register_id, name, type, owner, criticality, description) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(req.params.id, name, type, owner || null, criticality || 'medium', description || null);

  db().prepare('UPDATE registers SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);
  const asset = db().prepare('SELECT * FROM assets WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(asset);
}));

router.put('/:assetId', asyncHandler((req, res) => {

  const asset = db().prepare('SELECT * FROM assets WHERE id = ? AND register_id = ?').get(req.params.assetId, req.params.id);
  if (!asset) return res.status(404).json({ error: 'Asset not found' });

  const { name, type, owner, criticality, description } = req.body;
  db().prepare(
    'UPDATE assets SET name = ?, type = ?, owner = ?, criticality = ?, description = ? WHERE id = ?'
  ).run(name || asset.name, type || asset.type, owner ?? asset.owner, criticality || asset.criticality, description ?? asset.description, asset.id);

  db().prepare('UPDATE registers SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);
  const updated = db().prepare('SELECT * FROM assets WHERE id = ?').get(asset.id);
  res.json(updated);
}));

router.delete('/:assetId', asyncHandler((req, res) => {

  const asset = db().prepare('SELECT * FROM assets WHERE id = ? AND register_id = ?').get(req.params.assetId, req.params.id);
  if (!asset) return res.status(404).json({ error: 'Asset not found' });

  db().prepare('DELETE FROM assets WHERE id = ?').run(asset.id);
  db().prepare('UPDATE registers SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);
  res.json({ message: 'Asset deleted' });
}));

module.exports = router;
