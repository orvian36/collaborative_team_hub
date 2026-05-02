const { hasCapability } = require('@team-hub/shared');

/**
 * Permission gate. MUST be chained AFTER `requireWorkspaceMembership(...)`,
 * which sets `req.member` (the WorkspaceMember row including `role`).
 *
 * Usage:
 *   router.post('/',
 *     requireWorkspaceMembership(),
 *     requirePermission(CAPABILITIES.GOAL_CREATE),
 *     createGoal
 *   );
 */
const requirePermission = (capability) => (req, res, next) => {
  if (!req.member) {
    return res.status(500).json({ error: 'requirePermission used without requireWorkspaceMembership' });
  }
  if (!hasCapability(req.member.role, capability)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};

module.exports = { requirePermission };
