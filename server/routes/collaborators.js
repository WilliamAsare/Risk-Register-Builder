const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { verifyRegisterOwnership, requireOwner } = require('../middleware/verifyOwnership');
const { asyncHandler } = require('../middleware/asyncHandler');

const db = () => global.__db;

const router = express.Router({ mergeParams: true });
router.use(requireAuth);
router.use(verifyRegisterOwnership);

// Get collaborators for a register
router.get('/', asyncHandler((req, res) => {
  const owner = db().prepare('SELECT id, name, email FROM users WHERE id = ?').get(req.register.user_id);
  const collaborators = db().prepare(`
    SELECT u.id, u.name, u.email, rc.role, rc.added_at
    FROM register_collaborators rc
    JOIN users u ON rc.user_id = u.id
    WHERE rc.register_id = ?
    ORDER BY rc.added_at
  `).all(req.params.id);

  res.json({ owner: { ...owner, role: 'owner' }, collaborators });
}));

// Add collaborator (owner only)
router.post('/', requireOwner, asyncHandler((req, res) => {
  const { email, role } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const user = db().prepare('SELECT id, name, email FROM users WHERE email = ?').get(email);
  if (!user) return res.status(404).json({ error: 'User not found. They must have an account first.' });
  if (user.id === req.session.userId) return res.status(400).json({ error: 'Cannot add yourself as collaborator' });

  const existing = db().prepare('SELECT 1 FROM register_collaborators WHERE register_id = ? AND user_id = ?').get(req.params.id, user.id);
  if (existing) return res.status(409).json({ error: 'User is already a collaborator' });

  const validRole = ['editor', 'viewer'].includes(role) ? role : 'viewer';
  db().prepare('INSERT INTO register_collaborators (register_id, user_id, role) VALUES (?, ?, ?)').run(req.params.id, user.id, validRole);

  res.status(201).json({ id: user.id, name: user.name, email: user.email, role: validRole });
}));

// Update collaborator role (owner only)
router.put('/:userId', requireOwner, asyncHandler((req, res) => {
  const { role } = req.body;
  const validRole = ['editor', 'viewer'].includes(role) ? role : 'viewer';
  db().prepare('UPDATE register_collaborators SET role = ? WHERE register_id = ? AND user_id = ?').run(validRole, req.params.id, req.params.userId);
  res.json({ message: 'Role updated' });
}));

// Remove collaborator (owner only)
router.delete('/:userId', requireOwner, asyncHandler((req, res) => {
  db().prepare('DELETE FROM register_collaborators WHERE register_id = ? AND user_id = ?').run(req.params.id, req.params.userId);
  res.json({ message: 'Collaborator removed' });
}));

module.exports = router;
