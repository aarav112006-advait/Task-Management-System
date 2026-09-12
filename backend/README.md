# 📋 Task Management System - Backend API

A production-grade, collaborative RESTful API for workspace task tracking, team collaborations, and recurring task scheduling built with **Node.js/Express**, **PostgreSQL**, **JWT Authentication**, and **Role-Based Access Control**.

---

## 🛠 Tech Stack

- **Runtime**: Node.js (>= 18.x)
- **Framework**: Express.js
- **Database**: PostgreSQL with `pg` connection pooling
- **Security**: JWT (JSON Web Tokens), `bcryptjs` password hashing, CORS
- **Logging & Utilities**: Morgan, Dotenv

---

## 🗄 Database Architecture (`schema.sql`)

1. **`users`**: User identities with hashed passwords and profile creation timestamps.
2. **`lists`**: Workspaces / task lists with custom colors and designated owners.
3. **`list_collaborators`**: Multi-tenant collaboration support with granular role permissions (`owner`, `editor`, `viewer`).
4. **`categories`**: User-defined classification tags with unique constraint per user.
5. **`tasks`**: Comprehensive task schema supporting:
   - Priority (`urgent`, `high`, `medium`, `low`)
   - Status (`todo`, `in_progress`, `completed`)
   - Due dates and reminders
   - Recurring task automation (`daily`, `weekly`, `monthly`, `custom` intervals, next occurrence tracker, parent-child linking)
6. **`task_assignees`**: Multi-assignee support per task.
7. **`task_activities`**: Immutable audit logs for task updates, status changes, and recurring generation events.

---

## 🚀 Setup & Execution

### 1. Configure PostgreSQL
Create a PostgreSQL database and execute the DDL migration script:
```bash
createdb task_management_db
psql -d task_management_db -f schema.sql
```

### 2. Environment Configuration
Copy `.env.example` to `.env` and fill in your connection credentials:
```bash
cp .env.example .env
```
Sample `.env`:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/task_management_db
JWT_SECRET=super_secret_jwt_key_replace_in_production_32chars!
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
```

### 3. Install Dependencies & Start Server
```bash
npm install

# Start in development mode (with nodemon)
npm run dev

# Or start in production mode
npm start
```

---

## 📡 API Endpoints Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Register new user with auto-generated default workspace | Public |
| POST | `/api/auth/login` | Authenticate user and receive Bearer JWT token | Public |
| GET | `/api/auth/profile` | Get current authenticated user profile | Required |

### Workspaces & Lists (`/api/lists`)
| Method | Endpoint | Description | Role / Permission |
|---|---|---|---|
| GET | `/api/lists` | List all workspaces owned or collaborated on | Authenticated |
| POST | `/api/lists` | Create a new workspace/list | Authenticated |
| GET | `/api/lists/:id` | Get list details and collaborators list | Viewer+ |
| PUT | `/api/lists/:id` | Update list metadata (title, description, color) | Editor+ |
| DELETE | `/api/lists/:id` | Delete list and cascade delete tasks | Owner only |
| POST | `/api/lists/:id/collaborators` | Invite/add collaborator with role | Owner only |
| DELETE | `/api/lists/:id/collaborators/:userId` | Remove collaborator from list | Owner only |

### Tasks (`/api/tasks`)
| Method | Endpoint | Description | Role / Permission |
|---|---|---|---|
| GET | `/api/tasks` | Get tasks with filters (`list_id`, `status`, `priority`, `category_id`, `due_date_from`, `due_date_to`, `assigned_to_me`, `search`) | Authenticated |
| POST | `/api/tasks` | Create task with optional assignees and recurrence rules | Editor+ |
| GET | `/api/tasks/:id` | Get task details, assignees, and activity history | Viewer+ |
| PUT | `/api/tasks/:id` | Update task fields (auto-spawns next occurrence if completed) | Editor+ |
| PATCH | `/api/tasks/:id/complete` | Complete task and automatically instantiate next recurring task | Editor+ |
| DELETE | `/api/tasks/:id` | Delete task | Editor+ |

### Categories / Tags (`/api/categories`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/categories` | Get user's custom categories | Required |
| POST | `/api/categories` | Create or update category | Required |
| DELETE | `/api/categories/:id` | Delete category | Required |

---

## 🔄 Recurring Task Engine

- **Service (`services/recurringTaskService.js`)**:
  Calculates next occurrence times for `daily`, `weekly`, `monthly`, or `custom` intervals and creates the next task instance while preserving assignees and audit trail links.
- **Background Scheduler (`services/schedulerService.js`)**:
  Lightweight interval worker scanning for due occurrences and scheduling freshness.
