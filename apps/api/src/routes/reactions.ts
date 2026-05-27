const express = require('express');
const { CAPABILITIES } = require('@team-hub/shared');
const { authenticate } = require('../middleware/auth');
const { requireWorkspaceMembership } = require('../middleware/workspace');
const { requirePermission } = require('../middleware/permission');
const c = require('../controllers/reactions');

const router = express.Router({ mergeParams: true });
router.use(authenticate);

// POST /api/workspaces/:workspaceId/announcements/:announcementId/reactions  body: { emoji }
router.post(
  '/',
  requireWorkspaceMembership(),
  requirePermission(CAPABILITIES.REACTION_TOGGLE),
  c.toggleReaction
);

module.exports = router;
