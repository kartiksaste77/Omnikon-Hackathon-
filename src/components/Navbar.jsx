"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { 
  Coins, 
  Flame, 
  Zap, 
  Bell, 
  Search, 
  LogOut, 
  User, 
  Sparkles,
  ChevronDown
} from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#090d16]/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                Skill<span className="text-gradient">Swap</span>
              </span>
              <span className="text-[10px] font-medium tracking-wider uppercase text-indigo-400">
                Time-Bank Mentorship
              </span>
            </div>
          </Link>
        </div>

        {/* Quick Search & Live Economy Stats */}
        <div className="flex items-center gap-4">
          
          {/* Live SkillCoin Balance */}
          <Link 
            href="/wallet"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 transition-all hover:scale-105"
            title="SkillCoin Balance (1 Hr Taught = 10 Coins = 1 Hr Learned)"
          >
            <Coins className="h-4 w-4 text-amber-400 animate-bounce" />
            <span className="text-xs font-semibold">{user?.coins ?? 50}</span>
            <span className="text-[11px] text-amber-400/80 font-medium hidden sm:inline">Coins</span>
          </Link>

          {/* Streak Counter */}
          <div 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 hidden sm:flex"
            title="Daily Active Streak"
          >
            <Flame className="h-4 w-4 text-rose-400 fill-rose-400" />
            <span className="text-xs font-bold">{user?.streak ?? 1}d</span>
          </div>

          {/* User XP Rank */}
          <div 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 hidden md:flex"
            title="Total Experience XP"
          >
            <Zap className="h-4 w-4 text-indigo-400 fill-indigo-400" />
            <span className="text-xs font-bold">{user?.xp ?? 100} XP</span>
          </div>

          {/* Notifications Trigger */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-cyan-400 ring-2 ring-[#090d16]" />
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl glass-panel p-4 shadow-2xl z-50 border border-white/10 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <h4 className="text-sm font-semibold text-white">Notifications</h4>
                  <span className="text-xs text-indigo-400 font-medium">2 new</span>
                </div>
                <div className="space-y-3 mt-3">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-slate-200">
                    <p className="font-semibold text-indigo-300">Upcoming Session in 2 Hours</p>
                    <p className="text-slate-400 mt-0.5">React Server Components with Priya Sharma.</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-slate-200">
                    <p className="font-semibold text-emerald-300">+10 SkillCoins Received</p>
                    <p className="text-slate-400 mt-0.5">Completed mentoring session on Dynamic Programming.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 p-1.5 rounded-full hover:bg-white/5 border border-transparent hover:border-white/10 transition-all"
            >
              <img
                src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                alt={user?.name || "User Avatar"}
                className="h-8 w-8 rounded-full object-cover ring-2 ring-indigo-500/50"
              />
              <span className="text-xs font-semibold text-slate-200 hidden lg:inline max-w-[100px] truncate">
                {user?.name || "Alex Rivera"}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl glass-panel p-2 shadow-2xl z-50 border border-white/10 animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 border-b border-white/10 mb-1">
                  <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                </div>
                <Link
                  href="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-indigo-600/20 hover:text-white transition-colors"
                >
                  <User className="h-4 w-4 text-indigo-400" />
                  My Profile & Skills
                </Link>
                <Link
                  href="/wallet"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-indigo-600/20 hover:text-white transition-colors"
                >
                  <Coins className="h-4 w-4 text-amber-400" />
                  Time-Bank Wallet ({user?.coins ?? 50} Coins)
                </Link>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-300 hover:bg-rose-500/10 transition-colors mt-1"
                >
                  <LogOut className="h-4 w-4 text-rose-400" />
                  Sign Out
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
}
