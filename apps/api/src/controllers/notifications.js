const prisma = require('../lib/prisma');

async function listNotifications(req, res) {
  const items = await prisma.notification.findMany({
    where: { userId: req.user.id },
    include: { actor: { select: { id: true, name: true, avatarUrl: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  const unreadCount = await prisma.notification.count({
    where: { userId: req.user.id, isRead: false },
  });
  res.json({ notifications: items, unreadCount });
}

async function markRead(req, res) {
  const n = await prisma.notification.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });
  if (!n) return res.status(404).json({ error: 'Notification not found' });
  await prisma.notification.update({ where: { id: n.id }, data: { isRead: true } });
  res.json({ ok: true });
}

async function markAllRead(req, res) {
  await prisma.notification.updateMany({
    where: { userId: req.user.id, isRead: false },
    data: { isRead: true },
  });
  res.json({ ok: true });
}

module.exports = { listNotifications, markRead, markAllRead };
