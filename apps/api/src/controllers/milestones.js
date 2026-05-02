const prisma = require('../lib/prisma');
const { logActivity } = require('../lib/activity');
const { broadcastToWorkspace } = require('../lib/socket');
const { ACTIVITY_TYPES, SOCKET_EVENTS } = require('@team-hub/shared');

async function listMilestones(req, res) {
  const goal = await prisma.goal.findFirst({
    where: { id: req.params.goalId, workspaceId: req.member.workspaceId },
    select: { id: true },
  });
  if (!goal) return res.status(404).json({ error: 'Goal not found' });
  const milestones = await prisma.milestone.findMany({
    where: { goalId: goal.id },
    orderBy: { createdAt: 'asc' },
  });
  res.json({ milestones });
}

async function createMilestone(req, res) {
  const goal = await prisma.goal.findFirst({
    where: { id: req.params.goalId, workspaceId: req.member.workspaceId },
    select: { id: true, title: true },
  });
  if (!goal) return res.status(404).json({ error: 'Goal not found' });

  const { title, progress, dueDate } = req.body;
  if (!title?.trim())
    return res.status(400).json({ error: 'Title is required' });

  const milestone = await prisma.$transaction(async (tx) => {
    const m = await tx.milestone.create({
      data: {
        title: title.trim(),
        progress: clampProgress(progress),
        dueDate: dueDate ? new Date(dueDate) : null,
        completedAt: clampProgress(progress) === 100 ? new Date() : null,
        goalId: goal.id,
      },
    });
    await logActivity(tx, {
      type: ACTIVITY_TYPES.MILESTONE_ADDED,
      message: `added milestone "${m.title}" to "${goal.title}"`,
      userId: req.user.id,
      workspaceId: req.member.workspaceId,
      goalId: goal.id,
      entityType: 'milestone',
      entityId: m.id,
    });
    return m;
  });

  broadcastToWorkspace(
    req.member.workspaceId,
    SOCKET_EVENTS.MILESTONE_UPSERTED,
    { milestone }
  );
  res.status(201).json({ milestone });
}

async function updateMilestone(req, res) {
  const milestone = await prisma.milestone.findUnique({
    where: { id: req.params.milestoneId },
    include: { goal: { select: { id: true, title: true, workspaceId: true } } },
  });
  if (!milestone || milestone.goal.workspaceId !== req.member.workspaceId) {
    return res.status(404).json({ error: 'Milestone not found' });
  }

  const { title, progress, dueDate } = req.body;
  const data = {};
  if (typeof title === 'string') data.title = title.trim();
  if (typeof progress === 'number') {
    data.progress = clampProgress(progress);
    data.completedAt = data.progress === 100 ? new Date() : null;
  }
  if (typeof dueDate !== 'undefined')
    data.dueDate = dueDate ? new Date(dueDate) : null;
  if (Object.keys(data).length === 0)
    return res.status(400).json({ error: 'No changes provided' });

  const updated = await prisma.$transaction(async (tx) => {
    const m = await tx.milestone.update({ where: { id: milestone.id }, data });
    await logActivity(tx, {
      type: ACTIVITY_TYPES.MILESTONE_UPDATED,
      message: `updated milestone "${m.title}"`,
      userId: req.user.id,
      workspaceId: req.member.workspaceId,
      goalId: milestone.goal.id,
      entityType: 'milestone',
      entityId: m.id,
    });
    return m;
  });
  broadcastToWorkspace(
    req.member.workspaceId,
    SOCKET_EVENTS.MILESTONE_UPSERTED,
    { milestone: updated }
  );
  res.json({ milestone: updated });
}

async function deleteMilestone(req, res) {
  const milestone = await prisma.milestone.findUnique({
    where: { id: req.params.milestoneId },
    include: { goal: { select: { id: true, title: true, workspaceId: true } } },
  });
  if (!milestone || milestone.goal.workspaceId !== req.member.workspaceId) {
    return res.status(404).json({ error: 'Milestone not found' });
  }

  await prisma.$transaction(async (tx) => {
    await tx.milestone.delete({ where: { id: milestone.id } });
    await logActivity(tx, {
      type: ACTIVITY_TYPES.MILESTONE_REMOVED,
      message: `removed milestone "${milestone.title}"`,
      userId: req.user.id,
      workspaceId: req.member.workspaceId,
      goalId: milestone.goal.id,
      entityType: 'milestone',
      entityId: milestone.id,
    });
  });

  broadcastToWorkspace(
    req.member.workspaceId,
    SOCKET_EVENTS.MILESTONE_DELETED,
    {
      milestoneId: milestone.id,
      goalId: milestone.goal.id,
    }
  );
  res.status(204).end();
}

function clampProgress(p) {
  const n = Number(p);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

module.exports = {
  listMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone,
};
