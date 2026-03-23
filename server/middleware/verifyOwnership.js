const db = () => global.__db;

/**
 * Express middleware that verifies the authenticated user owns the register
 * or is a collaborator. Sets req.register and req.registerRole on success.
 */
function verifyRegisterOwnership(req, res, next) {
  const register = db().prepare(
    'SELECT * FROM registers WHERE id = ?'
  ).get(req.params.id);

  if (!register) {
    return res.status(404).json({ error: 'Register not found' });
  }

  if (register.user_id === req.session.userId) {
    req.register = register;
    req.registerRole = 'owner';
    return next();
  }

  // Check collaborator access
  const collab = db().prepare(
    'SELECT role FROM register_collaborators WHERE register_id = ? AND user_id = ?'
  ).get(req.params.id, req.session.userId);

  if (collab) {
    req.register = register;
    req.registerRole = collab.role;
    return next();
  }

  console.warn(`[SECURITY] Access denied: user ${req.session.userId} attempted to access register ${req.params.id}`);
  res.status(404).json({ error: 'Register not found' });
}

/**
 * Middleware that requires owner role (not just collaborator).
 */
function requireOwner(req, res, next) {
  if (req.registerRole !== 'owner') {
    return res.status(403).json({ error: 'Owner access required' });
  }
  next();
}

module.exports = { verifyRegisterOwnership, requireOwner };
