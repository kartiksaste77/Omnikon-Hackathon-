"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(2);

  // Initialize auth from /api/auth/me or stored token
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem("skillswap_jwt");
        const headers = storedToken ? { Authorization: `Bearer ${storedToken}` } : {};
        
        const res = await fetch("/api/auth/me", { headers });
        if (res.ok) {
          const data = await res.json();
          if (data?.user) {
            setUser(data.user);
            setToken(storedToken);
          }
        }
      } catch (err) {
        console.warn("Auth check failed:", err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Fetch pending connection requests count
  useEffect(() => {
    if (!user) return;
    const fetchPendingCount = async () => {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch("/api/connections", { headers });
        if (res.ok) {
          const data = await res.json();
          setPendingRequestsCount(data.incomingRequests?.length || 0);
        }
      } catch (e) {}
    };

    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 5000);
    return () => clearInterval(interval);
  }, [user, token]);

  // Real Login
  const login = async (email, password) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Login failed" };
      }

      setUser(data.user);
      setToken(data.token);
      localStorage.setItem("skillswap_jwt", data.token);
      localStorage.setItem("skillswap_user", JSON.stringify(data.user));

      return { success: true, user: data.user };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Real Registration
  const register = async (formData) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Registration failed" };
      }

      setUser(data.user);
      setToken(data.token);
      localStorage.setItem("skillswap_jwt", data.token);
      localStorage.setItem("skillswap_user", JSON.stringify(data.user));

      return { success: true, user: data.user };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Real Logout
  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {}

    setUser(null);
    setToken(null);
    localStorage.removeItem("skillswap_jwt");
    localStorage.removeItem("skillswap_user");
    window.location.href = "/auth/login";
  };

  const updateUser = (updates) => {
    setUser((prev) => {
      const updated = { ...prev, ...updates };
      localStorage.setItem("skillswap_user", JSON.stringify(updated));
      return updated;
    });
  };

  const modifyCoins = (amount) => {
    setUser((prev) => {
      if (!prev) return prev;
      const newCoins = Math.max(0, (prev.coins || 0) + amount);
      const updated = { ...prev, coins: newCoins };
      localStorage.setItem("skillswap_user", JSON.stringify(updated));
      return updated;
    });
  };

  const modifyXp = (amount) => {
    setUser((prev) => {
      if (!prev) return prev;
      const newXp = (prev.xp || 0) + amount;
      const updated = { ...prev, xp: newXp };
      localStorage.setItem("skillswap_user", JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        pendingRequestsCount,
        login,
        register,
        logout,
        updateUser,
        modifyCoins,
        modifyXp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
