"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Search, Users, MessageSquare, Calendar, Star, User, Brain, Trophy, Map, Sparkles } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/matches", label: "Find Matches", icon: Sparkles },
  { href: "/connections", label: "Connections", icon: Users },
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/sessions", label: "Sessions", icon: Calendar },
  { href: "/skills", label: "Browse Skills", icon: Search },
  { href: "/reviews", label: "Reviews", icon: Star },
  { href: "/ai/roadmap", label: "AI Roadmap", icon: Map },
  { href: "/ai/assistant", label: "AI Assistant", icon: Brain },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/profile", label: "My Profile", icon: User },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-56 bg-[#0A0A10] border-r border-white/8 py-4 px-3 space-y-1 overflow-y-auto shrink-0">
      <div className="text-[10px] uppercase font-mono font-bold text-slate-500 px-3 pt-2 pb-1 tracking-wider">Navigation</div>
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
              isActive
                ? "bg-red-600/15 text-red-400 font-semibold border border-red-500/20"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </aside>
  );
}
