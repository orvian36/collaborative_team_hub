const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireWorkspaceMembership } = require('../middleware/workspace');
const { ROLES } = require('@team-hub/shared');
const c = require('../controllers/members');

// mergeParams so :workspaceId is visible from the parent workspaces router.
const router = express.Router({ mergeParams: true });

router.use(authenticate);
router.use(requireWorkspaceMembership());

router.get('/', c.listMembers);
router.post('/leave', c.leaveWorkspace);

// Admin-only role + remove. We don't use requireWorkspaceMembership(ADMIN) for
// remove because members are allowed to remove themselves; the controller does
// the per-call self-vs-admin check.
router.patch('/:memberId', requireAdmin, c.updateMemberRole);
router.delete('/:memberId', c.removeMember);

function requireAdmin(req, res, next) {
  if (req.member.role !== ROLES.ADMIN) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

module.exports = router;
