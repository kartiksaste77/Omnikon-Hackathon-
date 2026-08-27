"use client";
// ============================================================================
// SkillSwap — Auth Context Provider
// Wraps the app with authentication state and provides auth functions
// ============================================================================

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import authService from "@/lib/authService";
import db from "@/lib/mockDatabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check session on mount
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) setUser(currentUser);
    setLoading(false);
  }, []);

  const login = useCallback((email, password) => {
    const result = authService.login(email, password);
    if (result.success) setUser(result.user);
    return result;
  }, []);

  const register = useCallback((name, email, password) => {
    const result = authService.register(name, email, password);
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

  const updateProfile = useCallback((updates) => {
    if (!user) return { success: false, error: "Not authenticated" };
    const result = authService.updateProfile(user.id, updates);
    if (result.success) setUser(result.user);
    return result;
  }, [user]);

  // Refresh user data from DB
  const refreshUser = useCallback(() => {
    if (!user) return;
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
