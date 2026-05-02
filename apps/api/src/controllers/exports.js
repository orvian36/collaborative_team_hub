const prisma = require('../lib/prisma');
const { streamCsv } = require('../lib/csv');

function slug(name) {
  return (name || 'workspace')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
function dateStr() {
  return new Date().toISOString().slice(0, 10);
}

async function exportGoals(req, res) {
  const workspaceId = req.member.workspaceId;
  const ws = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { name: true },
  });
  const goals = await prisma.goal.findMany({
    where: { workspaceId },
    include: { owner: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'asc' },
  });
  const rows = goals.map((g) => ({
    id: g.id,
    title: g.title,
    description: g.description || '',
    status: g.status,
    owner: g.owner?.name || '',
    ownerEmail: g.owner?.email || '',
    dueDate: g.dueDate ? g.dueDate.toISOString() : '',
    createdAt: g.createdAt.toISOString(),
  }));
  await streamCsv(res, {
    filename: `${slug(ws?.name)}-goals-${dateStr()}`,
    columns: [
      { key: 'id', header: 'id' },
      { key: 'title', header: 'title' },
      { key: 'description', header: 'description' },
      { key: 'status', header: 'status' },
      { key: 'owner', header: 'owner' },
      { key: 'ownerEmail', header: 'ownerEmail' },
      { key: 'dueDate', header: 'dueDate' },
      { key: 'createdAt', header: 'createdAt' },
    ],
    rows,
  });
}

async function exportActionItems(req, res) {
  const workspaceId = req.member.workspaceId;
  const ws = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { name: true },
  });
  const items = await prisma.actionItem.findMany({
    where: { workspaceId },
    include: {
      assignee: { select: { name: true, email: true } },
      goal: { select: { title: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
  const rows = items.map((i) => ({
    id: i.id,
    title: i.title,
    description: i.description || '',
    priority: i.priority,
    status: i.status,
    assignee: i.assignee?.name || '',
    assigneeEmail: i.assignee?.email || '',
    goal: i.goal?.title || '',
    dueDate: i.dueDate ? i.dueDate.toISOString() : '',
    createdAt: i.createdAt.toISOString(),
  }));
  await streamCsv(res, {
    filename: `${slug(ws?.name)}-action-items-${dateStr()}`,
    columns: [
      { key: 'id', header: 'id' },
      { key: 'title', header: 'title' },
      { key: 'description', header: 'description' },
      { key: 'priority', header: 'priority' },
      { key: 'status', header: 'status' },
      { key: 'assignee', header: 'assignee' },
      { key: 'assigneeEmail', header: 'assigneeEmail' },
      { key: 'goal', header: 'goal' },
      { key: 'dueDate', header: 'dueDate' },
      { key: 'createdAt', header: 'createdAt' },
    ],
    rows,
  });
}

async function exportAnnouncements(req, res) {
  const workspaceId = req.member.workspaceId;
  const ws = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { name: true },
  });
  const items = await prisma.announcement.findMany({
    where: { workspaceId },
    include: {
      author: { select: { name: true, email: true } },
      _count: { select: { comments: true, reactions: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
  const rows = items.map((a) => ({
    id: a.id,
    title: a.title,
    contentHtml: a.content,
    author: a.author?.name || '',
    authorEmail: a.author?.email || '',
    isPinned: a.isPinned,
    commentsCount: a._count?.comments || 0,
    reactionsCount: a._count?.reactions || 0,
    createdAt: a.createdAt.toISOString(),
  }));
  await streamCsv(res, {
    filename: `${slug(ws?.name)}-announcements-${dateStr()}`,
    columns: [
      { key: 'id', header: 'id' },
      { key: 'title', header: 'title' },
      { key: 'contentHtml', header: 'contentHtml' },
      { key: 'author', header: 'author' },
      { key: 'authorEmail', header: 'authorEmail' },
      { key: 'isPinned', header: 'isPinned' },
      { key: 'commentsCount', header: 'commentsCount' },
      { key: 'reactionsCount', header: 'reactionsCount' },
      { key: 'createdAt', header: 'createdAt' },
    ],
    rows,
  });
}

async function exportAudit(req, res) {
  const workspaceId = req.member.workspaceId;
  const ws = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { name: true },
  });
  const where = { workspaceId };
  if (req.query.from)
    where.createdAt = {
      ...(where.createdAt || {}),
      gte: new Date(req.query.from),
    };
  if (req.query.to)
    where.createdAt = {
      ...(where.createdAt || {}),
      lte: new Date(req.query.to),
    };
  if (req.query.type) where.type = req.query.type;
  if (req.query.actorId) where.userId = req.query.actorId;

  const events = await prisma.activity.findMany({
    where,
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'asc' },
  });
  const rows = events.map((e) => ({
    id: e.id,
    type: e.type,
    message: e.message,
    actor: e.user?.name || '',
    actorEmail: e.user?.email || '',
    entityType: e.entityType || '',
    entityId: e.entityId || '',
    metadata: e.metadata ? JSON.stringify(e.metadata) : '',
    createdAt: e.createdAt.toISOString(),
  }));
  await streamCsv(res, {
    filename: `${slug(ws?.name)}-audit-${dateStr()}`,
    columns: [
      { key: 'id', header: 'id' },
      { key: 'type', header: 'type' },
      { key: 'message', header: 'message' },
      { key: 'actor', header: 'actor' },
      { key: 'actorEmail', header: 'actorEmail' },
      { key: 'entityType', header: 'entityType' },
      { key: 'entityId', header: 'entityId' },
      { key: 'metadata', header: 'metadata' },
      { key: 'createdAt', header: 'createdAt' },
    ],
    rows,
  });
}

module.exports = {
  exportGoals,
  exportActionItems,
  exportAnnouncements,
  exportAudit,
};
