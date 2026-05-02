# Workspaces Feature — Design Spec

**Date:** 2026-04-30
**Scope:** The `Workspaces` slice of the Collaborative Team Hub assignment (FredoCloud Intern Assignment). Goals/Announcements/Action Items/Real-time/Analytics are out of scope for this spec — each gets its own.

## Goals

Per the assignment PDF:

- Users can create and switch between multiple workspaces.
- Admins can invite members by email and assign roles (Admin / Member).
- Each workspace has a name, description, and accent colour.

This spec also covers the implicit pieces those requirements drag in: workspace ownership/permissions, the invitation lifecycle (token-link flow), workspace icon uploads, the dashboard chrome that hosts the workspace switcher, and the first-run experience.

## Non-goals

- Real-time member presence and the Socket.io wiring for it (next milestone — but the relevant `SOCKET_EVENTS` constants are added now to avoid a follow-up migration of the shared package).
- Email delivery of invitation links via Nodemailer / EmailJS. The admin copies the link from a toast in this milestone. The controller is structured so plugging email in later is a single function call.
- Workspace ownership transfer. `Workspace.createdById` is informational only — any Admin has the full admin permission set.
- Audit logging — that's one of the optional advanced features and gets its own spec if chosen.
- Backend test suite — no test runner is configured in the repo yet, and tests are a bonus item handled separately.

---

## Decisions made during brainstorming

| #     | Decision                    | Choice                                                                                                                                                                       | Rationale                                                                                                                                                                 |
| ----- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1    | Invitation flow             | **Token-link invite** — backend creates an `Invitation` row with a one-time token; admin gets a shareable link; recipient registers/logs in, then accepts.                   | Matches "invite by email" wording in the PDF (which implies outreach to people without accounts) and pairs naturally with the bonus email-notifications feature.          |
| Q2    | Permissions matrix          | Standard set: Admin can edit/invite/remove/delete; any Admin can delete the workspace; last-admin guard on demote/leave/remove; admins may self-demote subject to the guard. | Covers the assignment's "Admin / Member" requirement without over-engineering. RBAC matrix is one of the optional advanced features (separate scope).                     |
| Q3    | Switcher UX                 | **Left vertical workspace rail** (Discord/Slack-style avatars), with the active workspace highlighted by its accent colour.                                                  | More distinctive UX than a top-nav dropdown, and gives the accent-colour requirement somewhere to actually shine in the chrome.                                           |
| Q4    | First run + workspace icon  | (a) Auto-create a default workspace `"<Name>'s Workspace"` during registration. (b) Add an optional `iconUrl` field with a Cloudinary upload endpoint.                       | Eliminates dead-end first-run states. Icon upload exercises the Cloudinary credentials that are already provisioned, makes the rail look polished.                        |
| Arch  | Backend layout              | Split routers + controllers layer + a dedicated `requireWorkspaceMembership` middleware.                                                                                     | Keeps handlers small, makes the controllers reusable across routers (auto-create-on-register reuses `createWorkspaceTx`), and replaces the misleading `authorize()` stub. |
| Sec-1 | Invite acceptance           | Strict — the logged-in user's email must match the invitation email (case-insensitive).                                                                                      | A leaked link should not grant blanket workspace access.                                                                                                                  |
| Sec-2 | Membership lookup errors    | `404` for non-members hitting a workspace ID, not `403`.                                                                                                                     | Avoids leaking workspace existence to non-members.                                                                                                                        |
| Doc   | OpenAPI annotation location | Move `@openapi` JSDoc to the controllers; widen the swagger.js glob to `./src/{routes,controllers}/*.js`.                                                                    | Annotations belong next to the handler logic, not the wiring.                                                                                                             |

---

## Architecture overview

