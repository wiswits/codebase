import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import client from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [demoUsers, setDemoUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDemoUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await client.get("/users/demo-users");
      const users = res.data.data || [];
      setDemoUsers(users);

      const savedId = localStorage.getItem("wiswits_demo_user_id");
      const found = users.find((u) => u._id === savedId);
      if (found) {
        setCurrentUser(found);
      } else if (users.length) {
        // default to first admin found
        const admin = users.find((u) => u.role === "admin") || users[0];
        localStorage.setItem("wiswits_demo_user_id", admin._id);
        setCurrentUser(admin);
      }
    } catch (err) {
      console.error("Failed to load demo users. Is the backend running + seeded?", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDemoUsers();
  }, [loadDemoUsers]);

  const switchUser = (userId) => {
    localStorage.setItem("wiswits_demo_user_id", userId);
    const found = demoUsers.find((u) => u._id === userId);
    setCurrentUser(found || null);
  };

  return (
    <AuthContext.Provider value={{ demoUsers, currentUser, switchUser, loading, reload: loadDemoUsers }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
