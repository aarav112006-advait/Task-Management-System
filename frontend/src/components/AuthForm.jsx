import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { CheckCircle2, AlertCircle } from "./Icons";

const AuthForm = () => {
  const { login, register, loading } = useAuth();
  const [tab, setTab] = useState("login"); // "login" or "register"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (tab === "login") {
      const res = await login(email, password);
      if (!res.success) setErrorMessage("Invalid email or password.");
    } else {
      if (!name.trim()) {
        setErrorMessage("Please enter your name.");
        return;
      }
      const res = await register(name, email, password);
      if (!res.success) setErrorMessage("Registration failed.");
    }
  };

  const handleQuickDemo = () => {
    login("aarav112006@gmail.com", "demo1234");
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-brand">
          <span className="auth-logo-icon">✓</span>
          <h2>TaskFlow</h2>
          <p>Collaborative project tracking & personal productivity</p>
        </div>

        {/* Tab switch */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${tab === "login" ? "active" : ""}`}
            onClick={() => {
              setTab("login");
              setErrorMessage("");
            }}
          >
            Log In
          </button>
          <button
            className={`auth-tab ${tab === "register" ? "active" : ""}`}
            onClick={() => {
              setTab("register");
              setErrorMessage("");
            }}
          >
            Create Account
          </button>
        </div>

        {errorMessage && (
          <div className="auth-error-banner">
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {tab === "register" && (
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="Aarav Patel"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="input-primary"
              />
            </div>
          )}

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input-primary"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input-primary"
            />
          </div>

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Processing..." : tab === "login" ? "Sign In to TaskFlow" : "Create Account"}
          </button>

          <div className="demo-divider">
            <span>or explore instantly</span>
          </div>

          <button
            type="button"
            className="btn-demo-login w-full"
            onClick={handleQuickDemo}
          >
            ⚡ Quick Demo Access (Aarav Patel)
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthForm;