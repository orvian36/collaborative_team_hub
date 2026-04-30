// TODO: Goal routes
const express = require('express');
const router = express.Router();

/**
 * @openapi
 * /api/goals:
 *   post:
 *     tags: [Goals]
 *     summary: Create a goal
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GoalInput'
 *     responses:
 *       201:
 *         description: Goal created
 *   get:
 *     tags: [Goals]
 *     summary: List goals for a workspace
 *     parameters:
 *       - in: query
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of goals
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Goal'
 */

/**
 * @openapi
 * /api/goals/{id}:
 *   get:
 *     tags: [Goals]
 *     summary: Get goal by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Goal details
 *   put:
 *     tags: [Goals]
 *     summary: Update a goal
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
 *             $ref: '#/components/schemas/GoalInput'
 *     responses:
 *       200:
 *         description: Goal updated
 *   delete:
 *     tags: [Goals]
 *     summary: Delete a goal
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Goal deleted
 */

/**
 * @openapi
 * /api/goals/{id}/milestones:
 *   post:
 *     tags: [Goals]
 *     summary: Add a milestone to a goal
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MilestoneInput'
 *     responses:
 *       201:
 *         description: Milestone created
 */

/**
 * @openapi
 * /api/goals/{id}/activity:
 *   get:
 *     tags: [Goals]
 *     summary: Get activity feed for a goal
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Activity list
 */

module.exports = router;
