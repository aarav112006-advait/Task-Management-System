# 📋 TaskFlow — Collaborative Task Management Frontend

A modern, responsive, and collaborative task management frontend application built with **React 18**, **React Router v6**, **Axios**, and custom SVG/Lucide icon systems, styled with an interface inspired by Linear, Todoist, and Notion.

---

## 🚀 Key Features

1. **State Management & Context Architecture**:
   - **`AuthContext`**: Manages user authentication, token persistence in `localStorage`, automated 401 session expiration handling, and demo account access.
   - **`TaskContext`**: Complete state management for workspaces/lists, tasks CRUD, status workflows (`todo`, `in_progress`, `completed`), category tagging, due date filtering (Today, Upcoming, Overdue), and workspace collaborator assignments.

2. **Core UI Components**:
   - **`Sidebar`**: Workspaces switcher, inline list creator with custom accent color picker, quick navigation links (All Tasks, Today, Upcoming, Completed, Shared with Me) with dynamic task count badges, category tags, and user session profile footer.
   - **`Navbar`**: Real-time multi-attribute search (by task title, description, category, and assignee), active workspace title with task count badge, collaborator avatar stack with "+ Invite" button, primary "+ Add Task" button, and user profile dropdown.
   - **`TaskList`**: Status tab filter bar (All, To Do, In Progress, Completed), sorting selector (Due Date, Priority, Title, Date Created), and empty state views.
   - **`TaskCard`**: Custom checkbox with checkmark completion animation, task title (strikethrough when completed), expandable descriptions, priority badges (Urgent: red, High: orange, Medium: amber, Low: blue), category pills, due date badge with overdue warning highlight, recurrence frequency indicator, assignee avatar, and inline edit/delete action triggers.
   - **`TaskModal`**: Full create/edit dialog with inputs for title, description, workspace list, category, priority, due date, and **recurring schedule configuration** (is_recurring toggle, frequency [Daily, Weekly, Monthly, Custom], and interval).
   - **`CollaboratorModal`**: Teammate invite form with email input, role selector (`Editor`, `Viewer`), and active member list with role badges and access revocation.
   - **`AuthForm`**: Tabbed Login and Register views with validation, error banners, and a instant one-click demo login option.

3. **API & Offline Mock Fallback**:
   - `src/services/api.js`: Pre-configured Axios client with request interceptor for JWT injection and response interceptor for 401 unauthorization detection.
   - `src/data/mockData.js`: Out-of-the-box mock dataset with realistic workspaces, tasks, categories, and collaborators, ensuring immediate functionality even if the backend server is not currently running.

4. **Keyboard Shortcuts**:
   - `c` or `n`: Open new task modal.
   - `Escape`: Close active modals.

---

## 📁 Project Structure

```
task-management-system/frontend/
├── .env
├── .env.example
├── package.json
├── README.md
├── public/
│   └── index.html
└── src/
    ├── index.js
    ├── index.css
    ├── App.js
    ├── App.css
    ├── context/
    │   ├── AuthContext.js
    │   └── TaskContext.js
    ├── services/
    │   └── api.js
    ├── data/
    │   └── mockData.js
    └── components/
        ├── Icons.jsx
        ├── Sidebar.jsx
        ├── Navbar.jsx
        ├── TaskList.jsx
        ├── TaskCard.jsx
        ├── TaskModal.jsx
        ├── CollaboratorModal.jsx
        └── AuthForm.jsx
```

---

## 🛠 Setup & Installation

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default content:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 3. Start Application
```bash
npm start
```
The application will launch at `http://localhost:3000`.