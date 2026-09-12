import React, { useState, useEffect } from "react";
import { useTasks } from "../context/TaskContext";
import { useAuth } from "../context/AuthContext";
import { X, Calendar, AlertCircle, Repeat } from "./Icons";

const TaskModal = ({ isOpen, onClose, taskToEdit }) => {
  const { lists, activeListId, categories, createTask, updateTask } = useTasks();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [listId, setListId] = useState("list_1");
  const [priority, setPriority] = useState("medium");
  const [category, setCategory] = useState("Engineering");
  const [dueDate, setDueDate] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState("weekly");
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title || "");
      setDescription(taskToEdit.description || "");
      setListId(taskToEdit.listId || lists[0]?.id || "list_1");
      setPriority(taskToEdit.priority || "medium");
      setCategory(taskToEdit.category || categories[0]?.name || "Engineering");
      setDueDate(taskToEdit.dueDate || "");
      setIsRecurring(!!taskToEdit.isRecurring);
      if (taskToEdit.recurrenceRule) {
        setRecurrenceFrequency(taskToEdit.recurrenceRule.frequency || "weekly");
        setRecurrenceInterval(taskToEdit.recurrenceRule.interval || 1);
      }
    } else {
      setTitle("");
      setDescription("");
      setListId(activeListId !== "all" ? activeListId : lists[0]?.id || "list_1");
      setPriority("medium");
      setCategory(categories[0]?.name || "Engineering");
      setDueDate(new Date().toISOString().split("T")[0]);
      setIsRecurring(false);
      setRecurrenceFrequency("weekly");
      setRecurrenceInterval(1);
    }
  }, [taskToEdit, isOpen, activeListId, lists, categories]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const payload = {
      title: title.trim(),
      description: description.trim(),
      listId,
      priority,
      category,
      dueDate: dueDate || null,
      isRecurring,
      recurrenceFrequency,
      recurrenceInterval,
      assignee: {
        name: user?.name || "Aarav Patel",
        email: user?.email || "aarav112006@gmail.com",
        avatar: user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
      },
    };

    if (taskToEdit) {
      updateTask(taskToEdit.id, payload);
    } else {
      createTask(payload);
    }

    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2>{taskToEdit ? "Edit Task" : "Create New Task"}</h2>
          <button className="btn-close-modal" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Title */}
          <div className="form-group">
            <label>Task Title *</label>
            <input
              type="text"
              placeholder="e.g. Refactor Redis PubSub client"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
              className="input-primary"
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label>Description (Markdown supported)</label>
            <textarea
              rows={3}
              placeholder="Add key deliverables, acceptance criteria, or links..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="textarea-primary"
            />
          </div>

          {/* Grid row: Workspace & Category */}
          <div className="form-grid-2">
            <div className="form-group">
              <label>Workspace / List</label>
              <select
                value={listId}
                onChange={(e) => setListId(e.target.value)}
                className="select-primary"
              >
                {lists.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="select-primary"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid row: Priority & Due Date */}
          <div className="form-grid-2">
            <div className="form-group">
              <label>Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="select-primary"
              >
                <option value="urgent">🔴 Urgent (Immediate Action)</option>
                <option value="high">🟠 High Priority</option>
                <option value="medium">🟡 Medium Priority</option>
                <option value="low">🔵 Low Priority</option>
              </select>
            </div>

            <div className="form-group">
              <label>Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="input-primary"
              />
            </div>
          </div>

          {/* Recurrence Schedule Section */}
          <div className="recurrence-box">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
              />
              <span className="checkbox-text">
                <Repeat size={14} className="inline-icon" /> Set as Recurring Task
              </span>
            </label>

            {isRecurring && (
              <div className="recurrence-fields">
                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Frequency</label>
                    <select
                      value={recurrenceFrequency}
                      onChange={(e) => setRecurrenceFrequency(e.target.value)}
                      className="select-sm"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Interval (every X frequency)</label>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={recurrenceInterval}
                      onChange={(e) => setRecurrenceInterval(e.target.value)}
                      className="input-sm"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {taskToEdit ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;