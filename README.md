# Collaborative Team Hub

Full-stack collaboration platform built for the FredoCloud Technical Assessment.
Teams manage shared goals, post announcements, and track action items in real time.

## Live URLs

- **Web app:** https://team-hub-web.up.railway.app
- **API:** https://team-hub-api.up.railway.app
- **API docs (Swagger):** https://team-hub-api.up.railway.app/api/docs

## Demo accounts

| Email            | Password   | Role   |
| ---------------- | ---------- | ------ |
| `admin@demo.com` | `demo1234` | Admin  |
| `iris@demo.com`  | `demo1234` | Admin  |
| `alice@demo.com` | `demo1234` | Member |
| `bob@demo.com`   | `demo1234` | Member |

(9 more `*@demo.com` accounts exist with the same password.)

## Features

### Core

- Email/password auth with JWT in httpOnly cookies (access + rotated refresh)
- User profile with Cloudinary avatar upload
- Workspaces — create, switch, invite by email (token link), Admin/Member roles
- Goals — title, owner, due date, status, milestones with progress, per-goal activity feed
- Announcements — TipTap rich text, sanitised on the wire, comments, emoji reactions, pinning
- Action items — priority, assignee, due date, optional parent goal, kanban + list views
- Real-time — Socket.io broadcasts goals/items/announcements/comments/reactions/presence
- @mentions — TipTap mention extension on announcements; markdown-style on comments
- Notifications — in-app bell + panel + email on @mention and invitation
- Online presence indicators per workspace
- Analytics — totals, completion-this-week, overdue, 6-month completion chart
- CSV exports — goals, action items, announcements, audit log

### Advanced features (3 of 5 — assignment minimum is 2)

1. **Optimistic UI** — Status changes, reactions, pin/unpin, kanban DnD, milestone progress, inline edits all reflect instantly and roll back on error.
2. **Advanced RBAC** — Capability matrix in `@team-hub/shared` enforced by `requirePermission(cap)` middleware on the backend and `useCapability` / `<PermissionGate>` on the frontend. Every privileged endpoint and UI button is gated against the same source of truth.
3. **Audit log** — Immutable `Activity` table written via `logActivity(tx, ...)` inside every mutation transaction. Filterable timeline UI under Settings → Audit log; live updates via the `activity:new` socket event; CSV export.

### Bonus features

- **Dark / light theme** — Tailwind class-mode + system-pref detection + persistent toggle
- **Email notifications** — Nodemailer with SMTP env-driven transport (Resend in production, console-log fallback for local dev)
- **Cmd+K command palette** — `cmdk` lib, navigation + quick-create + theme + sign-out
- **OpenAPI / Swagger** — Auto-generated from JSDoc, served at `/api/docs`
- **PWA** — Installable shell via `@ducanh2912/next-pwa` (no offline writes — see "known limitations")
- **Tests** — _Not included; explicitly deferred per scope decision._

## Tech stack

Turborepo monorepo — `apps/api` (Express + Prisma + Socket.io), `apps/web` (Next.js 16 App Router + React 19 + Zustand + Tailwind + Recharts + TipTap + @dnd-kit), `packages/shared` (CommonJS constants + capability matrix).

## Local setup

Requires Node 18+ and PostgreSQL 14+.

1. Clone and install:

   ```bash
   git clone https://github.com/orvian36/collaborative_team_hub.git
   cd collaborative_team_hub
   npm install
   ```

