"use client";
// ============================================================================
// SkillSwap — Auth Context Provider
// Wraps the app with authentication state and provides auth functions
// ============================================================================

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import authService from "@/lib/authService";
import db from "@/lib/mockDatabase";
import apiClient from "@/lib/apiClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check session on mount + sync from SQLite /me endpoint
  useEffect(() => {
    async function initAuth() {
      const currentUser = authService.getCurrentUser();
      if (currentUser) setUser(currentUser);

      // Verify token with backend SQLite
      const token = apiClient.getToken();
      if (token) {
        try {
          const res = await fetch("/api/auth/me", {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data);
          }
        } catch (e) {
          console.warn("Backend me verification fallback", e);
        }
      }
      setLoading(false);
    }
    initAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    const result = await authService.login(email, password);
    if (result.success) setUser(result.user);
    return result;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const result = await authService.register(name, email, password);
    if (result.success) setUser(result.user);
    return result;
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  const resetPassword = useCallback((email) => {
    return authService.resetPassword(email);
  }, []);

  const updateProfile = useCallback(async (updates) => {
    if (!user) return { success: false, error: "Not authenticated" };
    const result = await authService.updateProfile(user.id, updates);
    if (result.success) setUser(result.user);
    return result;
  }, [user]);

  // Refresh user data from DB
  const refreshUser = useCallback(async () => {
    if (!user) return;
    const token = apiClient.getToken();
    if (token) {
      try {
        const res = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          return;
        }
      } catch (e) {}
    }
    const fresh = db.getUser(user.id);
    if (fresh) {
      const { password, ...safe } = fresh;
      setUser(safe);
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, resetPassword, updateProfile, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

export default AuthContext;
