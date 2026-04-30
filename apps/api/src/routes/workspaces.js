// TODO: Workspace routes
const express = require('express');
const router = express.Router();

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
 *       201:
 *         description: Workspace created
 *   get:
 *     tags: [Workspaces]
 *     summary: List workspaces for the current user
 *     responses:
 *       200:
 *         description: List of workspaces
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Workspace'
 */

/**
 * @openapi
 * /api/workspaces/{id}:
 *   get:
 *     tags: [Workspaces]
 *     summary: Get workspace by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Workspace details
 *   put:
 *     tags: [Workspaces]
 *     summary: Update a workspace
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WorkspaceInput'
 *     responses:
 *       200:
 *         description: Workspace updated
 */

/**
 * @openapi
 * /api/workspaces/{id}/invite:
 *   post:
 *     tags: [Workspaces]
 *     summary: Invite a member by email
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InviteInput'
 *     responses:
 *       200:
 *         description: Invitation sent
 */

/**
 * @openapi
 * /api/workspaces/{id}/members:
 *   get:
 *     tags: [Workspaces]
 *     summary: List workspace members
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of members
 */

module.exports = router;
