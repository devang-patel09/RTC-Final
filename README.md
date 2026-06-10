# AI-Powered Bug Tracker & Project Management System

A production-grade, AI-powered bug tracking and project management platform built with the MERN stack. Combines Jira-style project management, Linear-inspired UX, GitHub integration, real-time collaboration, and OpenAI-powered bug analysis.

## Tech Stack

### Frontend
- React 18 + Vite
- Tailwind CSS (dark/light mode)
- React Router v6
- TanStack Query
- DND Kit (Kanban)
- Recharts (Analytics)
- Socket.io Client
- Framer Motion
- React Hook Form + Zod

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT (RS256) with refresh token rotation
- Socket.io (real-time)
- OpenAI SDK (GPT-4o)
- Cloudinary (file uploads)
- Nodemailer
- Node Cron
- Swagger API Docs

## Features

### Project Management
- Full CRUD for projects
- Sprint management (plan, start, complete, cancel)
- Team member management with roles (Admin, Developer, Tester)
- Member invitations

### Kanban Board
- Drag & drop with @dnd-kit
- 5 columns: Backlog, To Do, In Progress, In Review, Done
- Real-time sync via Socket.io
- Optimistic UI updates

### Bug Tracking
- Rich bug fields (severity, priority, status, attachments)
- Status workflow: Open → In Progress → In Review → Resolved → Closed
- File uploads to Cloudinary (PNG, JPG, PDF, TXT, LOG)
- Threaded comments with Markdown
- Activity log for all changes

### AI Integration (OpenAI GPT-4o)
- **Bug Explanation** - Root cause, impact, recommended actions
- **Fix Suggestions** - Code recommendations with prevention tips
- **Release Notes Generator** - Auto-generate from sprint data
- **Priority Detection** - Auto-classify priority with confidence scoring (>0.8 auto-applies)

### Real-Time Collaboration
- Socket.io events for all CRUD operations
- Online presence system
- Project-scoped rooms
- Live notifications

### GitHub Integration
- OAuth connection to repos
- Link PRs to bugs
- Auto-close bugs on PR merge (webhook)

### Analytics Dashboard
- Bug metrics (open/closed, resolution rate, avg resolution time)
- Sprint metrics (velocity, burndown, completion %)
- Team metrics (workload, assigned vs completed)
- Recharts visualizations

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas URI
- OpenAI API Key
- Cloudinary Account

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd bug-tracker

# Install all dependencies
npm run install:all

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Start development
npm run dev
```

### Environment Variables

See `.env.example` for all required variables.

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   │   ├── layout/     # Sidebar, Header
│   │   │   ├── auth/       # Auth forms
│   │   │   ├── dashboard/  # Dashboard widgets
│   │   │   ├── projects/   # Project components
│   │   │   ├── bugs/       # Bug components
│   │   │   ├── board/      # Kanban board
│   │   │   ├── ai/         # AI module UI
│   │   │   ├── analytics/  # Charts & metrics
│   │   │   ├── notifications/
│   │   │   └── settings/
│   │   ├── pages/          # Route pages
│   │   ├── services/       # API client
│   │   ├── store/          # Context providers
│   │   └── utils/          # Helpers
│   └── ...
├── server/                 # Express backend
│   ├── config/             # DB, cloudinary, env
│   ├── controllers/        # Route handlers
│   ├── middleware/         # Auth, validation, errors
│   ├── models/            # Mongoose schemas
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   ├── validators/        # Zod schemas
│   ├── utils/             # Helpers, swagger
│   ├── cron/              # Scheduled jobs
│   └── templates/         # Email templates
├── Dockerfile
├── docker-compose.yml
└── vercel.json
```

## API Documentation

When running, visit `http://localhost:5000/api-docs` for Swagger UI.

### API Prefix: `/api/v1`

**Auth:** `/auth/register`, `/auth/login`, `/auth/logout`, `/auth/refresh`, `/auth/verify`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/me`

**Projects:** `/projects` (CRUD), `/projects/:id/members`

**Bugs:** `/projects/:id/bugs` (CRUD, reorder, attachments, AI tools)

**Comments:** `/projects/:id/bugs/:bugId/comments`

**Sprints:** `/projects/:id/sprints` (CRUD, start, complete, cancel, stats)

**AI:** `/ai/explain`, `/ai/suggest-fix`, `/ai/summary`, `/ai/auto-priority`, `/ai/release-notes`

**Notifications:** `/notifications` (list, mark read, mark all read)

**Analytics:** `/analytics/user`, `/projects/:id/analytics`

## Deployment

### Vercel (Frontend)
```bash
cd client
npm run build
# Deploy client/dist to Vercel
```

### Railway (Backend)
```bash
# Deploy using Dockerfile
railway up
```

### Docker
```bash
docker-compose up -d
```

## Testing

```bash
# Backend tests
cd server && npm test

# Frontend tests
cd client && npm test
```

## License

MIT