```
HTTP layer:                                Persistence:
  routes/workspaces.js   ─┐                 prisma/schema.prisma
  routes/members.js       ├─ thin wiring     ├─ Workspace (+ iconUrl, createdById)
  routes/invitations.js  ─┘                  ├─ WorkspaceMember
                                             └─ Invitation  (NEW)
  controllers/workspaces.js   ──┐
  controllers/members.js        ├─ business logic + Swagger annotations
  controllers/invitations.js  ──┘

Cross-cutting:
  middleware/auth.js          (existing — unchanged except removing the stub authorize())
  middleware/workspace.js     (NEW — requireWorkspaceMembership(role?))
  lib/prisma.js               (existing singleton)
  lib/cloudinary.js           (NEW — thin SDK wrapper for icon uploads)

Shared:
  packages/shared/src/index.js  (+ INVITATION_STATUS, INVITATION_TTL_DAYS,
                                   WORKSPACE_ACCENT_PALETTE, new SOCKET_EVENTS)

Frontend:
  app/dashboard/layout.js                        (rewrite — left rail + content slot)
  app/dashboard/[workspaceId]/{layout,page,settings/...}.js
  app/invite/[token]/page.js
  app/onboarding/page.js
  components/workspace/*  members/*  invitations/*  ui/*
  stores/workspaceStore.js (rewrite)  workspaceMembersStore.js (NEW)
  lib/api.js (add api.upload)
```

The active workspace is identified by **the URL path segment**, not a stateful "current workspace" cookie. This makes deep links work, makes the back button meaningful, and avoids the race between Zustand hydration and the first request.

---

## Data model changes

### `apps/api/prisma/schema.prisma`

**Workspace** — add `iconUrl` and `createdById`:

```prisma
model Workspace {
  id           String   @id @default(uuid())
  name         String
  description  String?
  accentColor  String   @default("#3b82f6")
  iconUrl      String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  createdById  String
  createdBy    User     @relation("WorkspaceCreator", fields: [createdById], references: [id])

  members       WorkspaceMember[]
  invitations   Invitation[]
  goals         Goal[]
  announcements Announcement[]
  actionItems   ActionItem[]
  activities    Activity[]
}
```

**Invitation** — new model:

```prisma
model Invitation {
  id           String   @id @default(uuid())
  email        String                          // lowercased, trimmed
  role         String   @default("MEMBER")     // ADMIN | MEMBER
  token        String   @unique                // crypto.randomBytes(32).hex
  status       String   @default("PENDING")    // PENDING | ACCEPTED | REVOKED | EXPIRED
  expiresAt    DateTime                        // now() + INVITATION_TTL_DAYS
  createdAt    DateTime @default(now())
  acceptedAt   DateTime?

  workspaceId  String
  invitedById  String
  acceptedById String?

  workspace    Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  invitedBy    User      @relation("InvitationsSent",     fields: [invitedById],   references: [id])
  acceptedBy   User?     @relation("InvitationsAccepted", fields: [acceptedById],  references: [id])

  @@index([workspaceId, status])
  @@unique([workspaceId, email, status])       // only one PENDING per (workspace, email)
}
```

**User** — add back-relations:

```prisma
createdWorkspaces     Workspace[]   @relation("WorkspaceCreator")
invitationsSent       Invitation[]  @relation("InvitationsSent")
invitationsAccepted   Invitation[]  @relation("InvitationsAccepted")
```

The composite unique on `(workspaceId, email, status)` allows the same email to have a `REVOKED` or `EXPIRED` history without blocking a new `PENDING` invite.

**Migration** — `npm run db:migrate --workspace=@team-hub/api -- --name add_workspace_icon_and_invitations`. Use `migrate dev` (creates a real migration file) rather than `db push`, so Railway deployment can rely on the migration history.

### `packages/shared/src/index.js`

Add:

```js
const INVITATION_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REVOKED: 'REVOKED',
  EXPIRED: 'EXPIRED',
};
const INVITATION_TTL_DAYS = 7;

const WORKSPACE_ACCENT_PALETTE = [
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#ec4899',
  '#f43f5e',
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#10b981',
  '#14b8a6',
  '#06b6d4',
];
```

Extend `SOCKET_EVENTS` with `MEMBER_JOINED`, `MEMBER_REMOVED`, `WORKSPACE_UPDATED` (used in the next milestone — added now to avoid a second migration of the shared package).

