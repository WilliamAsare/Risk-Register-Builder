const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { verifyRegisterOwnership } = require('../middleware/verifyOwnership');
const { asyncHandler } = require('../middleware/asyncHandler');

const db = () => global.__db;
const router = express.Router({ mergeParams: true });
router.use(requireAuth);
router.use(verifyRegisterOwnership);

// Get comments for a risk
router.get('/:riskId/comments', asyncHandler((req, res) => {

  const comments = db().prepare(`
    SELECT rc.*, u.name as user_name
    FROM risk_comments rc
    LEFT JOIN users u ON rc.user_id = u.id
    WHERE rc.risk_id = ?
    ORDER BY rc.created_at DESC
  `).all(req.params.riskId);

  res.json(comments);
}));

// Add comment to a risk
router.post('/:riskId/comments', asyncHandler((req, res) => {

  const risk = db().prepare('SELECT * FROM risks WHERE id = ? AND register_id = ?').get(req.params.riskId, req.params.id);
  if (!risk) return res.status(404).json({ error: 'Risk not found' });

  const { content } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: 'Content is required' });
  if (content.length > 5000) return res.status(400).json({ error: 'Comment must be 5000 characters or fewer' });

  const result = db().prepare(
    'INSERT INTO risk_comments (risk_id, user_id, content) VALUES (?, ?, ?)'
  ).run(req.params.riskId, req.session.userId, content.trim());

  // Log to history
  db().prepare(
    'INSERT INTO risk_history (risk_id, register_id, user_id, action, new_value) VALUES (?, ?, ?, ?, ?)'
  ).run(req.params.riskId, req.params.id, req.session.userId, 'comment_added', content.trim());

  const comment = db().prepare(`
    SELECT rc.*, u.name as user_name
    FROM risk_comments rc
    LEFT JOIN users u ON rc.user_id = u.id
    WHERE rc.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(comment);
}));

// Delete a comment
router.delete('/:riskId/comments/:commentId', asyncHandler((req, res) => {

  const comment = db().prepare('SELECT * FROM risk_comments WHERE id = ? AND risk_id = ?').get(req.params.commentId, req.params.riskId);
  if (!comment) return res.status(404).json({ error: 'Comment not found' });
  if (comment.user_id !== req.session.userId) return res.status(403).json({ error: 'Not authorized' });

  db().prepare('DELETE FROM risk_comments WHERE id = ?').run(comment.id);
  res.json({ message: 'Comment deleted' });
}));

module.exports = router;
