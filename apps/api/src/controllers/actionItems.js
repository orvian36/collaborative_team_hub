const prisma = require('../lib/prisma');
const { logActivity } = require('../lib/activity');
const { broadcastToWorkspace } = require('../lib/socket');
const { createNotification } = require('../lib/notifications');
const { ACTIVITY_TYPES, SOCKET_EVENTS, NOTIFICATION_TYPES, ACTION_ITEM_STATUS, PRIORITY } = require('@team-hub/shared');

async function listActionItems(req, res) {
  const items = await prisma.actionItem.findMany({
    where: { workspaceId: req.member.workspaceId },
    include: {
      assignee: { select: { id: true, name: true, avatarUrl: true } },
      goal:     { select: { id: true, title: true } },
    },
    orderBy: [{ status: 'asc' }, { position: 'asc' }, { createdAt: 'desc' }],
  });
  res.json({ actionItems: items });
}

async function getActionItem(req, res) {
  const item = await prisma.actionItem.findFirst({
    where: { id: req.params.actionItemId, workspaceId: req.member.workspaceId },
    include: {
      assignee: { select: { id: true, name: true, avatarUrl: true } },
      goal:     { select: { id: true, title: true } },
    },
  });
  if (!item) return res.status(404).json({ error: 'Action item not found' });
  res.json({ actionItem: item });
}

async function createActionItem(req, res) {
  const { title, description, priority, status, dueDate, assigneeId, goalId } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });
  if (priority && !Object.values(PRIORITY).includes(priority)) {
    return res.status(400).json({ error: 'Invalid priority' });
  }
  if (status && !Object.values(ACTION_ITEM_STATUS).includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  if (assigneeId) {
    const m = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: assigneeId, workspaceId: req.member.workspaceId } },
    });
    if (!m) return res.status(400).json({ error: 'Assignee must be a workspace member' });
  }
  if (goalId) {
    const g = await prisma.goal.findFirst({ where: { id: goalId, workspaceId: req.member.workspaceId } });
    if (!g) return res.status(400).json({ error: 'Goal must belong to this workspace' });
  }

  const targetStatus = status || ACTION_ITEM_STATUS.TODO;

  const item = await prisma.$transaction(async (tx) => {
    // New cards go to the bottom of their column
    const last = await tx.actionItem.findFirst({
      where: { workspaceId: req.member.workspaceId, status: targetStatus },
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    const position = (last?.position ?? -1) + 1;

    const created = await tx.actionItem.create({
      data: {
        title:       title.trim(),
        description: description?.trim() || null,
        priority:    priority || PRIORITY.MEDIUM,
        status:      targetStatus,
        dueDate:     dueDate ? new Date(dueDate) : null,
        assigneeId:  assigneeId || null,
        goalId:      goalId || null,
        workspaceId: req.member.workspaceId,
        position,
      },
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        goal:     { select: { id: true, title: true } },
      },
    });
    await logActivity(tx, {
      type:        ACTIVITY_TYPES.ACTION_ITEM_CREATED,
      message:     `created action item "${created.title}"`,
      userId:      req.user.id,
      workspaceId: req.member.workspaceId,
      goalId:      created.goalId || null,
      entityType:  'actionItem',
      entityId:    created.id,
    });
    if (assigneeId && assigneeId !== req.user.id) {
      await createNotification(tx, {
        userId:     assigneeId,
        type:       NOTIFICATION_TYPES.ASSIGNMENT,
        message:    `${req.user.name || 'Someone'} assigned you "${created.title}"`,
        actorId:    req.user.id,
        entityType: 'actionItem',
        entityId:   created.id,
      });
    }
    return created;
  });

  broadcastToWorkspace(req.member.workspaceId, SOCKET_EVENTS.ACTION_ITEM_CREATED, { actionItem: item });
  res.status(201).json({ actionItem: item });
}