---

## API surface

All routes require `authenticate`. Workspace-scoped routes additionally use `requireWorkspaceMembership(role?)`. Errors return JSON `{ error: '...' }` matching the existing `auth.js` style.

### Workspaces — `/api/workspaces`

| Method   | Path        | Auth   | Body                                              | Returns                                                                                         |
| -------- | ----------- | ------ | ------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `POST`   | `/`         | authed | `{ name, description?, accentColor?, iconUrl? }`  | `201 { workspace }` — caller becomes ADMIN                                                      |
| `GET`    | `/`         | authed | —                                                 | `200 { workspaces: [...] }` — only ones caller is a member of, includes `myRole`, `memberCount` |
| `GET`    | `/:id`      | member | —                                                 | `200 { workspace, myRole }`                                                                     |
| `PATCH`  | `/:id`      | ADMIN  | `{ name?, description?, accentColor?, iconUrl? }` | `200 { workspace }`                                                                             |
| `DELETE` | `/:id`      | ADMIN  | —                                                 | `204` — schema cascade handles dependent rows                                                   |
| `POST`   | `/:id/icon` | ADMIN  | `multipart/form-data` with `icon` file            | `200 { iconUrl }` — uploads to Cloudinary, persists to workspace                                |

### Members — mounted at `/api/workspaces/:workspaceId/members`

| Method   | Path         | Auth          | Body                            | Returns                                                                     |
| -------- | ------------ | ------------- | ------------------------------- | --------------------------------------------------------------------------- |
| `GET`    | `/`          | member        | —                               | `200 { members: [{ id, userId, name, email, avatarUrl, role, joinedAt }] }` |
| `PATCH`  | `/:memberId` | ADMIN         | `{ role: "ADMIN" \| "MEMBER" }` | `200 { member }` — last-admin guard on demote                               |
| `DELETE` | `/:memberId` | ADMIN OR self | —                               | `204` — last-admin guard                                                    |
| `POST`   | `/leave`     | member        | —                               | `204` — convenience self-leave; last-admin guard                            |

### Invitations (workspace-scoped) — `/api/workspaces/:workspaceId/invitations`

| Method   | Path                    | Auth  | Body              | Returns                                                                   |
| -------- | ----------------------- | ----- | ----------------- | ------------------------------------------------------------------------- |
| `POST`   | `/`                     | ADMIN | `{ email, role }` | `201 { invitation, inviteUrl }`                                           |
| `GET`    | `/`                     | ADMIN | —                 | `200 { invitations: [...] }` — pending + recent history                   |
| `DELETE` | `/:invitationId`        | ADMIN | —                 | `204` — sets status `REVOKED`                                             |
| `POST`   | `/:invitationId/resend` | ADMIN | —                 | `200 { invitation, inviteUrl }` — extends `expiresAt`, returns same token |

### Invitations (public-by-token) — `/api/invitations`

| Method | Path             | Auth     | Body | Returns                                                                                                                                                |
| ------ | ---------------- | -------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GET`  | `/:token`        | optional | —    | `200 { workspace: { name, iconUrl, accentColor }, invitation: { email, role, status }, requiresAuth }` — flips status to `EXPIRED` if past `expiresAt` |
| `POST` | `/:token/accept` | required | —    | `200 { workspace }` — strict email match (case-insensitive); creates `WorkspaceMember`, marks invite `ACCEPTED`                                        |

### Failure codes

- `400` — missing/invalid body, name >100 chars, accentColor not `#RRGGBB`, invalid role enum, malformed email
- `401` — not authenticated
- `403` — authenticated but not an Admin (where Admin is required)
- `404` — workspace/invitation not found, **or** caller not a member of the workspace (intentional — avoids leaking existence)
- `409` — email already a member; PENDING invite already exists for that email; demote/remove would leave zero admins; user already a member when accepting
- `410` — invitation expired or revoked at accept time

### Wiring

