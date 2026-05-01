const prisma = require('../lib/prisma');
const { ROLES } = require('@team-hub/shared');

/**
 * Verifies the authenticated user is a member of the workspace identified
 * by `req.params.workspaceId` (or `req.params.id` for top-level workspace
 * routes), optionally with a required role. On success, attaches `req.member`
 * (the WorkspaceMember row including `role`).
 *
 * Returns 404 (not 403) for non-members so we don't leak workspace existence.
 *
 * @param {string} [requiredRole] - if provided, e.g. ROLES.ADMIN, the caller
 *   must have that role. Otherwise any membership is sufficient.
 */
const requireWorkspaceMembership = (requiredRole) => async (req, res, next) => {
  const workspaceId = req.params.workspaceId || req.params.id;
  if (!workspaceId) {
    return res.status(400).json({ error: 'Workspace ID is required' });
  }

  try {
    const member = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: req.user.id, workspaceId } },
    });

    if (!member) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    if (requiredRole && member.role !== requiredRole) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.member = member;
    next();
  } catch (error) {
    console.error('requireWorkspaceMembership error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { requireWorkspaceMembership };
