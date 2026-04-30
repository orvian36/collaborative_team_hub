// TODO: Action Item routes
const express = require('express');
const router = express.Router();

/**
 * @openapi
 * /api/action-items:
 *   post:
 *     tags: [Action Items]
 *     summary: Create an action item
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ActionItemInput'
 *     responses:
 *       201:
 *         description: Action item created
 *   get:
 *     tags: [Action Items]
 *     summary: List action items for a workspace
 *     parameters:
 *       - in: query
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of action items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ActionItem'
 */

/**
 * @openapi
 * /api/action-items/{id}:
 *   get:
 *     tags: [Action Items]
 *     summary: Get action item by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Action item details
 *   put:
 *     tags: [Action Items]
 *     summary: Update an action item
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ActionItemInput'
 *     responses:
 *       200:
 *         description: Action item updated
 *   delete:
 *     tags: [Action Items]
 *     summary: Delete an action item
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Action item deleted
 */

module.exports = router;