```js
// apps/api/src/index.js
app.use('/api/workspaces', require('./routes/workspaces'));
app.use('/api/invitations', require('./routes/invitations'));
```

The members router is mounted **inside** `routes/workspaces.js` via `router.use('/:workspaceId/members', require('./members'))` so `:workspaceId` is in scope. The members router itself must be created with `express.Router({ mergeParams: true })` for `req.params.workspaceId` to be readable from inside it. Same pattern for the workspace-scoped invitations router.

---

## Concurrency & invariants

### Transactional boundaries

Every multi-statement operation runs inside `prisma.$transaction`:

| Operation               | Why                                                                                                                                                                                                                    |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Create workspace        | Insert `Workspace` + `WorkspaceMember (ADMIN)` for creator atomically.                                                                                                                                                 |
| Auto-create on register | Extend the existing register transaction (which already creates user + refresh token) to also create the default workspace + admin membership. The controller exposes `createWorkspaceTx(tx, userId, data)` for reuse. |
| Accept invitation       | Re-validate `status=PENDING` and `expiresAt > now()` inside the transaction; create `WorkspaceMember`; update `invitation.status = ACCEPTED`.                                                                          |
| Demote / remove member  | Run the last-admin count inside the transaction with the mutation.                                                                                                                                                     |
| Send invitation         | Check no existing membership and no PENDING invite within the transaction with the insert. The composite unique is the safety net.                                                                                     |

### Last-admin guard — single source of truth

```js
async function assertNotLastAdmin(tx, workspaceId, leavingMemberId) {
  const remaining = await tx.workspaceMember.count({
    where: { workspaceId, role: 'ADMIN', id: { not: leavingMemberId } },
  });
  if (remaining === 0) {
    throw new HttpError(
      409,
      'LAST_ADMIN',
      'Promote another member to admin before leaving'
    );
  }
}
```

Called from: PATCH role (when demoting an admin), DELETE member, POST `/leave`. No inline counts elsewhere.

### Email normalization

Lowercased and trimmed before any lookup or write — applied in registration, invitation creation, and the invite acceptance comparison.

### Invitation token

- `crypto.randomBytes(32).toString('hex')` → 256-bit entropy.
- Stored as plaintext in the DB. Tradeoff for this scope: invites are short-lived (7d), single-use, scoped to one workspace; hashing buys little. Documented as a known limitation.
- Lazy expiry — `GET /:token` and the accept endpoint flip status `PENDING → EXPIRED` on read when past `expiresAt`. No cron job.

### Cloudinary upload

1. `multer` (memory storage, 2 MB limit, mime allowlist `image/png|jpeg|webp`) parses the form.
2. Buffer streamed to Cloudinary with `folder: 'team-hub/workspaces'`, `public_id: <workspaceId>`, `overwrite: true` — re-uploads replace the previous image.
3. `secure_url` written to `Workspace.iconUrl`.
4. On workspace deletion, attempt Cloudinary destroy by public-id; **don't fail the deletion** if destroy errors (logged warning only). DB cascade is the source of truth.

`multer` and `cloudinary` may need to be added to `apps/api/package.json` (verify during planning).

---

## Frontend architecture

### Routing

```
apps/web/src/app/
├── login/page.js                                  (existing)
├── register/page.js                               (existing)
├── invite/[token]/page.js                         NEW — invite landing
├── onboarding/page.js                             NEW — fallback if 0 workspaces
├── dashboard/
│   ├── layout.js                                  REWRITE — left rail + content slot
│   ├── page.js                                    redirects to last-active or onboarding
│   └── [workspaceId]/
│       ├── layout.js                              fetches workspace meta, validates membership
│       ├── page.js                                workspace home (placeholder for next milestones)
│       └── settings/
│           ├── page.js                            general (name/desc/colour/icon/delete)
│           ├── members/page.js
│           └── invitations/page.js
```

### Components — `apps/web/src/components/`