async function updateActionItem(req, res) {
  const item = await prisma.actionItem.findFirst({
    where: { id: req.params.actionItemId, workspaceId: req.member.workspaceId },
  });
  if (!item) return res.status(404).json({ error: 'Action item not found' });

  const { title, description, priority, dueDate, assigneeId, goalId } = req.body;
  const data = {};
  if (typeof title === 'string')       data.title = title.trim();
  if (typeof description === 'string') data.description = description.trim() || null;
  if (priority) {
    if (!Object.values(PRIORITY).includes(priority)) return res.status(400).json({ error: 'Invalid priority' });
    data.priority = priority;
  }
  if (typeof dueDate !== 'undefined') data.dueDate = dueDate ? new Date(dueDate) : null;
  if (typeof goalId !== 'undefined') {
    if (goalId) {
      const g = await prisma.goal.findFirst({ where: { id: goalId, workspaceId: req.member.workspaceId } });
      if (!g) return res.status(400).json({ error: 'Goal must belong to this workspace' });
      data.goalId = goalId;
    } else {
      data.goalId = null;
    }
  }
  if (typeof assigneeId !== 'undefined' && assigneeId !== item.assigneeId) {
    if (assigneeId) {
      const m = await prisma.workspaceMember.findUnique({
        where: { userId_workspaceId: { userId: assigneeId, workspaceId: req.member.workspaceId } },
      });
      if (!m) return res.status(400).json({ error: 'Assignee must be a workspace member' });
    }
    data.assigneeId = assigneeId || null;
  }
  if (Object.keys(data).length === 0) return res.status(400).json({ error: 'No changes provided' });

  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.actionItem.update({
      where: { id: item.id },
      data,
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        goal:     { select: { id: true, title: true } },
      },
    });
    await logActivity(tx, {
      type:        ACTIVITY_TYPES.ACTION_ITEM_UPDATED,
      message:     `updated action item "${u.title}"`,
      userId:      req.user.id,
      workspaceId: req.member.workspaceId,
      goalId:      u.goalId || null,
      entityType:  'actionItem',
      entityId:    u.id,
    });
    if ('assigneeId' in data && data.assigneeId && data.assigneeId !== req.user.id) {
      await createNotification(tx, {
        userId:     data.assigneeId,
        type:       NOTIFICATION_TYPES.ASSIGNMENT,
        message:    `${req.user.name || 'Someone'} assigned you "${u.title}"`,
        actorId:    req.user.id,
        entityType: 'actionItem',
        entityId:   u.id,
      });
    }
    return u;
  });

  broadcastToWorkspace(req.member.workspaceId, SOCKET_EVENTS.ACTION_ITEM_UPDATED, { actionItem: updated });
  res.json({ actionItem: updated });
}

async function deleteActionItem(req, res) {
  const item = await prisma.actionItem.findFirst({
    where: { id: req.params.actionItemId, workspaceId: req.member.workspaceId },
  });
  if (!item) return res.status(404).json({ error: 'Action item not found' });

  await prisma.$transaction(async (tx) => {
    await tx.actionItem.delete({ where: { id: item.id } });
    await logActivity(tx, {
      type:        ACTIVITY_TYPES.ACTION_ITEM_DELETED,
      message:     `deleted action item "${item.title}"`,
      userId:      req.user.id,
      workspaceId: req.member.workspaceId,
      goalId:      item.goalId || null,
      entityType:  'actionItem',
      entityId:    item.id,
    });
  });

  broadcastToWorkspace(req.member.workspaceId, SOCKET_EVENTS.ACTION_ITEM_DELETED, { actionItemId: item.id });
  res.status(204).end();
}

async function moveActionItem(req, res) {
  const { status, position } = req.body;
  if (!Object.values(ACTION_ITEM_STATUS).includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  if (typeof position !== 'number' || position < 0) {
    return res.status(400).json({ error: 'Invalid position' });
  }
  const item = await prisma.actionItem.findFirst({
    where: { id: req.params.actionItemId, workspaceId: req.member.workspaceId },
  });
  if (!item) return res.status(404).json({ error: 'Action item not found' });

  const updated = await prisma.$transaction(async (tx) => {
    // Compact source column (close gap) if moving across columns
    if (item.status !== status) {
      await tx.actionItem.updateMany({
        where: {
          workspaceId: req.member.workspaceId,
          status: item.status,
          position: { gt: item.position },
        },
        data: { position: { decrement: 1 } },
      });
    } else {
      // Same column: shift only between old and new
      if (position > item.position) {
        await tx.actionItem.updateMany({
          where: {
            workspaceId: req.member.workspaceId,
            status,
            position: { gt: item.position, lte: position },
          },
          data: { position: { decrement: 1 } },
        });
      } else if (position < item.position) {
        await tx.actionItem.updateMany({
          where: {
            workspaceId: req.member.workspaceId,
            status,
            position: { gte: position, lt: item.position },
          },
          data: { position: { increment: 1 } },
        });
      }
    }
    if (item.status !== status) {
      // Make room at target position in destination column
      await tx.actionItem.updateMany({
        where: {
          workspaceId: req.member.workspaceId,
          status,
          position: { gte: position },
        },
        data: { position: { increment: 1 } },
      });
    }
    const u = await tx.actionItem.update({
      where: { id: item.id },
      data:  { status, position },
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        goal:     { select: { id: true, title: true } },
      },
    });
    if (item.status !== status) {
      await logActivity(tx, {
        type:        ACTIVITY_TYPES.ACTION_ITEM_STATUS_CHANGED,
        message:     `moved "${u.title}" to ${status}`,
        userId:      req.user.id,
        workspaceId: req.member.workspaceId,
        goalId:      u.goalId || null,
        entityType:  'actionItem',
        entityId:    u.id,
        metadata:    { from: item.status, to: status },
      });
    }
    return u;
  });

  broadcastToWorkspace(req.member.workspaceId, SOCKET_EVENTS.ACTION_ITEM_MOVED, {
    actionItem: updated, previousStatus: item.status, previousPosition: item.position,
  });
  res.json({ actionItem: updated });
}

module.exports = { listActionItems, getActionItem, createActionItem, updateActionItem, deleteActionItem, moveActionItem };
