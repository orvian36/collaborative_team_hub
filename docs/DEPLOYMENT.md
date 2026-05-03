# Railway Deployment Guide

Step-by-step deployment of the **Collaborative Team Hub** Turborepo (Next.js 16 web + Express/Prisma API + PostgreSQL) to **Railway** as two services in one project.

---

## Pre-flight status

Both production-only concerns have already been addressed in code — the reader's job is to commit/push and configure Railway.

- ✅ **Cross-site auth cookies** — `apps/api/src/lib/jwt.js` flips to `Secure; SameSite=None` when `NODE_ENV=production`, so cookies flow between the `team-hub-web.up.railway.app` and `team-hub-api.up.railway.app` subdomains. Local dev still uses `SameSite=Strict`. `clearAuthCookies` is matched, so logout works in both modes.
- ✅ **Email (Gmail SMTP)** — wired and verified end-to-end locally. Startup logs show `📧 Email: SMTP transport ready (smtp.gmail.com, ...)`. The exact same 5 `SMTP_*` values from `apps/api/.env` go into the Railway API service.

The only thing left is to push your branch (with the cookie + email changes committed) and follow the steps below.

---

## Environment variables — full reference

> Vars marked **auto-injected** are set for you by Railway and should **not** be added manually.

### Backend service (`apps/api`)

