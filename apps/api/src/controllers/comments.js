const prisma = require('../lib/prisma');
const { hasCapability, ACTIVITY_TYPES, SOCKET_EVENTS, NOTIFICATION_TYPES, CAPABILITIES } = require('@team-hub/shared');
const { extractFromMarkdown } = require('../lib/mentions');
const { logActivity } = require('../lib/activity');
const { broadcastToWorkspace } = require('../lib/socket');
const { createNotification } = require('../lib/notifications');

async function listComments(req, res) {
  const announcement = await prisma.announcement.findFirst({
    where: { id: req.params.announcementId, workspaceId: req.member.workspaceId },
    select: { id: true },
  });
  if (!announcement) return res.status(404).json({ error: 'Announcement not found' });

  const comments = await prisma.comment.findMany({
    where: { announcementId: announcement.id },
    include: { author: { select: { id: true, name: true, avatarUrl: true } } },
    orderBy: { createdAt: 'asc' },
  });
  res.json({ comments });
}

async function createComment(req, res) {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'Content is required' });

  const announcement = await prisma.announcement.findFirst({
    where: { id: req.params.announcementId, workspaceId: req.member.workspaceId },
    select: { id: true, title: true },
  });
  if (!announcement) return res.status(404).json({ error: 'Announcement not found' });

  const mentionedIds = extractFromMarkdown(content);

  const comment = await prisma.$transaction(async (tx) => {
    const c = await tx.comment.create({
      data: {
        content:          content.trim(),
        mentionedUserIds: mentionedIds,
        authorId:         req.user.id,
        announcementId:   announcement.id,
      },
      include: { author: { select: { id: true, name: true, avatarUrl: true } } },
    });
    await logActivity(tx, {
      type:        ACTIVITY_TYPES.COMMENT_ADDED,
      message:     `commented on "${announcement.title}"`,
      userId:      req.user.id,
      workspaceId: req.member.workspaceId,
      entityType:  'comment',
      entityId:    c.id,
    });
    for (const userId of mentionedIds) {
      if (userId === req.user.id) continue;
      const member = await tx.workspaceMember.findUnique({
        where: { userId_workspaceId: { userId, workspaceId: req.member.workspaceId } },
      });
      if (!member) continue;
      await createNotification(tx, {
        userId,
        type:       NOTIFICATION_TYPES.MENTION,
        message:    `${req.user.name || 'Someone'} mentioned you in a comment on "${announcement.title}"`,
        actorId:    req.user.id,
        entityType: 'announcement',
        entityId:   announcement.id,
      });
    }
    return c;
  });

  broadcastToWorkspace(req.member.workspaceId, SOCKET_EVENTS.COMMENT_NEW, { comment });
  res.status(201).json({ comment });
}

async function deleteComment(req, res) {
  const comment = await prisma.comment.findUnique({
    where: { id: req.params.commentId },
    include: { announcement: { select: { id: true, workspaceId: true, title: true } } },
  });
  if (!comment || comment.announcement.workspaceId !== req.member.workspaceId) {
    return res.status(404).json({ error: 'Comment not found' });
  }

  const isOwn = comment.authorId === req.user.id;
  const allowed =
    (isOwn && hasCapability(req.member.role, CAPABILITIES.COMMENT_DELETE_OWN)) ||
    hasCapability(req.member.role, CAPABILITIES.COMMENT_DELETE_ANY);
  if (!allowed) return res.status(403).json({ error: 'Forbidden' });

  await prisma.$transaction(async (tx) => {
    await tx.comment.delete({ where: { id: comment.id } });
    await logActivity(tx, {
      type:        ACTIVITY_TYPES.COMMENT_DELETED,
      message:     `deleted a comment on "${comment.announcement.title}"`,
      userId:      req.user.id,
      workspaceId: req.member.workspaceId,
      entityType:  'comment',
      entityId:    comment.id,
    });
  });

  broadcastToWorkspace(req.member.workspaceId, SOCKET_EVENTS.COMMENT_DELETED, {
    commentId: comment.id, announcementId: comment.announcement.id,
  });
  res.status(204).end();
}

module.exports = { listComments, createComment, deleteComment };
