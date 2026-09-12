export const initialUser = {
  id: "usr_001",
  name: "Aarav Patel",
  email: "aarav112006@gmail.com",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
  role: "Lead Architect",
};

export const initialCategories = [
  { id: "cat_1", name: "Engineering", color: "#3b82f6" },
  { id: "cat_2", name: "UI/UX Design", color: "#ec4899" },
  { id: "cat_3", name: "Product Strategy", color: "#8b5cf6" },
  { id: "cat_4", name: "Marketing & Launch", color: "#10b981" },
  { id: "cat_5", name: "Personal", color: "#f59e0b" },
];

export const initialLists = [
  {
    id: "list_1",
    name: "Engineering Sprint 14",
    color: "#6366f1",
    isShared: true,
    collaborators: [
      { id: "usr_001", name: "Aarav Patel", email: "aarav112006@gmail.com", role: "Owner", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150" },
      { id: "usr_002", name: "Ira Rai", email: "ira.rai@example.com", role: "Editor", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150" },
      { id: "usr_003", name: "Vikram Sharma", email: "vikram.s@example.com", role: "Viewer", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150" },
    ],
  },
  {
    id: "list_2",
    name: "Mobile App Redesign",
    color: "#ec4899",
    isShared: true,
    collaborators: [
      { id: "usr_001", name: "Aarav Patel", email: "aarav112006@gmail.com", role: "Owner", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150" },
      { id: "usr_002", name: "Ira Rai", email: "ira.rai@example.com", role: "Editor", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150" },
    ],
  },
  {
    id: "list_3",
    name: "Personal Growth & Studies",
    color: "#10b981",
    isShared: false,
    collaborators: [
      { id: "usr_001", name: "Aarav Patel", email: "aarav112006@gmail.com", role: "Owner", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150" },
    ],
  },
];

export const initialTasks = [
  {
    id: "tsk_101",
    title: "Implement WebSocket connection pool for real-time sync",
    description: "Ensure multi-client heartbeats, room isolation, and graceful reconnection handling on mobile networks.",
    status: "in_progress",
    priority: "urgent",
    category: "Engineering",
    dueDate: new Date(Date.now() + 86400000).toISOString().split("T")[0], // Tomorrow
    isRecurring: false,
    recurrenceRule: null,
    assignee: {
      name: "Aarav Patel",
      email: "aarav112006@gmail.com",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
    },
    listId: "list_1",
    createdAt: new Date().toISOString(),
  },
  {
    id: "tsk_102",
    title: "Weekly Architecture & API Review",
    description: "Review database schemas, indexing latency, and security headers with team leads.",
    status: "todo",
    priority: "high",
    category: "Product Strategy",
    dueDate: new Date().toISOString().split("T")[0], // Today
    isRecurring: true,
    recurrenceRule: {
      frequency: "weekly",
      interval: 1,
    },
    assignee: {
      name: "Ira Rai",
      email: "ira.rai@example.com",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
    },
    listId: "list_1",
    createdAt: new Date().toISOString(),
  },
  {
    id: "tsk_103",
    title: "Figma Dark Mode Design Tokens Audit",
    description: "Audit high-contrast accessibility compliance (WCAG AAA) across primary button variants and badges.",
    status: "todo",
    priority: "medium",
    category: "UI/UX Design",
    dueDate: new Date(Date.now() + 259200000).toISOString().split("T")[0], // In 3 days
    isRecurring: false,
    recurrenceRule: null,
    assignee: {
      name: "Ira Rai",
      email: "ira.rai@example.com",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
    },
    listId: "list_2",
    createdAt: new Date().toISOString(),
  },
  {
    id: "tsk_104",
    title: "Daily Standup Notes & Blocker Resolution",
    description: "Consolidate morning standup commitments, track blocker resolution tickets, and update board status.",
    status: "completed",
    priority: "low",
    category: "Engineering",
    dueDate: new Date(Date.now() - 86400000).toISOString().split("T")[0], // Yesterday
    isRecurring: true,
    recurrenceRule: {
      frequency: "daily",
      interval: 1,
    },
    assignee: {
      name: "Vikram Sharma",
      email: "vikram.s@example.com",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
    },
    listId: "list_1",
    createdAt: new Date().toISOString(),
  },
  {
    id: "tsk_105",
    title: "Machine Learning Paper Summary: Attention Heads in Transformers",
    description: "Prepare two-page synthesis on efficient attention mechanisms and sparse multi-head caching.",
    status: "todo",
    priority: "medium",
    category: "Personal",
    dueDate: new Date(Date.now() + 432000000).toISOString().split("T")[0], // In 5 days
    isRecurring: false,
    recurrenceRule: null,
    assignee: {
      name: "Aarav Patel",
      email: "aarav112006@gmail.com",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
    },
    listId: "list_3",
    createdAt: new Date().toISOString(),
  },
];