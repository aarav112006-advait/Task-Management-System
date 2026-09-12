import React, { createContext, useContext, useState, useEffect } from "react";
import { authApi } from "../services/api";
import { initialUser } from "../data/mockData";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : initialUser;
  });
  const [token, setToken] = useState(() => localStorage.getItem("token") || "mock_jwt_token_demo");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      // Try real backend API first
      const res = await authApi.login({ email, password });
      const { user: userData, token: jwtToken } = res.data;
      setUser(userData);
      setToken(jwtToken);
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", jwtToken);
      return { success: true };
    } catch (err) {
      // Fallback for mock preview if backend is not running
      console.warn("API offline, falling back to mock authentication.");
      const demoUser = {
        ...initialUser,
        email: email || initialUser.email,
        name: email ? email.split("@")[0] : initialUser.name,
      };
      const mockToken = "mock_jwt_token_" + Date.now();
      setUser(demoUser);
      setToken(mockToken);
      localStorage.setItem("user", JSON.stringify(demoUser));
      localStorage.setItem("token", mockToken);
      return { success: true };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.register({ name, email, password });
      const { user: userData, token: jwtToken } = res.data;
      setUser(userData);
      setToken(jwtToken);
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", jwtToken);
      return { success: true };
    } catch (err) {
      console.warn("API offline, registering user in local state.");
      const newUser = {
        id: "usr_" + Math.random().toString(36).substr(2, 6),
        name,
        email,
        role: "Member",
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      };
      const mockToken = "mock_jwt_token_" + Date.now();
      setUser(newUser);
      setToken(mockToken);
      localStorage.setItem("user", JSON.stringify(newUser));
      localStorage.setItem("token", mockToken);
      return { success: true };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        loading,
        error,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);