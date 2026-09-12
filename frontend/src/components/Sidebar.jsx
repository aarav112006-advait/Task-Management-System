import React, { useState } from "react";
import { useTasks } from "../context/TaskContext";
import { useAuth } from "../context/AuthContext";
import {
  Calendar,
  Clock,
  CheckCircle2,
  Users,
  FolderPlus,
  Plus,
  Layers,
  Trash2,
  LogOut,
} from "./Icons";

const Sidebar = ({ onOpenNewTask, onOpenCollaborators }) => {
  const {
    lists,
    activeListId,
    setActiveListId,
    activeFilter,
    setActiveFilter,
    categories,
    selectedCategory,
    setSelectedCategory,
    taskCounts,
    createList,
    deleteList,
  } = useTasks();
  const { user, logout } = useAuth();

  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListColor, setNewListColor] = useState("#6366f1");

  const colors = ["#6366f1", "#ec4899", "#10b981", "#f59e0b", "#3b82f6", "#ef4444"];

  const handleCreateList = (e) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    createList(newListName.trim(), newListColor);
    setNewListName("");
    setIsCreatingList(false);
  };

  const navItems = [
    { id: "all", label: "All Tasks", icon: Layers, count: taskCounts.all },
    { id: "today", label: "Today", icon: Clock, count: taskCounts.today },
    { id: "upcoming", label: "Upcoming", icon: Calendar, count: taskCounts.upcoming },
    { id: "completed", label: "Completed", icon: CheckCircle2, count: taskCounts.completed },
    { id: "shared", label: "Shared with Me", icon: Users, count: taskCounts.shared },
  ];

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="brand-logo">
          <span className="brand-icon">✓</span>
          <span className="brand-name">TaskFlow</span>
        </div>
        <button
          className="btn-quick-add"
          onClick={onOpenNewTask}
          title="Create task"
        >
          <Plus size={16} />
          <span>New Task</span>
        </button>
      </div>

      {/* Main Navigation */}
      <div className="sidebar-section">
        <div className="section-label">OVERVIEW</div>
        <nav className="nav-list">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeFilter === item.id && activeListId === "all";
            return (
              <button
                key={item.id}
                className={`nav-item ${isActive ? "active" : ""}`}
                onClick={() => {
                  setActiveFilter(item.id);
                  setActiveListId("all");
                }}
              >
                <span className="nav-item-icon">
                  <Icon size={16} />
                </span>
                <span className="nav-item-label">{item.label}</span>
                {item.count > 0 && (
                  <span className={`nav-badge ${item.id === "today" ? "badge-today" : ""}`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Workspaces / Lists */}
      <div className="sidebar-section">
        <div className="section-header-flex">
          <span className="section-label">WORKSPACES</span>
          <button
            className="btn-icon-subtle"
            onClick={() => setIsCreatingList((prev) => !prev)}
            title="Add Workspace"
          >
            <FolderPlus size={14} />
          </button>
        </div>

        {isCreatingList && (
          <form onSubmit={handleCreateList} className="new-list-form">
            <input
              type="text"
              placeholder="Workspace name..."
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              autoFocus
              className="input-sm"
            />
            <div className="color-picker-row">
              {colors.map((c) => (
                <span
                  key={c}
                  className={`color-dot-select ${newListColor === c ? "selected" : ""}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setNewListColor(c)}
                />
              ))}
            </div>
            <div className="form-actions-row">
              <button type="button" className="btn-text-sm" onClick={() => setIsCreatingList(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary-sm">
                Create
              </button>
            </div>
          </form>
        )}

        <div className="workspace-list">
          {lists.map((list) => {
            const isActive = activeListId === list.id;
            return (
              <div
                key={list.id}
                className={`workspace-item ${isActive ? "active" : ""}`}
                onClick={() => {
                  setActiveListId(list.id);
                  setActiveFilter("all");
                }}
              >
                <span className="workspace-dot" style={{ backgroundColor: list.color }} />
                <span className="workspace-name">{list.name}</span>
                {list.isShared && (
                  <span className="shared-indicator" title="Shared workspace">
                    <Users size={12} />
                  </span>
                )}
                {lists.length > 1 && (
                  <button
                    className="btn-delete-workspace"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Delete workspace "${list.name}"?`)) {
                        deleteList(list.id);
                      }
                    }}
                    title="Delete workspace"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Categories Filter */}
      <div className="sidebar-section">
        <div className="section-label">CATEGORIES</div>
        <div className="category-tags">
          <button
            className={`category-pill ${selectedCategory === "all" ? "active" : ""}`}
            onClick={() => setSelectedCategory("all")}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`category-pill ${selectedCategory === cat.name ? "active" : ""}`}
              onClick={() =>
                setSelectedCategory((prev) => (prev === cat.name ? "all" : cat.name))
              }
            >
              <span className="cat-color-dot" style={{ backgroundColor: cat.color }} />
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* User Footer Profile */}
      <div className="sidebar-footer">
        <div className="user-profile-badge">
          <img
            src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"}
            alt={user?.name}
            className="user-avatar-sm"
          />
          <div className="user-info-text">
            <span className="user-name">{user?.name || "Aarav Patel"}</span>
            <span className="user-role">{user?.role || "Developer"}</span>
          </div>
        </div>
        <button className="btn-logout" onClick={logout} title="Sign Out">
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;