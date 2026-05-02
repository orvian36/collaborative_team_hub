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

async function updateGoal(req, res) {
  const goal = await prisma.goal.findFirst({
    where: { id: req.params.goalId, workspaceId: req.member.workspaceId },
  });
  if (!goal) return res.status(404).json({ error: 'Goal not found' });

  const { title, description, ownerId, dueDate } = req.body;
  const data = {};
  if (typeof title === 'string')       data.title = title.trim();
  if (typeof description === 'string') data.description = description.trim() || null;
  if (typeof dueDate !== 'undefined')  data.dueDate = dueDate ? new Date(dueDate) : null;
  if (ownerId && ownerId !== goal.ownerId) {
    const m = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: ownerId, workspaceId: req.member.workspaceId } },
    });
    if (!m) return res.status(400).json({ error: 'Owner must be a workspace member' });
    data.ownerId = ownerId;
  }
  if (Object.keys(data).length === 0) return res.status(400).json({ error: 'No changes provided' });

  const updated = await prisma.$transaction(async (tx) => {
    const g = await tx.goal.update({
      where: { id: goal.id },
      data,
      include: { owner: { select: { id: true, name: true, avatarUrl: true } }, milestones: true },
    });
    await logActivity(tx, {
      type:        ACTIVITY_TYPES.GOAL_UPDATED,
      message:     `updated goal "${g.title}"`,
      userId:      req.user.id,
      workspaceId: req.member.workspaceId,
      goalId:      g.id,
      entityType:  'goal',
      entityId:    g.id,
    });
    return g;
  });
  broadcastToWorkspace(req.member.workspaceId, SOCKET_EVENTS.GOAL_UPDATED, { goal: updated });
  res.json({ goal: updated });
}

async function changeGoalStatus(req, res) {
  const { status } = req.body;
  if (!Object.values(GOAL_STATUS).includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const goal = await prisma.goal.findFirst({
    where: { id: req.params.goalId, workspaceId: req.member.workspaceId },
  });
  if (!goal) return res.status(404).json({ error: 'Goal not found' });

  const updated = await prisma.$transaction(async (tx) => {
    const g = await tx.goal.update({
      where: { id: goal.id },
      data:  { status },
      include: { owner: { select: { id: true, name: true, avatarUrl: true } } },
    });
    await logActivity(tx, {
      type:        ACTIVITY_TYPES.GOAL_STATUS_CHANGED,
      message:     `changed status of "${g.title}" to ${status}`,
      userId:      req.user.id,
      workspaceId: req.member.workspaceId,
      goalId:      g.id,
      entityType:  'goal',
      entityId:    g.id,
      metadata:    { from: goal.status, to: status },
    });
    return g;
  });

  broadcastToWorkspace(req.member.workspaceId, SOCKET_EVENTS.GOAL_STATUS_CHANGED, {
    goalId: updated.id, status: updated.status, by: req.user.id,
  });

  // Notify the goal owner if they didn't change it themselves (Phase 5 wires real notification dispatch).
  res.json({ goal: updated });
}

async function deleteGoal(req, res) {
  const goal = await prisma.goal.findFirst({
    where: { id: req.params.goalId, workspaceId: req.member.workspaceId },
  });
  if (!goal) return res.status(404).json({ error: 'Goal not found' });

  await prisma.$transaction(async (tx) => {
    await tx.goal.delete({ where: { id: goal.id } });
    await logActivity(tx, {
      type:        ACTIVITY_TYPES.GOAL_DELETED,
      message:     `deleted goal "${goal.title}"`,
      userId:      req.user.id,
      workspaceId: req.member.workspaceId,
      entityType:  'goal',
      entityId:    goal.id,
    });
  });

  broadcastToWorkspace(req.member.workspaceId, SOCKET_EVENTS.GOAL_DELETED, { goalId: goal.id });
  res.status(204).end();
}

async function getGoalActivity(req, res) {
  const goal = await prisma.goal.findFirst({
    where: { id: req.params.goalId, workspaceId: req.member.workspaceId },
    select: { id: true },
  });
  if (!goal) return res.status(404).json({ error: 'Goal not found' });

  const activities = await prisma.activity.findMany({
    where: { goalId: goal.id },
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  res.json({ activities });
}

module.exports = { listGoals, getGoal, createGoal, updateGoal, changeGoalStatus, deleteGoal, getGoalActivity };
