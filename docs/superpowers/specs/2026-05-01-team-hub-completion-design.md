# Collaborative Team Hub — Completion Design Spec

**Date:** 2026-05-01
**Status:** Approved
**Scope:** All remaining features from `docs/FredoCloud_Intern_Assignment.pdf` not covered by the Workspaces feature already shipped on `main`.

## 1. Overview

Build out the rest of the Collaborative Team Hub on top of the existing auth + workspaces foundation. Single master spec, single phased plan, seven vertical-slice phases. Each phase produces working software that can ship to `main` independently.

**Already on `main` (no rework):**

- Auth: register, login, logout, refresh, `GET /api/auth/me` (JWT in httpOnly cookies)
- Workspaces: CRUD, members, invitations (token-link, 7d TTL), icon upload, accent colour, role matrix (`ADMIN`/`MEMBER`)
- Prisma schema declares (but does not yet wire up) `Goal`, `Milestone`, `Announcement`, `Comment`, `Reaction`, `ActionItem`, `Activity`, `Notification`
- Swagger docs at `/api/docs` (counts as bonus item E)
- Shared constants: roles, statuses, priorities, activity types, notification types, invitation status, accent palette, socket event names

**Out of scope for this spec (assignment doesn't ask):**

- Password reset / 2FA
- File attachments beyond avatars + workspace icons
- Real-time collaborative editing (advanced feature 1 — not picked)
- Offline support (advanced feature 3 — not picked)
- i18n / a11y audit beyond library defaults
- Multi-instance horizontal scaling (presence is single-instance)

## 2. Feature Set Decisions (recap)

### Core PDF features (all required)

- User profile + avatar upload
- Goals + milestones + per-goal activity feed
- Announcements + reactions + comments + pinning (rich text via TipTap)
- Action items + kanban + list + link to parent goal
- Real-time updates via Socket.io
- Online presence indicators
- @mentions trigger in-app notifications
- Analytics dashboard: stats + Recharts goal-completion chart + CSV export

### Advanced features chosen (3 of 5 — assignment requires only 2)

- **#2 Optimistic UI** — scoped to status changes, reactions, pin/unpin, kanban DnD, milestone progress slider, inline edits. Create/delete/comment stay blocking.
- **#4 Advanced RBAC** — capability matrix in `@team-hub/shared`, `requirePermission(cap)` middleware, `useCapability` / `<PermissionGate>` on the frontend.
- **#5 Audit log** — reuses `Activity` model, immutable log helper, filterable timeline UI under `settings/audit`, CSV export.

### Bonus features chosen (all 6)

- **A. Dark / light theme** — Tailwind `darkMode: 'class'` already configured; ship the toggle + system-pref detection
- **B. Email notifications** — Nodemailer + Resend SMTP, sends on invitation create/resend and on @mention notification creation, fire-and-forget
- **C. Cmd+K command palette** — `cmdk` library, navigation + new-entity quick actions
- **D. Tests** — explicitly **dropped** (deferred per user direction)
- **E. OpenAPI / Swagger** — already shipped, called out in README
- **F. PWA** — `@ducanh2912/next-pwa` shell-only (no offline writes), installable

### Library choices

- Rich text: **TipTap** (`@tiptap/react @tiptap/starter-kit @tiptap/extension-mention @tiptap/extension-link @tiptap/suggestion`) — output sanitized server-side via `sanitize-html`
- Kanban DnD: **`@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities`**
- CSV: **`csv-stringify`** streaming writer
- Email: **`nodemailer`** with SMTP env-driven config (Resend in production)
- Cmd+K: **`cmdk`**
- PWA: **`@ducanh2912/next-pwa`** (actively maintained fork; original `next-pwa` is not Next.js 16-compatible)

## 3. Architecture

### Backend (`apps/api`) additions

**New libs:**

- `lib/socket.js` — Socket.io setup, JWT-cookie handshake auth, presence map, `broadcastToWorkspace(workspaceId, event, payload)` helper
- `lib/email.js` — `sendEmail({ to, subject, html, text })`, env-driven Nodemailer transport, fire-and-forget
- `lib/sanitize.js` — `sanitize-html` wrapper with allowlist tuned for TipTap output
- `lib/csv.js` — `streamCsv(res, columns, rowIterable)` thin wrapper around csv-stringify
- `lib/activity.js` — `logActivity(tx, payload)` writes to `Activity` and emits `activity:new` over Socket.io
- `lib/notifications.js` — `createNotification(tx, payload)` writes to `Notification`, emits `notification:new` to user room, dispatches email for `MENTION` type
- `lib/mentions.js` — extracts user IDs from sanitized HTML (`span[data-user-id]`) and from `@[Name](id)` markdown text

**New middleware:**

- `middleware/permission.js` — `requirePermission(capability)` reads `req.member.role` (set by existing `requireWorkspaceMembership` middleware), calls `hasCapability(role, cap)` from shared, 403s on miss

**New controllers (one file each):**

- `controllers/goals.js`
- `controllers/milestones.js`
- `controllers/announcements.js`
- `controllers/comments.js`
- `controllers/reactions.js`
- `controllers/actionItems.js`
- `controllers/notifications.js`
- `controllers/audit.js`
- `controllers/analytics.js`
- `controllers/exports.js`

**New routes (one file each, mounted in `index.js`):**

- `routes/goals.js` — replaces existing stub; sub-mounts `routes/milestones.js` at `/:goalId/milestones`
- `routes/announcements.js` — replaces stub; sub-mounts `routes/comments.js` and `routes/reactions.js`
- `routes/actionItems.js` — replaces stub
- `routes/notifications.js`
- `routes/workspaces.js` — gain sub-routes for `/audit`, `/stats`, `/exports/<entity>.csv`, `/presence`

**Profile endpoint:** extend existing `routes/auth.js` with `PUT /api/auth/me` (multer single-file `avatar` field, Cloudinary upload, name update).

### Frontend (`apps/web`) additions

**New libs:**

- `lib/socket.js` — singleton `socket.io-client`, auto-reconnect, `connectToWorkspace(workspaceId)` / `disconnect()`, exposes per-event `subscribe(event, handler)` for stores
- `lib/optimistic.js` — `optimisticUpdate({ get, set, key, id, patch, apiCall })` snapshot/restore helper

**New hooks:**

- `hooks/useCapability.js` — reads active workspace role from store, returns boolean

**New stores (Zustand, one per feature):**

- `goalsStore`, `milestonesStore`, `announcementsStore`, `commentsStore`, `reactionsStore`, `actionItemsStore`, `notificationsStore`, `presenceStore`, `auditStore`, `analyticsStore`, `themeStore`

**New routes under `dashboard/[workspaceId]/`:**

- `profile/page.js` — name + avatar editor
- `page.js` (rewrite of placeholder) — Analytics dashboard
- `goals/page.js` — list + filters + create
- `goals/[goalId]/page.js` — detail with milestones + activity feed + linked action items
- `announcements/page.js` — feed + composer + reactions + comments
- `action-items/page.js` — kanban (default) and list views via `?view=` query
- `settings/audit/page.js` — audit log timeline + filters + export

**Component directories** (each has its own folder under `components/`):

- `goals/`, `announcements/`, `actionItems/`, `analytics/`, `audit/`, `notifications/`, `presence/`, `mentions/`, `profile/`
- `ui/CommandPalette.jsx`, `ui/ThemeToggle.jsx`, `ui/PermissionGate.jsx`, `ui/RichTextRenderer.jsx`

## 4. Data Model Deltas

**Single migration:** `20260501100000_add_team_hub_completion_fields`. Purely additive; safe on existing dev data.

```sql
ALTER TABLE "Goal"          ADD COLUMN "createdById"      TEXT;
ALTER TABLE "Milestone"     ADD COLUMN "dueDate"          TIMESTAMP(3),
                            ADD COLUMN "completedAt"      TIMESTAMP(3);
ALTER TABLE "Announcement"  ADD COLUMN "pinnedAt"         TIMESTAMP(3);
ALTER TABLE "Comment"       ADD COLUMN "mentionedUserIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "ActionItem"    ADD COLUMN "position"         INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Activity"      ADD COLUMN "entityType"       TEXT,
                            ADD COLUMN "entityId"         TEXT;
ALTER TABLE "Notification"  ADD COLUMN "actorId"          TEXT,
                            ADD COLUMN "entityType"       TEXT,
                            ADD COLUMN "entityId"         TEXT;
CREATE INDEX "ActionItem_workspaceId_status_position_idx"
  ON "ActionItem"("workspaceId", "status", "position");

UPDATE "Goal" SET "createdById" = "ownerId" WHERE "createdById" IS NULL;
ALTER TABLE "Goal" ALTER COLUMN "createdById" SET NOT NULL;
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id");
```

**Schema.prisma corresponding edits:**

- `Goal.createdById` + relation `createdBy User @relation("GoalCreator", ...)` and back-relation on User
- `Milestone.dueDate` + `completedAt`
- `Announcement.pinnedAt`
- `Comment.mentionedUserIds String[]`
- `ActionItem.position Int @default(0)` + `@@index([workspaceId, status, position])`
- `Activity.entityType String?` + `entityId String?`
- `Notification.actorId String?` + `entityType String?` + `entityId String?` + relation `actor User? @relation("NotificationActor", ...)` and back-relation on User

## 5. RBAC Capability Matrix

Lives in `packages/shared/src/index.js`. Backend enforces; frontend gates UI for UX only.

```js
const CAPABILITIES = {
  WORKSPACE_SETTINGS_WRITE: 'workspace:settings:write',
  WORKSPACE_DELETE: 'workspace:delete',
  MEMBER_INVITE: 'member:invite',
  MEMBER_ROLE_WRITE: 'member:role:write',
  MEMBER_REMOVE: 'member:remove',
  GOAL_CREATE: 'goal:create',
  GOAL_EDIT: 'goal:edit',
  GOAL_DELETE: 'goal:delete',
  GOAL_REASSIGN_OWNER: 'goal:reassign-owner',
  MILESTONE_WRITE: 'milestone:write',
  ACTION_ITEM_CREATE: 'actionItem:create',
  ACTION_ITEM_EDIT: 'actionItem:edit',
  ACTION_ITEM_DELETE: 'actionItem:delete',
  ACTION_ITEM_REASSIGN: 'actionItem:reassign',
  ANNOUNCEMENT_CREATE: 'announcement:create',
  ANNOUNCEMENT_EDIT: 'announcement:edit',
  ANNOUNCEMENT_DELETE: 'announcement:delete',
  ANNOUNCEMENT_PIN: 'announcement:pin',
  COMMENT_CREATE: 'comment:create',
  COMMENT_DELETE_OWN: 'comment:delete-own',
  COMMENT_DELETE_ANY: 'comment:delete-any',
  REACTION_TOGGLE: 'reaction:toggle',
  AUDIT_READ: 'audit:read',
  EXPORT_CSV: 'export:csv',
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
```

**Backend usage:**

```js
router.post(
  '/',
  requireWorkspaceMembership(),
  requirePermission(CAPABILITIES.GOAL_CREATE),
  createGoal
);
```

**Frontend usage:**

```jsx
const canCreate = useCapability(CAPABILITIES.GOAL_CREATE);
{
  canCreate && <Button>New goal</Button>;
}
// or
<PermissionGate cap={CAPABILITIES.GOAL_CREATE}>
  <Button>...</Button>
</PermissionGate>;
```

## 6. Real-time Topology

### Server (`apps/api/src/lib/socket.js`)

- Single Socket.io server attached to existing httpServer in `index.js`
- CORS: `origin: CLIENT_URL`, `credentials: true`
- Handshake auth: parse `accessToken` cookie from `socket.handshake.headers.cookie`, verify JWT, attach `socket.userId`. Reject unauthenticated.
- On connect, client emits `workspace:join` with `{ workspaceId }`. Server verifies membership (`prisma.workspaceMember.findUnique`), joins room `workspace:<id>`, joins personal room `user:<userId>`, updates presence map, broadcasts `user:online`.
- Disconnect: remove from presence map; if last socket for that user in that workspace, broadcast `user:offline`.

### Presence map

`Map<workspaceId, Map<userId, Set<socketId>>>`. In-memory. Reset on server restart. Documented limitation in README.

Exposes `getOnlineUserIds(workspaceId): string[]` for the initial-load REST endpoint `GET /api/workspaces/:id/presence`.

### Broadcast helper

`broadcastToWorkspace(workspaceId, event, payload)` — controllers call this after successful mutations. Controllers do **not** import `io` directly; the helper is the single integration seam.

### Events

**Workspace room (`workspace:<id>`):**

- `goal:created` / `goal:updated` / `goal:deleted` / `goal:status-changed`
- `milestone:upserted` / `milestone:deleted`
- `actionItem:created` / `actionItem:updated` / `actionItem:deleted` / `actionItem:moved`
- `announcement:new` / `announcement:updated` / `announcement:pinned` / `announcement:deleted`
- `comment:new` / `comment:deleted`
- `reaction:new` / `reaction:removed`
- `user:online` / `user:offline`
- `activity:new`

**Personal room (`user:<userId>`):**

- `notification:new`

### Client (`apps/web/src/lib/socket.js`)

Singleton client. `connectToWorkspace(workspaceId)` called by `[workspaceId]/layout.js` mount effect. Token cookie travels via `withCredentials: true`. Token rotation works automatically on reconnect because the cookie is refreshed before reconnect attempts complete.

Per-feature stores own their subscriptions. Example:

```js
// goalsStore.js
subscribe(socket) {
  socket.on('goal:created',  (p) => get().upsertGoal(p.goal));
  socket.on('goal:updated',  (p) => get().upsertGoal(p.goal));
  socket.on('goal:deleted',  (p) => get().removeGoal(p.goalId));
  socket.on('goal:status-changed', (p) => get().patchGoal(p.goalId, { status: p.status }));
}
```

## 7. Optimistic UI (advanced #2)

### Scoped operations

| Operation                                              | Optimistic? |
| ------------------------------------------------------ | ----------- |
| Action item kanban DnD (status + position)             | ✅          |
| Action item inline edit (priority, assignee, due date) | ✅          |
| Goal status change                                     | ✅          |
| Milestone progress slider                              | ✅          |
| Announcement reaction toggle                           | ✅          |
| Announcement pin/unpin                                 | ✅          |
| Goal create / edit / delete                            | ❌ blocking |
| Action item create / delete                            | ❌ blocking |
| Announcement create / edit / delete                    | ❌ blocking |
| Comment create / delete                                | ❌ blocking |

### Helper (`apps/web/src/lib/optimistic.js`)

```js
export async function optimisticUpdate({ get, set, key, id, patch, apiCall }) {
  const list = get()[key];
  const prev = list.find((x) => x.id === id);
  if (!prev) return apiCall();

  set((s) => ({
    [key]: s[key].map((x) => (x.id === id ? { ...x, ...patch } : x)),
  }));

  try {
    const result = await apiCall();
    set((s) => ({ [key]: s[key].map((x) => (x.id === id ? result : x)) }));
    return result;
  } catch (err) {
    set((s) => ({ [key]: s[key].map((x) => (x.id === id ? prev : x)) }));
    throw err;
  }
}
```

For kanban moves (cross-list), an analogous `optimisticMove({ get, set, fromKey, toKey, ... })` lives next to it.

## 8. Audit Log (advanced #5)

### Storage

Reuses `Activity` model. Immutable: no PUT/DELETE routes. Inserted only via `logActivity(tx, payload)` inside the same transaction as the mutation.

### Logged events

| Event                                              | Logged?        |
| -------------------------------------------------- | -------------- |
| Goal created/updated/deleted/status-changed        | ✅             |
| Milestone added/updated/removed                    | ✅             |
| Action item created/updated/status-changed/deleted | ✅             |
| Announcement posted/edited/pinned/deleted          | ✅             |
| Comment added/deleted                              | ✅             |
| Reaction added/removed                             | ❌ (too noisy) |
| Member invited/role-changed/removed/left           | ✅             |
| Workspace settings changed (name, accent, icon)    | ✅             |
| User logins                                        | ❌             |

### UI

- `settings/audit/page.js` — admin-only via `<PermissionGate cap={AUDIT_READ}>`
- Filters: event type (multi-select), actor (member dropdown), date range (from/to)
- Paginated, 50 per page
- "Export CSV" button → `GET /api/workspaces/:id/exports/audit.csv`
- Live updates: subscribes to `activity:new` socket event

## 9. CSV Export

Four endpoints, all admin-only via `requirePermission(CAPABILITIES.EXPORT_CSV)`, all streamed:

- `GET /api/workspaces/:id/exports/goals.csv`
- `GET /api/workspaces/:id/exports/action-items.csv`
- `GET /api/workspaces/:id/exports/announcements.csv`
- `GET /api/workspaces/:id/exports/audit.csv`

Implementation: `lib/csv.js` wraps `csv-stringify` to take an async iterable of row objects + a column definition. Controllers run a Prisma query (no take limit, ordered by createdAt) and pipe results through.

Filename pattern: `<workspace-slug>-<entity>-<YYYY-MM-DD>.csv`.

## 10. Email Notifications

### Provider

Nodemailer with SMTP env-driven transport. Default production: Resend (`SMTP_HOST=smtp.resend.com`, `SMTP_USER=resend`, `SMTP_PASS=<api-key>`).

### Triggers

| Trigger                                                               | Email                   |
| --------------------------------------------------------------------- | ----------------------- |
| Invitation created or resent                                          | Yes — to invitee email  |
| Notification created with type `MENTION`                              | Yes — to mentioned user |
| Notification created with other types (`ASSIGNMENT`, `STATUS_UPDATE`) | No (in-app only)        |

### Templates

`apps/api/src/templates/email/invitation.js` and `apps/api/src/templates/email/mention.js`. Plain template literals, no engine. Each exports `{ subject, html, text }` factories taking a payload.

### Behaviour

Fire-and-forget: `sendEmail(...)` is called inside a `Promise.resolve().then(...)` chain that catches and logs errors but never bubbles into the response. SMTP failures must not 500 the API request.

## 11. Notifications + @mentions

### Mention parsing (`lib/mentions.js`)

- Announcement HTML body: parse `span[data-user-id="..."]` (TipTap mention extension output, sanitized through allowlist)
- Comment text + goal activity messages: parse `@[Display Name](user-id)` markdown-style tokens emitted by `MentionTextarea`
- Both extractors return `string[]` of user IDs, deduplicated, with the actor's own ID filtered out

### Notification creation

`lib/notifications.js` exposes `createNotification(tx, { userId, type, message, actorId?, entityType?, entityId? })`:

1. Inserts `Notification` row in `tx`
2. After `tx` commits, emits `notification:new` to `user:<userId>` socket room
3. If `type === 'MENTION'`, dispatches email (fire-and-forget) using mention template

### Notification types in scope

| Type            | Trigger                                                                                                |
| --------------- | ------------------------------------------------------------------------------------------------------ |
| `MENTION`       | User @mentioned in announcement body or comment or goal activity update                                |
| `ASSIGNMENT`    | Action item created or updated and assignee field changed (notify new assignee, only if not the actor) |
| `STATUS_UPDATE` | Goal status changed by someone other than the goal owner (notify owner)                                |
| `INVITE`        | Notification model used; not emitted for the assignment scope (covered by email)                       |

### UI

- `<NotificationsBell>` in top nav with unread badge
- `<NotificationsPanel>` dropdown — list of recent 20, "mark all read", click row → navigate via `entityType + entityId`

## 12. UI / Routing Map

```
/login
/register
/onboarding
/invite/[token]
/dashboard                           ← redirects to last-active or onboarding (existing)
/dashboard/[workspaceId]/
  layout.js                          ← top nav + presence avatars + notifications bell + theme toggle (extend existing)
  page.js                            ← Analytics dashboard (rewrite placeholder)
  profile/page.js                    ← profile + avatar
  goals/
    page.js                          ← list + filters + create
    [goalId]/page.js                 ← detail + milestones + activity feed
  announcements/
    page.js                          ← feed + composer
  action-items/
    page.js                          ← kanban (?view=kanban) | list (?view=list)
  settings/
    page.js                          ← general (existing)
    members/page.js                  ← (existing)
    invitations/page.js              ← (existing)
    audit/page.js                    ← timeline + filters + export
```

## 13. Phasing

Each phase = working software = one merge to `main`.

### Phase 1 — Foundation (~6 tasks)

- Migration `20260501100000_add_team_hub_completion_fields`
- `packages/shared/src/index.js` — `CAPABILITIES`, `ROLE_CAPABILITIES`, `hasCapability`
- `apps/api/src/middleware/permission.js`
- `apps/api/src/lib/socket.js` — created with **no-op `broadcastToWorkspace` placeholder export** (stable import shape; full Socket.io wiring lands in Phase 5 by replacing the implementation, not by adding a new file)
- `apps/api/src/lib/activity.js` — calls `broadcastToWorkspace` from `lib/socket.js`; the no-op behaviour means Phase 1 logging works without socket infrastructure
- `apps/api/src/routes/auth.js` — implement `PUT /api/auth/me` (multer + Cloudinary)
- `apps/web/src/app/dashboard/[workspaceId]/profile/page.js` + `components/profile/AvatarUpload.jsx`
- Update top nav avatar to link to profile

### Phase 2 — Goals & Milestones (~10 tasks)

- `controllers/goals.js`, `controllers/milestones.js`
- `routes/goals.js` (replace stub) + `routes/milestones.js` (sub-mount) + `GET /:id/activity`
- `goalsStore`, `milestonesStore`
- Pages: `goals/page.js`, `goals/[goalId]/page.js`
- Components: `GoalCard`, `GoalFormModal`, `MilestoneList`, `GoalActivityFeed`, `StatusPill`

### Phase 3 — Announcements (~10 tasks)

- Add deps: `@tiptap/react @tiptap/starter-kit @tiptap/extension-mention @tiptap/extension-link @tiptap/suggestion sanitize-html`
- `lib/sanitize.js`
- `controllers/announcements.js`, `controllers/comments.js`, `controllers/reactions.js`
- `routes/announcements.js` + sub-mounts; `PATCH /:id/pin`
- Stores: `announcementsStore`, `commentsStore`, `reactionsStore`
- Pages: `announcements/page.js`
- Components: `AnnouncementCard`, `AnnouncementComposer` (TipTap), `ReactionBar`, `CommentList`, `PinToggle`, `RichTextRenderer`

### Phase 4 — Action Items (~10 tasks)

- Add deps: `@dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
- `controllers/actionItems.js` + `PATCH /:id/move` (transactional reorder)
- `routes/actionItems.js` (replace stub)
- `actionItemsStore` (state shape: `byStatus`)
- Pages: `action-items/page.js` with `?view=` toggle
- Components: `KanbanBoard`, `KanbanColumn`, `ActionItemCard`, `ActionItemList`, `ActionItemFormModal`, `ViewToggle`
- Optimistic-UI integration: kanban DnD via `optimisticMove`

### Phase 5 — Real-time + Notifications + @mentions + Email (~12 tasks)

- Add dep: `nodemailer`
- `lib/socket.js` — full implementation per Section 6
- `index.js` — uncomment scaffolding, attach to httpServer
- `lib/email.js`, `lib/notifications.js`, `lib/mentions.js`
- `controllers/notifications.js` + `routes/notifications.js`
- Insert `broadcastToWorkspace(...)` calls into Phases 2-4 controllers (additive, no rewrites)
- Hook mention parser into comments + announcement bodies + goal activity updates → `MENTION` notifications
- Hook assignment notifications into action item create/update
- Hook status-update notifications into goal status changes
- Email templates: `templates/email/invitation.js`, `templates/email/mention.js`
- Update existing `controllers/invitations.js` to call `sendEmail` on invite create/resend
- Frontend `lib/socket.js` singleton + per-store subscribers
- Stores: `presenceStore`, `notificationsStore`
- Components: `NotificationsBell`, `NotificationsPanel`, `PresenceAvatars`, `MentionTextarea`
- Top nav extension in `[workspaceId]/layout.js`

### Phase 6 — Analytics + CSV (~6 tasks)

- `lib/csv.js`
- `controllers/analytics.js` — `GET /api/workspaces/:id/stats`
- `controllers/exports.js` — 4 endpoints
- `analyticsStore`
- Page: `[workspaceId]/page.js` — Analytics dashboard
- Components: `StatsTiles`, `GoalCompletionChart` (Recharts BarChart), `ExportButtons`

### Phase 7 — Audit UI + Optimistic Polish + Bonus + Deploy (~12 tasks)

- `controllers/audit.js` + `GET /api/workspaces/:id/audit`
- Page: `settings/audit/page.js`
- Components: `AuditTimeline`, `AuditFilters`, `AuditExportButton`
- Apply `optimisticUpdate` helper to scoped operations from Section 7
- `themeStore` + `<ThemeToggle>` + `prefers-color-scheme` sync in root layout
- `<CommandPalette>` (cmd+k via `cmdk` lib)
- PWA: `@ducanh2912/next-pwa` config + `public/manifest.json` + maskable icons
- Seed script `apps/api/prisma/seed.js`: 12 users, 25 goals (mixed statuses + 2-3 milestones each), 60 action items, 10 announcements (1 pinned, mixed reactions/comments), 30 activity rows, 2 pending invitations
- README rewrite: overview, setup, env vars table, advanced features called out (3), bonus items called out (6), known limitations, demo credentials, Swagger link
- Railway deployment: `apps/api/railway.json`, `apps/web/railway.json`, provision Postgres plugin, configure env vars, smoke test, capture URLs
- Walkthrough video (manual, not in plan)

**Total: ~66 tasks across 7 phases.**

## 14. Deployment

### Railway services

One Railway project, three services:

1. `api` — built from `apps/api`, start command runs `prisma migrate deploy && node src/index.js`
2. `web` — built from `apps/web`, `npm run build` → `npm start`
3. `postgres` — Railway plugin, auto-injects `DATABASE_URL`

### Required env vars

**`api` service:**

- `DATABASE_URL` (auto)
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (manual; `openssl rand -hex 32`)
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `CLIENT_URL` = public URL of `web` service
- `SMTP_HOST=smtp.resend.com`, `SMTP_PORT=465`, `SMTP_USER=resend`, `SMTP_PASS=<resend-api-key>`, `SMTP_FROM`
- `NODE_ENV=production`
- `PORT` (auto)

**`web` service:**

- `NEXT_PUBLIC_API_URL` = public URL of `api` service
- `NEXT_PUBLIC_SOCKET_URL` = same as `NEXT_PUBLIC_API_URL`

### Deploy order

1. Provision Postgres plugin
2. Deploy `api` (migration runs in start command)
3. Deploy `web` with `NEXT_PUBLIC_API_URL` set
4. Update `api`'s `CLIENT_URL` → redeploy api so CORS allows the live web origin
5. Run seed once via Railway shell: `npm run db:seed --workspace=@team-hub/api`
6. Smoke test: register fresh account → invite a second account → log in as both in different browsers → verify presence + live updates + reactions across browsers

## 15. Submission Deliverables

1. Two Railway URLs (web + api) in README
2. Seeded demo accounts: `admin@demo.com / demo1234` (admin), `alice@demo.com / demo1234`, `bob@demo.com / demo1234`, plus 9 more members
3. Public GitHub repo with conventional-commit history (one commit per task)
4. README.md sections: project overview, monorepo layout, local setup, env vars, deployment, advanced features (3), bonus items (6), known limitations, demo credentials, Swagger link
5. 3-5 minute walkthrough video (recorded manually after deploy)

## 16. Known Limitations (called out in README)

- Presence map is in-memory; resets on server restart. Multi-instance scaling would need Redis pub/sub.
- PWA is shell-only; no offline write queue. (Offline support advanced feature was explicitly not picked.)
- @mention emails are per-event; no digest/batching.
- Refresh-token rotation is per-request, not per-session-fingerprint; theft detection is out of scope.
- Audit log retention is unbounded; no archival policy.
- No automated tests in this submission (deferred per scope decision).
