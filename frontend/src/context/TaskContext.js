import React, { createContext, useContext, useState, useMemo, useEffect } from "react";
import { initialLists, initialTasks, initialCategories } from "../data/mockData";
import { taskApi, listApi } from "../services/api";
import { useAuth } from "./AuthContext";

const TaskContext = createContext();

export const TaskProvider = ({ children }) => {
  const { user } = useAuth();
  const [lists, setLists] = useState(() => {
    const saved = localStorage.getItem("tf_lists");
    return saved ? JSON.parse(saved) : initialLists;
  });
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem("tf_tasks");
    return saved ? JSON.parse(saved) : initialTasks;
  });
  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem("tf_categories");
    return saved ? JSON.parse(saved) : initialCategories;
  });

  const [activeListId, setActiveListId] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all"); // "all", "today", "upcoming", "completed", "shared"
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all"); // "all", "todo", "in_progress", "completed"
  const [sortBy, setSortBy] = useState("dueDate"); // "dueDate", "priority", "title", "createdAt"
  const [searchQuery, setSearchQuery] = useState("");

  // Persist local state
  useEffect(() => {
    localStorage.setItem("tf_lists", JSON.stringify(lists));
  }, [lists]);

  useEffect(() => {
    localStorage.setItem("tf_tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem("tf_categories", JSON.stringify(categories));
  }, [categories]);

  // Current active workspace
  const activeList = useMemo(() => {
    if (activeListId === "all") return null;
    return lists.find((l) => l.id === activeListId) || null;
  }, [lists, activeListId]);

  // Priority ranking for sorting
  const priorityWeight = {
    urgent: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  // Filter and Sort Tasks
  const filteredTasks = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];

    return tasks.filter((task) => {
      // 1. List filter
      if (activeListId !== "all" && task.listId !== activeListId) {
        return false;
      }

      // 2. Navigation Quick Filter
      if (activeFilter === "today") {
        if (task.dueDate !== todayStr) return false;
      } else if (activeFilter === "upcoming") {
        if (!task.dueDate || task.dueDate <= todayStr || task.status === "completed") return false;
      } else if (activeFilter === "completed") {
        if (task.status !== "completed") return false;
      } else if (activeFilter === "shared") {
        const list = lists.find((l) => l.id === task.listId);
        if (!list || !list.isShared) return false;
      }

      // 3. Category Filter
      if (selectedCategory !== "all" && task.category !== selectedCategory) {
        return false;
      }

      // 4. Status Filter (from status tabs)
      if (statusFilter !== "all" && task.status !== statusFilter) {
        return false;
      }

      // 5. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesDesc = (task.description || "").toLowerCase().includes(query);
        const matchesCategory = (task.category || "").toLowerCase().includes(query);
        const matchesAssignee = task.assignee && task.assignee.name.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesCategory && !matchesAssignee) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "priority") {
        return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
      }
      if (sortBy === "dueDate") {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      }
      if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === "createdAt") {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      return 0;
    });
  }, [tasks, activeListId, activeFilter, selectedCategory, statusFilter, searchQuery, sortBy, lists]);

  // Counts for quick nav badges
  const taskCounts = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    return {
      all: tasks.filter((t) => t.status !== "completed").length,
      today: tasks.filter((t) => t.dueDate === todayStr && t.status !== "completed").length,
      upcoming: tasks.filter((t) => t.dueDate && t.dueDate > todayStr && t.status !== "completed").length,
      completed: tasks.filter((t) => t.status === "completed").length,
      shared: tasks.filter((t) => {
        const list = lists.find((l) => l.id === t.listId);
        return list && list.isShared && t.status !== "completed";
      }).length,
    };
  }, [tasks, lists]);

  // Task Actions
  const createTask = (taskData) => {
    const newTask = {
      id: "tsk_" + Math.random().toString(36).substr(2, 7),
      listId: taskData.listId || (activeListId !== "all" ? activeListId : lists[0]?.id || "list_1"),
      title: taskData.title,
      description: taskData.description || "",
      status: taskData.status || "todo",
      priority: taskData.priority || "medium",
      category: taskData.category || "General",
      dueDate: taskData.dueDate || null,
      isRecurring: !!taskData.isRecurring,
      recurrenceRule: taskData.isRecurring
        ? {
            frequency: taskData.recurrenceFrequency || "weekly",
            interval: Number(taskData.recurrenceInterval) || 1,
          }
        : null,
      assignee: taskData.assignee || {
        name: user?.name || "Aarav Patel",
        email: user?.email || "aarav112006@gmail.com",
        avatar: user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
      },
      createdAt: new Date().toISOString(),
    };

    setTasks((prev) => [newTask, ...prev]);

    // Optional API sync
    taskApi.createTask(newTask).catch((err) => console.log("Offline mode: created locally."));
    return newTask;
  };

  const updateTask = (id, updatedFields) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, ...updatedFields } : task))
    );
    taskApi.updateTask(id, updatedFields).catch(() => {});
  };

  const deleteTask = (id) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
    taskApi.deleteTask(id).catch(() => {});
  };

  const toggleCompleteTask = (id) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== id) return task;
        const newStatus = task.status === "completed" ? "todo" : "completed";
        return { ...task, status: newStatus };
      })
    );
  };

  // List Actions
  const createList = (name, color = "#6366f1") => {
    const newList = {
      id: "list_" + Math.random().toString(36).substr(2, 6),
      name,
      color,
      isShared: false,
      collaborators: [
        {
          id: user?.id || "usr_001",
          name: user?.name || "Aarav Patel",
          email: user?.email || "aarav112006@gmail.com",
          role: "Owner",
          avatar: user?.avatar,
        },
      ],
    };
    setLists((prev) => [...prev, newList]);
    setActiveListId(newList.id);
    return newList;
  };

  const deleteList = (listId) => {
    setLists((prev) => prev.filter((l) => l.id !== listId));
    setTasks((prev) => prev.filter((t) => t.listId !== listId));
    if (activeListId === listId) {
      setActiveListId("all");
    }
  };

  // Collaborator Actions
  const addCollaborator = (listId, { email, role = "Viewer", name }) => {
    const assignedName = name || email.split("@")[0];
    const newCollaborator = {
      id: "usr_" + Math.random().toString(36).substr(2, 6),
      name: assignedName,
      email,
      role,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(assignedName)}`,
    };

    setLists((prev) =>
      prev.map((list) => {
        if (list.id !== listId) return list;
        return {
          ...list,
          isShared: true,
          collaborators: [...(list.collaborators || []), newCollaborator],
        };
      })
    );
  };

  const removeCollaborator = (listId, collaboratorId) => {
    setLists((prev) =>
      prev.map((list) => {
        if (list.id !== listId) return list;
        const updatedCollaborators = (list.collaborators || []).filter(
          (c) => c.id !== collaboratorId
        );
        return {
          ...list,
          isShared: updatedCollaborators.length > 1,
          collaborators: updatedCollaborators,
        };
      })
    );
  };

  return (
    <TaskContext.Provider
      value={{
        lists,
        tasks,
        categories,
        activeListId,
        setActiveListId,
        activeList,
        activeFilter,
        setActiveFilter,
        selectedCategory,
        setSelectedCategory,
        statusFilter,
        setStatusFilter,
        sortBy,
        setSortBy,
        searchQuery,
        setSearchQuery,
        filteredTasks,
        taskCounts,
        createTask,
        updateTask,
        deleteTask,
        toggleCompleteTask,
        createList,
        deleteList,
        addCollaborator,
        removeCollaborator,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => useContext(TaskContext);