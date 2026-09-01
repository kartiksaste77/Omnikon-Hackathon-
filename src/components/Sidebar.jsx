"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  Sparkles,
  BookOpen,
  CalendarCheck2,
  Compass,
  MessageSquare,
  Users,
  Coins,
  Trophy,
  Star,
  User
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const { pendingRequestsCount } = useAuth();

  const NAV_ITEMS = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "AI Matches", href: "/matches", icon: Sparkles, badge: "AI" },
    { 
      label: "Connections", 
      href: "/connections", 
      icon: Users, 
      badge: pendingRequestsCount > 0 ? `${pendingRequestsCount}` : null,
      badgeColor: "rose"
    },
    { label: "Live Chat", href: "/chat", icon: MessageSquare },
    { label: "Explore Skills", href: "/skills", icon: BookOpen },
    { label: "My Sessions", href: "/sessions", icon: CalendarCheck2 },
    { label: "AI Roadmaps", href: "/ai", icon: Compass, badge: "New" },
    { label: "Time Wallet", href: "/wallet", icon: Coins },
    { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
    { label: "Reviews", href: "/reviews", icon: Star },
    { label: "Profile", href: "/profile", icon: User },
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-white/10 bg-[#090d16]/70 backdrop-blur-xl hidden md:flex flex-col justify-between p-4 min-h-[calc(100vh-4rem)]">
      
      <div className="space-y-1.5">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Navigation
        </div>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? "bg-gradient-to-r from-indigo-600/30 to-indigo-600/10 text-white border border-indigo-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-100 hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`h-4 w-4 transition-transform group-hover:scale-110 ${
                    isActive ? "text-indigo-400" : "text-slate-400 group-hover:text-indigo-300"
                  }`}
                />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.badgeColor === "rose"
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      : item.badge === "AI"
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                      : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Zero Cost Time-Bank Badge */}
      <div className="p-4 rounded-2xl glass-panel border border-indigo-500/20 bg-gradient-to-b from-indigo-950/40 to-slate-950/40">
        <div className="flex items-center gap-2 mb-1.5">
          <Coins className="h-4 w-4 text-amber-400" />
          <span className="text-xs font-bold text-white">Time-Bank Rules</span>
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          1 Hour Taught = 10 SkillCoins. Spend 10 Coins to Learn Any 1-Hour Skill. Zero Cash!
        </p>
      </div>

    </aside>
  );
}
