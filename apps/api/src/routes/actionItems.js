const express = require('express');
const { CAPABILITIES } = require('@team-hub/shared');
const { authenticate } = require('../middleware/auth');
const { requireWorkspaceMembership } = require('../middleware/workspace');
const { requirePermission } = require('../middleware/permission');
const c = require('../controllers/actionItems');

const router = express.Router({ mergeParams: true });
router.use(authenticate);

router.get('/', requireWorkspaceMembership(), c.listActionItems);
router.post(
  '/',
  requireWorkspaceMembership(),
  requirePermission(CAPABILITIES.ACTION_ITEM_CREATE),
  c.createActionItem
);

router.get('/:actionItemId', requireWorkspaceMembership(), c.getActionItem);
router.put(
  '/:actionItemId',
  requireWorkspaceMembership(),
  requirePermission(CAPABILITIES.ACTION_ITEM_EDIT),
  c.updateActionItem
);
router.patch(
  '/:actionItemId/move',
  requireWorkspaceMembership(),
  requirePermission(CAPABILITIES.ACTION_ITEM_EDIT),
  c.moveActionItem
);
router.delete(
  '/:actionItemId',
  requireWorkspaceMembership(),
  requirePermission(CAPABILITIES.ACTION_ITEM_DELETE),
  c.deleteActionItem
);

module.exports = router;
