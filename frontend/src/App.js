import React, { useState, useEffect } from "react";
import "./App.css";
import { useAuth } from "./context/AuthContext";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import TaskList from "./components/TaskList";
import TaskModal from "./components/TaskModal";
import CollaboratorModal from "./components/CollaboratorModal";
import AuthForm from "./components/AuthForm";

function App() {
  const { isAuthenticated } = useAuth();

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [isCollabModalOpen, setIsCollabModalOpen] = useState(false);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing in input or textarea
      if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;

      if (e.key === "c" || e.key === "C" || e.key === "n" || e.key === "N") {
        e.preventDefault();
        setTaskToEdit(null);
        setIsTaskModalOpen(true);
      }
      if (e.key === "Escape") {
        setIsTaskModalOpen(false);
        setIsCollabModalOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!isAuthenticated) {
    return <AuthForm />;
  }

  const handleOpenNewTask = () => {
    setTaskToEdit(null);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task) => {
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };

  return (
    <div className="app-layout">
      {/* Left Sidebar */}
      <Sidebar
        onOpenNewTask={handleOpenNewTask}
        onOpenCollaborators={() => setIsCollabModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="main-content-wrapper">
        <Navbar
          onOpenNewTask={handleOpenNewTask}
          onOpenCollaborators={() => setIsCollabModalOpen(true)}
        />

        <main className="content-scroll-view">
          <TaskList
            onOpenNewTask={handleOpenNewTask}
            onEditTask={handleEditTask}
          />
        </main>
      </div>

      {/* Modals */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setTaskToEdit(null);
        }}
        taskToEdit={taskToEdit}
      />

      <CollaboratorModal
        isOpen={isCollabModalOpen}
        onClose={() => setIsCollabModalOpen(false)}
      />
    </div>
  );
}

export default App;