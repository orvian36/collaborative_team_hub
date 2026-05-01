# Workspaces Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Workspaces slice of the Collaborative Team Hub: workspace CRUD, member management, token-link invitations, the left-rail switcher UX, and auto-create-on-register, per the design spec at `docs/superpowers/specs/2026-04-30-workspaces-design.md`.

**Architecture:** Backend uses split routers + a controllers layer + a `requireWorkspaceMembership` middleware. Frontend keeps the active workspace in the URL (`/dashboard/[workspaceId]/...`) and uses a Discord/Slack-style left rail of workspace tiles. Token-link invitations live as their own table; admin copies the link from a toast.

**Tech Stack:** Express 4 (CommonJS), Prisma 5 + PostgreSQL, `multer` + `cloudinary` SDK for icon uploads. Next.js 16 App Router (JS, no TS), Zustand 4, Tailwind. `multer` and `cloudinary` are already in `apps/api/package.json` — no install needed.

**Note on tests:** This repo has no test runner configured (per `CLAUDE.md`). Each task therefore has a **manual verification** step instead of a TDD red/green cycle. The spec marks an automated test suite as out of scope.

---

## Reference materials the engineer should keep open

- Design spec: `docs/superpowers/specs/2026-04-30-workspaces-design.md`
- Existing patterns: `apps/api/src/routes/auth.js` (route + controller-in-one style — we're moving controllers into their own files for new code, but the conventions for status codes, error JSON shape, and `prisma.$transaction` usage carry over)
- Auth helpers: `apps/api/src/lib/jwt.js`, `apps/api/src/middleware/auth.js`, `apps/api/src/lib/prisma.js`
- Shared constants: `packages/shared/src/index.js` (must be `require`d from backend, `import`ed from frontend)
- Frontend API client: `apps/web/src/lib/api.js` (handles 401-refresh — extending it, not replacing it)

## Conventions used by this plan

- All backend imports use CommonJS `require` / `module.exports`.
- All frontend imports use ES modules.
- Database operations always go through `apps/api/src/lib/prisma.js` (the singleton). Never `new PrismaClient()`.
- Email comparisons use lowercase + trim. Helper: `normalizeEmail(s) => s.trim().toLowerCase()`.
- Errors return JSON `{ error: '<message>' }` with the appropriate status code, matching `auth.js` style. No code field — keep it simple.

---

## Task 1: Update Prisma schema and run migration

**Files:**
- Modify: `apps/api/prisma/schema.prisma`

- [ ] **Step 1: Add `iconUrl` and `createdById` to Workspace, plus the User back-relation**

In `apps/api/prisma/schema.prisma`, replace the `Workspace` block and add a relation to `User`:

```prisma
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  password     String
  name         String
  avatarUrl    String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Relations
  memberships         WorkspaceMember[]
  goals               Goal[]            @relation("GoalOwner")
  actionItems         ActionItem[]      @relation("ActionItemAssignee")
  comments            Comment[]
  reactions           Reaction[]
  activities          Activity[]
  notifications       Notification[]
  createdWorkspaces   Workspace[]       @relation("WorkspaceCreator")
  invitationsSent     Invitation[]      @relation("InvitationsSent")
  invitationsAccepted Invitation[]      @relation("InvitationsAccepted")
}
```

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

- [ ] **Step 2: Add the Invitation model**

Append to `apps/api/prisma/schema.prisma` (place it under the `WorkspaceMember` block):

```prisma
model Invitation {
  id           String   @id @default(uuid())
  email        String                          // lowercased, trimmed
  role         String   @default("MEMBER")     // ADMIN | MEMBER
  token        String   @unique                // crypto.randomBytes(32).hex
  status       String   @default("PENDING")    // PENDING | ACCEPTED | REVOKED | EXPIRED
  expiresAt    DateTime
  createdAt    DateTime @default(now())
  acceptedAt   DateTime?

  workspaceId  String
  invitedById  String
  acceptedById String?

  workspace    Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  invitedBy    User      @relation("InvitationsSent",     fields: [invitedById],   references: [id])
  acceptedBy   User?     @relation("InvitationsAccepted", fields: [acceptedById],  references: [id])

  @@index([workspaceId, status])
  @@unique([workspaceId, email, status])
}
```

- [ ] **Step 3: Run the migration**

```bash
npm run db:migrate --workspace=@team-hub/api -- --name add_workspace_icon_and_invitations
```

Expected: A new directory under `apps/api/prisma/migrations/` is created with the SQL, the database schema is updated, and `prisma generate` runs automatically. If the DATABASE_URL points at a remote DB you don't want to mutate, switch to a local Postgres first.

- [ ] **Step 4: Verify Prisma client picks up the new types**

```bash
npm run db:generate --workspace=@team-hub/api
```

Expected: `✔ Generated Prisma Client`. No errors.

- [ ] **Step 5: Commit**

```bash
git add apps/api/prisma/schema.prisma apps/api/prisma/migrations
git commit -m "feat(db): add Workspace.iconUrl, createdById, and Invitation model"
```

---

## Task 2: Update shared constants

**Files:**
- Modify: `packages/shared/src/index.js`

- [ ] **Step 1: Add invitation constants, accent palette, and new socket events**

Replace `packages/shared/src/index.js` with:

```js
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
```

- [ ] **Step 2: Verify both apps still resolve `@team-hub/shared`**

```bash
node -e "console.log(require('@team-hub/shared').INVITATION_STATUS)"
```
from `apps/api/`. Expected output: `{ PENDING: 'PENDING', ACCEPTED: 'ACCEPTED', REVOKED: 'REVOKED', EXPIRED: 'EXPIRED' }`.

- [ ] **Step 3: Commit**

```bash
git add packages/shared/src/index.js
git commit -m "feat(shared): add INVITATION_STATUS, accent palette, member socket events"
```

---

## Task 3: Add `requireWorkspaceMembership` middleware and remove the `authorize` stub

**Files:**
- Create: `apps/api/src/middleware/workspace.js`
- Modify: `apps/api/src/middleware/auth.js`

- [ ] **Step 1: Create the workspace membership middleware**

Create `apps/api/src/middleware/workspace.js`:

```js
const prisma = require('../lib/prisma');
const { ROLES } = require('@team-hub/shared');

/**
 * Verifies the authenticated user is a member of the workspace identified
 * by `req.params.workspaceId` (or `req.params.id` for top-level workspace
 * routes), optionally with a required role. On success, attaches `req.member`
 * (the WorkspaceMember row including `role`).
 *
 * Returns 404 (not 403) for non-members so we don't leak workspace existence.
 *
 * @param {string} [requiredRole] - if provided, e.g. ROLES.ADMIN, the caller
 *   must have that role. Otherwise any membership is sufficient.
 */
const requireWorkspaceMembership = (requiredRole) => async (req, res, next) => {
  const workspaceId = req.params.workspaceId || req.params.id;
  if (!workspaceId) {
    return res.status(400).json({ error: 'Workspace ID is required' });
  }

  try {
    const member = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: req.user.id, workspaceId } },
    });

    if (!member) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    if (requiredRole && member.role !== requiredRole) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.member = member;
    next();
  } catch (error) {
    console.error('requireWorkspaceMembership error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { requireWorkspaceMembership };
```

- [ ] **Step 2: Remove the misleading `authorize` stub**

Replace `apps/api/src/middleware/auth.js` with:

```js
const { verifyAccessToken } = require('../lib/jwt');

const authenticate = (req, res, next) => {
  const { accessToken } = req.cookies;

  if (!accessToken) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = verifyAccessToken(accessToken);
    req.user = { id: decoded.userId };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = { authenticate };
```

- [ ] **Step 3: Verify nothing else references `authorize`**

```bash
grep -rn "authorize" apps/api/src/ || true
```

Expected: no matches. If anything references it, fix the caller before continuing.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/middleware/
git commit -m "feat(api): add requireWorkspaceMembership middleware; remove stub authorize"
```

---

## Task 4: Cloudinary helper

**Files:**
- Create: `apps/api/src/lib/cloudinary.js`

- [ ] **Step 1: Implement the helper**

Create `apps/api/src/lib/cloudinary.js`:

```js
// Cloudinary helper: upload buffer + destroy by public id.
// Uses environment variables CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET
// already documented in apps/api/.env.example.

const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Uploads a buffer to Cloudinary. Returns the secure URL.
 *
 * @param {Buffer} buffer
 * @param {object} opts
 * @param {string} opts.folder  e.g. 'team-hub/workspaces'
 * @param {string} opts.publicId  workspace UUID (for stable replacement)
 * @returns {Promise<string>} secure URL
 */
const uploadBuffer = (buffer, { folder, publicId }) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        overwrite: true,
        resource_type: 'image',
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });

/**
 * Best-effort destroy by public id. Logs on error and resolves anyway —
 * orphaned images are cleanup, not correctness.
 */
const destroyByPublicId = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
  } catch (err) {
    console.warn('cloudinary destroy failed for', publicId, err.message);
  }
};

module.exports = { uploadBuffer, destroyByPublicId };
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/lib/cloudinary.js
git commit -m "feat(api): add Cloudinary upload/destroy helper"
```

---

## Task 5: Workspaces controller (CRUD + icon upload)

**Files:**
- Create: `apps/api/src/controllers/workspaces.js`

- [ ] **Step 1: Implement the controller**

Create `apps/api/src/controllers/workspaces.js`:

```js
const crypto = require('crypto');
const prisma = require('../lib/prisma');
const { ROLES } = require('@team-hub/shared');
const { uploadBuffer, destroyByPublicId } = require('../lib/cloudinary');

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

const validateWorkspaceInput = ({ name, description, accentColor, iconUrl }, { partial = false } = {}) => {
  if (!partial || name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) return 'Workspace name is required';
    if (name.length > 100) return 'Workspace name must be 100 characters or fewer';
  }
  if (description !== undefined && description !== null && typeof description !== 'string') {
    return 'Description must be a string';
  }
  if (accentColor !== undefined && !HEX_COLOR.test(accentColor)) {
    return 'accentColor must be a 6-digit hex like #3b82f6';
  }
  if (iconUrl !== undefined && iconUrl !== null && typeof iconUrl !== 'string') {
    return 'iconUrl must be a string';
  }
  return null;
};

/**
 * Reusable workspace + admin-membership creation. Accepts a Prisma transaction
 * client so it can be called from inside the auth register handler's existing
 * transaction. Returns the new workspace.
 */
const createWorkspaceTx = async (tx, userId, data) => {
  const workspace = await tx.workspace.create({
    data: {
      name: data.name.trim(),
      description: data.description ?? null,
      accentColor: data.accentColor || '#3b82f6',
      iconUrl: data.iconUrl ?? null,
      createdById: userId,
    },
  });
  await tx.workspaceMember.create({
    data: {
      userId,
      workspaceId: workspace.id,
      role: ROLES.ADMIN,
    },
  });
  return workspace;
};

