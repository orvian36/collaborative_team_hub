const express = require('express');
const { CAPABILITIES } = require('@team-hub/shared');
const { authenticate } = require('../middleware/auth');
const { requireWorkspaceMembership } = require('../middleware/workspace');
const { requirePermission } = require('../middleware/permission');
const c = require('../controllers/comments');

const router = express.Router({ mergeParams: true });
router.use(authenticate);

router.get('/',                            requireWorkspaceMembership(), c.listComments);
router.post('/',                           requireWorkspaceMembership(), requirePermission(CAPABILITIES.COMMENT_CREATE), c.createComment);
router.delete('/:commentId',               requireWorkspaceMembership(), c.deleteComment); // capability check inline

module.exports = router;
