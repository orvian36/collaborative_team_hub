const prisma = require('../lib/prisma');
const { ROLES } = require('@team-hub/shared');

/**
 * Throws a 409 if removing/demoting `leavingMemberId` would leave zero admins.
 * Must be run inside the same transaction as the mutation.
 */
const assertNotLastAdmin = async (tx, workspaceId, leavingMemberId) => {
  const remaining = await tx.workspaceMember.count({
    where: { workspaceId, role: ROLES.ADMIN, id: { not: leavingMemberId } },
  });
  if (remaining === 0) {
    const err = new Error('Promote another member to admin first');
    err.status = 409;
    throw err;
  }
};

/**
 * @openapi
 * /api/workspaces/{workspaceId}/members:
 *   get:
 *     tags: [Workspaces]
 *     summary: List members of a workspace
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema: { type: string, format: uuid }
 */
const listMembers = async (req, res) => {
  try {
    const search = (req.query.search || '').trim().toLowerCase();
    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId: req.params.workspaceId },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
      orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
    });

    const filtered = !search
      ? members
      : members.filter(
          (m) =>
            m.user.name.toLowerCase().includes(search) ||
            m.user.email.toLowerCase().includes(search)
        );

    res.status(200).json({ members: filtered });
  } catch (err) {
    console.error('listMembers error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * @openapi
 * /api/workspaces/{workspaceId}/members/{memberId}:
 *   patch:
 *     tags: [Workspaces]
 *     summary: Change a member's role (admin only)
 */
const updateMemberRole = async (req, res) => {
  const { role } = req.body;
  if (![ROLES.ADMIN, ROLES.MEMBER].includes(role)) {
    return res.status(400).json({ error: 'Role must be ADMIN or MEMBER' });
  }

  try {
    const target = await prisma.workspaceMember.findUnique({
      where: { id: req.params.memberId },
    });
    if (!target || target.workspaceId !== req.params.workspaceId) {
      return res.status(404).json({ error: 'Member not found' });
    }

    if (target.role === role) {
      return res.status(200).json({ member: target });
    }

    const member = await prisma.$transaction(async (tx) => {
      // Demoting an admin → enforce last-admin guard
      if (target.role === ROLES.ADMIN && role === ROLES.MEMBER) {
        await assertNotLastAdmin(tx, target.workspaceId, target.id);
      }
      return tx.workspaceMember.update({
        where: { id: target.id },
        data: { role },
      });
    });

    res.status(200).json({ member });
  } catch (err) {
    if (err.status === 409) return res.status(409).json({ error: err.message });
    console.error('updateMemberRole error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * @openapi
 * /api/workspaces/{workspaceId}/members/{memberId}:
 *   delete:
 *     tags: [Workspaces]
 *     summary: Remove a member (admin or self)
 */
const removeMember = async (req, res) => {
  try {
    const target = await prisma.workspaceMember.findUnique({
      where: { id: req.params.memberId },
    });
    if (!target || target.workspaceId !== req.params.workspaceId) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const isSelf = target.userId === req.user.id;
    const callerIsAdmin = req.member.role === ROLES.ADMIN;
    if (!isSelf && !callerIsAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    await prisma.$transaction(async (tx) => {
      if (target.role === ROLES.ADMIN) {
        await assertNotLastAdmin(tx, target.workspaceId, target.id);
      }
      await tx.workspaceMember.delete({ where: { id: target.id } });
    });

    res.status(204).end();
  } catch (err) {
    if (err.status === 409) return res.status(409).json({ error: err.message });
    console.error('removeMember error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * @openapi
 * /api/workspaces/{workspaceId}/members/leave:
 *   post:
 *     tags: [Workspaces]
 *     summary: Leave the workspace (self)
 */
const leaveWorkspace = async (req, res) => {
  try {
    await prisma.$transaction(async (tx) => {
      if (req.member.role === ROLES.ADMIN) {
        await assertNotLastAdmin(tx, req.member.workspaceId, req.member.id);
      }
      await tx.workspaceMember.delete({ where: { id: req.member.id } });
    });
    res.status(204).end();
  } catch (err) {
    if (err.status === 409) return res.status(409).json({ error: err.message });
    console.error('leaveWorkspace error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  listMembers,
  updateMemberRole,
  removeMember,
  leaveWorkspace,
  assertNotLastAdmin,
};
