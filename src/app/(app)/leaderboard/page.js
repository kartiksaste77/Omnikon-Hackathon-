"use client";

import React, { useState } from "react";
import { 
  Trophy, 
  Medal, 
  Flame, 
  Star, 
  Zap, 
  Clock, 
  Award,
  Crown,
  Sparkles
} from "lucide-react";
import { INITIAL_USERS } from "@/lib/seedData";

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState(
    [...INITIAL_USERS].sort((a, b) => (b.xp || 0) - (a.xp || 0))
  );

  const topThree = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <div className="space-y-8 animate-in fade-in">
      
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-2">
          <Trophy className="h-3.5 w-3.5 text-amber-400" />
          Campus Rankings & Gamification
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Mentor Leaderboard</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Top student mentors ranked by total XP earned, hours taught, reliability rating, and active streaks.
        </p>
      </div>

      {/* Top 3 Podium Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
        
        {/* Rank 2 (Silver) */}
        {topThree[1] && (
          <div className="glass-card p-6 border border-slate-400/30 flex flex-col items-center text-center space-y-3 relative order-2 md:order-1">
            <div className="absolute -top-4 h-8 w-8 rounded-full bg-slate-400/20 text-slate-300 border border-slate-400/40 flex items-center justify-center font-bold text-xs">
              2
            </div>
            <img
              src={topThree[1].avatar}
              alt={topThree[1].name}
              className="h-16 w-16 rounded-full object-cover ring-4 ring-slate-400/40 shadow-lg"
            />
            <div>
              <h3 className="text-sm font-bold text-white">{topThree[1].name}</h3>
              <p className="text-xs text-slate-400">{topThree[1].role.split("&")[0]}</p>
            </div>
            <div className="text-xs font-bold text-indigo-300">{topThree[1].xp} XP • {topThree[1].completedHours} hrs</div>
          </div>
        )}

        {/* Rank 1 (Gold) */}
        {topThree[0] && (
          <div className="glass-card p-6 border border-amber-500/50 bg-gradient-to-b from-amber-950/30 to-slate-900 flex flex-col items-center text-center space-y-3 relative order-1 md:order-2 md:-mt-4 shadow-xl shadow-amber-500/10">
            <div className="absolute -top-5 h-10 w-10 rounded-full bg-amber-500 text-slate-950 font-extrabold text-sm flex items-center justify-center shadow-lg shadow-amber-500/30">
              👑 1
            </div>
            <img
              src={topThree[0].avatar}
              alt={topThree[0].name}
              className="h-20 w-20 rounded-full object-cover ring-4 ring-amber-400 shadow-xl"
            />
            <div>
              <h3 className="text-base font-extrabold text-white">{topThree[0].name}</h3>
              <p className="text-xs text-amber-300">{topThree[0].role}</p>
            </div>
            <div className="text-sm font-extrabold text-amber-300">{topThree[0].xp} XP • {topThree[0].completedHours} hrs taught</div>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Campus Champion
            </span>
          </div>
        )}

        {/* Rank 3 (Bronze) */}
        {topThree[2] && (
          <div className="glass-card p-6 border border-amber-700/30 flex flex-col items-center text-center space-y-3 relative order-3">
            <div className="absolute -top-4 h-8 w-8 rounded-full bg-amber-700/20 text-amber-400 border border-amber-700/40 flex items-center justify-center font-bold text-xs">
              3
            </div>
            <img
              src={topThree[2].avatar}
              alt={topThree[2].name}
              className="h-16 w-16 rounded-full object-cover ring-4 ring-amber-700/40 shadow-lg"
            />
            <div>
              <h3 className="text-sm font-bold text-white">{topThree[2].name}</h3>
              <p className="text-xs text-slate-400">{topThree[2].role.split("&")[0]}</p>
            </div>
            <div className="text-xs font-bold text-indigo-300">{topThree[2].xp} XP • {topThree[2].completedHours} hrs</div>
          </div>
        )}

      </div>

      {/* Leaderboard Table */}
      <div className="glass-card p-6 border border-white/10 space-y-4">
        <h3 className="text-sm font-bold text-white">Full Campus Standings</h3>

        <div className="divide-y divide-white/5">
          {leaderboard.map((student, idx) => (
            <div key={student.id} className="py-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-slate-400 w-5 text-center">{idx + 1}</span>
                <img
                  src={student.avatar}
                  alt={student.name}
                  className="h-9 w-9 rounded-full object-cover ring-2 ring-white/10"
                />
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    {student.name}
                    {student.streak >= 10 && (
                      <span className="text-[10px] text-rose-400 flex items-center gap-0.5">
                        <Flame className="h-3 w-3 fill-rose-400" /> {student.streak}d
                      </span>
                    )}
                  </h4>
                  <p className="text-[11px] text-slate-400">{student.role}</p>
                </div>
              </div>

              <div className="flex items-center gap-6 text-right">
                <div className="hidden sm:block">
                  <p className="text-xs font-semibold text-slate-200">{student.completedHours} hrs</p>
                  <p className="text-[10px] text-slate-500">Taught</p>
                </div>

                <div className="hidden sm:block">
                  <p className="text-xs font-semibold text-amber-300">★ {student.rating}</p>
                  <p className="text-[10px] text-slate-500">{student.totalReviews || 12} reviews</p>
                </div>

                <div>
                  <p className="text-xs font-bold text-indigo-300">{student.xp} XP</p>
                  <p className="text-[10px] text-indigo-400 font-medium">{student.coins} Coins</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
