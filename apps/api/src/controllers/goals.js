const prisma = require('../lib/prisma');
const { logActivity } = require('../lib/activity');
const { broadcastToWorkspace } = require('../lib/socket');
const { ACTIVITY_TYPES, SOCKET_EVENTS, GOAL_STATUS } = require('@team-hub/shared');

async function listGoals(req, res) {
  const goals = await prisma.goal.findMany({
    where: { workspaceId: req.member.workspaceId },
    include: {
      owner: { select: { id: true, name: true, avatarUrl: true } },
      milestones: { orderBy: { createdAt: 'asc' } },
      _count: { select: { actionItems: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ goals });
}

async function getGoal(req, res) {
  const goal = await prisma.goal.findFirst({
    where: { id: req.params.goalId, workspaceId: req.member.workspaceId },
    include: {
      owner:   { select: { id: true, name: true, avatarUrl: true } },
      createdBy: { select: { id: true, name: true } },
      milestones: { orderBy: { createdAt: 'asc' } },
    },
  });
  if (!goal) return res.status(404).json({ error: 'Goal not found' });
  res.json({ goal });
}

async function createGoal(req, res) {
  const { title, description, ownerId, dueDate, status } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });
  if (status && !Object.values(GOAL_STATUS).includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const ownerExists = ownerId
    ? await prisma.workspaceMember.findUnique({
        where: { userId_workspaceId: { userId: ownerId, workspaceId: req.member.workspaceId } },
      })
    : true;
  if (!ownerExists) return res.status(400).json({ error: 'Owner must be a workspace member' });

  const goal = await prisma.$transaction(async (tx) => {
    const g = await tx.goal.create({
      data: {
        title:       title.trim(),
        description: description?.trim() || null,
        ownerId:     ownerId || req.user.id,
        createdById: req.user.id,
        workspaceId: req.member.workspaceId,
        dueDate:     dueDate ? new Date(dueDate) : null,
        status:      status || GOAL_STATUS.NOT_STARTED,
      },
      include: { owner: { select: { id: true, name: true, avatarUrl: true } }, milestones: true },
    });
    await logActivity(tx, {
      type:        ACTIVITY_TYPES.GOAL_CREATED,
      message:     `created goal "${g.title}"`,
      userId:      req.user.id,
      workspaceId: req.member.workspaceId,
      goalId:      g.id,
      entityType:  'goal',
      entityId:    g.id,
    });
    return g;
  });

  broadcastToWorkspace(req.member.workspaceId, SOCKET_EVENTS.GOAL_CREATED, { goal });
  res.status(201).json({ goal });
}

module.exports = { listGoals, getGoal, createGoal };
