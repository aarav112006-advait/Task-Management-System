import React from "react";
import { useTasks } from "../context/TaskContext";
import TaskCard from "./TaskCard";
import { Filter, Plus } from "./Icons";

const TaskList = ({ onOpenNewTask, onEditTask }) => {
  const {
    filteredTasks,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    tasks,
    activeList,
  } = useTasks();

  const statusTabs = [
    { id: "all", label: "All Tasks" },
    { id: "todo", label: "To Do" },
    { id: "in_progress", label: "In Progress" },
    { id: "completed", label: "Completed" },
  ];

  return (
    <section className="task-list-container">
      {/* Control Bar: Status Tabs & Sort Selector */}
      <div className="task-control-bar">
        {/* Status Filter Tabs */}
        <div className="status-tabs">
          {statusTabs.map((tab) => {
            const count = tasks.filter((t) => {
              if (activeList && t.listId !== activeList.id) return false;
              if (tab.id === "all") return true;
              return t.status === tab.id;
            }).length;

            return (
              <button
                key={tab.id}
                className={`status-tab ${statusFilter === tab.id ? "active" : ""}`}
                onClick={() => setStatusFilter(tab.id)}
              >
                <span>{tab.label}</span>
                <span className="tab-count">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Sort selector */}
        <div className="sort-controls">
          <Filter size={14} className="sort-icon" />
          <span className="sort-label">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-dropdown"
          >
            <option value="dueDate">Due Date</option>
            <option value="priority">Priority</option>
            <option value="title">Alphabetical</option>
            <option value="createdAt">Date Created</option>
          </select>
        </div>
      </div>

      {/* Task Cards Stream */}
      {filteredTasks.length > 0 ? (
        <div className="task-cards-list">
          {filteredTasks.map((task) => (
            <TaskCard key={task.id} task={task} onEdit={onEditTask} />
          ))}
        </div>
      ) : (
        <div className="empty-tasks-placeholder">
          <div className="empty-icon-wrap">📋</div>
          <h3>No tasks found in this view</h3>
          <p>Create a new task or adjust your active filters and search query.</p>
          <button className="btn-primary" onClick={onOpenNewTask}>
            <Plus size={16} />
            <span>Create First Task</span>
          </button>
        </div>
      )}
    </section>
  );
};

export default TaskList;