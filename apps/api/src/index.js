const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');

// Load environment variables
require('dotenv').config();

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Swagger API Docs
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Team Hub API Docs',
}));
app.get('/api/docs.json', (req, res) => res.json(swaggerSpec));

/**
 * @openapi
 * /api/health:
 *   get:
 *     tags: [Health]
 *     summary: Server health check
 *     security: []
 *     responses:
 *       200:
 *         description: Server is running
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount route handlers
app.use('/api/auth', require('./routes/auth'));
app.use('/api/workspaces', require('./routes/workspaces'));
app.use('/api/invitations', require('./routes/invitations'));
app.use('/api/goals', require('./routes/goals'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/actionItems', require('./routes/actionItems'));

// TODO: Initialize Socket.io
// const { Server } = require('socket.io');
// const io = new Server(server, {
//   cors: { origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true },
// });

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 API server running on port ${PORT}`);
});