/**
 * @openapi
 * /api/workspaces:
 *   post:
 *     tags: [Workspaces]
 *     summary: Create a new workspace
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WorkspaceInput'
 *     responses:
 *       201: { description: Workspace created }
 */
const createWorkspace = async (req, res) => {
  const error = validateWorkspaceInput(req.body);
  if (error) return res.status(400).json({ error });

  try {
    const workspace = await prisma.$transaction((tx) =>
      createWorkspaceTx(tx, req.user.id, req.body)
    );
    res.status(201).json({ workspace: { ...workspace, myRole: ROLES.ADMIN, memberCount: 1 } });
  } catch (err) {
    console.error('createWorkspace error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * @openapi
 * /api/workspaces:
 *   get:
 *     tags: [Workspaces]
 *     summary: List workspaces for the current user
 *     responses:
 *       200:
 *         description: List of workspaces with myRole and memberCount
 */
const listWorkspaces = async (req, res) => {
  try {
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId: req.user.id },
      include: {
        workspace: {
          include: { _count: { select: { members: true } } },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    const workspaces = memberships.map((m) => ({
      id: m.workspace.id,
      name: m.workspace.name,
      description: m.workspace.description,
      accentColor: m.workspace.accentColor,
      iconUrl: m.workspace.iconUrl,
      createdAt: m.workspace.createdAt,
      updatedAt: m.workspace.updatedAt,
      createdById: m.workspace.createdById,
      myRole: m.role,
      memberCount: m.workspace._count.members,
    }));

    res.status(200).json({ workspaces });
  } catch (err) {
    console.error('listWorkspaces error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * @openapi
 * /api/workspaces/{id}:
 *   get:
 *     tags: [Workspaces]
 *     summary: Get a workspace by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Workspace details }
 */
const getWorkspace = async (req, res) => {
  try {
    const workspace = await prisma.workspace.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { members: true } } },
    });
    if (!workspace) return res.status(404).json({ error: 'Workspace not found' });

    res.status(200).json({
      workspace: {
        id: workspace.id,
        name: workspace.name,
        description: workspace.description,
        accentColor: workspace.accentColor,
        iconUrl: workspace.iconUrl,
        createdAt: workspace.createdAt,
        updatedAt: workspace.updatedAt,
        createdById: workspace.createdById,
        memberCount: workspace._count.members,
      },
      myRole: req.member.role,
    });
  } catch (err) {
    console.error('getWorkspace error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * @openapi
 * /api/workspaces/{id}:
 *   patch:
 *     tags: [Workspaces]
 *     summary: Update a workspace (admin only)
 */
const updateWorkspace = async (req, res) => {
  const error = validateWorkspaceInput(req.body, { partial: true });
  if (error) return res.status(400).json({ error });

  const data = {};
  for (const key of ['name', 'description', 'accentColor', 'iconUrl']) {
    if (req.body[key] !== undefined) data[key] = req.body[key];
  }
  if (data.name) data.name = data.name.trim();

  try {
    const workspace = await prisma.workspace.update({
      where: { id: req.params.id },
      data,
    });
    res.status(200).json({ workspace });
  } catch (err) {
    console.error('updateWorkspace error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * @openapi
 * /api/workspaces/{id}:
 *   delete:
 *     tags: [Workspaces]
 *     summary: Delete a workspace (admin only)
 */
const deleteWorkspace = async (req, res) => {
  try {
    const workspace = await prisma.workspace.findUnique({ where: { id: req.params.id } });
    if (!workspace) return res.status(404).json({ error: 'Workspace not found' });

    await prisma.workspace.delete({ where: { id: req.params.id } });
    // Best-effort Cloudinary cleanup
    if (workspace.iconUrl) {
      destroyByPublicId(`team-hub/workspaces/${req.params.id}`);
    }
    res.status(204).end();
  } catch (err) {
    console.error('deleteWorkspace error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * @openapi
 * /api/workspaces/{id}/icon:
 *   post:
 *     tags: [Workspaces]
 *     summary: Upload a workspace icon (admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               icon: { type: string, format: binary }
 *     responses:
 *       200: { description: Icon uploaded }
 */
const uploadIcon = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Icon file is required' });

  try {
    const url = await uploadBuffer(req.file.buffer, {
      folder: 'team-hub/workspaces',
      publicId: req.params.id,
    });
    await prisma.workspace.update({
      where: { id: req.params.id },
      data: { iconUrl: url },
    });
    res.status(200).json({ iconUrl: url });
  } catch (err) {
    console.error('uploadIcon error:', err);
    res.status(500).json({ error: 'Failed to upload icon' });
  }
};

module.exports = {
  createWorkspace,
  listWorkspaces,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
  uploadIcon,
  createWorkspaceTx,
};
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/controllers/workspaces.js
git commit -m "feat(api): workspaces controller with CRUD, icon upload, reusable createWorkspaceTx"
```

---

## Task 6: Workspaces router (with members + invitations sub-mounts)

**Files:**
- Modify: `apps/api/src/routes/workspaces.js` (replace stub)

- [ ] **Step 1: Replace the stub with the real router**

Overwrite `apps/api/src/routes/workspaces.js`:

```js
const express = require('express');
const multer = require('multer');
const { authenticate } = require('../middleware/auth');
const { requireWorkspaceMembership } = require('../middleware/workspace');
const { ROLES } = require('@team-hub/shared');
const c = require('../controllers/workspaces');

const router = express.Router();

// All workspace routes require authentication.
router.use(authenticate);

// Multer config for icon upload: in-memory, 2 MB cap, image mime allowlist.
const ALLOWED_IMAGE_MIMES = ['image/png', 'image/jpeg', 'image/webp'];
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_IMAGE_MIMES.includes(file.mimetype)) {
      return cb(new Error('Only PNG, JPEG, or WebP images are allowed'));
    }
    cb(null, true);
  },
});

// Top-level workspace routes
router.post('/', c.createWorkspace);
router.get('/', c.listWorkspaces);
router.get('/:id', requireWorkspaceMembership(), c.getWorkspace);
router.patch('/:id', requireWorkspaceMembership(ROLES.ADMIN), c.updateWorkspace);
router.delete('/:id', requireWorkspaceMembership(ROLES.ADMIN), c.deleteWorkspace);

router.post(
  '/:id/icon',
  requireWorkspaceMembership(ROLES.ADMIN),
  (req, res, next) => upload.single('icon')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  }),
  c.uploadIcon
);

// Sub-routers (defined in later tasks). Both need mergeParams to see :workspaceId.
router.use('/:workspaceId/members', require('./members'));
router.use('/:workspaceId/invitations', require('./invitations.workspace'));

module.exports = router;
```

- [ ] **Step 2: Manual verification (skip until later tasks land if you want — see Task 13 for full smoke)**

Even before members/invitations routers exist, the workspace endpoints can be smoke-tested. Start the dev server and run from a second terminal:

```bash
# Register a user (cookies stored in /tmp/cj.txt)
curl -i -c /tmp/cj.txt -H 'Content-Type: application/json' \
  -d '{"name":"Alice","email":"alice@x.com","password":"secret123"}' \
  http://localhost:5000/api/auth/register

# List workspaces (should be empty until Task 7 adds auto-create on register)
curl -b /tmp/cj.txt http://localhost:5000/api/workspaces

# Create one
curl -i -b /tmp/cj.txt -H 'Content-Type: application/json' \
  -d '{"name":"Engineering","accentColor":"#10b981"}' \
  http://localhost:5000/api/workspaces
```

Expected: `201` with the new workspace, `myRole: "ADMIN"`, `memberCount: 1`.

The members and invitations sub-mounts will throw `Cannot find module` until Tasks 9 and 10 land — that's expected. Skip the sub-mount lines temporarily by commenting them out if you want to test the parent router in isolation, then re-enable.

- [ ] **Step 3: Commit (after sub-routers exist)**

Hold this commit until Task 10 lands so the file references resolve. If you want to commit incrementally now, comment out the two `router.use` lines and commit, then re-enable them in a follow-up commit.

---

## Task 7: Auto-create default workspace on registration

**Files:**
- Modify: `apps/api/src/routes/auth.js` (the `/register` handler only)

- [ ] **Step 1: Update `/register` to also create a default workspace**

In `apps/api/src/routes/auth.js`, replace the body of the `router.post('/register', ...)` handler (the one starting at the file top after `const router = express.Router();`):

```js
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user, refresh token, default workspace, and admin membership
    // atomically. createWorkspaceTx is reused from the workspaces controller.
    const { createWorkspaceTx } = require('../controllers/workspaces');

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: { name: name.trim(), email: normalizedEmail, password: hashedPassword },
      });

      const accessToken = generateAccessToken(created.id);
      const refreshToken = generateRefreshToken(created.id);

      await tx.refreshToken.create({
        data: {
          token: refreshToken,
          userId: created.id,
          expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
        },
      });

      await createWorkspaceTx(tx, created.id, {
        name: `${created.name}'s Workspace`,
      });

      // Stash tokens on the closure for the outer scope
      created.__tokens = { accessToken, refreshToken };
      return created;
    });

    setAuthCookies(res, user.__tokens.accessToken, user.__tokens.refreshToken);

    const { password: _, __tokens: __, ...userWithoutPassword } = user;
    res.status(201).json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

The `__tokens` stash is intentional — `prisma.$transaction(async)` returns the callback's return value, but we also need the tokens at the outer scope to set cookies. Keeping them on the user object is the simplest way to thread them out.

- [ ] **Step 2: Manual verification**

Restart the dev server (`npm run dev`), then:

```bash
rm -f /tmp/cj.txt
curl -i -c /tmp/cj.txt -H 'Content-Type: application/json' \
  -d '{"name":"Bob","email":"bob@x.com","password":"secret123"}' \
  http://localhost:5000/api/auth/register

curl -b /tmp/cj.txt http://localhost:5000/api/workspaces
```

Expected second call returns `{ "workspaces": [{ "name": "Bob's Workspace", ..., "myRole": "ADMIN", "memberCount": 1 }] }`.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/routes/auth.js
git commit -m "feat(api): auto-create default workspace on registration"
```

---

## Task 8: Members controller and router

**Files:**
- Create: `apps/api/src/controllers/members.js`
- Create: `apps/api/src/routes/members.js`

- [ ] **Step 1: Implement the controller**

Create `apps/api/src/controllers/members.js`:

```js
const prisma = require('../lib/prisma');
const { ROLES } = require('@team-hub/shared');

/**
 * Throws a 409 if removing/demoting `leavingMemberId` would leave zero admins.
 * Must be run inside the same transaction as the mutation.
 */
const assertNotLastAdmin = async (tx, workspaceId, leavingMemberId) => {
  const remaining = await tx.workspaceMember.count({
    where: { workspaceId, role: ROLES.ADMIN, id: { not: leavingMemberId } },
  });
  if (remaining === 0) {
    const err = new Error('Promote another member to admin first');
    err.status = 409;
    throw err;
  }
};

/**
 * @openapi
 * /api/workspaces/{workspaceId}/members:
 *   get:
 *     tags: [Workspaces]
 *     summary: List members of a workspace
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema: { type: string, format: uuid }
 */
const listMembers = async (req, res) => {
  try {
    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId: req.params.workspaceId },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
      orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
    });

    const out = members.map((m) => ({
      id: m.id,
      userId: m.user.id,
      name: m.user.name,
      email: m.user.email,
      avatarUrl: m.user.avatarUrl,
      role: m.role,
      joinedAt: m.joinedAt,
    }));
    res.status(200).json({ members: out });
  } catch (err) {
    console.error('listMembers error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * @openapi
 * /api/workspaces/{workspaceId}/members/{memberId}:
 *   patch:
 *     tags: [Workspaces]
 *     summary: Change a member's role (admin only)
 */
const updateMemberRole = async (req, res) => {
  const { role } = req.body;
  if (![ROLES.ADMIN, ROLES.MEMBER].includes(role)) {
    return res.status(400).json({ error: 'Role must be ADMIN or MEMBER' });
  }

  try {
    const target = await prisma.workspaceMember.findUnique({
      where: { id: req.params.memberId },
    });
    if (!target || target.workspaceId !== req.params.workspaceId) {
      return res.status(404).json({ error: 'Member not found' });
    }

    if (target.role === role) {
      return res.status(200).json({ member: target });
    }

    const member = await prisma.$transaction(async (tx) => {
      // Demoting an admin → enforce last-admin guard
      if (target.role === ROLES.ADMIN && role === ROLES.MEMBER) {
        await assertNotLastAdmin(tx, target.workspaceId, target.id);
      }
      return tx.workspaceMember.update({
        where: { id: target.id },
        data: { role },
      });
    });

    res.status(200).json({ member });
  } catch (err) {
    if (err.status === 409) return res.status(409).json({ error: err.message });
    console.error('updateMemberRole error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * @openapi
 * /api/workspaces/{workspaceId}/members/{memberId}:
 *   delete:
 *     tags: [Workspaces]
 *     summary: Remove a member (admin or self)
 */
const removeMember = async (req, res) => {
  try {
    const target = await prisma.workspaceMember.findUnique({
      where: { id: req.params.memberId },
    });
    if (!target || target.workspaceId !== req.params.workspaceId) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const isSelf = target.userId === req.user.id;
    const callerIsAdmin = req.member.role === ROLES.ADMIN;
    if (!isSelf && !callerIsAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    await prisma.$transaction(async (tx) => {
      if (target.role === ROLES.ADMIN) {
        await assertNotLastAdmin(tx, target.workspaceId, target.id);
      }
      await tx.workspaceMember.delete({ where: { id: target.id } });
    });

    res.status(204).end();
  } catch (err) {
    if (err.status === 409) return res.status(409).json({ error: err.message });
    console.error('removeMember error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * @openapi
 * /api/workspaces/{workspaceId}/members/leave:
 *   post:
 *     tags: [Workspaces]
 *     summary: Leave the workspace (self)
 */
const leaveWorkspace = async (req, res) => {
  try {
    await prisma.$transaction(async (tx) => {
      if (req.member.role === ROLES.ADMIN) {
        await assertNotLastAdmin(tx, req.member.workspaceId, req.member.id);
      }
      await tx.workspaceMember.delete({ where: { id: req.member.id } });
    });
    res.status(204).end();
  } catch (err) {
    if (err.status === 409) return res.status(409).json({ error: err.message });
    console.error('leaveWorkspace error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { listMembers, updateMemberRole, removeMember, leaveWorkspace, assertNotLastAdmin };
```

- [ ] **Step 2: Implement the router**

Create `apps/api/src/routes/members.js`:

```js
const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireWorkspaceMembership } = require('../middleware/workspace');
const { ROLES } = require('@team-hub/shared');
const c = require('../controllers/members');

// mergeParams so :workspaceId is visible from the parent workspaces router.
const router = express.Router({ mergeParams: true });

router.use(authenticate);
router.use(requireWorkspaceMembership());

router.get('/', c.listMembers);
router.post('/leave', c.leaveWorkspace);

// Admin-only role + remove. We don't use requireWorkspaceMembership(ADMIN) for
// remove because members are allowed to remove themselves; the controller does
// the per-call self-vs-admin check.
router.patch('/:memberId', requireAdmin, c.updateMemberRole);
router.delete('/:memberId', c.removeMember);

function requireAdmin(req, res, next) {
  if (req.member.role !== ROLES.ADMIN) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

module.exports = router;
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/controllers/members.js apps/api/src/routes/members.js
git commit -m "feat(api): members controller and router with last-admin guard"
```

---

## Task 9: Invitations controller

**Files:**
- Create: `apps/api/src/controllers/invitations.js`

- [ ] **Step 1: Implement the controller**

Create `apps/api/src/controllers/invitations.js`:

```js
const crypto = require('crypto');
const prisma = require('../lib/prisma');
const { ROLES, INVITATION_STATUS, INVITATION_TTL_DAYS } = require('@team-hub/shared');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const normalizeEmail = (s) => String(s).trim().toLowerCase();
const ttlFromNow = () => new Date(Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000);
const inviteUrlFor = (token) => {
  const base = process.env.CLIENT_URL || 'http://localhost:3000';
  return `${base.replace(/\/$/, '')}/invite/${token}`;
};

/**
 * Helper: if invitation is PENDING but past expiresAt, flip status to EXPIRED
 * and return the updated row. Pure SQL update; safe to call inside or outside
 * a transaction.
 */
const expireIfNeeded = async (tx, invitation) => {
  if (invitation.status === INVITATION_STATUS.PENDING && invitation.expiresAt < new Date()) {
    return tx.invitation.update({
      where: { id: invitation.id },
      data: { status: INVITATION_STATUS.EXPIRED },
    });
  }
  return invitation;
};

/**
 * @openapi
 * /api/workspaces/{workspaceId}/invitations:
 *   post:
 *     tags: [Workspaces]
 *     summary: Create an invitation (admin only)
 */
const createInvitation = async (req, res) => {
  const email = req.body.email && normalizeEmail(req.body.email);
  const role = req.body.role || ROLES.MEMBER;

  if (!email || !EMAIL_RE.test(email)) return res.status(400).json({ error: 'Valid email is required' });
  if (![ROLES.ADMIN, ROLES.MEMBER].includes(role)) return res.status(400).json({ error: 'Role must be ADMIN or MEMBER' });

  try {
    const workspaceId = req.params.workspaceId;

    // Fast path: is there already a user with that email who's a member?
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const existingMember = await prisma.workspaceMember.findUnique({
        where: { userId_workspaceId: { userId: existingUser.id, workspaceId } },
      });
      if (existingMember) {
        return res.status(409).json({ error: 'User is already a member of this workspace' });
      }
    }

    // Reject if a PENDING invite already exists for this email + workspace.
    const existingPending = await prisma.invitation.findFirst({
      where: { workspaceId, email, status: INVITATION_STATUS.PENDING },
    });
    if (existingPending) {
      return res.status(409).json({ error: 'A pending invitation already exists for this email' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const invitation = await prisma.invitation.create({
      data: {
        email,
        role,
        token,
        status: INVITATION_STATUS.PENDING,
        expiresAt: ttlFromNow(),
        workspaceId,
        invitedById: req.user.id,
      },
    });

    res.status(201).json({ invitation, inviteUrl: inviteUrlFor(token) });
  } catch (err) {
    console.error('createInvitation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * @openapi
 * /api/workspaces/{workspaceId}/invitations:
 *   get:
 *     tags: [Workspaces]
 *     summary: List invitations (admin only)
 */
const listInvitations = async (req, res) => {
  try {
    const rows = await prisma.invitation.findMany({
      where: { workspaceId: req.params.workspaceId },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      include: {
        invitedBy:  { select: { id: true, name: true, email: true } },
        acceptedBy: { select: { id: true, name: true, email: true } },
      },
    });
    // Lazy-expire any stale rows so the UI stays consistent
    const expiredIds = rows
      .filter((r) => r.status === INVITATION_STATUS.PENDING && r.expiresAt < new Date())
      .map((r) => r.id);
    if (expiredIds.length) {
      await prisma.invitation.updateMany({
        where: { id: { in: expiredIds } },
        data: { status: INVITATION_STATUS.EXPIRED },
      });
      for (const r of rows) {
        if (expiredIds.includes(r.id)) r.status = INVITATION_STATUS.EXPIRED;
      }
    }
    res.status(200).json({ invitations: rows });
  } catch (err) {
    console.error('listInvitations error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * @openapi
 * /api/workspaces/{workspaceId}/invitations/{invitationId}:
 *   delete:
 *     tags: [Workspaces]
 *     summary: Revoke an invitation (admin only)
 */
const revokeInvitation = async (req, res) => {
  try {
    const inv = await prisma.invitation.findUnique({ where: { id: req.params.invitationId } });
    if (!inv || inv.workspaceId !== req.params.workspaceId) {
      return res.status(404).json({ error: 'Invitation not found' });
    }
    if (inv.status !== INVITATION_STATUS.PENDING) {
      return res.status(409).json({ error: 'Only pending invitations can be revoked' });
    }
    await prisma.invitation.update({
      where: { id: inv.id },
      data: { status: INVITATION_STATUS.REVOKED },
    });
    res.status(204).end();
  } catch (err) {
    console.error('revokeInvitation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * @openapi
 * /api/workspaces/{workspaceId}/invitations/{invitationId}/resend:
 *   post:
 *     tags: [Workspaces]
 *     summary: Re-extend a pending invitation (admin only)
 */
const resendInvitation = async (req, res) => {
  try {
    const inv = await prisma.invitation.findUnique({ where: { id: req.params.invitationId } });
    if (!inv || inv.workspaceId !== req.params.workspaceId) {
      return res.status(404).json({ error: 'Invitation not found' });
    }
    if (inv.status !== INVITATION_STATUS.PENDING && inv.status !== INVITATION_STATUS.EXPIRED) {
      return res.status(409).json({ error: 'Only pending or expired invitations can be resent' });
    }
    const updated = await prisma.invitation.update({
      where: { id: inv.id },
      data: { status: INVITATION_STATUS.PENDING, expiresAt: ttlFromNow() },
    });
    res.status(200).json({ invitation: updated, inviteUrl: inviteUrlFor(updated.token) });
  } catch (err) {
    console.error('resendInvitation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * @openapi
 * /api/invitations/{token}:
 *   get:
 *     tags: [Workspaces]
 *     summary: Look up invitation by token (public preview)
 *     security: []
 */
const getInvitationByToken = async (req, res) => {
  try {
    const inv = await prisma.invitation.findUnique({
      where: { token: req.params.token },
      include: {
        workspace: { select: { id: true, name: true, iconUrl: true, accentColor: true } },
      },
    });
    if (!inv) return res.status(404).json({ error: 'Invitation not found or no longer valid' });

    const refreshed = await expireIfNeeded(prisma, inv);

    res.status(200).json({
      workspace: inv.workspace,
      invitation: {
        id: refreshed.id,
        email: refreshed.email,
        role: refreshed.role,
        status: refreshed.status,
        expiresAt: refreshed.expiresAt,
      },
      requiresAuth: true,
    });
  } catch (err) {
    console.error('getInvitationByToken error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * @openapi
 * /api/invitations/{token}/accept:
 *   post:
 *     tags: [Workspaces]
 *     summary: Accept an invitation (must be logged in with the matching email)
 */
const acceptInvitation = async (req, res) => {
  try {
    // Re-load user (we only have id from authenticate middleware) to compare email
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(401).json({ error: 'Authentication required' });

    const result = await prisma.$transaction(async (tx) => {
      const inv = await tx.invitation.findUnique({
        where: { token: req.params.token },
      });
      if (!inv) return { status: 404, error: 'Invitation not found or no longer valid' };

      // Lazy expire
      const refreshed = await expireIfNeeded(tx, inv);

      if (refreshed.status !== INVITATION_STATUS.PENDING) {
        return { status: 410, error: `Invitation is ${refreshed.status.toLowerCase()}` };
      }
      if (refreshed.email !== normalizeEmail(user.email)) {
        return { status: 403, error: 'This invitation was sent to a different email address' };
      }

      // If already a member, mark accepted and short-circuit
      const existing = await tx.workspaceMember.findUnique({
        where: { userId_workspaceId: { userId: user.id, workspaceId: refreshed.workspaceId } },
      });
      if (existing) {
        await tx.invitation.update({
          where: { id: refreshed.id },
          data: {
            status: INVITATION_STATUS.ACCEPTED,
            acceptedAt: new Date(),
            acceptedById: user.id,
          },
        });
        return { status: 409, error: 'You are already a member of this workspace', workspaceId: refreshed.workspaceId };
      }

      await tx.workspaceMember.create({
        data: { userId: user.id, workspaceId: refreshed.workspaceId, role: refreshed.role },
      });
      const accepted = await tx.invitation.update({
        where: { id: refreshed.id },
        data: {
          status: INVITATION_STATUS.ACCEPTED,
          acceptedAt: new Date(),
          acceptedById: user.id,
        },
      });
      return { status: 200, workspaceId: accepted.workspaceId };
    });

    if (result.status === 200) {
      const workspace = await prisma.workspace.findUnique({ where: { id: result.workspaceId } });
      return res.status(200).json({ workspace });
    }
    return res.status(result.status).json({ error: result.error, workspaceId: result.workspaceId });
  } catch (err) {
    console.error('acceptInvitation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createInvitation,
  listInvitations,
  revokeInvitation,
  resendInvitation,
  getInvitationByToken,
  acceptInvitation,
};
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/controllers/invitations.js
git commit -m "feat(api): invitations controller with token-link flow and lazy expiry"
```

---

## Task 10: Invitation routers (workspace-scoped + public-by-token)

**Files:**
- Create: `apps/api/src/routes/invitations.workspace.js` (mounted under workspaces; admin-only)
- Create: `apps/api/src/routes/invitations.js` (top-level public-by-token)
- Modify: `apps/api/src/index.js` (mount the public router)

- [ ] **Step 1: Workspace-scoped invitations router**

Create `apps/api/src/routes/invitations.workspace.js`:

```js
const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireWorkspaceMembership } = require('../middleware/workspace');
const { ROLES } = require('@team-hub/shared');
const c = require('../controllers/invitations');

const router = express.Router({ mergeParams: true });

router.use(authenticate);
router.use(requireWorkspaceMembership(ROLES.ADMIN));

router.post('/', c.createInvitation);
router.get('/', c.listInvitations);
router.delete('/:invitationId', c.revokeInvitation);
router.post('/:invitationId/resend', c.resendInvitation);

module.exports = router;
```

- [ ] **Step 2: Public-by-token invitations router**

Create `apps/api/src/routes/invitations.js`:

```js
const express = require('express');
const { authenticate } = require('../middleware/auth');
const c = require('../controllers/invitations');

const router = express.Router();

// Token preview is public — no auth required so the invite landing page
// can show workspace details before login.
router.get('/:token', c.getInvitationByToken);

// Accept requires a logged-in user.
router.post('/:token/accept', authenticate, c.acceptInvitation);

module.exports = router;
```

- [ ] **Step 3: Mount the public router in `index.js`**

In `apps/api/src/index.js`, add this line in the route-mount block (alongside the existing mounts):

```js
app.use('/api/invitations', require('./routes/invitations'));
```

The full mount block should now read:

```js
app.use('/api/auth', require('./routes/auth'));
app.use('/api/workspaces', require('./routes/workspaces'));
app.use('/api/invitations', require('./routes/invitations'));
app.use('/api/goals', require('./routes/goals'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/actionItems', require('./routes/actionItems'));
```

- [ ] **Step 4: Manual smoke**

Restart the dev server. Repeat the flow:

```bash
rm -f /tmp/cj.txt
curl -s -c /tmp/cj.txt -H 'Content-Type: application/json' \
  -d '{"name":"Alice","email":"alice@x.com","password":"secret123"}' \
  http://localhost:5000/api/auth/register

# Get the workspace id from the auto-created workspace
WS_ID=$(curl -s -b /tmp/cj.txt http://localhost:5000/api/workspaces | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).workspaces[0].id))")
echo "WS_ID=$WS_ID"

# Invite Bob
curl -s -b /tmp/cj.txt -H 'Content-Type: application/json' \
  -d '{"email":"bob@x.com","role":"MEMBER"}' \
  "http://localhost:5000/api/workspaces/$WS_ID/invitations"
```

Expected: `201` with `invitation` object and an `inviteUrl` like `http://localhost:3000/invite/<token>`.

Then look up by token without auth:
```bash
TOKEN=$(curl -s -b /tmp/cj.txt "http://localhost:5000/api/workspaces/$WS_ID/invitations" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).invitations[0].token))")
curl -s "http://localhost:5000/api/invitations/$TOKEN"
```

Expected: workspace preview JSON.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/routes/invitations.workspace.js apps/api/src/routes/invitations.js apps/api/src/index.js apps/api/src/routes/workspaces.js
git commit -m "feat(api): invitation routers and workspaces sub-mounts"
```

---

## Task 11: Swagger schema additions

**Files:**
- Modify: `apps/api/src/config/swagger.js`

- [ ] **Step 1: Widen the JSDoc glob and add new schemas**

In `apps/api/src/config/swagger.js`, update the bottom of the `options` object so the `apis` glob picks up controllers:

```js
  apis: ['./src/routes/*.js', './src/controllers/*.js', './src/index.js'],
```

In the same file, add three new schemas to `components.schemas` (insert near the existing Workspace schemas):

```js
        Member: {
          type: 'object',
          properties: {
            id:        { type: 'string', format: 'uuid' },
            userId:    { type: 'string', format: 'uuid' },
            name:      { type: 'string' },
            email:     { type: 'string', format: 'email' },
            avatarUrl: { type: 'string', nullable: true },
            role:      { type: 'string', enum: ['ADMIN', 'MEMBER'] },
            joinedAt:  { type: 'string', format: 'date-time' },
          },
        },
        Invitation: {
          type: 'object',
          properties: {
            id:           { type: 'string', format: 'uuid' },
            email:        { type: 'string', format: 'email' },
            role:         { type: 'string', enum: ['ADMIN', 'MEMBER'] },
            status:       { type: 'string', enum: ['PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED'] },
            expiresAt:    { type: 'string', format: 'date-time' },
            createdAt:    { type: 'string', format: 'date-time' },
            workspaceId:  { type: 'string', format: 'uuid' },
            invitedById:  { type: 'string', format: 'uuid' },
            acceptedAt:   { type: 'string', format: 'date-time', nullable: true },
            acceptedById: { type: 'string', format: 'uuid', nullable: true },
          },
        },
        RoleUpdateInput: {
          type: 'object',
          required: ['role'],
          properties: {
            role: { type: 'string', enum: ['ADMIN', 'MEMBER'] },
          },
        },
```

Also extend the existing `Workspace` schema to include the new fields:

```js
        Workspace: {
          type: 'object',
          properties: {
            id:          { type: 'string', format: 'uuid' },
            name:        { type: 'string' },
            description: { type: 'string', nullable: true },
            accentColor: { type: 'string' },
            iconUrl:     { type: 'string', nullable: true },
            createdById: { type: 'string', format: 'uuid' },
            createdAt:   { type: 'string', format: 'date-time' },
            myRole:      { type: 'string', enum: ['ADMIN', 'MEMBER'] },
            memberCount: { type: 'integer' },
          },
        },
```

- [ ] **Step 2: Manual verification**

Open `http://localhost:5000/api/docs` after restarting the server. The `Workspaces` tag should now show all the new endpoints (members, invitations) with the new schemas.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/config/swagger.js
git commit -m "docs(api): add Member/Invitation Swagger schemas; include controllers in glob"
```

---

## Task 12: Frontend `api.upload` helper

**Files:**
- Modify: `apps/web/src/lib/api.js`

- [ ] **Step 1: Add `upload` to the exported `api` object**

Read the existing `apps/web/src/lib/api.js`. Add a new method that posts `FormData` (no `Content-Type` header so the browser fills in the boundary). Insert it inside the `customFetch` block — easiest is to refactor `customFetch` to take an `isFormData` flag.

Replace `apps/web/src/lib/api.js` entirely with:

```js
// API client helper for making requests to the backend

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (cb) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (err) => {
  refreshSubscribers.forEach((cb) => cb(err));
  refreshSubscribers = [];
};

const customFetch = async (url, options = {}, { isFormData = false } = {}) => {
  const headers = isFormData
    ? { ...options.headers } // browser sets multipart boundary
    : { 'Content-Type': 'application/json', ...options.headers };

  const finalOptions = {
    ...options,
    credentials: 'include',
    headers,
  };

  let response = await fetch(`${API_URL}${url}`, finalOptions);

  if (response.status === 401 && !url.includes('/api/auth/refresh') && !url.includes('/api/auth/login')) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshResponse = await fetch(`${API_URL}/api/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });

        if (refreshResponse.ok) {
          isRefreshing = false;
          onRefreshed(null);
          response = await fetch(`${API_URL}${url}`, finalOptions);
        } else {
          isRefreshing = false;
          const error = new Error('Session expired');
          error.status = 401;
          onRefreshed(error);
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          throw error;
        }
      } catch (error) {
        isRefreshing = false;
        onRefreshed(error);
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw error;
      }
    } else {
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh(async (err) => {
          if (err) return reject(err);
          try {
            const retryRes = await fetch(`${API_URL}${url}`, finalOptions);
            resolve(retryRes);
          } catch (retryErr) {
            reject(retryErr);
          }
        });
      });
    }
  }

  if (!response.ok) {
    const text = await response.text();
    let errorMsg = text;
    try {
      const parsed = JSON.parse(text);
      errorMsg = parsed.error || parsed.message || text;
    } catch (e) {}
    const error = new Error(errorMsg);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) return {};
  const text = await response.text();
  return text ? JSON.parse(text) : {};
};

export const api = {
  get: (path) => customFetch(path, { method: 'GET' }),
  post: (path, body) => customFetch(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: (path, body) => customFetch(path, { method: 'PATCH', body: JSON.stringify(body) }),
  put: (path, body) => customFetch(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path) => customFetch(path, { method: 'DELETE' }),
  upload: (path, formData) => customFetch(path, { method: 'POST', body: formData }, { isFormData: true }),
};
```

The new bits: `patch`, `upload`, and a `204 → {}` short-circuit (members `DELETE` returns 204).

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/lib/api.js
git commit -m "feat(web): api.upload helper, api.patch, 204 handling"
```

---

## Task 13: Workspace store rewrite

**Files:**
- Modify: `apps/web/src/stores/workspaceStore.js`

- [ ] **Step 1: Replace the skeleton store**

Overwrite `apps/web/src/stores/workspaceStore.js`:

```js
import { create } from 'zustand';
import { api } from '../lib/api';

const LAST_ACTIVE_KEY = 'team-hub:lastActiveWorkspaceId';

const useWorkspaceStore = create((set, get) => ({
  workspaces: [],
  activeWorkspaceId: null,
  isLoading: false,
  error: null,

  setActiveWorkspaceId: (id) => {
    set({ activeWorkspaceId: id });
    if (typeof window !== 'undefined' && id) {
      window.localStorage.setItem(LAST_ACTIVE_KEY, id);
    }
  },

  getLastActiveWorkspaceId: () => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(LAST_ACTIVE_KEY);
  },

  fetchWorkspaces: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.get('/api/workspaces');
      set({ workspaces: data.workspaces || [], isLoading: false });
      return data.workspaces || [];
    } catch (err) {
      set({ error: err.message, isLoading: false });
      return [];
    }
  },

  createWorkspace: async (input) => {
    try {
      const data = await api.post('/api/workspaces', input);
      const ws = data.workspace;
      set((s) => ({ workspaces: [...s.workspaces, ws] }));
      return ws;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  updateWorkspace: async (id, patch) => {
    const data = await api.patch(`/api/workspaces/${id}`, patch);
    const updated = data.workspace;
    set((s) => ({
      workspaces: s.workspaces.map((w) => (w.id === id ? { ...w, ...updated } : w)),
    }));
    return updated;
  },

  uploadWorkspaceIcon: async (id, file) => {
    const fd = new FormData();
    fd.append('icon', file);
    const data = await api.upload(`/api/workspaces/${id}/icon`, fd);
    set((s) => ({
      workspaces: s.workspaces.map((w) => (w.id === id ? { ...w, iconUrl: data.iconUrl } : w)),
    }));
    return data.iconUrl;
  },

  deleteWorkspace: async (id) => {
    await api.delete(`/api/workspaces/${id}`);
    set((s) => {
      const remaining = s.workspaces.filter((w) => w.id !== id);
      const activeRemoved = s.activeWorkspaceId === id;
      return {
        workspaces: remaining,
        activeWorkspaceId: activeRemoved ? null : s.activeWorkspaceId,
      };
    });
    if (typeof window !== 'undefined' && get().getLastActiveWorkspaceId() === id) {
      window.localStorage.removeItem(LAST_ACTIVE_KEY);
    }
  },
}));

export default useWorkspaceStore;
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/stores/workspaceStore.js
git commit -m "feat(web): workspace store with CRUD, icon upload, last-active persistence"
```

---

## Task 14: Workspace members store

**Files:**
- Create: `apps/web/src/stores/workspaceMembersStore.js`

- [ ] **Step 1: Implement the store**

Create `apps/web/src/stores/workspaceMembersStore.js`:

```js
import { create } from 'zustand';
import { api } from '../lib/api';

const useWorkspaceMembersStore = create((set, get) => ({
  members: [],
  invitations: [],
  isLoading: false,
  error: null,

  fetchMembers: async (workspaceId) => {
    const data = await api.get(`/api/workspaces/${workspaceId}/members`);
    set({ members: data.members || [] });
    return data.members || [];
  },

  fetchInvitations: async (workspaceId) => {
    const data = await api.get(`/api/workspaces/${workspaceId}/invitations`);
    set({ invitations: data.invitations || [] });
    return data.invitations || [];
  },

  inviteMember: async (workspaceId, { email, role }) => {
    const data = await api.post(`/api/workspaces/${workspaceId}/invitations`, { email, role });
    set((s) => ({ invitations: [data.invitation, ...s.invitations] }));
    return data;
  },

  revokeInvitation: async (workspaceId, invitationId) => {
    await api.delete(`/api/workspaces/${workspaceId}/invitations/${invitationId}`);
    set((s) => ({
      invitations: s.invitations.map((i) =>
        i.id === invitationId ? { ...i, status: 'REVOKED' } : i
      ),
    }));
  },

  resendInvitation: async (workspaceId, invitationId) => {
    const data = await api.post(`/api/workspaces/${workspaceId}/invitations/${invitationId}/resend`, {});
    set((s) => ({
      invitations: s.invitations.map((i) =>
        i.id === invitationId ? data.invitation : i
      ),
    }));
    return data;
  },

  updateMemberRole: async (workspaceId, memberId, role) => {
    const data = await api.patch(`/api/workspaces/${workspaceId}/members/${memberId}`, { role });
    set((s) => ({
      members: s.members.map((m) => (m.id === memberId ? { ...m, role: data.member.role } : m)),
    }));
    return data.member;
  },

  removeMember: async (workspaceId, memberId) => {
    await api.delete(`/api/workspaces/${workspaceId}/members/${memberId}`);
    set((s) => ({ members: s.members.filter((m) => m.id !== memberId) }));
  },

  leaveWorkspace: async (workspaceId) => {
    await api.post(`/api/workspaces/${workspaceId}/members/leave`, {});
  },
}));

export default useWorkspaceMembersStore;
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/stores/workspaceMembersStore.js
git commit -m "feat(web): workspace members & invitations store"
```

---

## Task 15: UI primitives (Button, Modal, ConfirmDialog)

**Files:**
- Create: `apps/web/src/components/ui/Button.jsx`
- Create: `apps/web/src/components/ui/Modal.jsx`
- Create: `apps/web/src/components/ui/ConfirmDialog.jsx`

- [ ] **Step 1: Button**

Create `apps/web/src/components/ui/Button.jsx`:

```jsx
'use client';

const VARIANTS = {
  primary:
    'bg-primary-600 hover:bg-primary-700 text-white border border-transparent',
  secondary:
    'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 border border-transparent',
  danger:
    'bg-red-600 hover:bg-red-700 text-white border border-transparent',
  outline:
    'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  className = '',
  disabled,
  children,
  ...rest
}) {
  const sizing = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm';
  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex items-center justify-center font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${VARIANTS[variant]} ${sizing} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
```

- [ ] **Step 2: Modal**

Create `apps/web/src/components/ui/Modal.jsx`:

```jsx
'use client';

import { useEffect } from 'react';

export default function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const sizeClass =
    size === 'sm' ? 'max-w-sm' : size === 'lg' ? 'max-w-2xl' : 'max-w-md';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`w-full ${sizeClass} bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
          </div>
        )}
        <div className="px-6 py-4">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: ConfirmDialog**

Create `apps/web/src/components/ui/ConfirmDialog.jsx`:

```jsx
'use client';

import Modal from './Modal';
import Button from './Button';

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  variant = 'danger',
  isLoading = false,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button variant={variant} onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'Working…' : confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-gray-700 dark:text-gray-300">{message}</p>
    </Modal>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/ui
git commit -m "feat(web): Button, Modal, ConfirmDialog UI primitives"
```

---

## Task 16: Workspace tile and rail components

**Files:**
- Create: `apps/web/src/components/workspace/WorkspaceTile.jsx`
- Create: `apps/web/src/components/workspace/AccentColorPicker.jsx`
- Create: `apps/web/src/components/workspace/WorkspaceIconUpload.jsx`
- Create: `apps/web/src/components/workspace/CreateWorkspaceModal.jsx`
- Create: `apps/web/src/components/workspace/WorkspaceRail.jsx`

- [ ] **Step 1: WorkspaceTile (single rail item)**

Create `apps/web/src/components/workspace/WorkspaceTile.jsx`:

```jsx
'use client';

import Link from 'next/link';

const initials = (name) =>
  name.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() || '').join('') || '?';

export default function WorkspaceTile({ workspace, isActive, href, title }) {
  const bg = workspace.accentColor || '#3b82f6';
  return (
    <Link
      href={href}
      title={title || workspace.name}
      className={`relative flex items-center justify-center w-12 h-12 rounded-lg overflow-hidden text-white font-semibold transition-all hover:scale-105 ${
        isActive ? 'ring-2 ring-offset-2 ring-offset-gray-900 ring-white' : ''
      }`}
      style={{ backgroundColor: bg }}
    >
      {workspace.iconUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={workspace.iconUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className="text-base">{initials(workspace.name)}</span>
      )}
    </Link>
  );
}
```

- [ ] **Step 2: AccentColorPicker**

Create `apps/web/src/components/workspace/AccentColorPicker.jsx`:

```jsx
'use client';

import { WORKSPACE_ACCENT_PALETTE } from '@team-hub/shared';

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export default function AccentColorPicker({ value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Accent colour
      </label>
      <div className="grid grid-cols-6 gap-2">
        {WORKSPACE_ACCENT_PALETTE.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            className={`h-8 w-8 rounded-md border transition-all ${
              value === c ? 'ring-2 ring-offset-2 ring-gray-900 dark:ring-white' : 'border-gray-300'
            }`}
            style={{ backgroundColor: c }}
            aria-label={`Use ${c}`}
          />
        ))}
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => HEX_RE.test(e.target.value) && onChange(e.target.value)}
        className="mt-2 block w-32 px-2 py-1 text-xs font-mono border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 dark:text-white"
        placeholder="#3b82f6"
      />
    </div>
  );
}
```

- [ ] **Step 3: WorkspaceIconUpload**

Create `apps/web/src/components/workspace/WorkspaceIconUpload.jsx`:

```jsx
'use client';

import { useRef, useState } from 'react';
import Button from '../ui/Button';

export default function WorkspaceIconUpload({ workspace, onUpload }) {
  const [isUploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('File must be 2 MB or smaller');
      return;
    }
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setError('PNG, JPEG, or WebP only');
      return;
    }
    setError('');
    setUploading(true);
    try {
      await onUpload(file);
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div
        className="w-16 h-16 rounded-lg overflow-hidden flex items-center justify-center text-white font-semibold text-2xl"
        style={{ backgroundColor: workspace.accentColor }}
      >
        {workspace.iconUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={workspace.iconUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          (workspace.name[0] || '?').toUpperCase()
        )}
      </div>
      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? 'Uploading…' : workspace.iconUrl ? 'Replace icon' : 'Upload icon'}
        </Button>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: CreateWorkspaceModal**

Create `apps/web/src/components/workspace/CreateWorkspaceModal.jsx`:

```jsx
'use client';

import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import AccentColorPicker from './AccentColorPicker';

export default function CreateWorkspaceModal({ open, onClose, onCreate }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [accentColor, setAccentColor] = useState('#3b82f6');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setName(''); setDescription(''); setAccentColor('#3b82f6'); setError(''); setSubmitting(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required'); return; }
    setSubmitting(true); setError('');
    try {
      await onCreate({ name: name.trim(), description: description.trim() || undefined, accentColor });
      reset();
    } catch (err) {
      setError(err.message || 'Failed to create workspace');
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => { if (!submitting) { reset(); onClose(); } }}
      title="Create workspace"
      footer={
        <>
          <Button variant="secondary" onClick={() => { reset(); onClose(); }} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Creating…' : 'Create'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 p-3 rounded">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 dark:text-white"
            placeholder="Engineering"
            autoFocus
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 dark:text-white"
            placeholder="What does this workspace do?"
          />
        </div>
        <AccentColorPicker value={accentColor} onChange={setAccentColor} />
      </form>
    </Modal>
  );
}
```

- [ ] **Step 5: WorkspaceRail (left vertical chrome)**

Create `apps/web/src/components/workspace/WorkspaceRail.jsx`:

```jsx
'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import useWorkspaceStore from '../../stores/workspaceStore';
import WorkspaceTile from './WorkspaceTile';
import CreateWorkspaceModal from './CreateWorkspaceModal';

export default function WorkspaceRail() {
  const router = useRouter();
  const params = useParams();
  const activeId = params?.workspaceId;
  const { workspaces, createWorkspace } = useWorkspaceStore();
  const [creating, setCreating] = useState(false);

  return (
    <aside className="flex flex-col items-center gap-3 py-4 w-20 bg-gray-900 text-white min-h-screen">
      <div className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">Hubs</div>
      {workspaces.map((w) => (
        <WorkspaceTile
          key={w.id}
          workspace={w}
          isActive={w.id === activeId}
          href={`/dashboard/${w.id}`}
        />
      ))}
      <button
        type="button"
        onClick={() => setCreating(true)}
        className="w-12 h-12 rounded-lg bg-gray-700 hover:bg-gray-600 text-2xl text-gray-200 flex items-center justify-center transition-colors"
        title="Create workspace"
      >
        +
      </button>
      <CreateWorkspaceModal
        open={creating}
        onClose={() => setCreating(false)}
        onCreate={async (data) => {
          const ws = await createWorkspace(data);
          setCreating(false);
          router.push(`/dashboard/${ws.id}`);
        }}
      />
    </aside>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/workspace
git commit -m "feat(web): workspace rail, tile, accent picker, icon upload, create modal"
```

---

## Task 17: Members and invitations components

**Files:**
- Create: `apps/web/src/components/members/RoleBadge.jsx`
- Create: `apps/web/src/components/members/RoleSelect.jsx`
- Create: `apps/web/src/components/members/MemberList.jsx`
- Create: `apps/web/src/components/invitations/InvitationStatusBadge.jsx`
- Create: `apps/web/src/components/invitations/InviteForm.jsx`
- Create: `apps/web/src/components/invitations/InvitationList.jsx`

- [ ] **Step 1: RoleBadge**

Create `apps/web/src/components/members/RoleBadge.jsx`:

```jsx
export default function RoleBadge({ role }) {
  const isAdmin = role === 'ADMIN';
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
        isAdmin
          ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-200'
          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
      }`}
    >
      {role}
    </span>
  );
}
```

- [ ] **Step 2: RoleSelect**

Create `apps/web/src/components/members/RoleSelect.jsx`:

```jsx
'use client';

import { useState } from 'react';
import { ROLES } from '@team-hub/shared';

export default function RoleSelect({ value, onChange, disabled }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handle = async (e) => {
    const next = e.target.value;
    setBusy(true); setError('');
    try {
      await onChange(next);
    } catch (err) {
      setError(err.message || 'Failed to update role');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <select
        value={value}
        onChange={handle}
        disabled={disabled || busy}
        className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 dark:text-white disabled:opacity-50"
      >
        <option value={ROLES.ADMIN}>ADMIN</option>
        <option value={ROLES.MEMBER}>MEMBER</option>
      </select>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 3: MemberList**

Create `apps/web/src/components/members/MemberList.jsx`:

```jsx
'use client';

import { useState } from 'react';
import RoleBadge from './RoleBadge';
import RoleSelect from './RoleSelect';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';

export default function MemberList({ members, currentUserId, isAdmin, onChangeRole, onRemove }) {
  const [confirmRemoveId, setConfirmRemoveId] = useState(null);
  const target = members.find((m) => m.id === confirmRemoveId);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
        {members.map((m) => {
          const isSelf = m.userId === currentUserId;
          return (
            <li key={m.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs font-semibold text-gray-700 dark:text-gray-200">
                  {(m.name[0] || '?').toUpperCase()}
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {m.name} {isSelf && <span className="text-xs text-gray-500">(you)</span>}
                  </div>
                  <div className="text-xs text-gray-500">{m.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {isAdmin ? (
                  <RoleSelect value={m.role} onChange={(r) => onChangeRole(m.id, r)} />
                ) : (
                  <RoleBadge role={m.role} />
                )}
                {(isAdmin || isSelf) && (
                  <Button variant="outline" size="sm" onClick={() => setConfirmRemoveId(m.id)}>
                    {isSelf ? 'Leave' : 'Remove'}
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <ConfirmDialog
        open={!!target}
        onClose={() => setConfirmRemoveId(null)}
        onConfirm={async () => {
          await onRemove(target.id);
          setConfirmRemoveId(null);
        }}
        title={target?.userId === currentUserId ? 'Leave workspace?' : 'Remove member?'}
        message={
          target?.userId === currentUserId
            ? 'You will lose access to this workspace immediately.'
            : `Remove ${target?.name} from this workspace?`
        }
        confirmLabel={target?.userId === currentUserId ? 'Leave' : 'Remove'}
      />
    </div>
  );
}
```

- [ ] **Step 4: InvitationStatusBadge**

Create `apps/web/src/components/invitations/InvitationStatusBadge.jsx`:

```jsx
const STYLES = {
  PENDING:  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200',
  ACCEPTED: 'bg-green-100  text-green-800  dark:bg-green-900/40  dark:text-green-200',
  REVOKED:  'bg-gray-100   text-gray-700   dark:bg-gray-700      dark:text-gray-200',
  EXPIRED:  'bg-gray-100   text-gray-700   dark:bg-gray-700      dark:text-gray-200',
};

export default function InvitationStatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STYLES[status] || STYLES.PENDING}`}>
      {status}
    </span>
  );
}
```

- [ ] **Step 5: InviteForm**

Create `apps/web/src/components/invitations/InviteForm.jsx`:

```jsx
'use client';

import { useState } from 'react';
import { ROLES } from '@team-hub/shared';
import Button from '../ui/Button';

export default function InviteForm({ onInvite }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState(ROLES.MEMBER);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successUrl, setSuccessUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccessUrl(''); setCopied(false);
    setSubmitting(true);
    try {
      const { inviteUrl } = await onInvite({ email: email.trim(), role });
      setSuccessUrl(inviteUrl);
      setEmail('');
    } catch (err) {
      setError(err.message || 'Failed to invite');
    } finally {
      setSubmitting(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(successUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 p-3 rounded">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="teammate@example.com"
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 dark:text-white"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 dark:text-white"
        >
          <option value={ROLES.MEMBER}>Member</option>
          <option value={ROLES.ADMIN}>Admin</option>
        </select>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Sending…' : 'Send invite'}
        </Button>
      </div>
      {successUrl && (
        <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded flex flex-col sm:flex-row sm:items-center gap-2">
          <code className="text-xs flex-1 break-all text-gray-800 dark:text-gray-200">{successUrl}</code>
          <Button variant="secondary" size="sm" onClick={copy} type="button">
            {copied ? 'Copied!' : 'Copy link'}
          </Button>
        </div>
      )}
    </form>
  );
}
```

- [ ] **Step 6: InvitationList**

Create `apps/web/src/components/invitations/InvitationList.jsx`:

```jsx
'use client';

import InvitationStatusBadge from './InvitationStatusBadge';
import Button from '../ui/Button';

export default function InvitationList({ invitations, onRevoke, onResend }) {
  if (!invitations.length) {
    return <p className="text-sm text-gray-500">No invitations yet.</p>;
  }
  return (
    <ul className="divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg">
      {invitations.map((inv) => (
        <li key={inv.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
          <div className="flex-1 min-w-[200px]">
            <div className="font-medium text-gray-900 dark:text-white">{inv.email}</div>
            <div className="text-xs text-gray-500">
              {inv.role} · sent {new Date(inv.createdAt).toLocaleDateString()}
              {inv.status === 'PENDING' && ` · expires ${new Date(inv.expiresAt).toLocaleDateString()}`}
            </div>
          </div>
          <InvitationStatusBadge status={inv.status} />
          {inv.status === 'PENDING' && (
            <>
              <Button variant="secondary" size="sm" onClick={() => onResend(inv.id)}>Resend</Button>
              <Button variant="outline" size="sm" onClick={() => onRevoke(inv.id)}>Revoke</Button>
            </>
          )}
          {inv.status === 'EXPIRED' && (
            <Button variant="secondary" size="sm" onClick={() => onResend(inv.id)}>Resend</Button>
          )}
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/components/members apps/web/src/components/invitations
git commit -m "feat(web): member list, role select, invite form and list components"
```

---

## Task 18: Dashboard layout rewrite + redirect page

**Files:**
- Modify: `apps/web/src/app/dashboard/layout.js`
- Modify: `apps/web/src/app/dashboard/page.js`
- Create: `apps/web/src/app/onboarding/page.js`

- [ ] **Step 1: Rewrite the dashboard layout**

Overwrite `apps/web/src/app/dashboard/layout.js`:

```jsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/stores/authStore';
import useWorkspaceStore from '@/stores/workspaceStore';
import WorkspaceRail from '@/components/workspace/WorkspaceRail';
import Button from '@/components/ui/Button';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const { user, isAuthenticated, isCheckingAuth, checkAuth, logout } = useAuthStore();
  const { fetchWorkspaces, isLoading: wsLoading } = useWorkspaceStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isCheckingAuth && !isAuthenticated) {
      router.push('/login');
    }
  }, [isCheckingAuth, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) fetchWorkspaces();
  }, [isAuthenticated, fetchWorkspaces]);

  if (isCheckingAuth || (!isAuthenticated && !isCheckingAuth)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      <WorkspaceRail />
      <div className="flex-1 flex flex-col">
        <nav className="bg-white dark:bg-gray-800 shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <span className="text-xl font-bold text-primary-600">Team Hub</span>
              <div className="flex items-center gap-3">
                <span className="hidden sm:block text-sm text-gray-600 dark:text-gray-300">
                  {user?.name}
                </span>
                <Button variant="secondary" size="sm" onClick={() => logout()}>Logout</Button>
              </div>
            </div>
          </div>
        </nav>
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Redirect `/dashboard` → last-active or onboarding**

Overwrite `apps/web/src/app/dashboard/page.js`:

```jsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useWorkspaceStore from '@/stores/workspaceStore';

export default function DashboardPage() {
  const router = useRouter();
  const { workspaces, isLoading, getLastActiveWorkspaceId } = useWorkspaceStore();

  useEffect(() => {
    if (isLoading) return;

    if (workspaces.length === 0) {
      router.replace('/onboarding');
      return;
    }

    const lastId = getLastActiveWorkspaceId();
    const target = workspaces.find((w) => w.id === lastId) || workspaces[0];
    router.replace(`/dashboard/${target.id}`);
  }, [isLoading, workspaces, router, getLastActiveWorkspaceId]);

  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>
  );
}
```

- [ ] **Step 3: Onboarding empty-state page**

Create `apps/web/src/app/onboarding/page.js`:

```jsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/stores/authStore';
import useWorkspaceStore from '@/stores/workspaceStore';
import CreateWorkspaceModal from '@/components/workspace/CreateWorkspaceModal';
import Button from '@/components/ui/Button';

export default function OnboardingPage() {
  const router = useRouter();
  const { isAuthenticated, isCheckingAuth, checkAuth } = useAuthStore();
  const { workspaces, fetchWorkspaces, createWorkspace } = useWorkspaceStore();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isCheckingAuth && !isAuthenticated) router.push('/login');
  }, [isCheckingAuth, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) fetchWorkspaces();
  }, [isAuthenticated, fetchWorkspaces]);

  useEffect(() => {
    if (workspaces.length > 0) router.replace(`/dashboard/${workspaces[0].id}`);
  }, [workspaces, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Welcome to Team Hub</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          You don't have any workspaces yet. Create one to start collaborating.
        </p>
        <Button onClick={() => setOpen(true)}>Create your first workspace</Button>
        <CreateWorkspaceModal
          open={open}
          onClose={() => setOpen(false)}
          onCreate={async (data) => {
            const ws = await createWorkspace(data);
            router.push(`/dashboard/${ws.id}`);
          }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/dashboard/layout.js apps/web/src/app/dashboard/page.js apps/web/src/app/onboarding/page.js
git commit -m "feat(web): dashboard layout with workspace rail; onboarding fallback"
```

---

## Task 19: Workspace home + settings (general) page

**Files:**
- Create: `apps/web/src/app/dashboard/[workspaceId]/layout.js`
- Create: `apps/web/src/app/dashboard/[workspaceId]/page.js`
- Create: `apps/web/src/app/dashboard/[workspaceId]/settings/page.js`

- [ ] **Step 1: `[workspaceId]` layout with membership validation and settings nav**

Create `apps/web/src/app/dashboard/[workspaceId]/layout.js`:

```jsx
'use client';

import { useEffect } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import useWorkspaceStore from '@/stores/workspaceStore';

export default function WorkspaceLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { workspaceId } = useParams();
  const { workspaces, isLoading, setActiveWorkspaceId } = useWorkspaceStore();
  const workspace = workspaces.find((w) => w.id === workspaceId);

  useEffect(() => {
    if (!isLoading && workspaces.length > 0 && !workspace) {
      router.replace('/dashboard');
    }
  }, [isLoading, workspaces, workspace, router]);

  useEffect(() => {
    if (workspace) setActiveWorkspaceId(workspace.id);
  }, [workspace, setActiveWorkspaceId]);

  if (!workspace) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const isAdmin = workspace.myRole === 'ADMIN';
  const tabs = [
    { href: `/dashboard/${workspace.id}`, label: 'Home' },
    isAdmin && { href: `/dashboard/${workspace.id}/settings`, label: 'Settings' },
    { href: `/dashboard/${workspace.id}/settings/members`, label: 'Members' },
    isAdmin && { href: `/dashboard/${workspace.id}/settings/invitations`, label: 'Invitations' },
  ].filter(Boolean);

  return (
    <div>
      <header
        className="rounded-lg p-6 mb-6 text-white"
        style={{ backgroundColor: workspace.accentColor }}
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-lg overflow-hidden bg-white/20 flex items-center justify-center text-2xl font-bold">
            {workspace.iconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={workspace.iconUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              (workspace.name[0] || '?').toUpperCase()
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{workspace.name}</h1>
            {workspace.description && (
              <p className="text-sm opacity-90">{workspace.description}</p>
            )}
          </div>
        </div>
      </header>
      <nav className="flex gap-1 mb-6 border-b border-gray-200 dark:border-gray-700">
        {tabs.map((t) => {
          const active = pathname === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                active
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Workspace home (placeholder for next milestone)**

Create `apps/web/src/app/dashboard/[workspaceId]/page.js`:

```jsx
'use client';

import { useParams } from 'next/navigation';
import useWorkspaceStore from '@/stores/workspaceStore';

export default function WorkspaceHome() {
  const { workspaceId } = useParams();
  const workspace = useWorkspaceStore((s) => s.workspaces.find((w) => w.id === workspaceId));

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        {workspace?.name || 'Workspace'}
      </h2>
      <p className="text-gray-600 dark:text-gray-300">
        Goals, announcements, and action items will live here in upcoming milestones.
        Use the tabs above to manage members and invitations.
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Settings (general) page**

Create `apps/web/src/app/dashboard/[workspaceId]/settings/page.js`:

```jsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useWorkspaceStore from '@/stores/workspaceStore';
import AccentColorPicker from '@/components/workspace/AccentColorPicker';
import WorkspaceIconUpload from '@/components/workspace/WorkspaceIconUpload';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

export default function WorkspaceSettings() {
  const router = useRouter();
  const { workspaceId } = useParams();
  const { workspaces, updateWorkspace, uploadWorkspaceIcon, deleteWorkspace } = useWorkspaceStore();
  const workspace = workspaces.find((w) => w.id === workspaceId);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [accentColor, setAccentColor] = useState('#3b82f6');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (workspace) {
      setName(workspace.name);
      setDescription(workspace.description || '');
      setAccentColor(workspace.accentColor);
    }
  }, [workspace]);

  if (!workspace) return null;
  if (workspace.myRole !== 'ADMIN') {
    return (
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <p className="text-gray-600 dark:text-gray-300">Only admins can edit workspace settings.</p>
      </div>
    );
  }

  const onSave = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await updateWorkspace(workspace.id, { name: name.trim(), description, accentColor });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <section className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Workspace icon</h2>
        <WorkspaceIconUpload
          workspace={workspace}
          onUpload={(file) => uploadWorkspaceIcon(workspace.id, file)}
        />
      </section>

      <section className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">General</h2>
        <form onSubmit={onSave} className="space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 p-3 rounded">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 dark:text-white"
            />
          </div>
          <AccentColorPicker value={accentColor} onChange={setAccentColor} />
          <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
        </form>
      </section>

      <section className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 border border-red-200 dark:border-red-900">
        <h2 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">Danger zone</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Deleting a workspace is permanent. All goals, announcements, and members will be removed.
        </p>
        <Button variant="danger" onClick={() => setConfirmDelete(true)}>Delete workspace</Button>
        <ConfirmDialog
          open={confirmDelete}
          onClose={() => setConfirmDelete(false)}
          onConfirm={async () => {
            setDeleting(true);
            try {
              await deleteWorkspace(workspace.id);
              router.replace('/dashboard');
            } finally {
              setDeleting(false);
              setConfirmDelete(false);
            }
          }}
          title={`Delete "${workspace.name}"?`}
          message="This cannot be undone."
          confirmLabel="Delete forever"
          isLoading={deleting}
        />
      </section>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/dashboard/\[workspaceId\]
git commit -m "feat(web): workspace layout, home placeholder, and settings page"
```

---

## Task 20: Members & invitations settings pages

**Files:**
- Create: `apps/web/src/app/dashboard/[workspaceId]/settings/members/page.js`
- Create: `apps/web/src/app/dashboard/[workspaceId]/settings/invitations/page.js`

- [ ] **Step 1: Members page**

Create `apps/web/src/app/dashboard/[workspaceId]/settings/members/page.js`:

```jsx
'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useAuthStore from '@/stores/authStore';
import useWorkspaceStore from '@/stores/workspaceStore';
import useWorkspaceMembersStore from '@/stores/workspaceMembersStore';
import MemberList from '@/components/members/MemberList';

export default function MembersPage() {
  const router = useRouter();
  const { workspaceId } = useParams();
  const { user } = useAuthStore();
  const workspace = useWorkspaceStore((s) => s.workspaces.find((w) => w.id === workspaceId));
  const fetchWorkspaces = useWorkspaceStore((s) => s.fetchWorkspaces);
  const { members, fetchMembers, updateMemberRole, removeMember, leaveWorkspace } = useWorkspaceMembersStore();

  useEffect(() => {
    if (workspaceId) fetchMembers(workspaceId);
  }, [workspaceId, fetchMembers]);

  if (!workspace) return null;

  const isAdmin = workspace.myRole === 'ADMIN';

  const handleChangeRole = async (memberId, role) => {
    await updateMemberRole(workspaceId, memberId, role);
  };

  const handleRemove = async (memberId) => {
    const target = members.find((m) => m.id === memberId);
    const isSelf = target?.userId === user?.id;
    if (isSelf) {
      await leaveWorkspace(workspaceId);
      await fetchWorkspaces();
      router.replace('/dashboard');
    } else {
      await removeMember(workspaceId, memberId);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Members ({members.length})
      </h2>
      <MemberList
        members={members}
        currentUserId={user?.id}
        isAdmin={isAdmin}
        onChangeRole={handleChangeRole}
        onRemove={handleRemove}
      />
    </div>
  );
}
```

- [ ] **Step 2: Invitations page**

Create `apps/web/src/app/dashboard/[workspaceId]/settings/invitations/page.js`:

```jsx
'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import useWorkspaceStore from '@/stores/workspaceStore';
import useWorkspaceMembersStore from '@/stores/workspaceMembersStore';
import InviteForm from '@/components/invitations/InviteForm';
import InvitationList from '@/components/invitations/InvitationList';

export default function InvitationsPage() {
  const { workspaceId } = useParams();
  const workspace = useWorkspaceStore((s) => s.workspaces.find((w) => w.id === workspaceId));
  const { invitations, fetchInvitations, inviteMember, revokeInvitation, resendInvitation } = useWorkspaceMembersStore();

  useEffect(() => {
    if (workspaceId) fetchInvitations(workspaceId);
  }, [workspaceId, fetchInvitations]);

  if (!workspace) return null;
  if (workspace.myRole !== 'ADMIN') {
    return (
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <p className="text-gray-600 dark:text-gray-300">Only admins can manage invitations.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Invite a teammate
        </h2>
        <InviteForm onInvite={(input) => inviteMember(workspaceId, input)} />
      </section>
      <section className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Pending & past invitations
        </h2>
        <InvitationList
          invitations={invitations}
          onRevoke={(id) => revokeInvitation(workspaceId, id)}
          onResend={(id) => resendInvitation(workspaceId, id)}
        />
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/dashboard/\[workspaceId\]/settings
git commit -m "feat(web): members and invitations settings pages"
```

---

## Task 21: Invite landing page

**Files:**
- Create: `apps/web/src/app/invite/[token]/page.js`

- [ ] **Step 1: Implement the landing page**

Create `apps/web/src/app/invite/[token]/page.js`:

```jsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import useAuthStore from '@/stores/authStore';
import Button from '@/components/ui/Button';

export default function InviteLanding() {
  const router = useRouter();
  const { token } = useParams();
  const { user, isAuthenticated, isCheckingAuth, checkAuth, logout } = useAuthStore();
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState('');

  useEffect(() => { checkAuth(); }, [checkAuth]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await api.get(`/api/invitations/${token}`);
        if (!cancelled) setData(d);
      } catch (err) {
        if (!cancelled) setLoadError(err.message || 'Invitation not found');
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const accept = async () => {
    setAccepting(true); setAcceptError('');
    try {
      const r = await api.post(`/api/invitations/${token}/accept`, {});
      router.push(`/dashboard/${r.workspace.id}`);
    } catch (err) {
      // 409 = already a member; payload has workspaceId
      if (err.status === 409) {
        try {
          const meta = await api.get(`/api/invitations/${token}`);
          if (meta.workspace?.id) {
            router.push(`/dashboard/${meta.workspace.id}`);
            return;
          }
        } catch {}
      }
      setAcceptError(err.message || 'Failed to accept invitation');
      setAccepting(false);
    }
  };

  if (loadError) {
    return (
      <Shell>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Invitation unavailable</h1>
        <p className="text-gray-600 dark:text-gray-300">{loadError}</p>
      </Shell>
    );
  }

  if (!data || isCheckingAuth) {
    return (
      <Shell>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </Shell>
    );
  }

  const { workspace, invitation } = data;
  const status = invitation.status;

  if (status === 'EXPIRED' || status === 'REVOKED') {
    return (
      <Shell workspace={workspace}>
        <p className="text-gray-700 dark:text-gray-300">
          This invitation is {status.toLowerCase()}. Ask an admin to send you a new one.
        </p>
      </Shell>
    );
  }

  if (status === 'ACCEPTED') {
    return (
      <Shell workspace={workspace}>
        <p className="text-gray-700 dark:text-gray-300 mb-4">This invitation has already been accepted.</p>
        {isAuthenticated && (
          <Link href={`/dashboard/${workspace.id}`} className="text-primary-600 hover:underline">
            Go to {workspace.name}
          </Link>
        )}
      </Shell>
    );
  }

  // PENDING
  if (!isAuthenticated) {
    const next = `/invite/${token}`;
    return (
      <Shell workspace={workspace}>
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          You've been invited to <strong>{workspace.name}</strong> as <strong>{invitation.role}</strong>.
          Sign in or create an account using <strong>{invitation.email}</strong> to accept.
        </p>
        <div className="flex gap-2">
          <Link href={`/login?next=${encodeURIComponent(next)}`}>
            <Button>Sign in</Button>
          </Link>
          <Link href={`/register?next=${encodeURIComponent(next)}`}>
            <Button variant="secondary">Create account</Button>
          </Link>
        </div>
      </Shell>
    );
  }

  const emailMatches = user?.email?.toLowerCase() === invitation.email.toLowerCase();
  if (!emailMatches) {
    return (
      <Shell workspace={workspace}>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          This invitation was sent to <strong>{invitation.email}</strong> but you're signed in as{' '}
          <strong>{user.email}</strong>.
        </p>
        <Button variant="secondary" onClick={() => logout()}>Log out and try again</Button>
      </Shell>
    );
  }

  return (
    <Shell workspace={workspace}>
      <p className="text-gray-700 dark:text-gray-300 mb-6">
        Accept invitation to <strong>{workspace.name}</strong> as <strong>{invitation.role}</strong>?
      </p>
      {acceptError && (
        <div className="bg-red-50 dark:bg-red-900/30 p-3 rounded mb-4">
          <p className="text-sm text-red-700 dark:text-red-400">{acceptError}</p>
        </div>
      )}
      <Button onClick={accept} disabled={accepting}>
        {accepting ? 'Accepting…' : 'Accept invitation'}
      </Button>
    </Shell>
  );
}

function Shell({ workspace, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl p-8 max-w-md w-full">
        {workspace && (
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl font-bold overflow-hidden"
              style={{ backgroundColor: workspace.accentColor }}
            >
              {workspace.iconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={workspace.iconUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                (workspace.name[0] || '?').toUpperCase()
              )}
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{workspace.name}</h2>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Make `login` and `register` honour `?next=`**

In `apps/web/src/app/login/page.js`, replace the line `router.push('/dashboard');` (it's inside `handleSubmit` after `if (res.success)`) with:

```jsx
const next = new URLSearchParams(window.location.search).get('next');
router.push(next && next.startsWith('/') ? next : '/dashboard');
```

Read `apps/web/src/app/register/page.js` and apply the same replacement to its post-success redirect (it should also be `router.push('/dashboard')` somewhere in the register handler — replace it the same way). If the register page differs structurally, the principle is: after registration succeeds, honour `?next=` if it's a relative path.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/invite apps/web/src/app/login apps/web/src/app/register
git commit -m "feat(web): invite landing page; login/register honour ?next= param"
```

---

## Task 22: End-to-end manual smoke test

This task has no code — it verifies the whole feature works together. Run after all preceding tasks land.

- [ ] **Step 1: Start fresh**

Drop the dev DB or roll back the schema (whichever is easiest), then re-apply migrations:

```bash
npm run db:migrate --workspace=@team-hub/api
npm run db:generate --workspace=@team-hub/api
```

Start both apps:

```bash
npm run dev
```

- [ ] **Step 2: Walk the golden path**

In a private browser window:

1. Visit `http://localhost:3000` → click **Register**.
2. Register as Alice. Land on `/dashboard/<id>` showing `Alice's Workspace` (auto-created).
3. The left rail shows one tile, accent blue. Click `+` → create "Engineering" with a green accent → land on its dashboard.
4. The rail now has two tiles. Switch back to the first by clicking its tile.
5. Click **Settings** → upload a PNG icon → confirm the rail tile updates immediately.
6. Edit the name to "Acme HQ" → save → confirm the header and rail tooltip update.
7. Click **Invitations** → enter `bob@x.com`, role MEMBER → click **Send invite** → confirm the inviteUrl appears with **Copy link**.
8. Copy the URL. Open a second private window, paste it.
9. The invite landing page shows the workspace preview with **Sign in** and **Create account** buttons.
10. Click **Create account** (with `?next=` preserved) → register as `bob@x.com`. After registration, the redirect lands you back on `/invite/<token>`.
11. The accept button now shows. Click **Accept invitation** → land on `/dashboard/<id>` with both Bob's auto-workspace **and** Acme HQ in his rail.
12. Switch back to Alice's window → reload Members tab → Bob now appears as MEMBER.
13. As Alice, change Bob's role to ADMIN via the inline select → confirm the badge updates.
14. As Alice, demote yourself to MEMBER → succeeds (Bob is still admin).
15. Try demoting Bob to MEMBER as Bob → fails with "Promote another member to admin first" (Bob is now last admin).
16. Bob promotes Alice back to ADMIN, then demotes himself → succeeds.
17. Alice deletes "Acme HQ" → confirm dialog → confirm → redirected to `/dashboard` → lands on her remaining workspace.
18. As Bob, reload his rail → Acme HQ is gone (cascade-deleted his membership too).

- [ ] **Step 3: Walk the error paths**

- Try inviting Bob again to a workspace he's a member of → 409 toast: "User is already a member of this workspace".
- Revoke a pending invitation → status flips to REVOKED in the list.
- Resend an expired invitation (simulate by editing `expiresAt` directly in the DB to `now() - 1 hour`, then refreshing the list — it should flip to EXPIRED on read; clicking Resend should issue a new pending one with the same token).
- Visit `/invite/abc-fake-token` → "Invitation unavailable" landing.
- Visit a valid token URL while logged in as someone whose email doesn't match → "This invitation was sent to..." with logout option.

- [ ] **Step 4: Commit a tag/marker (optional)**

If the smoke passes, mark the milestone:

```bash
git tag workspaces-complete
```

---

## Self-review

- **Spec coverage:**
  - Create + switch workspaces → Tasks 5, 6, 13, 16, 18, 19 ✓
  - Invite by email + role → Tasks 9, 10, 14, 17, 20 ✓
  - Name/description/accent colour → Tasks 5, 16, 19 ✓
  - Workspace icon (Q4-ii) → Tasks 4, 5, 13, 16, 19 ✓
  - Auto-create on register (Q4-A) → Task 7 ✓
  - Token-link invite flow (Q1-A) → Tasks 9, 10, 21 ✓
  - Last-admin guard / role rules (Q2) → Task 8 ✓
  - Left rail switcher (Q3-B) → Tasks 16, 18 ✓
  - Permissions middleware → Task 3 ✓
  - Swagger updates → Task 11 ✓
  - 404 vs 403 leak prevention → Task 3 (`requireWorkspaceMembership` returns 404) ✓
  - Email normalization → Tasks 7, 9 (both use lowercase + trim) ✓

- **Placeholder scan:** No `TBD`/`TODO`/"implement later" tokens in the plan body; manual smoke is fully scripted. The single fragment that defers behaviour is the comment in the workspace-home page ("Goals, announcements, and action items will live here in upcoming milestones") — that's intentional product copy reflecting the staged nature of the assignment, not a missing instruction.

- **Type consistency:** Every controller export name is referenced consistently. `createWorkspaceTx` is defined in Task 5 and consumed in Task 7. `assertNotLastAdmin` is defined in Task 8 and used three times in the same file. Store method names (`updateMemberRole`, `removeMember`, `leaveWorkspace`, `resendInvitation`, etc.) match between the store (Task 14) and the page consumers (Tasks 19, 20).

---

## Known follow-ups (not part of this plan)

- Real-time member presence via Socket.io (next milestone — constants are already in place).
- Email delivery of `inviteUrl` (bonus item — `createInvitation` is structured to make this a one-line hook).
- Tests once the repo gets a runner (out of scope per spec).
