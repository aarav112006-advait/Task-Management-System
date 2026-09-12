import React, { useState } from "react";
import { useTasks } from "../context/TaskContext";
import { useAuth } from "../context/AuthContext";
import { Search, Plus, Users, X, ChevronDown } from "./Icons";

const Navbar = ({ onOpenNewTask, onOpenCollaborators }) => {
  const {
    activeList,
    activeFilter,
    searchQuery,
    setSearchQuery,
    filteredTasks,
  } = useTasks();
  const { user } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const getHeaderTitle = () => {
    if (activeList) return activeList.name;
    switch (activeFilter) {
      case "today":
        return "Today's Priorities";
      case "upcoming":
        return "Upcoming Tasks";
      case "completed":
        return "Completed Tasks";
      case "shared":
        return "Shared Workspaces";
      default:
        return "All Active Tasks";
    }
  };

  return (
    <header className="navbar">
      {/* Title & Stats */}
      <div className="navbar-title-area">
        <h1 className="navbar-title">{getHeaderTitle()}</h1>
        <span className="navbar-stats-pill">
          {filteredTasks.length} {filteredTasks.length === 1 ? "task" : "tasks"}
        </span>
      </div>

      {/* Global Search Bar */}
      <div className="navbar-search">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          placeholder="Search tasks, categories, assignees..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        {searchQuery && (
          <button
            className="search-clear-btn"
            onClick={() => setSearchQuery("")}
            title="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Right Controls */}
      <div className="navbar-actions">
        {activeList && (
          <div className="collaborator-pill-group">
            <div className="avatar-stack">
              {(activeList.collaborators || []).slice(0, 3).map((collab) => (
                <img
                  key={collab.id}
                  src={collab.avatar}
                  alt={collab.name}
                  title={`${collab.name} (${collab.role})`}
                  className="collaborator-avatar"
                />
              ))}
              {(activeList.collaborators || []).length > 3 && (
                <span className="avatar-overflow">
                  +{activeList.collaborators.length - 3}
                </span>
              )}
            </div>
            <button
              className="btn-invite"
              onClick={onOpenCollaborators}
              title="Manage workspace members"
            >
              <Users size={14} />
              <span>Invite</span>
            </button>
          </div>
        )}

        <button className="btn-primary" onClick={onOpenNewTask}>
          <Plus size={16} />
          <span>Add Task</span>
        </button>

        <div className="profile-dropdown-container">
          <button
            className="profile-btn"
            onClick={() => setShowProfileMenu((prev) => !prev)}
          >
            <img
              src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"}
              alt={user?.name}
              className="navbar-user-avatar"
            />
            <ChevronDown size={14} />
          </button>

          {showProfileMenu && (
            <div className="profile-dropdown-menu">
              <div className="dropdown-user-header">
                <strong>{user?.name || "Aarav Patel"}</strong>
                <span>{user?.email || "aarav112006@gmail.com"}</span>
              </div>
              <div className="dropdown-divider" />
              <div className="dropdown-item-info">
                <span>Workspace Access</span>
                <span className="badge-pro">Admin Pro</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;