- `workspace/`: `WorkspaceRail`, `WorkspaceTile`, `CreateWorkspaceModal`, `WorkspaceIconUpload`, `AccentColorPicker`
- `members/`: `MemberList`, `RoleBadge`, `RoleSelect`
- `invitations/`: `InviteForm`, `InvitationList`, `InvitationStatusBadge`
- `ui/`: `Modal`, `Button`, `ConfirmDialog`

The accent colour: `WORKSPACE_ACCENT_PALETTE` (12 swatches) drives the picker, with an "Other" hex input for power users. Tailwind's `primary-*` scale is fixed in `tailwind.config.js`, so per-workspace colour is applied via `style={{ backgroundColor: workspace.accentColor }}` on the rail tile and a couple of accent surfaces inside the workspace. We do not regenerate Tailwind classes per workspace.

### Stores

`stores/workspaceStore.js` (rewrite) — workspaces list + active id (synced from URL):

```js
{
  workspaces, activeWorkspaceId, isLoading, error,
  fetchWorkspaces(),
  createWorkspace(data),
  updateWorkspace(id, patch),
  deleteWorkspace(id),
  setActiveWorkspaceId(id),
}
```

`stores/workspaceMembersStore.js` (new) — heavy state for the admin pages only:

```js
{
  members, invitations,
  fetchMembers(workspaceId),
  fetchInvitations(workspaceId),
  inviteMember(workspaceId, { email, role }),
  revokeInvitation(workspaceId, invitationId),
  resendInvitation(workspaceId, invitationId),
  updateMemberRole(workspaceId, memberId, role),
  removeMember(workspaceId, memberId),
}
```

Two stores keep re-renders contained — most pages only need workspace metadata.

### `lib/api.js`

Add `api.upload(path, formData)` for multipart bodies. The existing JSON helper can't handle them.

### Invite landing — `app/invite/[token]/page.js`

Three states from `GET /api/invitations/:token` + auth check:

1. **Logged out** — workspace preview ("You've been invited to **Acme**") with two CTAs: "Sign in" and "Create account". Both pass `?next=/invite/<token>` so we land back here after auth.
2. **Logged in, email matches** — single "Accept invitation" button → `POST /:token/accept` → redirect to `/dashboard/<workspaceId>`.
3. **Logged in, email doesn't match** — explain the mismatch, offer logout + retry.

Plus terminal states: expired, revoked, not found, already accepted (redirect into the workspace).

---

## Failure modes — user-facing

| Scenario                                     | UX                                                                                                                              |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Last admin tries to demote/remove themselves | Inline error, "Promote someone else first." Action reverts.                                                                     |
| User deletes their only workspace            | Allowed. Frontend redirects to the onboarding empty state.                                                                      |
| Invite accepted but user is already a member | `409` from API → friendly "You're already in this workspace" + redirect in.                                                     |
| Invite link expired                          | "Invitation expired" landing state, with guidance to request a new one.                                                         |
| Token doesn't match any invitation           | Generic "Invitation not found or no longer valid" (same wording for "never existed" and "revoked", to avoid token enumeration). |
| Two admins edit the workspace simultaneously | Last write wins. Acceptable for this scope.                                                                                     |
| Network drops mid-icon-upload                | Frontend toast + prior icon intact (DB is only written after Cloudinary returns).                                               |

Logging matches existing `auth.js` style — `console.error('<op> error:', err)` in catch, generic `{ error: 'Internal server error' }` to the client.

---

## Build sequence

