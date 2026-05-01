const express = require('express');
const multer = require('multer');
const { authenticate } = require('../middleware/auth');
const { requireWorkspaceMembership } = require('../middleware/workspace');
const { ROLES } = require('@team-hub/shared');
const c = require('../controllers/workspaces');

const router = express.Router();

// All workspace routes require authentication.
router.use(authenticate);

// Multer config for icon upload: in-memory, 2 MB cap, image mime allowlist.
const ALLOWED_IMAGE_MIMES = ['image/png', 'image/jpeg', 'image/webp'];
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_IMAGE_MIMES.includes(file.mimetype)) {
      return cb(new Error('Only PNG, JPEG, or WebP images are allowed'));
    }
    cb(null, true);
  },
});

// Top-level workspace routes
router.post('/', c.createWorkspace);
router.get('/', c.listWorkspaces);
router.get('/:id', requireWorkspaceMembership(), c.getWorkspace);
router.patch('/:id', requireWorkspaceMembership(ROLES.ADMIN), c.updateWorkspace);
router.delete('/:id', requireWorkspaceMembership(ROLES.ADMIN), c.deleteWorkspace);

router.post(
  '/:id/icon',
  requireWorkspaceMembership(ROLES.ADMIN),
  (req, res, next) => upload.single('icon')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  }),
  c.uploadIcon
);

// Sub-routers (defined in later tasks). Both need mergeParams to see :workspaceId.
router.use('/:workspaceId/members', require('./members'));
router.use('/:workspaceId/invitations', require('./invitations.workspace'));

module.exports = router;
