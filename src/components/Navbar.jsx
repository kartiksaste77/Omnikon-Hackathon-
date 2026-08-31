"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap, Bell, LogOut, Coins, Menu, X, Check, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import apiClient from "@/lib/apiClient";
import getSocket from "@/lib/socket";
import { useState, useEffect, useRef } from "react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [showNotif, setShowNotif] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);

  const unread = notifications.filter((n) => !n.read).length;

  // Load notifications from API
  const loadNotifications = async () => {
    if (!user) return;
    try {
      const data = await apiClient.get("/api/notifications");
      setNotifications(data || []);
    } catch (e) {
      // Silently fail — non-critical
    }
  };

  // Real-time notification listener
  useEffect(() => {
    if (!user) return;
    loadNotifications();
    const token = apiClient.getToken();
    const socket = getSocket(token);
    socket.on("notification:new", (notif) => {
      setNotifications((prev) => [notif, ...prev]);
    });
    return () => socket.off("notification:new");
  }, [user]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotif(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await apiClient.patch("/api/notifications", {});
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {}
  };

  const handleLogout = () => { logout(); window.location.href = "/"; };
  const initials = user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase() || "?";

  const notifIcon = (type) => {
    const icons = {
      connection: "🤝",
      session: "📅",
      message: "💬",
      review: "⭐",
      skillcoin: "🪙",
      match: "✨",
    };
    return icons[type] || "🔔";
  };

  return (
    <header className="sticky top-0 z-50 bg-[#09090D]/95 backdrop-blur-xl border-b border-white/10">
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <button className="lg:hidden text-slate-400 hover:text-white mr-1" onClick={() => setMobileMenu(!mobileMenu)}>
            {mobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-red-600 to-amber-500 flex items-center justify-center shadow-lg shadow-red-600/25">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-extrabold tracking-tight font-[Outfit] hidden sm:inline">
              Skill<span className="text-red-500">Swap</span>
            </span>
          </Link>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* SkillCoins Balance */}
          <Link
            href="/wallet"
            className="flex items-center gap-1.5 bg-slate-900/80 border border-amber-500/30 hover:border-amber-500/60 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer group"
          >
            <Coins className="h-4 w-4 text-amber-400 group-hover:animate-bounce" />
            <span className="text-sm font-bold text-white font-mono">{user?.skillCoins || 0}</span>
            <span className="text-[10px] text-amber-400 font-mono hidden sm:inline">COINS</span>
          </Link>

          {/* Notifications Bell */}
          <div className="relative" ref={notifRef}>
            <button
              id="notifications-bell"
              onClick={() => setShowNotif(!showNotif)}
              className={`relative p-2 rounded-xl transition-colors ${showNotif ? "bg-white/10 text-white" : "bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"}`}
            >
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>

            {showNotif && (
              <div className="absolute right-0 top-12 w-80 sm:w-96 glass rounded-xl border border-white/15 shadow-2xl shadow-black/40 z-50 animate-fade-in overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Bell className="h-3.5 w-3.5 text-red-400" />
                    <span className="text-sm font-bold text-white">Notifications</span>
                    {unread > 0 && (
                      <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-mono">
                        {unread} new
                      </span>
                    )}
                  </div>
                  {unread > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[10px] text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors"
                    >
                      <Check className="h-3 w-3" /> Mark all read
                    </button>
                  )}
                </div>

                {/* Notification List */}
                <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center">
                      <Sparkles className="h-6 w-6 text-slate-600 mx-auto mb-2" />
                      <p className="text-xs text-slate-500">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.slice(0, 20).map((n) => (
                      <div
                        key={n.id}
                        className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-white/5 ${!n.read ? "bg-red-500/5" : ""}`}
                      >
                        <span className="text-base shrink-0 mt-0.5">{notifIcon(n.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs leading-relaxed ${n.read ? "text-slate-400" : "text-slate-200"}`}>
                            {n.content}
                          </p>
                          <p className="text-[10px] text-slate-600 mt-1 font-mono">
                            {new Date(n.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        {!n.read && (
                          <div className="h-2 w-2 rounded-full bg-red-500 shrink-0 mt-1.5" />
                        )}
                      </div>
                    ))
                  )}
                </div>

                {notifications.length > 0 && (
                  <div className="px-4 py-2 border-t border-white/10 text-center">
                    <button className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors">
                      View all notifications
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Avatar */}
          <div className="flex items-center gap-2">
            <Link href="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-red-600 to-amber-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white/10 hover:ring-red-500/50 transition-all">
                {initials}
              </div>
              <span className="text-sm font-semibold text-slate-200 hidden md:inline">{user?.name}</span>
            </Link>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-red-400 transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
