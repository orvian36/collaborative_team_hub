const express = require('express');
const { CAPABILITIES } = require('@team-hub/shared');
const { authenticate } = require('../middleware/auth');
const { requireWorkspaceMembership } = require('../middleware/workspace');
const { requirePermission } = require('../middleware/permission');
const c = require('../controllers/announcements');
const commentsRouter = require('./comments');
const reactionsRouter = require('./reactions');

const router = express.Router({ mergeParams: true });
router.use(authenticate);

router.get('/', requireWorkspaceMembership(), c.listAnnouncements);
router.post(
  '/',
  requireWorkspaceMembership(),
  requirePermission(CAPABILITIES.ANNOUNCEMENT_CREATE),
  c.createAnnouncement
);

router.get('/:announcementId', requireWorkspaceMembership(), c.getAnnouncement);
router.put(
  '/:announcementId',
  requireWorkspaceMembership(),
  requirePermission(CAPABILITIES.ANNOUNCEMENT_EDIT),
  c.updateAnnouncement
);
router.delete(
  '/:announcementId',
  requireWorkspaceMembership(),
  requirePermission(CAPABILITIES.ANNOUNCEMENT_DELETE),
  c.deleteAnnouncement
);
router.patch(
  '/:announcementId/pin',
  requireWorkspaceMembership(),
  requirePermission(CAPABILITIES.ANNOUNCEMENT_PIN),
  c.togglePin
);

router.use('/:announcementId/comments', commentsRouter);
router.use('/:announcementId/reactions', reactionsRouter);

module.exports = router;
