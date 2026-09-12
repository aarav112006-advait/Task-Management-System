import React, { useState } from "react";
import { useTasks } from "../context/TaskContext";
import {
  Calendar,
  Clock,
  Repeat,
  AlertCircle,
  Check,
  Trash2,
  Edit3,
} from "./Icons";

const TaskCard = ({ task, onEdit }) => {
  const { toggleCompleteTask, deleteTask } = useTasks();
  const [isExpanded, setIsExpanded] = useState(false);

  const isCompleted = task.status === "completed";

  // Check if overdue
  const todayStr = new Date().toISOString().split("T")[0];
  const isOverdue = task.dueDate && task.dueDate < todayStr && !isCompleted;

  // Format Due Date cleanly
  const formatDueDate = (dateStr) => {
    if (!dateStr) return null;
    if (dateStr === todayStr) return "Today";
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    if (dateStr === tomorrowStr) return "Tomorrow";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
    return dateStr;
  };

  const priorityStyles = {
    urgent: { label: "Urgent", badgeClass: "priority-urgent" },
    high: { label: "High", badgeClass: "priority-high" },
    medium: { label: "Medium", badgeClass: "priority-medium" },
    low: { label: "Low", badgeClass: "priority-low" },
  };

  const currentPriority = priorityStyles[task.priority] || priorityStyles.medium;

  return (
    <div className={`task-card ${isCompleted ? "task-completed" : ""} ${isOverdue ? "task-overdue" : ""}`}>
      {/* Left: Custom Checkbox */}
      <button
        className={`task-checkbox ${isCompleted ? "checked" : ""}`}
        onClick={() => toggleCompleteTask(task.id)}
        aria-label="Toggle Complete"
      >
        {isCompleted && <Check size={12} strokeWidth={3} />}
      </button>

      {/* Center: Main Task Details */}
      <div className="task-content-wrapper" onClick={() => setIsExpanded((prev) => !prev)}>
        <div className="task-header-row">
          <h3 className="task-title">{task.title}</h3>
          
          {/* Priority Badge */}
          <span className={`priority-badge ${currentPriority.badgeClass}`}>
            {task.priority === "urgent" && <AlertCircle size={12} />}
            <span>{currentPriority.label}</span>
          </span>
        </div>

        {/* Optional Description */}
        {task.description && (
          <p className={`task-description ${isExpanded ? "expanded" : ""}`}>
            {task.description}
          </p>
        )}

        {/* Metadata Badges Footer */}
        <div className="task-meta-row">
          {/* Category Pill */}
          {task.category && (
            <span className="task-category-pill">
              {task.category}
            </span>
          )}

          {/* Due Date Indicator */}
          {task.dueDate && (
            <span className={`task-due-badge ${isOverdue ? "due-overdue" : ""}`}>
              <Calendar size={13} />
              <span>{formatDueDate(task.dueDate)}</span>
            </span>
          )}

          {/* Recurrence Indicator */}
          {task.isRecurring && (
            <span className="task-recurring-badge" title={`Repeats: ${task.recurrenceRule?.frequency || "Custom"}`}>
              <Repeat size={12} />
              <span>{task.recurrenceRule?.frequency || "Recurring"}</span>
            </span>
          )}

          {/* Status Indicator */}
          <span className={`status-pill status-${task.status}`}>
            {task.status === "in_progress" ? "In Progress" : task.status === "completed" ? "Done" : "To Do"}
          </span>
        </div>
      </div>

      {/* Right Actions: Assignee Avatar & Buttons */}
      <div className="task-actions-wrapper">
        {task.assignee && (
          <img
            src={task.assignee.avatar}
            alt={task.assignee.name}
            title={`Assigned to ${task.assignee.name}`}
            className="assignee-avatar-sm"
          />
        )}

        <div className="action-buttons-group">
          <button
            className="btn-card-action"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
            title="Edit task"
          >
            <Edit3 size={14} />
          </button>
          <button
            className="btn-card-action text-danger"
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm(`Delete task "${task.title}"?`)) {
                deleteTask(task.id);
              }
            }}
            title="Delete task"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;