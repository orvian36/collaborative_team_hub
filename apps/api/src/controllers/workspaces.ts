const crypto = require('crypto');
const prisma = require('../lib/prisma');
const { ROLES } = require('@team-hub/shared');
const { uploadBuffer, destroyByPublicId } = require('../lib/cloudinary');

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

const validateWorkspaceInput = (
  { name, description, accentColor, iconUrl },
  { partial = false } = {}
) => {
  if (!partial || name !== undefined) {
    if (typeof name !== 'string' || !name.trim())
      return 'Workspace name is required';
    if (name.length > 100)
      return 'Workspace name must be 100 characters or fewer';
  }
  if (
    description !== undefined &&
    description !== null &&
    typeof description !== 'string'
  ) {
    return 'Description must be a string';
  }
  if (accentColor !== undefined && !HEX_COLOR.test(accentColor)) {
    return 'accentColor must be a 6-digit hex like #3b82f6';
  }
  if (
    iconUrl !== undefined &&
    iconUrl !== null &&
    typeof iconUrl !== 'string'
  ) {
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
    res
      .status(201)
      .json({
        workspace: { ...workspace, myRole: ROLES.ADMIN, memberCount: 1 },
      });
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
    if (!workspace)
      return res.status(404).json({ error: 'Workspace not found' });

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
    const workspace = await prisma.workspace.findUnique({
      where: { id: req.params.id },
    });
    if (!workspace)
      return res.status(404).json({ error: 'Workspace not found' });

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
  if (!req.file)
    return res.status(400).json({ error: 'Icon file is required' });

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
