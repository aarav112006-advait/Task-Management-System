import React, { useState } from "react";
import { useTasks } from "../context/TaskContext";
import { X, Users, Trash2, Check } from "./Icons";

const CollaboratorModal = ({ isOpen, onClose }) => {
  const { activeList, addCollaborator, removeCollaborator } = useTasks();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Viewer");
  const [invitedSuccess, setInvitedSuccess] = useState(false);

  if (!isOpen || !activeList) return null;

  const handleInvite = (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    addCollaborator(activeList.id, { email: email.trim(), role });
    setEmail("");
    setInvitedSuccess(true);
    setTimeout(() => setInvitedSuccess(false), 2500);
  };

  const collaborators = activeList.collaborators || [];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <h2>Workspace Collaborators</h2>
            <span className="workspace-subhead">{activeList.name}</span>
          </div>
          <button className="btn-close-modal" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Invite Form */}
        <form onSubmit={handleInvite} className="invite-form-box">
          <div className="invite-inputs-row">
            <input
              type="email"
              placeholder="Teammate's email address..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input-primary flex-1"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="select-primary w-32"
            >
              <option value="Editor">Editor</option>
              <option value="Viewer">Viewer</option>
            </select>
            <button type="submit" className="btn-primary">
              Invite
            </button>
          </div>
          {invitedSuccess && (
            <p className="invite-success-msg">
              <Check size={14} /> Invitation recorded!
            </p>
          )}
        </form>

        {/* Existing Members List */}
        <div className="collaborators-section">
          <h4>Active Members ({collaborators.length})</h4>
          <div className="collaborators-list">
            {collaborators.map((c) => (
              <div key={c.id} className="collaborator-row">
                <img src={c.avatar} alt={c.name} className="collab-avatar" />
                <div className="collab-info">
                  <span className="collab-name">{c.name}</span>
                  <span className="collab-email">{c.email}</span>
                </div>
                <span className={`role-badge role-${c.role.toLowerCase()}`}>
                  {c.role}
                </span>
                {c.role !== "Owner" && (
                  <button
                    className="btn-remove-collab"
                    onClick={() => removeCollaborator(activeList.id, c.id)}
                    title="Remove access"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default CollaboratorModal;