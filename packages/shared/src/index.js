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
  GOAL_CREATED:              'GOAL_CREATED',
  GOAL_UPDATED:              'GOAL_UPDATED',
  GOAL_DELETED:              'GOAL_DELETED',
  GOAL_STATUS_CHANGED:       'GOAL_STATUS_CHANGED',
  MILESTONE_ADDED:           'MILESTONE_ADDED',
  MILESTONE_UPDATED:         'MILESTONE_UPDATED',
  MILESTONE_REMOVED:         'MILESTONE_REMOVED',
  ACTION_ITEM_CREATED:       'ACTION_ITEM_CREATED',
  ACTION_ITEM_UPDATED:       'ACTION_ITEM_UPDATED',
  ACTION_ITEM_DELETED:       'ACTION_ITEM_DELETED',
  ACTION_ITEM_STATUS_CHANGED:'ACTION_ITEM_STATUS_CHANGED',
  ANNOUNCEMENT_POSTED:       'ANNOUNCEMENT_POSTED',
  ANNOUNCEMENT_UPDATED:      'ANNOUNCEMENT_UPDATED',
  ANNOUNCEMENT_PINNED:       'ANNOUNCEMENT_PINNED',
  ANNOUNCEMENT_DELETED:      'ANNOUNCEMENT_DELETED',
  COMMENT_ADDED:             'COMMENT_ADDED',
  COMMENT_DELETED:           'COMMENT_DELETED',
  MEMBER_JOINED:             'MEMBER_JOINED',
  MEMBER_INVITED:            'MEMBER_INVITED',
  MEMBER_ROLE_CHANGED:       'MEMBER_ROLE_CHANGED',
  MEMBER_REMOVED:            'MEMBER_REMOVED',
  WORKSPACE_SETTINGS_CHANGED:'WORKSPACE_SETTINGS_CHANGED',
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
  JOIN_WORKSPACE:        'workspace:join',
  LEAVE_WORKSPACE:       'workspace:leave',
  WORKSPACE_UPDATED:     'workspace:updated',
  MEMBER_JOINED:         'member:joined',
  MEMBER_REMOVED:        'member:removed',
  GOAL_CREATED:          'goal:created',
  GOAL_UPDATED:          'goal:updated',
  GOAL_DELETED:          'goal:deleted',
  GOAL_STATUS_CHANGED:   'goal:status-changed',
  MILESTONE_UPSERTED:    'milestone:upserted',
  MILESTONE_DELETED:     'milestone:deleted',
  ACTION_ITEM_CREATED:   'actionItem:created',
  ACTION_ITEM_UPDATED:   'actionItem:updated',
  ACTION_ITEM_DELETED:   'actionItem:deleted',
  ACTION_ITEM_MOVED:     'actionItem:moved',
  ANNOUNCEMENT_NEW:      'announcement:new',
  ANNOUNCEMENT_UPDATED:  'announcement:updated',
  ANNOUNCEMENT_PINNED:   'announcement:pinned',
  ANNOUNCEMENT_DELETED:  'announcement:deleted',
  COMMENT_NEW:           'comment:new',
  COMMENT_DELETED:       'comment:deleted',
  REACTION_NEW:          'reaction:new',
  REACTION_REMOVED:      'reaction:removed',
  USER_ONLINE:           'user:online',
  USER_OFFLINE:          'user:offline',
  NOTIFICATION_NEW:      'notification:new',
  ACTIVITY_NEW:          'activity:new',
};

// ─── Capabilities ────────────────────────────────────────────
const CAPABILITIES = {
  WORKSPACE_SETTINGS_WRITE: 'workspace:settings:write',
  WORKSPACE_DELETE:         'workspace:delete',
  MEMBER_INVITE:            'member:invite',
  MEMBER_ROLE_WRITE:        'member:role:write',
  MEMBER_REMOVE:            'member:remove',
  GOAL_CREATE:              'goal:create',
  GOAL_EDIT:                'goal:edit',
  GOAL_DELETE:              'goal:delete',
  GOAL_REASSIGN_OWNER:      'goal:reassign-owner',
  MILESTONE_WRITE:          'milestone:write',
  ACTION_ITEM_CREATE:       'actionItem:create',
  ACTION_ITEM_EDIT:         'actionItem:edit',
  ACTION_ITEM_DELETE:       'actionItem:delete',
  ACTION_ITEM_REASSIGN:     'actionItem:reassign',
  ANNOUNCEMENT_CREATE:      'announcement:create',
  ANNOUNCEMENT_EDIT:        'announcement:edit',
  ANNOUNCEMENT_DELETE:      'announcement:delete',
  ANNOUNCEMENT_PIN:         'announcement:pin',
  COMMENT_CREATE:           'comment:create',
  COMMENT_DELETE_OWN:       'comment:delete-own',
  COMMENT_DELETE_ANY:       'comment:delete-any',
  REACTION_TOGGLE:          'reaction:toggle',
  AUDIT_READ:               'audit:read',
  EXPORT_CSV:               'export:csv',
};

const ROLE_CAPABILITIES = {
  ADMIN: new Set(Object.values(CAPABILITIES)),
  MEMBER: new Set([
    CAPABILITIES.GOAL_CREATE,
    CAPABILITIES.GOAL_EDIT,
    CAPABILITIES.GOAL_DELETE,
    CAPABILITIES.MILESTONE_WRITE,
    CAPABILITIES.ACTION_ITEM_CREATE,
    CAPABILITIES.ACTION_ITEM_EDIT,
    CAPABILITIES.ACTION_ITEM_DELETE,
    CAPABILITIES.COMMENT_CREATE,
    CAPABILITIES.COMMENT_DELETE_OWN,
    CAPABILITIES.REACTION_TOGGLE,
  ]),
};

function hasCapability(role, capability) {
  return ROLE_CAPABILITIES[role]?.has(capability) ?? false;
}

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
  CAPABILITIES,
  ROLE_CAPABILITIES,
  hasCapability,
};
