const crypto = require('crypto');
const prisma = require('../lib/prisma');
const {
  ROLES,
  INVITATION_STATUS,
  INVITATION_TTL_DAYS,
} = require('@team-hub/shared');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const normalizeEmail = (s) => String(s).trim().toLowerCase();
const ttlFromNow = () =>
  new Date(Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000);
const inviteUrlFor = (token) => {
  const base = process.env.CLIENT_URL || 'http://localhost:3000';
  return `${base.replace(/\/$/, '')}/invite/${token}`;
};

/**
 * Helper: if invitation is PENDING but past expiresAt, flip status to EXPIRED
 * and return the updated row. Pure SQL update; safe to call inside or outside
 * a transaction.
 */
const expireIfNeeded = async (tx, invitation) => {
  if (
    invitation.status === INVITATION_STATUS.PENDING &&
    invitation.expiresAt < new Date()
  ) {
    return tx.invitation.update({
      where: { id: invitation.id },
      data: { status: INVITATION_STATUS.EXPIRED },
    });
  }
  return invitation;
};

/**
 * @openapi
 * /api/workspaces/{workspaceId}/invitations:
 *   post:
 *     tags: [Workspaces]
 *     summary: Create an invitation (admin only)
 */
const createInvitation = async (req, res) => {
  const email = req.body.email && normalizeEmail(req.body.email);
  const role = req.body.role || ROLES.MEMBER;

  if (!email || !EMAIL_RE.test(email))
    return res.status(400).json({ error: 'Valid email is required' });
  if (![ROLES.ADMIN, ROLES.MEMBER].includes(role))
    return res.status(400).json({ error: 'Role must be ADMIN or MEMBER' });

  try {
    const workspaceId = req.params.workspaceId;

    // Fast path: is there already a user with that email who's a member?
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const existingMember = await prisma.workspaceMember.findUnique({
        where: { userId_workspaceId: { userId: existingUser.id, workspaceId } },
      });
      if (existingMember) {
        return res
          .status(409)
          .json({ error: 'User is already a member of this workspace' });
      }
    }

    // Reject if a PENDING invite already exists for this email + workspace.
    const existingPending = await prisma.invitation.findFirst({
      where: { workspaceId, email, status: INVITATION_STATUS.PENDING },
    });
    if (existingPending) {
      return res
        .status(409)
        .json({ error: 'A pending invitation already exists for this email' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const invitation = await prisma.invitation.create({
      data: {
        email,
        role,
        token,
        status: INVITATION_STATUS.PENDING,
        expiresAt: ttlFromNow(),
        workspaceId,
        invitedById: req.user.id,
      },
    });

    const { sendInvitationEmail } = require('../lib/email');
    const workspace = await prisma.workspace.findUnique({
      where: { id: req.member.workspaceId },
      select: { id: true, name: true, accentColor: true },
    });
    const inviter = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true },
    });
    sendInvitationEmail({ invitation, workspace, inviter }).catch((err) =>
      console.error('email error', err)
    );

    res.status(201).json({ invitation, inviteUrl: inviteUrlFor(token) });
  } catch (err) {
    console.error('createInvitation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * @openapi
 * /api/workspaces/{workspaceId}/invitations:
 *   get:
 *     tags: [Workspaces]
 *     summary: List invitations (admin only)
 */
const listInvitations = async (req, res) => {
  try {
    const rows = await prisma.invitation.findMany({
      where: { workspaceId: req.params.workspaceId },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      include: {
        invitedBy: { select: { id: true, name: true, email: true } },
        acceptedBy: { select: { id: true, name: true, email: true } },
      },
    });
    // Lazy-expire any stale rows so the UI stays consistent
    const expiredIds = rows
      .filter(
        (r) =>
          r.status === INVITATION_STATUS.PENDING && r.expiresAt < new Date()
      )
      .map((r) => r.id);
    if (expiredIds.length) {
      await prisma.invitation.updateMany({
        where: { id: { in: expiredIds } },
        data: { status: INVITATION_STATUS.EXPIRED },
      });
      for (const r of rows) {
        if (expiredIds.includes(r.id)) r.status = INVITATION_STATUS.EXPIRED;
      }
    }
    res.status(200).json({ invitations: rows });
  } catch (err) {
    console.error('listInvitations error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * @openapi
 * /api/workspaces/{workspaceId}/invitations/{invitationId}:
 *   delete:
 *     tags: [Workspaces]
 *     summary: Revoke an invitation (admin only)
 */
const revokeInvitation = async (req, res) => {
  try {
    const inv = await prisma.invitation.findUnique({
      where: { id: req.params.invitationId },
    });
    if (!inv || inv.workspaceId !== req.params.workspaceId) {
      return res.status(404).json({ error: 'Invitation not found' });
    }
    if (inv.status !== INVITATION_STATUS.PENDING) {
      return res
        .status(409)
        .json({ error: 'Only pending invitations can be revoked' });
    }
    await prisma.invitation.update({
      where: { id: inv.id },
      data: { status: INVITATION_STATUS.REVOKED },
    });
    res.status(204).end();
  } catch (err) {
    console.error('revokeInvitation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * @openapi
 * /api/workspaces/{workspaceId}/invitations/{invitationId}/resend:
 *   post:
 *     tags: [Workspaces]
 *     summary: Re-extend a pending invitation (admin only)
 */
const resendInvitation = async (req, res) => {
  try {
    const inv = await prisma.invitation.findUnique({
      where: { id: req.params.invitationId },
    });
    if (!inv || inv.workspaceId !== req.params.workspaceId) {
      return res.status(404).json({ error: 'Invitation not found' });
    }
    if (
      inv.status !== INVITATION_STATUS.PENDING &&
      inv.status !== INVITATION_STATUS.EXPIRED
    ) {
      return res
        .status(409)
        .json({ error: 'Only pending or expired invitations can be resent' });
    }
    const updated = await prisma.invitation.update({
      where: { id: inv.id },
      data: { status: INVITATION_STATUS.PENDING, expiresAt: ttlFromNow() },
    });

    const { sendInvitationEmail } = require('../lib/email');
    const workspace = await prisma.workspace.findUnique({
      where: { id: inv.workspaceId },
      select: { id: true, name: true, accentColor: true },
    });
    const inviter = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true },
    });
    sendInvitationEmail({ invitation: updated, workspace, inviter }).catch(
      (err) => console.error('email error', err)
    );

    res
      .status(200)
      .json({ invitation: updated, inviteUrl: inviteUrlFor(updated.token) });
  } catch (err) {
    console.error('resendInvitation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * @openapi
 * /api/invitations/{token}:
 *   get:
 *     tags: [Workspaces]
 *     summary: Look up invitation by token (public preview)
 *     security: []
 */
const getInvitationByToken = async (req, res) => {
  try {
    const inv = await prisma.invitation.findUnique({
      where: { token: req.params.token },
      include: {
        workspace: {
          select: { id: true, name: true, iconUrl: true, accentColor: true },
        },
      },
    });
    if (!inv)
      return res
        .status(404)
        .json({ error: 'Invitation not found or no longer valid' });

    const refreshed = await expireIfNeeded(prisma, inv);

    res.status(200).json({
      workspace: inv.workspace,
      invitation: {
        id: refreshed.id,
        email: refreshed.email,
        role: refreshed.role,
        status: refreshed.status,
        expiresAt: refreshed.expiresAt,
      },
      requiresAuth: true,
    });
  } catch (err) {
    console.error('getInvitationByToken error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * @openapi
 * /api/invitations/{token}/accept:
 *   post:
 *     tags: [Workspaces]
 *     summary: Accept an invitation (must be logged in with the matching email)
 */
const acceptInvitation = async (req, res) => {
  try {
    // Re-load user (we only have id from authenticate middleware) to compare email
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user)
      return res.status(401).json({ error: 'Authentication required' });

    const result = await prisma.$transaction(async (tx) => {
      const inv = await tx.invitation.findUnique({
        where: { token: req.params.token },
      });
      if (!inv)
        return {
          status: 404,
          error: 'Invitation not found or no longer valid',
        };

      // Lazy expire
      const refreshed = await expireIfNeeded(tx, inv);

      if (refreshed.status !== INVITATION_STATUS.PENDING) {
        return {
          status: 410,
          error: `Invitation is ${refreshed.status.toLowerCase()}`,
        };
      }
      if (refreshed.email !== normalizeEmail(user.email)) {
        return {
          status: 403,
          error: 'This invitation was sent to a different email address',
        };
      }

      // If already a member, mark accepted and short-circuit
      const existing = await tx.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: user.id,
            workspaceId: refreshed.workspaceId,
          },
        },
      });
      if (existing) {
        await tx.invitation.update({
          where: { id: refreshed.id },
          data: {
            status: INVITATION_STATUS.ACCEPTED,
            acceptedAt: new Date(),
            acceptedById: user.id,
          },
        });
        return {
          status: 409,
          error: 'You are already a member of this workspace',
          workspaceId: refreshed.workspaceId,
        };
      }

      await tx.workspaceMember.create({
        data: {
          userId: user.id,
          workspaceId: refreshed.workspaceId,
          role: refreshed.role,
        },
      });
      const accepted = await tx.invitation.update({
        where: { id: refreshed.id },
        data: {
          status: INVITATION_STATUS.ACCEPTED,
          acceptedAt: new Date(),
          acceptedById: user.id,
        },
      });
      return { status: 200, workspaceId: accepted.workspaceId };
    });

    if (result.status === 200) {
      const workspace = await prisma.workspace.findUnique({
        where: { id: result.workspaceId },
      });
      return res.status(200).json({ workspace });
    }
    return res
      .status(result.status)
      .json({ error: result.error, workspaceId: result.workspaceId });
  } catch (err) {
    console.error('acceptInvitation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createInvitation,
  listInvitations,
  revokeInvitation,
  resendInvitation,
  getInvitationByToken,
  acceptInvitation,
};