1. **Schema & shared constants** — Migrate `add_workspace_icon_and_invitations`. Add `INVITATION_STATUS`, `INVITATION_TTL_DAYS`, `WORKSPACE_ACCENT_PALETTE`, three new socket events. Run `prisma generate`.
2. **Middleware foundation** — `middleware/workspace.js` with `requireWorkspaceMembership(role?)`. Delete the misleading `authorize()` stub from `middleware/auth.js`.
3. **Workspaces CRUD** — `controllers/workspaces.js` (with reusable `createWorkspaceTx`) + `routes/workspaces.js`. Wire icon upload using `multer` + Cloudinary helper.
4. **Auto-create on register** — Update `routes/auth.js` register handler to call `createWorkspaceTx` inside its existing `$transaction`.
5. **Members management** — `controllers/members.js` + `routes/members.js`, including `assertNotLastAdmin`.
6. **Invitations** — `controllers/invitations.js` + `routes/invitations.js` (workspace-scoped) + public-by-token routes.
7. **Swagger** — Widen the glob to include `controllers/`. Add `Member`, `Invitation`, `RoleUpdateInput` schemas. Extend `Workspace` with `iconUrl`/`myRole`/`memberCount`.
8. **Frontend API plumbing** — `api.upload` in `lib/api.js`. Rewrite `workspaceStore.js`. Create `workspaceMembersStore.js`.
9. **Frontend chrome** — Rewrite `app/dashboard/layout.js` with the left rail. Add `app/dashboard/[workspaceId]/layout.js` and home page. Build `WorkspaceRail`, `WorkspaceTile`, `CreateWorkspaceModal`.
10. **Workspace settings** — `[workspaceId]/settings/page.js` (general + icon + delete) plus `AccentColorPicker`, `WorkspaceIconUpload`.
11. **Members & invitations pages** — `settings/members/page.js`, `settings/invitations/page.js` and their components.
12. **Invite landing** — `app/invite/[token]/page.js` with all five states, including login/register redirects via `?next=`.
13. **Onboarding fallback** — `app/onboarding/page.js`.
14. **Manual smoke** — `npm run dev`; walk through register → see auto-workspace → create second → switch via rail → invite → copy link → accept as second user → see new member → demote/remove → leave.

---

## File inventory

**Backend — created**

- `apps/api/src/middleware/workspace.js`
- `apps/api/src/controllers/workspaces.js`
- `apps/api/src/controllers/members.js`
- `apps/api/src/controllers/invitations.js`
- `apps/api/src/routes/members.js`
- `apps/api/src/routes/invitations.js`
- `apps/api/src/lib/cloudinary.js`
- `apps/api/prisma/migrations/<timestamp>_add_workspace_icon_and_invitations/`

**Backend — modified**

- `apps/api/prisma/schema.prisma`
- `apps/api/src/routes/workspaces.js`
- `apps/api/src/routes/auth.js`
- `apps/api/src/middleware/auth.js`
- `apps/api/src/index.js`
- `apps/api/src/config/swagger.js`
- `apps/api/package.json` (add `multer`, `cloudinary` if missing)

**Frontend — created**

- `apps/web/src/app/dashboard/[workspaceId]/{layout,page}.js`
- `apps/web/src/app/dashboard/[workspaceId]/settings/{page,members/page,invitations/page}.js`
- `apps/web/src/app/invite/[token]/page.js`
- `apps/web/src/app/onboarding/page.js`
- `apps/web/src/stores/workspaceMembersStore.js`
- `apps/web/src/components/workspace/{WorkspaceRail,WorkspaceTile,CreateWorkspaceModal,WorkspaceIconUpload,AccentColorPicker}.jsx`
- `apps/web/src/components/members/{MemberList,RoleBadge,RoleSelect}.jsx`
- `apps/web/src/components/invitations/{InviteForm,InvitationList,InvitationStatusBadge}.jsx`
- `apps/web/src/components/ui/{Modal,Button,ConfirmDialog}.jsx`

**Frontend — modified**

- `apps/web/src/app/dashboard/layout.js`
- `apps/web/src/app/dashboard/page.js`
- `apps/web/src/stores/workspaceStore.js`
- `apps/web/src/lib/api.js`

**Shared — modified**

- `packages/shared/src/index.js`

---

## Known limitations

- Invitation tokens are stored in plaintext (acceptable given short TTL and single-use semantics, documented above).
- No email delivery — admin copies the link manually from the success toast.
- No real-time presence in this milestone; socket constants are added now to avoid a follow-up migration.
- Workspace ownership transfer is not supported. `createdById` is informational; any Admin has full admin powers.
- Concurrent admin edits use last-write-wins. No optimistic concurrency.
- Cloudinary cleanup on workspace deletion is best-effort.
