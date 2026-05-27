const express = require('express');
const { authenticate } = require('../middleware/auth');
const c = require('../controllers/invitations');

const router = express.Router();

// Token preview is public — no auth required so the invite landing page
// can show workspace details before login.
router.get('/:token', c.getInvitationByToken);

// Accept requires a logged-in user.
router.post('/:token/accept', authenticate, c.acceptInvitation);

module.exports = router;
