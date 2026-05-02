# AGENTS.md

## Commands

```bash
# Run single workspace (not "npm run dev -w @team-hub/api")
npm run dev --workspace=@team-hub/api      # API on port 5000
npm run dev --workspace=@team-hub/web       # Web on port 3000

# Prisma - always target workspace
npm run db:generate --workspace=@team-hub/api   # after schema changes
npm run db:push --workspace=@team-hub/api       # sync schema (dev)
npm run db:migrate --workspace=@team-hub/api     # create migration
npm run db:seed --workspace=@team-hub/api

# Format before committing
npm run format
```

## Auth (Critical)

- **No Authorization header** - tokens live in httpOnly cookies only
- `authenticate` middleware reads `req.cookies.accessToken`
- Refresh token cookie path is `/api/auth/refresh` — must use same path when clearing
- Use `setAuthCookies` / `clearAuthCookies` helpers in `apps/api/src/lib/jwt.js`
- `req.user` only has `{ id }` — roles are per-workspace, query `WorkspaceMember` table

## Module System

- Backend is **CommonJS** (`require`/`module.exports`)
- Frontend is **ESM** (Next.js App Router)
- **Never mix** — use `require()` in api, `import` in web
- Use Prisma singleton: `require('../lib/prisma')` — never `new PrismaClient()`

## Data Model

- Enums are plain `String` fields, not Prisma enums
- Use constants from `packages/shared/src/index.js` (`GOAL_STATUS`, `ACTION_ITEM_STATUS`, `PRIORITY`, `ROLES`)
- IDs are UUID strings (`@default(uuid())`)

## API Docs

- Swagger UI: http://localhost:5000/api/docs
- Spec JSON: http://localhost:5000/api/docs.json
- Add routes with `@openapi` JSDoc blocks, reference schemas from `swagger.js`

## Frontend

- Path alias: `@/*` maps to `src/*` (see `jsjsconfig.json`)
- Tailwind: use `bg-primary-600` not hardcoded hex colors
- Zustand stores in `apps/web/src/stores/` are skeleton TODOs

## Env Setup

- API: `apps/api/.env` (copy from `.env.example`)
- Web: `apps/web/.env.local`
- `CLIENT_URL` must match web origin for CORS+cookies

## Testing

- No test runner configured — don't claim tests pass

## See Also

- Full architecture docs: `CLAUDE.md`
