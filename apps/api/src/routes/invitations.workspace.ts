const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireWorkspaceMembership } = require('../middleware/workspace');
const { ROLES } = require('@team-hub/shared');
const c = require('../controllers/invitations');

const router = express.Router({ mergeParams: true });

router.use(authenticate);
router.use(requireWorkspaceMembership(ROLES.ADMIN));

router.post('/', c.createInvitation);
router.get('/', c.listInvitations);
router.delete('/:invitationId', c.revokeInvitation);
router.post('/:invitationId/resend', c.resendInvitation);

module.exports = router;
