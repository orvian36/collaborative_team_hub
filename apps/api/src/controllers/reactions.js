const prisma = require('../lib/prisma');
const { broadcastToWorkspace } = require('../lib/socket');
const { SOCKET_EVENTS } = require('@team-hub/shared');

async function toggleReaction(req, res) {
  const { emoji } = req.body;
  if (typeof emoji !== 'string' || emoji.length === 0 || emoji.length > 8) {
    return res.status(400).json({ error: 'Invalid emoji' });
  }
  const announcement = await prisma.announcement.findFirst({
    where: {
      id: req.params.announcementId,
      workspaceId: req.member.workspaceId,
    },
    select: { id: true },
  });
  if (!announcement)
    return res.status(404).json({ error: 'Announcement not found' });

  const existing = await prisma.reaction.findUnique({
    where: {
      userId_announcementId_emoji: {
        userId: req.user.id,
        announcementId: announcement.id,
        emoji,
      },
    },
  });

  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
    broadcastToWorkspace(
      req.member.workspaceId,
      SOCKET_EVENTS.REACTION_REMOVED,
      {
        reactionId: existing.id,
        announcementId: announcement.id,
        userId: req.user.id,
        emoji,
      }
    );
    return res.json({ removed: true });
  }

  const reaction = await prisma.reaction.create({
    data: { userId: req.user.id, announcementId: announcement.id, emoji },
    include: { user: { select: { id: true, name: true } } },
  });
  broadcastToWorkspace(req.member.workspaceId, SOCKET_EVENTS.REACTION_NEW, {
    reaction,
  });
  res.status(201).json({ reaction });
}

module.exports = { toggleReaction };
