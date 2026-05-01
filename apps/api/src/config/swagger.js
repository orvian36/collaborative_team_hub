const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Collaborative Team Hub API',
      version: '1.0.0',
      description: 'REST API for managing team workspaces, goals, announcements, and action items.',
      contact: { email: 'hiring@fredocloud.com' },
    },
    servers: [
      { url: 'http://localhost:5000', description: 'Development' },
    ],
    tags: [
      { name: 'Health', description: 'Server health check' },
      { name: 'Auth', description: 'Authentication & user profile' },
      { name: 'Workspaces', description: 'Workspace management & invitations' },
      { name: 'Goals', description: 'Goals & milestones' },
      { name: 'Announcements', description: 'Announcements, comments & reactions' },
      { name: 'Action Items', description: 'Action items (Kanban)' },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'accessToken',
        },
      },
      schemas: {
        // ── Auth ─────────────────────────────
        RegisterInput: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            password: { type: 'string', minLength: 6, example: 'secret123' },
          },
        },
        LoginInput: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            avatarUrl: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        // ── Workspace ────────────────────────
        WorkspaceInput: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', example: 'Engineering' },
            description: { type: 'string' },
            accentColor: { type: 'string', example: '#3b82f6' },
          },
        },
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
        InviteInput: {
          type: 'object',
          required: ['email', 'role'],
          properties: {
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['ADMIN', 'MEMBER'] },
          },
        },
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
        // ── Goal ─────────────────────────────
        GoalInput: {
          type: 'object',
          required: ['title', 'workspaceId'],
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            dueDate: { type: 'string', format: 'date-time' },
            workspaceId: { type: 'string', format: 'uuid' },
          },
        },
        Goal: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            description: { type: 'string' },
            status: { type: 'string', enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'] },
            dueDate: { type: 'string', format: 'date-time', nullable: true },
            ownerId: { type: 'string', format: 'uuid' },
            workspaceId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        MilestoneInput: {
          type: 'object',
          required: ['title'],
          properties: {
            title: { type: 'string' },
            progress: { type: 'integer', minimum: 0, maximum: 100 },
          },
        },
        // ── Announcement ─────────────────────
        AnnouncementInput: {
          type: 'object',
          required: ['title', 'content', 'workspaceId'],
          properties: {
            title: { type: 'string' },
            content: { type: 'string', description: 'Rich-text HTML' },
            workspaceId: { type: 'string', format: 'uuid' },
          },
        },
        Announcement: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            content: { type: 'string' },
            isPinned: { type: 'boolean' },
            authorId: { type: 'string', format: 'uuid' },
            workspaceId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        CommentInput: {
          type: 'object',
          required: ['content'],
          properties: { content: { type: 'string' } },
        },
        ReactionInput: {
          type: 'object',
          required: ['emoji'],
          properties: { emoji: { type: 'string', example: '👍' } },
        },
        // ── Action Item ──────────────────────
        ActionItemInput: {
          type: 'object',
          required: ['title', 'workspaceId'],
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
            status: { type: 'string', enum: ['TODO', 'IN_PROGRESS', 'DONE'] },
            dueDate: { type: 'string', format: 'date-time' },
            assigneeId: { type: 'string', format: 'uuid' },
            goalId: { type: 'string', format: 'uuid' },
            workspaceId: { type: 'string', format: 'uuid' },
          },
        },
        ActionItem: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            description: { type: 'string' },
            priority: { type: 'string' },
            status: { type: 'string' },
            dueDate: { type: 'string', format: 'date-time', nullable: true },
            assigneeId: { type: 'string', format: 'uuid', nullable: true },
            goalId: { type: 'string', format: 'uuid', nullable: true },
            workspaceId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
    security: [{ cookieAuth: [] }],
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js', './src/index.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
