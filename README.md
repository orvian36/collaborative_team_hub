# Collaborative Team Hub

## 📖 Project Overview
Full-stack collaboration platform designed for modern teams. This platform enables teams to manage shared goals, track action items via Kanban, and communicate through real-time announcements and notifications.

- **📽️ Demo Video:** [Watch the walkthrough](https://drive.google.com/file/d/1MFEl8d5774iaEqbFd043b2Y9jSYIapvh/view?usp=sharing)

### 🚀 Live Demo & Documentation
- **Web App:** [collaborativeteamhub-production.up.railway.app](https://collaborativeteamhub-production.up.railway.app/)
- **API Server:** [adventurous-learning-production-da09.up.railway.app](https://adventurous-learning-production-da09.up.railway.app/)
- **Interactive API Docs:** [adventurous-learning-production-da09.up.railway.app/api/docs](https://adventurous-learning-production-da09.up.railway.app/api/docs) (Swagger UI)



---

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 20+ and PostgreSQL 14+
- A Cloudinary account (for image uploads)

### Local Development
1. **Clone & Install**:
   ```bash
   git clone https://github.com/orvian36/collaborative_team_hub.git
   npm install
   ```

2. **Environment Configuration**:
   - Copy `apps/api/.env.example` to `apps/api/.env` and fill in your secrets.
   - Set up `apps/web/.env.local` with your local API/Socket URLs.

3. **Database Initialization**:
   ```bash
   npm run db:migrate --workspace=@team-hub/api
   npm run db:seed --workspace=@team-hub/api
   ```

4. **Start the Engines**:
   ```bash
   npm run dev # Runs api + web concurrently
   ```

---

## 🔑 Environment Variable Reference

### `apps/api/.env`
| Name | Required | Notes |
| :--- | :--- | :--- |
| `DATABASE_URL` | Yes | Postgres connection string |
| `JWT_ACCESS_SECRET` | Yes | Secret for access token signing |
| `JWT_REFRESH_SECRET` | Yes | Secret for refresh token signing |
| `CLOUDINARY_URL` | Yes | Cloudinary connection string for avatars/icons |
| `CLIENT_URL` | Yes | Web app URL (must match exactly for CORS/Cookies) |
| `SMTP_*` | Yes | SMTP credentials for email notifications (logs to console if unset) |

---

## 💎 Advanced Features Built

Out of the five proposed advanced features, the following two were chosen and fully implemented to demonstrate architectural depth:

### 1. 🚀 Optimistic UI (Zustand + React)
Every high-frequency interaction (emoji reactions, Kanban task movement, milestone progress, and announcement pinning) uses an optimistic update pattern. The UI reflects the change instantly and automatically reconciles or rolls back state if the server request fails.

### 2. 🔐 Advanced RBAC (Capability Matrix)
Implemented a centralized, decoupled Role-Based Access Control system in `@team-hub/shared`. 
- **Backend**: Middleware (`requirePermission`) enforces permissions at the route level.
- **Frontend**: Custom hooks (`useCapability`) and components (`<PermissionGate>`) gate UI elements based on the same source of truth, ensuring a consistent security posture across the entire stack.

---

## ⚠️ Known Limitations
- **Presence Persistence**: The real-time presence map is stored in-memory on the API server. In a production environment with horizontal scaling, this would require a Redis adapter for Socket.io.
- **PWA Offline Mode**: The PWA implementation is currently "shell-only." While the app is installable, it does not support offline data writes or a background sync queue.
- **Email Batching**: @mention notifications are sent per-event; the system does not currently support digest/batch notifications for high-volume threads.
- **Audit Log Retention**: The audit log is append-only and immutable but lacks a configured archival or TTL policy for long-term database management.

---
**License:** MIT | Built by [orvian36](https://github.com/orvian36)
