const express = require('express');
const { CAPABILITIES } = require('@team-hub/shared');
const { authenticate } = require('../middleware/auth');
const { requireWorkspaceMembership } = require('../middleware/workspace');
const { requirePermission } = require('../middleware/permission');
const milestonesRouter = require('./milestones');
const c = require('../controllers/goals');

const router = express.Router({ mergeParams: true });

router.use(authenticate);

// /api/workspaces/:workspaceId/goals
router.get('/', requireWorkspaceMembership(), c.listGoals);
router.post(
  '/',
  requireWorkspaceMembership(),
  requirePermission(CAPABILITIES.GOAL_CREATE),
  c.createGoal
);

router.get('/:goalId', requireWorkspaceMembership(), c.getGoal);
router.put(
  '/:goalId',
  requireWorkspaceMembership(),
  requirePermission(CAPABILITIES.GOAL_EDIT),
  c.updateGoal
);
router.patch(
  '/:goalId/status',
  requireWorkspaceMembership(),
  requirePermission(CAPABILITIES.GOAL_EDIT),
  c.changeGoalStatus
);
router.delete(
  '/:goalId',
  requireWorkspaceMembership(),
  requirePermission(CAPABILITIES.GOAL_DELETE),
  c.deleteGoal
);
router.get(
  '/:goalId/activity',
  requireWorkspaceMembership(),
  c.getGoalActivity
);

router.use('/:goalId/milestones', milestonesRouter);

module.exports = router;
