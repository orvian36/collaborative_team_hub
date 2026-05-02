const express = require('express');
const multer = require('multer');
const { authenticate } = require('../middleware/auth');
const { requireWorkspaceMembership } = require('../middleware/workspace');
const { ROLES, CAPABILITIES } = require('@team-hub/shared');
const { requirePermission } = require('../middleware/permission');
const c = require('../controllers/workspaces');
const analyticsController = require('../controllers/analytics');
const exportsController   = require('../controllers/exports');
const auditController     = require('../controllers/audit');

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

// Sub-routers. Both need mergeParams to see :workspaceId.
router.use('/:workspaceId/members', require('./members'));
router.use('/:workspaceId/invitations', require('./invitations.workspace'));

// Presence endpoint
const { getOnlineUserIds } = require('../lib/socket');
router.get('/:id/presence', requireWorkspaceMembership(), (req, res) => {
  res.json({ onlineUserIds: getOnlineUserIds(req.params.id) });
});

// Analytics & Exports
router.get('/:id/stats',
  requireWorkspaceMembership(),
  analyticsController.getStats);

router.get('/:id/exports/goals.csv',
  requireWorkspaceMembership(), requirePermission(CAPABILITIES.EXPORT_CSV),
  exportsController.exportGoals);

router.get('/:id/exports/action-items.csv',
  requireWorkspaceMembership(), requirePermission(CAPABILITIES.EXPORT_CSV),
  exportsController.exportActionItems);

router.get('/:id/exports/announcements.csv',
  requireWorkspaceMembership(), requirePermission(CAPABILITIES.EXPORT_CSV),
  exportsController.exportAnnouncements);

router.get('/:id/exports/audit.csv',
  requireWorkspaceMembership(), requirePermission(CAPABILITIES.EXPORT_CSV),
  exportsController.exportAudit);

// Audit Log
router.get('/:id/audit',
  requireWorkspaceMembership(), requirePermission(CAPABILITIES.AUDIT_READ),
  auditController.listAudit);

module.exports = router;
