const prisma = require('../lib/prisma');
const { sanitizeAnnouncementHtml } = require('../lib/sanitize');
const { extractFromHtml } = require('../lib/mentions');
const { logActivity } = require('../lib/activity');
const { broadcastToWorkspace } = require('../lib/socket');
const { createNotification } = require('../lib/notifications');
const {
  ACTIVITY_TYPES,
  SOCKET_EVENTS,
  NOTIFICATION_TYPES,
} = require('@team-hub/shared');

async function listAnnouncements(req, res) {
  const items = await prisma.announcement.findMany({
    where: { workspaceId: req.member.workspaceId },
    include: {
      author: { select: { id: true, name: true, avatarUrl: true } },
      _count: { select: { comments: true, reactions: true } },
    },
    orderBy: [
      { isPinned: 'desc' },
      { pinnedAt: 'desc' },
      { createdAt: 'desc' },
    ],
  });
  res.json({ announcements: items });
}

async function getAnnouncement(req, res) {
  const a = await prisma.announcement.findFirst({
    where: {
      id: req.params.announcementId,
      workspaceId: req.member.workspaceId,
    },
    include: {
      author: { select: { id: true, name: true, avatarUrl: true } },
      reactions: { include: { user: { select: { id: true, name: true } } } },
      comments: {
        orderBy: { createdAt: 'asc' },
        include: {
          author: { select: { id: true, name: true, avatarUrl: true } },
        },
      },
    },
  });
  if (!a) return res.status(404).json({ error: 'Announcement not found' });
  res.json({ announcement: a });
}

async function createAnnouncement(req, res) {
  const { title, content } = req.body;
  if (!title?.trim())
    return res.status(400).json({ error: 'Title is required' });
  if (!content?.trim())
    return res.status(400).json({ error: 'Content is required' });

  const safeContent = sanitizeAnnouncementHtml(content);
  const mentionedIds = extractFromHtml(safeContent);

  const announcement = await prisma.$transaction(async (tx) => {
    const a = await tx.announcement.create({
      data: {
        title: title.trim(),
        content: safeContent,
        authorId: req.user.id,
        workspaceId: req.member.workspaceId,
      },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
    await logActivity(tx, {
      type: ACTIVITY_TYPES.ANNOUNCEMENT_POSTED,
      message: `posted announcement "${a.title}"`,
      userId: req.user.id,
      workspaceId: req.member.workspaceId,
      entityType: 'announcement',
      entityId: a.id,
    });
    for (const userId of mentionedIds) {
      if (userId === req.user.id) continue;
      const member = await tx.workspaceMember.findUnique({
        where: {
          userId_workspaceId: { userId, workspaceId: req.member.workspaceId },
        },
      });
      if (!member) continue;
      await createNotification(tx, {
        userId,
        type: NOTIFICATION_TYPES.MENTION,
        message: `${req.user.name || 'Someone'} mentioned you in "${a.title}"`,
        actorId: req.user.id,
        entityType: 'announcement',
        entityId: a.id,
      });
    }
    return a;
  });

  broadcastToWorkspace(req.member.workspaceId, SOCKET_EVENTS.ANNOUNCEMENT_NEW, {
    announcement,
  });
  res.status(201).json({ announcement });
}

async function updateAnnouncement(req, res) {
  const a = await prisma.announcement.findFirst({
    where: {
      id: req.params.announcementId,
      workspaceId: req.member.workspaceId,
    },
  });
  if (!a) return res.status(404).json({ error: 'Announcement not found' });

  const { title, content } = req.body;
  const data = {};
  if (typeof title === 'string') data.title = title.trim();
  if (typeof content === 'string')
    data.content = sanitizeAnnouncementHtml(content);
  if (Object.keys(data).length === 0)
    return res.status(400).json({ error: 'No changes provided' });

  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.announcement.update({
      where: { id: a.id },
      data,
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
    await logActivity(tx, {
      type: ACTIVITY_TYPES.ANNOUNCEMENT_UPDATED,
      message: `updated announcement "${u.title}"`,
      userId: req.user.id,
      workspaceId: req.member.workspaceId,
      entityType: 'announcement',
      entityId: u.id,
    });
    return u;
  });

  broadcastToWorkspace(
    req.member.workspaceId,
    SOCKET_EVENTS.ANNOUNCEMENT_UPDATED,
    { announcement: updated }
  );
  res.json({ announcement: updated });
}

async function deleteAnnouncement(req, res) {
  const a = await prisma.announcement.findFirst({
    where: {
      id: req.params.announcementId,
      workspaceId: req.member.workspaceId,
    },
  });
  if (!a) return res.status(404).json({ error: 'Announcement not found' });

  await prisma.$transaction(async (tx) => {
    await tx.announcement.delete({ where: { id: a.id } });
    await logActivity(tx, {
      type: ACTIVITY_TYPES.ANNOUNCEMENT_DELETED,
      message: `deleted announcement "${a.title}"`,
      userId: req.user.id,
      workspaceId: req.member.workspaceId,
      entityType: 'announcement',
      entityId: a.id,
    });
  });

  broadcastToWorkspace(
    req.member.workspaceId,
    SOCKET_EVENTS.ANNOUNCEMENT_DELETED,
    { announcementId: a.id }
  );
  res.status(204).end();
}

async function togglePin(req, res) {
  const a = await prisma.announcement.findFirst({
    where: {
      id: req.params.announcementId,
      workspaceId: req.member.workspaceId,
    },
  });
  if (!a) return res.status(404).json({ error: 'Announcement not found' });

  const next = !a.isPinned;
  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.announcement.update({
      where: { id: a.id },
      data: { isPinned: next, pinnedAt: next ? new Date() : null },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
    await logActivity(tx, {
      type: ACTIVITY_TYPES.ANNOUNCEMENT_PINNED,
      message: `${next ? 'pinned' : 'unpinned'} "${u.title}"`,
      userId: req.user.id,
      workspaceId: req.member.workspaceId,
      entityType: 'announcement',
      entityId: u.id,
    });
    return u;
  });

  broadcastToWorkspace(
    req.member.workspaceId,
    SOCKET_EVENTS.ANNOUNCEMENT_PINNED,
    { announcement: updated }
  );
  res.json({ announcement: updated });
}

module.exports = {
  listAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  togglePin,
};
