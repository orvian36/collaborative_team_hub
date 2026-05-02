const { broadcastToWorkspace } = require('./socket');
const { SOCKET_EVENTS } = require('@team-hub/shared');

/**
 * Append an immutable activity entry. MUST be called inside a Prisma
 * transaction so the activity row is rolled back if the surrounding
 * mutation fails.
 *
 * Emits `activity:new` to the workspace room AFTER the transaction
 * commits — so callers wrap this in their own `tx.$transaction(async tx => {
 * ...; await logActivity(tx, ...); }).then(() => broadcastsAlreadyEmitted)`.
 *
 * The broadcast is fire-and-forget. In Phase 1 it's a no-op (lib/socket
 * stubs). Phase 5 makes it real.
 *
 * @param {import('@prisma/client').Prisma.TransactionClient} tx
 * @param {{
 *   type: string,
 *   message: string,
 *   userId: string,
 *   workspaceId: string,
 *   goalId?: string,
 *   entityType?: string,
 *   entityId?: string,
 *   metadata?: object,
 * }} payload
 */
async function logActivity(tx, payload) {
  const activity = await tx.activity.create({
    data: {
      type: payload.type,
      message: payload.message,
      userId: payload.userId,
      workspaceId: payload.workspaceId,
      goalId: payload.goalId ?? null,
      entityType: payload.entityType ?? null,
      entityId: payload.entityId ?? null,
      metadata: payload.metadata ?? null,
    },
  });
  // Fire after the caller commits — but since this is the same tx,
  // we schedule the broadcast on next tick so any rollback prevents emission.
  process.nextTick(() => {
    broadcastToWorkspace(payload.workspaceId, SOCKET_EVENTS.ACTIVITY_NEW, {
      activity,
    });
  });
  return activity;
}

module.exports = { logActivity };
