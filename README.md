# Collaborative Team Hub

A full-stack web application where teams can manage shared goals, post announcements, and track action items in real time. Built as a Turborepo monorepo.

## Tech Stack

| Area | Technology |
|------|-----------|
| Monorepo | Turborepo |
| Frontend | Next.js 14+ (App Router, JavaScript) |
| Styling | Tailwind CSS |
| State | Zustand |
| Backend | Node.js + Express.js (REST API) |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT (access + refresh tokens in httpOnly cookies) |
| Real-time | Socket.io |
| File Storage | Cloudinary |
| Deployment | Railway |

## Project Structure

```
collaborative_team_hub/
├── apps/
│   ├── web/                  # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/          # App Router pages
│   │   │   ├── stores/       # Zustand stores
│   │   │   └── lib/          # Utilities
│   │   └── package.json
│   └── api/                  # Express.js backend
│       ├── src/
│       │   ├── routes/       # API route handlers
│       │   ├── middleware/   # Auth middleware
│       │   └── lib/          # Prisma client, helpers
│       ├── prisma/           # Prisma schema & migrations
│       └── package.json
├── packages/
│   └── shared/               # Shared constants & utils
│       └── src/index.js
├── turbo.json                # Turborepo pipeline config
├── package.json              # Root workspace config
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm 10+
- PostgreSQL running locally or a hosted instance

### Installation

```bash
# Install all dependencies (from root)
npm install
```

### Environment Variables

Copy the example env files and fill in your values:

```bash
# Backend
cp apps/api/.env.example apps/api/.env

# Frontend
cp apps/web/.env.example apps/web/.env.local
```

#### Backend (`apps/api/.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `CLIENT_URL` | Frontend URL for CORS |
| `PORT` | Server port (default: 5000) |

#### Frontend (`apps/web/.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL |
| `NEXT_PUBLIC_SOCKET_URL` | Socket.io server URL |

### Database Setup

```bash
# Generate Prisma client
npm run db:generate --workspace=@team-hub/api

# Push schema to database
npm run db:push --workspace=@team-hub/api
```

### Development

```bash
# Start all apps in development mode
npm run dev

# Start individual apps
npm run dev --workspace=@team-hub/web
npm run dev --workspace=@team-hub/api
```

### Build

```bash
# Build all apps
npm run build
```

## Advanced Features (Choose 2)

> TBD — Select two from the assignment document.

## Known Limitations

- Project is currently in scaffold/setup phase.
