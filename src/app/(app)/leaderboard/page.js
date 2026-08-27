"use client";
import db from "@/lib/mockDatabase";
import { Trophy, Star, Flame, Coins, Medal, Crown } from "lucide-react";

export default function LeaderboardPage() {
  const leaderboard = db.getLeaderboard();

  const getInitials = (name) => name?.split(" ").map(n => n[0]).join("").toUpperCase() || "?";
  const getRankColor = (rank) => {
    if (rank === 1) return "from-amber-500 to-yellow-400";
    if (rank === 2) return "from-slate-400 to-slate-300";
    if (rank === 3) return "from-amber-700 to-amber-600";
    return "from-slate-700 to-slate-600";
  };
  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-amber-400" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-slate-300" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="text-sm font-mono text-slate-500 font-bold">#{rank}</span>;
  };

  return (
    <div className="space-y-6 max-w-3xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white font-[Outfit] flex items-center gap-2"><Trophy className="h-6 w-6 text-amber-400" /> Leaderboard</h1>
        <p className="text-sm text-slate-400 mt-1">Top skill swappers ranked by XP, teaching hours, and community impact</p>
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-3 gap-3">
        {leaderboard.slice(0, 3).map((u, i) => (
          <div key={u.id} className={`glass rounded-2xl p-5 text-center space-y-2 ${i === 0 ? "border border-amber-500/30 glass-red" : ""}`}>
            <div className="mx-auto">{getRankIcon(u.rank)}</div>
            <div className={`h-14 w-14 mx-auto rounded-2xl bg-gradient-to-br ${getRankColor(u.rank)} flex items-center justify-center text-white font-bold text-lg`}>
              {getInitials(u.name)}
            </div>
            <div className="text-sm font-bold text-white">{u.name}</div>
            <div className="text-xs text-slate-400">{u.location}</div>
            <div className="flex justify-center gap-3 text-xs font-mono">
              <span className="text-emerald-400">{u.xp} XP</span>
              <span className="text-amber-400">{u.skillCoins} 🪙</span>
            </div>
            {u.badges?.length > 0 && (
              <div className="flex justify-center gap-1 pt-1">
                {u.badges.slice(0, 3).map(b => <span key={b.id} title={b.name} className="text-sm">{b.icon}</span>)}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Full Rankings */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="grid grid-cols-12 gap-2 p-3 text-[10px] uppercase font-mono font-bold text-slate-500 border-b border-white/10">
          <div className="col-span-1">Rank</div>
          <div className="col-span-4">User</div>
          <div className="col-span-1 text-center">XP</div>
          <div className="col-span-1 text-center">Coins</div>
          <div className="col-span-1 text-center"><Flame className="h-3 w-3 inline" /></div>
          <div className="col-span-1 text-center"><Star className="h-3 w-3 inline" /></div>
          <div className="col-span-1 text-center">Sess.</div>
          <div className="col-span-2">Badges</div>
        </div>
        {leaderboard.map(u => (
          <div key={u.id} className={`grid grid-cols-12 gap-2 p-3 items-center text-sm border-b border-white/5 hover:bg-white/[0.02] transition-colors ${u.rank <= 3 ? "bg-amber-500/5" : ""}`}>
            <div className="col-span-1 font-mono font-bold text-slate-400">#{u.rank}</div>
            <div className="col-span-4 flex items-center gap-2">
              <div className={`h-7 w-7 rounded-lg bg-gradient-to-br ${getRankColor(u.rank)} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                {getInitials(u.name)}
              </div>
              <div>
                <div className="text-xs font-semibold text-white">{u.name}</div>
                <div className="text-[10px] text-slate-500">{u.location}</div>
              </div>
            </div>
            <div className="col-span-1 text-center font-mono text-xs text-emerald-400 font-bold">{u.xp || 0}</div>
            <div className="col-span-1 text-center font-mono text-xs text-amber-400">{u.skillCoins || 0}</div>
            <div className="col-span-1 text-center font-mono text-xs text-orange-400">{u.streak || 0}d</div>
            <div className="col-span-1 text-center font-mono text-xs text-yellow-400">{u.rating || "—"}</div>
            <div className="col-span-1 text-center font-mono text-xs text-slate-400">{u.sessionsCompleted || 0}</div>
            <div className="col-span-2 flex gap-1">
              {u.badges?.slice(0, 3).map(b => <span key={b.id} title={b.name} className="text-xs">{b.icon}</span>)}
              {(!u.badges || u.badges.length === 0) && <span className="text-[10px] text-slate-600">—</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
