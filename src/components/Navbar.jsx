"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap, Bell, LogOut, User, Coins, Menu, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import db from "@/lib/mockDatabase";

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [showNotif, setShowNotif] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  const notifications = user ? db.getNotifications(user.id) : [];
  const unread = notifications.filter(n => !n.read).length;

  const handleLogout = () => { logout(); window.location.href = "/"; };

  const initials = user?.name?.split(" ").map(n => n[0]).join("").toUpperCase() || "?";

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
            <span className="text-lg font-extrabold tracking-tight font-[Outfit] hidden sm:inline">Skill<span className="text-red-500">Swap</span></span>
          </Link>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-3">
          {/* SkillCoins Balance */}
          <Link
            href="/wallet"
            className="flex items-center gap-1.5 bg-slate-900/80 border border-amber-500/30 hover:border-amber-500/50 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
          >
            <Coins className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-bold text-white font-mono">{user?.skillCoins || 0}</span>
            <span className="text-[10px] text-amber-400 font-mono hidden sm:inline">COINS</span>
          </Link>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotif(!showNotif)}
              className="relative p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{unread}</span>
              )}
            </button>
            {showNotif && (
              <div className="absolute right-0 top-12 w-80 glass rounded-xl border border-white/15 shadow-2xl p-3 space-y-2 z-50 animate-fade-in">
                <div className="text-xs font-bold text-slate-300 pb-2 border-b border-white/10">Notifications</div>
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-500 py-3 text-center">No notifications yet</p>
                ) : (
                  notifications.slice(0, 5).map(n => (
                    <div key={n.id} className={`text-xs p-2 rounded-lg ${n.read ? "text-slate-500" : "text-slate-200 bg-white/5"}`}>
                      {n.content}
                      <div className="text-[10px] text-slate-600 mt-0.5">{new Date(n.timestamp).toLocaleString()}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* User Avatar Dropdown */}
          <div className="flex items-center gap-2">
            <Link href="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-red-600 to-amber-500 flex items-center justify-center text-white text-xs font-bold">
                {initials}
              </div>
              <span className="text-sm font-semibold text-slate-200 hidden md:inline">{user?.name}</span>
            </Link>
            <button onClick={handleLogout} className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-red-400 transition-colors" title="Logout">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
