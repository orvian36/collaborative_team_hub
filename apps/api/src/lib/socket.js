// Socket.io scaffold. Phase 1 ships the no-op exports so other modules can
// import safely; Phase 5 replaces the implementation in place. Do NOT add
// a second socket file later — this is the canonical seam.

let io = null;

function initSocket(_httpServer) {
  // Real implementation lands in Phase 5.
}

function broadcastToWorkspace(_workspaceId, _event, _payload) {
  // No-op until Phase 5.
}

function emitToUser(_userId, _event, _payload) {
  // No-op until Phase 5.
}

function getOnlineUserIds(_workspaceId) {
  return [];
}

module.exports = { initSocket, broadcastToWorkspace, emitToUser, getOnlineUserIds, getIo: () => io };