2. Provision a local Postgres database (or use Railway's `DATABASE_URL`).

3. Configure env files:

   ```bash
   cp apps/api/.env.example apps/api/.env
   # Then fill in the values described in "Environment variables" below.
   ```

   For the web app:

   ```bash
   echo 'NEXT_PUBLIC_API_URL=http://localhost:5000'   >  apps/web/.env.local
   echo 'NEXT_PUBLIC_SOCKET_URL=http://localhost:5000' >> apps/web/.env.local
   ```

4. Migrate and seed:

   ```bash
   npm run db:migrate --workspace=@team-hub/api
   npm run db:seed    --workspace=@team-hub/api
   ```

5. Run both apps:

   ```bash
   npm run dev
   ```

6. Open `http://localhost:3000/login` and sign in with `admin@demo.com / demo1234`.

## Environment variables

### `apps/api/.env`

| Name                    | Required | Notes                                               |
| ----------------------- | -------- | --------------------------------------------------- |
| `DATABASE_URL`          | yes      | Postgres connection string                          |
| `JWT_ACCESS_SECRET`     | yes      | `openssl rand -hex 32`                              |
| `JWT_REFRESH_SECRET`    | yes      | `openssl rand -hex 32`                              |
| `CLOUDINARY_CLOUD_NAME` | yes      | For avatar + workspace icon uploads                 |
| `CLOUDINARY_API_KEY`    | yes      |                                                     |
| `CLOUDINARY_API_SECRET` | yes      |                                                     |
| `CLIENT_URL`            | yes      | Web app URL — must match exactly for cookies + CORS |
| `SMTP_HOST`             | no       | If unset, emails are logged instead of sent         |
| `SMTP_PORT`             | no       | Default 465                                         |
| `SMTP_USER`             | no       |                                                     |
| `SMTP_PASS`             | no       |                                                     |
| `SMTP_FROM`             | no       | e.g. `Team Hub <noreply@example.com>`               |
| `PORT`                  | no       | Default 5000                                        |

### `apps/web/.env.local`

| Name                     | Required | Notes                                              |
| ------------------------ | -------- | -------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`    | yes      | API base URL                                       |
| `NEXT_PUBLIC_SOCKET_URL` | yes      | Same as API URL (Socket.io shares the HTTP server) |

## Scripts

```bash
npm run dev             # api + web concurrently
npm run build
npm run lint
npm run format

# Backend-only
npm run dev      --workspace=@team-hub/api
npm run db:generate --workspace=@team-hub/api
npm run db:migrate  --workspace=@team-hub/api
npm run db:seed     --workspace=@team-hub/api

# Frontend-only
npm run dev   --workspace=@team-hub/web
npm run build --workspace=@team-hub/web
```

## Repository layout

```
apps/
  api/           Express REST + Socket.io + Prisma
  web/           Next.js 16 App Router (JS, no TS)
packages/
  shared/        Constants, capability matrix, helpers shared by both apps
docs/
  superpowers/
    specs/       Design specs
    plans/       Implementation plans
```

## Architecture highlights

- **Auth:** JWT access (15min) + refresh (7d, rotated) in httpOnly cookies, paths `/` and `/api/auth/refresh`. No `Authorization: Bearer` flow.
- **Authorisation:** Two layers — `requireWorkspaceMembership()` confirms the user is in the workspace; `requirePermission(cap)` checks the capability matrix in shared. Frontend mirrors the same matrix via `useCapability` / `<PermissionGate>`.
- **Real-time:** Single Socket.io server attached to the Express HTTP server. Auth via `accessToken` cookie at handshake. Rooms: `workspace:<id>` for workspace events, `user:<id>` for personal notifications. Presence map is in-memory (single-instance limitation called out below).
- **Audit + activity feed:** One `Activity` table powers both the per-goal activity feed (filtered by `goalId`) and the workspace audit log (no filter). Writes are transactional with the mutation that triggered them, and never via PUT/DELETE — the table is append-only by design.
- **Optimistic UI:** Each store has explicit optimistic actions (kanban move, reaction toggle, status change). The pattern: snapshot prior state → apply patch → call API → reconcile/rollback.

## Known limitations

- Presence map is in-memory; resets on server restart and does not survive horizontal scaling. Multi-instance would need Redis pub/sub.
- PWA is shell-only — no offline write queue. Offline support was explicitly not chosen as an advanced feature.
- @mention emails are per-event; no digest/batching.
- Refresh-token rotation is per-request, not per-session-fingerprint; theft detection is out of scope.
- Audit log retention is unbounded; no archival policy.
- No automated tests in this submission.

## License

MIT.
