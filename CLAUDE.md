# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Layout

Turborepo monorepo with npm workspaces. Three workspaces:

- `apps/api` — Express.js REST API (CommonJS), Prisma + PostgreSQL, Socket.io (planned). Package name `@team-hub/api`.
- `apps/web` — Next.js 16 App Router frontend (JavaScript, **not** TypeScript), React 19, Tailwind, Zustand. Package name `@team-hub/web`.
- `packages/shared` — Plain CommonJS module exporting cross-app constants (roles, statuses, socket event names). Package name `@team-hub/shared`. No build step. Importing from this package is how the frontend and backend stay in sync on enum strings — prefer it over redefining literals.

## Common commands

Run from repo root unless noted. Turbo orchestrates across workspaces.

```bash
# Install all deps (root)
npm install

# Run everything in dev (api + web concurrently via turbo)
npm run dev

# Run only one app
npm run dev --workspace=@team-hub/api      # nodemon, port 5000
npm run dev --workspace=@team-hub/web      # next dev, port 3000

# Build / lint
npm run build
npm run lint
npm run format          # Prettier across all js/jsx/json/md/css

# Prisma (must target the api workspace)
npm run db:generate --workspace=@team-hub/api   # regenerate client after schema.prisma edits
npm run db:push --workspace=@team-hub/api       # sync schema (dev) — no migration file
npm run db:migrate --workspace=@team-hub/api    # prisma migrate dev (creates migration)
npm run db:seed --workspace=@team-hub/api       # runs prisma/seed.js (file does not yet exist)
```

There is no test runner configured yet. Don't claim tests pass — there are none.

## Architecture notes

### Auth (cookie-based, not Authorization header)

Implemented in `apps/api/src/lib/jwt.js`, `apps/api/src/middleware/auth.js`, `apps/api/src/routes/auth.js`.

- Both tokens live in **httpOnly cookies**. The `authenticate` middleware reads `req.cookies.accessToken` — there is no `Authorization: Bearer` flow. Don't add one without a reason; the frontend relies on `credentials: 'include'` plus the CORS config in `apps/api/src/index.js` (which already sets `credentials: true` and a single `CLIENT_URL` origin).
- Access token: 15min, cookie path `/`. Refresh token: 7d, cookie path **`/api/auth/refresh`** — set this same path when clearing or it will not be removed. `setAuthCookies` / `clearAuthCookies` are the only correct way to touch these cookies.
- Refresh tokens are stored in the `RefreshToken` table and **rotated** on every `/api/auth/refresh` call (old row deleted, new row inserted, both inside a single `prisma.$transaction`). When adding logout-everywhere or session-revocation features, delete by `userId` from this table.
- `authorize(...)` in `middleware/auth.js` is a **stub that calls `next()`** with no checks. Roles in this app are per-workspace (see `WorkspaceMember.role`), so authorization must be done inside each route by querying `WorkspaceMember` for the requesting user — not by relying on a global role on `req.user`. `req.user` only carries `{ id }`.

### Backend module system & Prisma client

- Backend is **CommonJS** (`require`/`module.exports`). Frontend is ESM. Don't mix.
- Use the singleton at `apps/api/src/lib/prisma.js` (`require('../lib/prisma')`) — do not instantiate `new PrismaClient()` ad-hoc, or you'll exhaust connections under nodemon reloads.

### API surface and current state

`apps/api/src/index.js` mounts: `/api/auth`, `/api/workspaces`, `/api/goals`, `/api/announcements`, `/api/actionItems`. As of the current commit only `auth.js` is implemented; the other route files contain only Swagger JSDoc annotations and are otherwise empty stubs. Socket.io is wired up in commented-out scaffolding in `index.js` only.

OpenAPI docs are generated via `swagger-jsdoc` from JSDoc comments in `src/routes/*.js` and `src/index.js` (configured in `apps/api/src/config/swagger.js`). UI: `http://localhost:5000/api/docs`. Raw spec: `/api/docs.json`. When adding a route, add the matching `@openapi` block above the handler, and reference shared schemas from `swagger.js` rather than redefining them inline.

### Data model conventions (`apps/api/prisma/schema.prisma`)

- All IDs are UUID strings (`@default(uuid())`).
- Status/role/priority fields are **plain `String`** with the allowed values listed in inline comments — there are no Prisma enums. The canonical enum values live in `packages/shared/src/index.js` (`GOAL_STATUS`, `ACTION_ITEM_STATUS`, `PRIORITY`, `ROLES`). Use those constants on both sides of the wire.
- Workspace-scoped resources (`Goal`, `Announcement`, `ActionItem`, `Activity`, `WorkspaceMember`) cascade-delete with the workspace. `WorkspaceMember` has a composite unique on `(userId, workspaceId)`.

### Frontend

- App Router under `apps/web/src/app/`. Path alias `@/*` → `src/*` (see `jsconfig.json`).
- State lives in Zustand stores under `apps/web/src/stores/`. Current stores are skeletons with TODOs.
- Tailwind has a custom `primary` color scale (blue, defined in `tailwind.config.js`) — use `bg-primary-600` etc. rather than hardcoding `#3b82f6`. Dark mode is `class`-based.
- API base and socket URL come from `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_SOCKET_URL` (defaulted in `next.config.js`). Cloudinary is in `images.remotePatterns`, so `next/image` works for `res.cloudinary.com` URLs out of the box.

## Environment

- `apps/api/.env` (copied from `.env.example`): `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CLOUDINARY_*`, `CLIENT_URL` (must match the web origin for CORS+cookies to work), `PORT` (default 5000).
- `apps/web/.env.local`: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SOCKET_URL`.
- Node 18+ required. Package manager pinned to `npm@10.2.4`.
- Prettier config: semicolons, single quotes, 2-space tabs, ES5 trailing commas. Run `npm run format` before committing if Prettier hasn't been run.