| Variable | Required | How to get / set | Notes |
|---|---|---|---|
| `DATABASE_URL` | ✅ | **Auto-injected** when you attach the Postgres plugin via *Reference Variable* (`${{Postgres.DATABASE_URL}}`). | Already set in your project per the audit. |
| `JWT_ACCESS_SECRET` | ✅ | Generate locally: `openssl rand -hex 32` (or `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`). | Any 32+ byte hex string. **Already set.** |
| `JWT_REFRESH_SECRET` | ✅ | Same as above — generate a **separate** 32-byte hex string. | Must be different from access secret. **Already set.** |
| `CLOUDINARY_CLOUD_NAME` | ✅ | [cloudinary.com](https://cloudinary.com) → free account → Dashboard → "Cloud name". | Used for avatar + workspace icon uploads. **Already set.** |
| `CLOUDINARY_API_KEY` | ✅ | Cloudinary Dashboard → "API Key". | **Already set.** |
| `CLOUDINARY_API_SECRET` | ✅ | Cloudinary Dashboard → "API Secret" (click *Reveal*). | **Already set.** |
| `CLIENT_URL` | ✅ | The **web service's** Railway public URL, e.g. `https://team-hub-web.up.railway.app`. **No trailing slash.** | Drives CORS, Socket.io origin, and email links. Must match the actual web URL exactly. |
| `NODE_ENV` | ✅ | Set to `production`. | Required so cookies are flagged `Secure` and `SameSite=None`. Railway does not set this automatically. |
| `PORT` | ⚙️ | **Auto-injected by Railway.** Do not override. | The API already reads `process.env.PORT`. |
| `SMTP_HOST` | ✅ | `smtp.gmail.com` (already configured locally). If unset, the API runs but emails fall through to a stub that just logs to stdout. | Code is generic — any SMTP provider works; Gmail is what's wired. |
| `SMTP_PORT` | ✅ | `465` (SSL). | Code sets `secure: true` only when port is 465. |
| `SMTP_USER` | ✅ | Full Gmail address (already configured locally — same value goes in Railway). | |
| `SMTP_PASS` | ✅ | 16-character Gmail **App Password** (already configured locally — same value goes in Railway). See "Gmail setup" below if regenerating. | Whitespace from Google's display format is auto-stripped at runtime. |
| `SMTP_FROM` | ✅ | `Team Hub <your.address@gmail.com>` — must match `SMTP_USER` (or a verified "Send mail as" alias), otherwise Gmail rewrites the From header. | |

### Gmail setup (already done locally — repeat only if regenerating)

1. Make sure 2-Step Verification is **on** for the Google account: <https://myaccount.google.com/security>. App Passwords are not available without it.
2. Visit <https://myaccount.google.com/apppasswords>.
3. Name it "Team Hub" (or anything) → **Create**.
4. Google shows a 16-character password formatted like `xxxx xxxx xxxx xxxx`. Copy it; you can't view it again later.
5. Paste it into `SMTP_PASS` in `apps/api/.env` (locally) and the API service Variables panel (on Railway). Spaces don't matter — the email lib strips them.
6. Restart the API. On startup you'll see one of:
   - `📧 Email: SMTP transport ready (smtp.gmail.com, user=you@gmail.com)` → working.
   - `📧 Email: SMTP transport FAILED (smtp.gmail.com): ...` → bad creds or port.

Gmail limits: ~500 sends/day for personal accounts, ~2000/day for Workspace. Plenty for this assessment; revisit if you scale.

> **Local verification status:** transport ready ✓, end-to-end test send accepted by Gmail ✓ (`messageId` returned). Reproduce the same check in Railway by tailing the API service's deployment logs after first boot.

### Frontend service (`apps/web`)

| Variable | Required | How to get / set | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | ✅ | The **API service's** Railway public URL, e.g. `https://team-hub-api.up.railway.app`. | Baked into the bundle at build time — must be set **before** the web service builds. |
| `NEXT_PUBLIC_SOCKET_URL` | ✅ | Same as `NEXT_PUBLIC_API_URL` (Socket.io shares the API HTTP server). | Same as above — set before build. |
| `NODE_ENV` | ⚙️ | **Auto-set to `production`** by `next start`. | No action needed. |
| `PORT` | ⚙️ | **Auto-injected by Railway.** `next start` reads it. | |

### Postgres plugin (managed by Railway)

When you provision the Postgres plugin, Railway automatically exposes:

- `DATABASE_URL` — full connection string with SSL
- `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD` — individual components

Only `DATABASE_URL` is referenced by the API. **Do not** copy/paste it as plain text — use a *Reference Variable* (see step 5 below) so it tracks the plugin if it's ever rotated.

---

## Step-by-step deployment

### 0. Prerequisites

- A **GitHub repo** with this project pushed to a branch (Railway pulls from GitHub).
- A **Railway account** ([railway.com](https://railway.com)) — Hobby plan ($5/month after free trial) is sufficient.
- The values currently in your local `apps/api/.env` (you'll paste each into Railway's Variables panel):
  - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
  - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` (Gmail App Password)
- All in-repo code changes committed and pushed (cookie SameSite fix, email startup verification, env var additions).

### 1. Create the Railway project

1. Go to [railway.com](https://railway.com) → **New Project** → **Deploy from GitHub repo**.
2. Authorize Railway to access your GitHub account if you haven't already.
3. Select the `collaborative_team_hub` repo.

> Railway will offer to deploy the whole repo as one service. **Cancel that** — we want two services and we'll add them manually so we can pin each one to a subdirectory.

### 2. Add the Postgres plugin

1. Inside the project, click **+ New** → **Database** → **Add PostgreSQL**.
2. Wait ~30 seconds for it to provision.
3. Click the new Postgres tile → **Variables** tab. Confirm `DATABASE_URL` is present. You don't copy it — you'll reference it from the API service in step 5.

### 3. Create the **API service**

1. Click **+ New** → **GitHub Repo** → pick the same repo.
2. Open the new service → **Settings** tab.
3. Configure:
   - **Service Name:** `team-hub-api`
   - **Root Directory:** `apps/api`
   - **Watch Paths:** `apps/api/**` and `packages/shared/**` (so it redeploys only when relevant files change)
   - **Build Command:** *(leave empty — Nixpacks auto-detects + the workspace install handles it; the `railway.json` in `apps/api/` already specifies the builder)*
   - **Start Command:** *(leave empty — `apps/api/railway.json` already sets it to `npx prisma migrate deploy && node src/index.js`)*
   - **Custom Install Command:** `cd ../.. && npm install` *(this is the Turborepo trick — install from the monorepo root so `@team-hub/shared` resolves)*

> **Why `cd ../..` for install?** With Root Directory set to `apps/api`, Nixpacks would otherwise run `npm install` only inside `apps/api`, and the local `@team-hub/shared` workspace dep would fail to resolve. Running install from the repo root lets npm workspaces wire up the symlinks first.

### 4. Generate a public domain for the API

1. API service → **Settings** → **Networking** → **Generate Domain**.
2. Copy the URL (e.g. `https://team-hub-api.up.railway.app`). You'll paste it into the web service's env vars in step 7.

### 5. Set the API service's environment variables

API service → **Variables** tab → **+ New Variable** for each:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Click *Add Reference* → `Postgres.DATABASE_URL`. Stored as `${{Postgres.DATABASE_URL}}`. |
| `JWT_ACCESS_SECRET` | Paste your generated 64-char hex string. |
| `JWT_REFRESH_SECRET` | Paste a **different** 64-char hex string. |
| `CLOUDINARY_CLOUD_NAME` | From Cloudinary dashboard. |
| `CLOUDINARY_API_KEY` | From Cloudinary dashboard. |
| `CLOUDINARY_API_SECRET` | From Cloudinary dashboard (revealed). |
| `CLIENT_URL` | Web service's URL — *you don't have this yet*. Leave blank for now and set in step 8. |
| `NODE_ENV` | `production` (required — switches cookies to `Secure; SameSite=None`) |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `465` |
| `SMTP_USER` | Your Gmail address (same value as `apps/api/.env`) |
| `SMTP_PASS` | Your Gmail App Password (same value as `apps/api/.env`) |
| `SMTP_FROM` | `Team Hub <your.address@gmail.com>` |

> Do **not** set `PORT` — Railway injects it.

The first deploy will run `prisma migrate deploy`, which creates the schema in the freshly provisioned Postgres. Watch **Deployments** → the latest deployment's logs. Look for two lines:

```
🚀 API server running on port <PORT>
📧 Email: SMTP transport ready (smtp.gmail.com, user=...)
```

If the email line says `FAILED`, double-check that the App Password copied across exactly (Google blocks the connection if even one character is wrong).

### 6. Create the **web service**

1. Project view → **+ New** → **GitHub Repo** → same repo.
2. Open the new service → **Settings**:
   - **Service Name:** `team-hub-web`
   - **Root Directory:** `apps/web`
   - **Watch Paths:** `apps/web/**` and `packages/shared/**`
   - **Custom Install Command:** `cd ../.. && npm install`
   - **Custom Build Command:** `cd ../.. && npm run build --workspace=@team-hub/web` *(Next.js needs the build to run from a context where workspaces resolve)*
   - **Start Command:** *(leave empty — `apps/web/railway.json` already sets it to `npm start`, which runs `next start`)*

### 7. Generate a public domain for the web

Web service → **Settings** → **Networking** → **Generate Domain**. Copy the URL (e.g. `https://team-hub-web.up.railway.app`).

### 8. Set the web service's environment variables AND finish API config

Web service → **Variables**:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | API URL from step 4, e.g. `https://team-hub-api.up.railway.app` |
| `NEXT_PUBLIC_SOCKET_URL` | Same as `NEXT_PUBLIC_API_URL` |

Then **go back to the API service → Variables** and finally set:

| Variable | Value |
|---|---|
| `CLIENT_URL` | Web URL from step 7, e.g. `https://team-hub-web.up.railway.app` (**no trailing slash**) |

This will trigger a redeploy of the API with the correct CORS / Socket.io origin.

### 9. Seed the demo data (one-time)

The seed script is not part of `prisma migrate deploy`. Run it once, manually:

**Option A — Railway CLI (recommended):**

```bash
npm install -g @railway/cli
railway login
railway link             # pick your project
railway service          # pick team-hub-api
railway run npm run db:seed --workspace=@team-hub/api
```

**Option B — Temporarily change the start command:**

1. API service → Settings → temporarily set Start Command to:
   `npx prisma migrate deploy && node prisma/seed.js && node src/index.js`
2. Trigger a redeploy.
3. Once the seed log appears, revert the Start Command back to empty (so it falls through to `apps/api/railway.json`).

After seeding, you can log in at the web URL with `admin@demo.com` / `demo1234`.

### 10. Verification checklist

Walk through these on the live URLs in this order — failures pinpoint which env var or step is wrong:

- [ ] Deployment logs show `📧 Email: SMTP transport ready (smtp.gmail.com, ...)` → **Gmail credentials valid in production**
- [ ] `https://<api>/api/health` returns `{"status":"ok",...}` → **API is up**
- [ ] `https://<api>/api/docs` returns Swagger UI → **Swagger mounted**
- [ ] `https://<api>/api/docs.json` loads → **Spec generated**
- [ ] Web URL loads landing page → **Frontend served**
- [ ] `/login` with demo creds → redirects to dashboard → **Auth + cross-site cookies working** (would fail if `NODE_ENV=production` were missing on the API)
- [ ] Hard reload dashboard → still logged in → **Cookies persisted**
- [ ] Open dashboard in two tabs, edit a goal in tab A → tab B updates without reload → **Socket.io working**
- [ ] Upload an avatar in profile → image renders from `res.cloudinary.com` → **Cloudinary creds correct**
- [ ] Invite a real email address from Settings → Invitations → email arrives → **Gmail end-to-end delivery working**

---

## Common pitfalls

| Symptom | Likely cause |
|---|---|
| Login redirects to dashboard, then bounces back to `/login` | `NODE_ENV` is not set to `production` on the API service (cookies stay `SameSite=Strict` and won't cross subdomains); or `CLIENT_URL` mismatch (CORS strips the cookie). |
| 401 on every API call after login | Same as above — the cookie isn't being sent cross-site. |
| Deployment log: `📧 Email: SMTP transport FAILED (smtp.gmail.com): Invalid login` | App Password mistyped, or you used the regular Gmail password. Regenerate at <https://myaccount.google.com/apppasswords> and re-paste. |
| Invite created in DB but no email arrives | Sender address in spam folder, or `SMTP_FROM` mismatch with `SMTP_USER` (Gmail rewrites silently). Check API logs for `Email send failed: ...`. |
| `CORS policy: ... has been blocked` in browser console | `CLIENT_URL` doesn't exactly match the web origin (trailing slash, http vs https, wrong subdomain). |
| `next start` works locally but Railway shows blank page | `NEXT_PUBLIC_API_URL` was missing **at build time**. Public env vars are baked into the bundle — you must set them before the build runs, then redeploy. |
| API crash: `Can't reach database server` | `DATABASE_URL` reference variable not attached, or Postgres plugin not in same project. |
| API crash: `Cannot find module '@team-hub/shared'` | The Custom Install Command isn't `cd ../.. && npm install` — workspace symlinks weren't created. |
| Avatar upload fails silently | Cloudinary creds wrong / typo'd. Check API logs. |
| Socket.io shows "transport close" loop | `NEXT_PUBLIC_SOCKET_URL` doesn't match `CLIENT_URL` direction, or it's pointing at the web URL instead of the API. |
| Prisma migrate fails on first deploy | `DATABASE_URL` not set yet — re-deploy after the variable is wired. |

---

## Updating after deploy

- **Code changes:** push to your default branch → Railway auto-deploys.
- **Schema changes:**
  1. Locally run `npm run db:migrate --workspace=@team-hub/api` to create the migration file.
  2. Commit the migration file under `apps/api/prisma/migrations/`.
  3. Push. The API's start command runs `prisma migrate deploy` on every boot, applying any pending migrations safely.
- **Env var changes:** Railway redeploys the affected service automatically when a variable is added/changed.
- **Rotating JWT secrets:** changes will invalidate all existing sessions (users get logged out on next refresh) — this is expected and safe.

---

## Cost note

Railway's Hobby plan ($5/month) gives you $5 of usage credit. With three services (web, API, Postgres) idling, expect ~$3–5/month at low traffic. The free trial allots $5 of one-time credit; once it's spent, you'll need to upgrade to keep the project running.
