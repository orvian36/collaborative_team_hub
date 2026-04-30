// TODO: Announcement routes
const express = require('express');
const router = express.Router();

/**
 * @openapi
 * /api/announcements:
 *   post:
 *     tags: [Announcements]
 *     summary: Create an announcement
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AnnouncementInput'
 *     responses:
 *       201:
 *         description: Announcement created
 *   get:
 *     tags: [Announcements]
 *     summary: List announcements for a workspace
 *     parameters:
 *       - in: query
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of announcements
 */

/**
 * @openapi
 * /api/announcements/{id}:
 *   put:
 *     tags: [Announcements]
 *     summary: Update an announcement
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
 *             $ref: '#/components/schemas/AnnouncementInput'
 *     responses:
 *       200:
 *         description: Announcement updated
 */

/**
 * @openapi
 * /api/announcements/{id}/pin:
 *   put:
 *     tags: [Announcements]
 *     summary: Pin or unpin an announcement
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pin status toggled
 */

/**
 * @openapi
 * /api/announcements/{id}/comments:
 *   post:
 *     tags: [Announcements]
 *     summary: Add a comment to an announcement
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
 *             $ref: '#/components/schemas/CommentInput'
 *     responses:
 *       201:
 *         description: Comment added
 */

/**
 * @openapi
 * /api/announcements/{id}/reactions:
 *   post:
 *     tags: [Announcements]
 *     summary: Add a reaction to an announcement
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
 *             $ref: '#/components/schemas/ReactionInput'
 *     responses:
 *       201:
 *         description: Reaction added
 */

module.exports = router;
