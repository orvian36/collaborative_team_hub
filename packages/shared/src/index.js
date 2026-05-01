/**
 * @team-hub/shared
 * Shared constants, validators, and utilities used across frontend and backend.
 */

// ─── Roles ───────────────────────────────────────────────────
const ROLES = {
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
};

// ─── Goal Statuses ───────────────────────────────────────────
const GOAL_STATUS = {
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
};

// ─── Action Item Statuses ────────────────────────────────────
const ACTION_ITEM_STATUS = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
};

// ─── Action Item Priority ────────────────────────────────────
const PRIORITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
};

// ─── Activity Types ──────────────────────────────────────────
const ACTIVITY_TYPES = {
  GOAL_CREATED: 'GOAL_CREATED',
  GOAL_UPDATED: 'GOAL_UPDATED',
  STATUS_CHANGED: 'STATUS_CHANGED',
  MILESTONE_ADDED: 'MILESTONE_ADDED',
  COMMENT_ADDED: 'COMMENT_ADDED',
  MEMBER_JOINED: 'MEMBER_JOINED',
  ANNOUNCEMENT_POSTED: 'ANNOUNCEMENT_POSTED',
  ACTION_ITEM_CREATED: 'ACTION_ITEM_CREATED',
  ACTION_ITEM_COMPLETED: 'ACTION_ITEM_COMPLETED',
};

// ─── Notification Types ──────────────────────────────────────
const NOTIFICATION_TYPES = {
  MENTION: 'MENTION',
  INVITE: 'INVITE',
  ASSIGNMENT: 'ASSIGNMENT',
  STATUS_UPDATE: 'STATUS_UPDATE',
};

// ─── Invitations ─────────────────────────────────────────────
const INVITATION_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REVOKED: 'REVOKED',
  EXPIRED: 'EXPIRED',
};

const INVITATION_TTL_DAYS = 7;

// ─── Workspace Accent Palette ────────────────────────────────
// 12-swatch curated palette matching Tailwind 500-tier hex values.
const WORKSPACE_ACCENT_PALETTE = [
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
  '#ec4899', '#f43f5e', '#ef4444', '#f97316',
  '#f59e0b', '#10b981', '#14b8a6', '#06b6d4',
];

// ─── Socket Events ───────────────────────────────────────────
const SOCKET_EVENTS = {
  JOIN_WORKSPACE: 'workspace:join',
  LEAVE_WORKSPACE: 'workspace:leave',
  WORKSPACE_UPDATED: 'workspace:updated',
  MEMBER_JOINED: 'member:joined',
  MEMBER_REMOVED: 'member:removed',
  NEW_ANNOUNCEMENT: 'announcement:new',
  NEW_COMMENT: 'comment:new',
  NEW_REACTION: 'reaction:new',
  STATUS_CHANGE: 'status:change',
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',
  NOTIFICATION: 'notification:new',
};

module.exports = {
  ROLES,
  GOAL_STATUS,
  ACTION_ITEM_STATUS,
  PRIORITY,
  ACTIVITY_TYPES,
  NOTIFICATION_TYPES,
  INVITATION_STATUS,
  INVITATION_TTL_DAYS,
  WORKSPACE_ACCENT_PALETTE,
  SOCKET_EVENTS,
};
