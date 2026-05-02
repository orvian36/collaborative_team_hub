const express = require('express');
const { CAPABILITIES } = require('@team-hub/shared');
const { authenticate } = require('../middleware/auth');
const { requireWorkspaceMembership } = require('../middleware/workspace');
const { requirePermission } = require('../middleware/permission');
const c = require('../controllers/milestones');

const router = express.Router({ mergeParams: true });

router.use(authenticate);

// /api/workspaces/:workspaceId/goals/:goalId/milestones
router.get('/', requireWorkspaceMembership(), c.listMilestones);
router.post(
  '/',
  requireWorkspaceMembership(),
  requirePermission(CAPABILITIES.MILESTONE_WRITE),
  c.createMilestone
);
router.put(
  '/:milestoneId',
  requireWorkspaceMembership(),
  requirePermission(CAPABILITIES.MILESTONE_WRITE),
  c.updateMilestone
);
router.delete(
  '/:milestoneId',
  requireWorkspaceMembership(),
  requirePermission(CAPABILITIES.MILESTONE_WRITE),
  c.deleteMilestone
);

module.exports = router;
