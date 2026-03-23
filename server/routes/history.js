const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { verifyRegisterOwnership } = require('../middleware/verifyOwnership');
const { asyncHandler } = require('../middleware/asyncHandler');

const db = () => global.__db;
const router = express.Router({ mergeParams: true });
router.use(requireAuth);
router.use(verifyRegisterOwnership);

// Get history for a specific risk
router.get('/:riskId/history', asyncHandler((req, res) => {

  const risk = db().prepare('SELECT * FROM risks WHERE id = ? AND register_id = ?').get(req.params.riskId, req.params.id);
  if (!risk) return res.status(404).json({ error: 'Risk not found' });

  const history = db().prepare(`
    SELECT rh.*, u.name as user_name
    FROM risk_history rh
    LEFT JOIN users u ON rh.user_id = u.id
    WHERE rh.risk_id = ?
    ORDER BY rh.created_at DESC
  `).all(req.params.riskId);

  res.json(history);
}));

// Get all history for a register
router.get('/history', asyncHandler((req, res) => {

  const history = db().prepare(`
    SELECT rh.*, u.name as user_name, r.risk_id_label, r.title as risk_title
    FROM risk_history rh
    LEFT JOIN users u ON rh.user_id = u.id
    LEFT JOIN risks r ON rh.risk_id = r.id
    WHERE rh.register_id = ?
    ORDER BY rh.created_at DESC
    LIMIT 100
  `).all(req.params.id);

  res.json(history);
}));

module.exports = router;
