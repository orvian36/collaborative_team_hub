# Collaborative Team Hub

Full-stack collaboration platform built for the **FredoCloud Technical Assessment**. This platform enables teams to manage shared goals, track action items via Kanban, and communicate through real-time announcements and notifications.

## 🚀 Live Demo & Documentation

- **Web App:** [collaborativeteamhub-production.up.railway.app](https://collaborativeteamhub-production.up.railway.app/)
- **API Server:** [adventurous-learning-production-da09.up.railway.app](https://adventurous-learning-production-da09.up.railway.app/)
- **Interactive API Docs:** [adventurous-learning-production-da09.up.railway.app/api/docs](https://adventurous-learning-production-da09.up.railway.app/api/docs) (Swagger UI)

## 🔑 Demo Accounts

| Email | Password | Role |
| :--- | :--- | :--- |
| `admin@demo.com` | `demo1234` | Administrator |
| `iris@demo.com` | `demo1234` | Administrator |
| `alice@demo.com` | `demo1234` | Member |
| `bob@demo.com` | `demo1234` | Member |

---

## ✨ Features

### 🏢 Workspace Isolation & Auth
- **Multi-tenancy**: Create or join multiple isolated workspaces.
- **Secure Auth**: JWT access tokens (15m) + rotated refresh tokens (7d) stored in secure `httpOnly` cookies.
- **Invitations**: Invite members by email with unique token-based join links.
- **Profiles**: Personalized user profiles with Cloudinary-backed avatar uploads.

### 🎯 Goal & Milestone Tracking
- **Interactive Goals**: Set titles, owners, and due dates with a dedicated activity feed for every goal.
- **Manual Milestones**: Break goals down into steps with manual progress sliders and completion toggles.
- **Progress Visualization**: Automatic goal progress calculation based on milestone completion.

### 📢 Announcements & Team Chat
- **Rich Text Editor**: Powered by TipTap for beautiful, sanitized announcements.
- **Engagement**: Nested comments and emoji reactions (live updates).
- **Mentions**: `@mention` teammates to trigger instant notifications.
- **Pinning**: Keep critical updates at the top of the feed.

### 📋 Action Items (Kanban)
- **Kanban Board**: Drag-and-drop task management powered by `@dnd-kit`.
- **Task Detail**: Manage priority (Low-Urgent), assignees, and parent goal associations.
- **List View**: Alternative table view for high-density task management.

### ⚡ Real-time & Activity
- **Live Engine**: Socket.io broadcasts every update (goals, tasks, reactions) instantly.
- **Presence**: Real-time "Who's Online" avatars in the workspace header.
- **Notifications**: Integrated notification center for mentions, assignments, and invites.
- **Audit Log**: An immutable, append-only activity log for every mutation in the workspace.

### 📊 Analytics & Reporting
- **Data Insights**: Visual charts (Recharts) showing goal completion trends over 6 months.
- **Stats Tiles**: Instant counts of overdue tasks, active goals, and team members.
- **Exports**: Export workspace data (Goals, Action Items, Audit Log) to CSV for offline reporting.

---

## 🛠️ Tech Stack

- **Monorepo**: Turborepo
- **Frontend**: Next.js 16 (App Router), React 19, Zustand, Tailwind CSS
- **Backend**: Node.js, Express, Prisma (PostgreSQL), Socket.io
- **Infrastructure**: Cloudinary (Media), Nodemailer (Email), Railway (Deployment)

---

## 🚀 Local Setup

1. **Clone & Install**:
   ```bash
   git clone https://github.com/orvian36/collaborative_team_hub.git
   npm install
   ```

2. **Database Setup**:
   Ensure PostgreSQL is running and set `DATABASE_URL` in `apps/api/.env`.
   ```bash
   npm run db:migrate --workspace=@team-hub/api
   npm run db:seed --workspace=@team-hub/api
   ```

3. **Start Development**:
   ```bash
   npm run dev
   ```
   Access the web app at `http://localhost:3000`.

---

## 💎 Advanced Implementation Details

1. **Optimistic UI**: High-frequency actions (reactions, Kanban moves) reflect instantly in the UI with automatic rollback on server error.
2. **Capability Matrix**: A unified RBAC system in `packages/shared` that gates both API endpoints and UI elements from a single source of truth.
3. **PWA Support**: Fully installable as a mobile or desktop app via service workers.
4. **Command Palette**: Professional `Cmd+K` interface for quick navigation and actions.

---
**License:** MIT | Built by [orvian36](https://github.com/orvian36)
