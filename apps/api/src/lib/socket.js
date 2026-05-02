const { Server } = require('socket.io');
const cookie = require('cookie');
const jwt = require('jsonwebtoken');
const prisma = require('./prisma');
const { SOCKET_EVENTS } = require('@team-hub/shared');

let io = null;

// Map<workspaceId, Map<userId, Set<socketId>>>
const presence = new Map();

function presenceAdd(workspaceId, userId, socketId) {
  if (!presence.has(workspaceId)) presence.set(workspaceId, new Map());
  const ws = presence.get(workspaceId);
  if (!ws.has(userId)) ws.set(userId, new Set());
  const set = ws.get(userId);
  const wasEmpty = set.size === 0;
  set.add(socketId);
  return wasEmpty;
}

function presenceRemove(workspaceId, userId, socketId) {
  const ws = presence.get(workspaceId);
  if (!ws) return false;
  const set = ws.get(userId);
  if (!set) return false;
  set.delete(socketId);
  if (set.size === 0) {
    ws.delete(userId);
    if (ws.size === 0) presence.delete(workspaceId);
    return true;
  }
  return false;
}

function getOnlineUserIds(workspaceId) {
  return Array.from(presence.get(workspaceId)?.keys() || []);
}

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const raw = socket.handshake.headers.cookie || '';
      const parsed = cookie.parse(raw || '');
      const token = parsed.accessToken;
      if (!token) return next(new Error('No access token'));
      const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      socket.userId = payload.userId;
      socket.join(`user:${payload.userId}`);
      next();
    } catch (err) {
      next(new Error('Unauthenticated'));
    }
  });

  io.on('connection', (socket) => {
    socket.on(SOCKET_EVENTS.JOIN_WORKSPACE, async ({ workspaceId }, ack) => {
      if (!workspaceId)
        return (
          typeof ack === 'function' &&
          ack({ ok: false, error: 'workspaceId required' })
        );
      const member = await prisma.workspaceMember.findUnique({
        where: { userId_workspaceId: { userId: socket.userId, workspaceId } },
      });
      if (!member)
        return (
          typeof ack === 'function' && ack({ ok: false, error: 'Not a member' })
        );

      socket.join(`workspace:${workspaceId}`);
      socket.data.workspaceId = workspaceId;
      const wasEmpty = presenceAdd(workspaceId, socket.userId, socket.id);
      if (wasEmpty) {
        io.to(`workspace:${workspaceId}`).emit(SOCKET_EVENTS.USER_ONLINE, {
          userId: socket.userId,
        });
      }
      if (typeof ack === 'function')
        ack({ ok: true, onlineUserIds: getOnlineUserIds(workspaceId) });
    });

    socket.on(SOCKET_EVENTS.LEAVE_WORKSPACE, () => {
      const wsId = socket.data.workspaceId;
      if (!wsId) return;
      socket.leave(`workspace:${wsId}`);
      const lastGone = presenceRemove(wsId, socket.userId, socket.id);
      if (lastGone)
        io.to(`workspace:${wsId}`).emit(SOCKET_EVENTS.USER_OFFLINE, {
          userId: socket.userId,
        });
      socket.data.workspaceId = null;
    });

    socket.on('disconnect', () => {
      const wsId = socket.data.workspaceId;
      if (!wsId) return;
      const lastGone = presenceRemove(wsId, socket.userId, socket.id);
      if (lastGone)
        io.to(`workspace:${wsId}`).emit(SOCKET_EVENTS.USER_OFFLINE, {
          userId: socket.userId,
        });
    });
  });
}

function broadcastToWorkspace(workspaceId, event, payload) {
  if (!io) return;
  io.to(`workspace:${workspaceId}`).emit(event, payload);
}

function emitToUser(userId, event, payload) {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, payload);
}

module.exports = {
  initSocket,
  broadcastToWorkspace,
  emitToUser,
  getOnlineUserIds,
  getIo: () => io,
};
