const express = require('express');
const { authenticate } = require('../middleware/auth');
const c = require('../controllers/notifications');

const router = express.Router();
router.use(authenticate);

router.get('/',                  c.listNotifications);
router.patch('/:id/read',        c.markRead);
router.patch('/read-all',        c.markAllRead);

module.exports = router;
