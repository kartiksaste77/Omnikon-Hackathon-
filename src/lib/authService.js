"use client";
// ============================================================================
// SkillSwap — Mock Auth Service
// Simulates registration, login, logout, session management, password reset
// Swappable with Supabase Auth / Firebase Auth / Clerk post-hackathon
// ============================================================================

import db from "./mockDatabase";

const SESSION_KEY = "skillswap_session";

export const authService = {
  // Register a new user
  register(name, email, password) {
    if (!name || !email || !password) {
      return { success: false, error: "All fields are required" };
    }
    if (password.length < 6) {
      return { success: false, error: "Password must be at least 6 characters" };
    }
    const existing = db.getUserByEmail(email);
    if (existing) {
      return { success: false, error: "An account with this email already exists" };
    }
    const user = db.createUser({ name, email, password });
    this._setSession(user);
    return { success: true, user: this._sanitize(user) };
  },

  // Login with email + password
  login(email, password) {
    if (!email || !password) {
      return { success: false, error: "Email and password are required" };
    }
    const user = db.getUserByEmail(email);
    if (!user || user.password !== password) {
      return { success: false, error: "Invalid email or password" };
    }
    this._setSession(user);
    return { success: true, user: this._sanitize(user) };
  },

  // Logout current user
  logout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem(SESSION_KEY);
    }
  },

  // Get currently authenticated user
  getCurrentUser() {
    if (typeof window === "undefined") return null;
    try {
      const session = localStorage.getItem(SESSION_KEY);
      if (!session) return null;
      const { userId } = JSON.parse(session);
      const user = db.getUser(userId);
      return user ? this._sanitize(user) : null;
    } catch {
      return null;
    }
  },

  // Simulate password reset
  resetPassword(email) {
    const user = db.getUserByEmail(email);
    if (!user) {
      return { success: false, error: "No account found with this email" };
    }
    // In production, would send email with reset link
    return { success: true, message: "Password reset link sent to your email" };
  },

  // Update profile for current user
  updateProfile(userId, updates) {
    const updated = db.updateUser(userId, updates);
    return updated ? { success: true, user: this._sanitize(updated) } : { success: false, error: "User not found" };
  },

  // Internal: set session in localStorage
  _setSession(user) {
    if (typeof window !== "undefined") {
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        userId: user.id,
        email: user.email,
        loginAt: new Date().toISOString(),
      }));
    }
  },

  // Internal: strip password from user object
  _sanitize(user) {
    if (!user) return null;
    const { password, ...safe } = user;
    return safe;
  },
};

export default authService;
