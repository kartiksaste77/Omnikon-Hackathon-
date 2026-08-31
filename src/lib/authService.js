"use client";
// ============================================================================
// SkillSwap — Hybrid Auth Service (SQLite API + local backup)
// ============================================================================

import db from "./mockDatabase";
import apiClient from "./apiClient";

const SESSION_KEY = "skillswap_session";

export const authService = {
  // Register a new user
  async register(name, email, password) {
    if (!name || !email || !password) {
      return { success: false, error: "All fields are required" };
    }
    if (password.length < 6) {
      return { success: false, error: "Password must be at least 6 characters" };
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Registration failed" };
      }

      if (data.token) apiClient.setToken(data.token);
      
      let localUser = db.getUserByEmail(email);
      if (!localUser) {
        localUser = db.createUser({ id: data.user.id, name, email, password });
      }
      this._setSession(localUser);

      return { success: true, user: data.user };
    } catch (err) {
      console.warn("API registration fallback:", err);
      // Fallback to local DB if backend network glitch
      const existing = db.getUserByEmail(email);
      if (existing) return { success: false, error: "An account with this email already exists" };
      const user = db.createUser({ name, email, password });
      this._setSession(user);
      return { success: true, user: this._sanitize(user) };
    }
  },

  // Login with email + password
  async login(email, password) {
    if (!email || !password) {
      return { success: false, error: "Email and password are required" };
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Invalid credentials" };
      }

      if (data.token) apiClient.setToken(data.token);

      let localUser = db.getUserByEmail(email);
      if (!localUser) {
        localUser = db.createUser({ id: data.user.id, name: data.user.name, email, password });
      }
      localUser.id = data.user.id;
      this._setSession(data.user || localUser);

      return { success: true, user: data.user };
    } catch (err) {
      console.warn("API login fallback:", err);
      const user = db.getUserByEmail(email);
      if (!user || user.password !== password) {
        return { success: false, error: "Invalid email or password" };
      }
      this._setSession(user);
      return { success: true, user: this._sanitize(user) };
    }
  },

  // Logout current user
  logout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem(SESSION_KEY);
      apiClient.setToken(null);
    }
  },

  // Get currently authenticated user
  getCurrentUser() {
    if (typeof window === "undefined") return null;
    try {
      const session = localStorage.getItem(SESSION_KEY);
      if (!session) return null;
      const parsed = JSON.parse(session);
      const user = db.getUser(parsed.userId) || parsed.user;
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
    return { success: true, message: "Password reset link sent to your email" };
  },

  // Update profile for current user
  async updateProfile(userId, updates) {
    try {
      await apiClient.patch(`/api/users/${userId}`, updates);
    } catch (e) {
      console.warn("API update profile fallback", e);
    }
    const updated = db.updateUser(userId, updates);
    return updated ? { success: true, user: this._sanitize(updated) } : { success: false, error: "User not found" };
  },

  // Internal: set session in localStorage
  _setSession(user) {
    if (typeof window !== "undefined") {
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        userId: user.id,
        email: user.email,
        name: user.name,
        user: this._sanitize(user),
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
