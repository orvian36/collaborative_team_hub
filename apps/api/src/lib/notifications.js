const { emitToUser } = require('./socket');
const { SOCKET_EVENTS, NOTIFICATION_TYPES } = require('@team-hub/shared');

/**
 * Insert a Notification row inside the caller's transaction. After the
 * transaction commits, emit `notification:new` to the user's personal room.
 * For MENTION notifications, dispatch an email (Phase 5 wires the real
 * email; until then `sendEmail` is a no-op stub via lib/email).
 *
 * @param {import('@prisma/client').Prisma.TransactionClient} tx
 * @param {{
 *   userId: string,
 *   type: string,
 *   message: string,
 *   actorId?: string,
 *   entityType?: string,
 *   entityId?: string,
 *   metadata?: object,
 * }} payload
 */
async function createNotification(tx, payload) {
  if (payload.actorId && payload.actorId === payload.userId) return null; // never notify self

  const notification = await tx.notification.create({
    data: {
      userId: payload.userId,
      type: payload.type,
      message: payload.message,
      actorId: payload.actorId ?? null,
      entityType: payload.entityType ?? null,
      entityId: payload.entityId ?? null,
      metadata: payload.metadata ?? null,
    },
  });

  process.nextTick(() => {
    emitToUser(payload.userId, SOCKET_EVENTS.NOTIFICATION_NEW, {
      notification,
    });
    if (payload.type === NOTIFICATION_TYPES.MENTION) {
      // Phase 5 plugs in the email module; for now this is a forward-compatible no-op.
      try {
        const { sendMentionEmail } = require('./email');
        if (typeof sendMentionEmail === 'function') {
          sendMentionEmail({ notification }).catch((err) =>
            console.error('email error', err)
          );
        }
      } catch {
        // email lib not wired yet (Phase 5)
      }
    }
  });

  return notification;
}

module.exports = { createNotification };
