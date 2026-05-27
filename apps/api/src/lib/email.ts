const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  if (!host) {
    transporter = {
      sendMail: async (opts) => {
        console.log('[email:disabled] would send:', {
          to: opts.to,
          subject: opts.subject,
        });
        return { messageId: 'disabled' };
      },
    };
    return transporter;
  }
  // Gmail app passwords arrive formatted "xxxx xxxx xxxx xxxx" — strip whitespace.
  const pass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');
  transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 465),
    secure: Number(process.env.SMTP_PORT || 465) === 465,
    auth: { user: process.env.SMTP_USER, pass },
  });
  return transporter;
}

/**
 * Connects to the configured SMTP server and reports the result. Called once
 * at server startup so misconfigured credentials are surfaced immediately
 * instead of silently failing on the first invitation/@mention.
 */
async function verifyEmailTransport() {
  const host = process.env.SMTP_HOST;
  if (!host) {
    console.log(
      '📧 Email: SMTP_HOST not set — emails will be logged to console, not sent.'
    );
    return false;
  }
  try {
    const t = getTransporter();
    await t.verify();
    console.log(
      `📧 Email: SMTP transport ready (${host}, user=${process.env.SMTP_USER || '<unset>'})`
    );
    return true;
  } catch (err) {
    console.error(
      `📧 Email: SMTP transport FAILED (${host}): ${err.message}`
    );
    console.error(
      '   Sends will be attempted but will likely fail. Check SMTP_USER / SMTP_PASS / SMTP_PORT.'
    );
    return false;
  }
}

/**
 * Fire-and-forget email send. Errors are logged but never thrown into the
 * request path. Returns a promise the caller can await for tests/scripts.
 */
async function sendEmail({ to, subject, html, text }) {
  try {
    const from = process.env.SMTP_FROM || 'Team Hub <noreply@example.com>';
    const t = getTransporter();
    return await t.sendMail({ from, to, subject, html, text });
  } catch (err) {
    console.error('Email send failed:', err.message);
    return null;
  }
}

const { invitationTemplate } = require('../templates/email/invitation');
const { mentionTemplate } = require('../templates/email/mention');

async function sendInvitationEmail({ invitation, workspace, inviter }) {
  const inviteUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/invite/${invitation.token}`;
  const { subject, html, text } = invitationTemplate({
    invitation,
    workspace,
    inviter,
    inviteUrl,
  });
  return sendEmail({ to: invitation.email, subject, html, text });
}

async function sendMentionEmail({ notification }) {
  // Caller should pre-load the user's email + entity context if rich content
  // is desired. Minimal: fetch the recipient + a relative link.
  const prisma = require('./prisma');
  const recipient = await prisma.user.findUnique({
    where: { id: notification.userId },
    select: { email: true, name: true },
  });
  if (!recipient) return null;
  let workspaceId = null;
  if (notification.entityType === 'announcement') {
    const a = await prisma.announcement.findUnique({
      where: { id: notification.entityId },
      select: { workspaceId: true },
    });
    workspaceId = a?.workspaceId;
  }
  const link = workspaceId
    ? `${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard/${workspaceId}/announcements`
    : process.env.CLIENT_URL || 'http://localhost:3000';
  const { subject, html, text } = mentionTemplate({
    recipient,
    notification,
    link,
  });
  return sendEmail({ to: recipient.email, subject, html, text });
}

module.exports = {
  sendEmail,
  sendInvitationEmail,
  sendMentionEmail,
  verifyEmailTransport,
};
