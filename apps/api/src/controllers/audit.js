const prisma = require('../lib/prisma');

async function listAudit(req, res) {
  const workspaceId = req.member.workspaceId;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const pageSize = 50;

  const where = { workspaceId };
  if (req.query.type) {
    where.type = Array.isArray(req.query.type) ? { in: req.query.type } : req.query.type;
  }
  if (req.query.actorId) where.userId = req.query.actorId;
  if (req.query.from) where.createdAt = { ...(where.createdAt || {}), gte: new Date(req.query.from) };
  if (req.query.to)   where.createdAt = { ...(where.createdAt || {}), lte: new Date(req.query.to) };

  const [total, events] = await Promise.all([
    prisma.activity.count({ where }),
    prisma.activity.findMany({
      where,
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  res.json({ events, page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
}

module.exports = { listAudit };
