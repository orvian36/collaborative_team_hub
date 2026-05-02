'use client';

import { io } from 'socket.io-client';
import { SOCKET_EVENTS } from '@team-hub/shared';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

let socket = null;
let currentWorkspaceId = null;
const subscribers = new Map(); // event -> Set<handler>

function ensureSocket() {
  if (socket) return socket;
  socket = io(SOCKET_URL, {
    withCredentials: true,
    autoConnect: false,
    reconnection: true,
    reconnectionDelay: 500,
  });
  socket.on('connect', () => {
    if (currentWorkspaceId) joinWorkspace(currentWorkspaceId);
  });
  return socket;
}

function on(event, handler) {
  if (!subscribers.has(event)) subscribers.set(event, new Set());
  subscribers.get(event).add(handler);
  ensureSocket().on(event, handler);
  return () => off(event, handler);
}

function off(event, handler) {
  subscribers.get(event)?.delete(handler);
  socket?.off(event, handler);
}

async function connectAndJoin(workspaceId) {
  ensureSocket();
  currentWorkspaceId = workspaceId;
  if (!socket.connected) socket.connect();
  return new Promise((resolve) => {
    socket.emit(SOCKET_EVENTS.JOIN_WORKSPACE, { workspaceId }, (ack) => {
      resolve(ack || { ok: false });
    });
  });
}

function joinWorkspace(workspaceId) {
  socket?.emit(SOCKET_EVENTS.JOIN_WORKSPACE, { workspaceId });
}

function leaveWorkspace() {
  if (!socket || !currentWorkspaceId) return;
  socket.emit(SOCKET_EVENTS.LEAVE_WORKSPACE);
  currentWorkspaceId = null;
}

function disconnect() {
  if (!socket) return;
  for (const [event, set] of subscribers) {
    for (const h of set) socket.off(event, h);
  }
  subscribers.clear();
  socket.disconnect();
  socket = null;
  currentWorkspaceId = null;
}

export const socketClient = {
  connectAndJoin,
  leaveWorkspace,
  disconnect,
  on,
  off,
};
