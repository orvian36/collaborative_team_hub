const prisma = require('../lib/prisma');
const { GOAL_STATUS, ACTION_ITEM_STATUS } = require('@team-hub/shared');

async function getStats(req, res) {
  const workspaceId = req.member.workspaceId;
  const now = new Date();
  const startOfWeek = startOfCurrentWeek(now);

  const [
    totalGoals,
    byGoalStatus,
    completedActionItemsThisWeek,
    overdueActionItems,
    monthBuckets,
  ] = await Promise.all([
    prisma.goal.count({ where: { workspaceId } }),
    prisma.goal.groupBy({
      by: ['status'],
      where: { workspaceId },
      _count: { _all: true },
    }),
    prisma.actionItem.count({
      where: {
        workspaceId,
        status: ACTION_ITEM_STATUS.DONE,
        updatedAt: { gte: startOfWeek },
      },
    }),
    prisma.actionItem.count({
      where: {
        workspaceId,
        status: { not: ACTION_ITEM_STATUS.DONE },
        dueDate: { lt: now },
      },
    }),
    completionByMonth(workspaceId),
  ]);

  const goalsByStatus = Object.fromEntries(
    Object.values(GOAL_STATUS).map((s) => [
      s,
      byGoalStatus.find((r) => r.status === s)?._count._all || 0,
    ])
  );

  res.json({
    totalGoals,
    goalsByStatus,
    completedActionItemsThisWeek,
    overdueActionItems,
    goalCompletionByMonth: monthBuckets,
  });
}

function startOfCurrentWeek(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay(); // 0 Sun ... 6 Sat
  x.setDate(x.getDate() - day);
  return x;
}

async function completionByMonth(workspaceId) {
  // Last 6 months including this one
  const buckets = [];
  const today = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const next = new Date(today.getFullYear(), today.getMonth() - i + 1, 1);
    const completed = await prisma.goal.count({
      where: {
        workspaceId,
        status: GOAL_STATUS.COMPLETED,
        updatedAt: { gte: d, lt: next },
      },
    });
    const created = await prisma.goal.count({
      where: { workspaceId, createdAt: { gte: d, lt: next } },
    });
    buckets.push({
      month: d.toLocaleString('default', { month: 'short' }),
      completed,
      created,
    });
  }
  return buckets;
}

module.exports = { getStats };
