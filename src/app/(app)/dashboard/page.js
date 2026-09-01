"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { 
  Coins, 
  Flame, 
  Zap, 
  Clock, 
  Sparkles, 
  ArrowRight, 
  Video, 
  Calendar, 
  Compass, 
  CheckCircle2,
  BookOpen,
  Award,
  ChevronRight
} from "lucide-react";
import { INITIAL_SESSIONS, INITIAL_USERS } from "@/lib/seedData";
import QRCheckInModal from "@/components/QRCheckInModal";

export default function DashboardPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState(INITIAL_SESSIONS);
  const [activeCheckInSession, setActiveCheckInSession] = useState(null);

  const upcomingSession = sessions.find((s) => s.status === "CONFIRMED");
  const topMatch = INITIAL_USERS.find((u) => u.id === "user_2"); // Priya Sharma

  return (
    <div className="space-y-8 animate-in fade-in">
      
      {/* Welcome Banner */}
      <div className="relative rounded-3xl p-6 sm:p-8 overflow-hidden glass-card border border-indigo-500/20 bg-gradient-to-r from-indigo-950/60 via-slate-900/80 to-cyan-950/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              Zero-Cost Campus Mentorship
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Hello, <span className="text-gradient">{user?.name || "Alex"}</span> 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              You have <strong className="text-amber-400">{user?.coins ?? 50} SkillCoins</strong> in your time-bank wallet. Teach 1 hour to earn 10 coins, or spend coins to learn any skill on campus!
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/matches"
              className="btn-primary px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30"
            >
              <Sparkles className="h-4 w-4 text-cyan-300" />
              Find AI Matches
            </Link>
            <Link
              href="/skills"
              className="btn-secondary px-5 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2"
            >
              <BookOpen className="h-4 w-4 text-slate-400" />
              Browse Skills
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Time-Bank Wallet */}
        <div className="glass-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">SkillCoin Balance</span>
            <div className="h-8 w-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <Coins className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-300">{user?.coins ?? 50}</span>
            <span className="text-xs text-slate-400 font-medium">Coins</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <span className="text-emerald-400 font-semibold">+10</span> per 1 hr session taught
          </div>
        </div>

        {/* Daily Streak */}
        <div className="glass-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Active Streak</span>
            <div className="h-8 w-8 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center">
              <Flame className="h-4 w-4 fill-rose-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-300">{user?.streak ?? 1}</span>
            <span className="text-xs text-slate-400 font-medium">Days Active</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Multiplier: <strong className="text-rose-300">1.25x XP</strong>
          </div>
        </div>

        {/* Experience & Level */}
        <div className="glass-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Experience Level</span>
            <div className="h-8 w-8 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
              <Zap className="h-4 w-4 fill-indigo-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-indigo-300">{user?.xp ?? 100}</span>
            <span className="text-xs text-slate-400 font-medium">XP Points</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-indigo-500 h-1.5 rounded-full w-[65%]" />
          </div>
        </div>

        {/* Completed Teaching Hours */}
        <div className="glass-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Hours Exchanged</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-300">{user?.completedHours ?? 32}</span>
            <span className="text-xs text-slate-400 font-medium">Hours</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Rating: <strong className="text-emerald-300">4.95 ★</strong> (28 reviews)
          </div>
        </div>

      </div>

      {/* Main Grid: Upcoming Session + AI Match Spotlight */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Upcoming Sessions Card (7 cols) */}
        <div className="lg:col-span-7 glass-card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-400" />
              <h2 className="text-base font-bold text-white">Upcoming Session</h2>
            </div>
            <Link href="/sessions" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              View All ({sessions.length}) <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {upcomingSession ? (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950/40 border border-indigo-500/20 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={upcomingSession.learnerAvatar || "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80"}
                    alt={upcomingSession.learnerName}
                    className="h-11 w-11 rounded-full object-cover ring-2 ring-indigo-500/40"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-white">{upcomingSession.skillTitle}</h3>
                    <p className="text-xs text-slate-400">
                      With <span className="text-slate-200 font-medium">{upcomingSession.learnerName}</span> • {upcomingSession.type === "VIRTUAL" ? "Live WebRTC Conference" : "Campus In-Person"}
                    </p>
                  </div>
                </div>

                <span className="self-start sm:self-auto text-[11px] font-semibold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Confirmed
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 text-xs text-slate-300">
                💬 <strong>Notes:</strong> {upcomingSession.notes}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-indigo-400" />
                  Scheduled: Today in 2 Hours
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveCheckInSession(upcomingSession)}
                    className="btn-secondary px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                  >
                    Check-In OTP
                  </button>
                  <Link
                    href={`/session/${upcomingSession.id}`}
                    className="btn-primary px-4 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
                  >
                    <Video className="h-3.5 w-3.5" />
                    Enter Virtual Room
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-slate-400 text-xs">
              No upcoming sessions. Browse skills or find matches to schedule one!
            </div>
          )}
        </div>

        {/* Right: AI Match Spotlight (5 cols) */}
        <div className="lg:col-span-5 glass-card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-cyan-400" />
              <h2 className="text-base font-bold text-white">AI Match Spotlight</h2>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              98% Synergy
            </span>
          </div>

          {topMatch && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img
                  src={topMatch.avatar}
                  alt={topMatch.name}
                  className="h-12 w-12 rounded-full object-cover ring-2 ring-cyan-500/40"
                />
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    {topMatch.name}
                    <span className="text-xs text-amber-400 font-semibold">★ {topMatch.rating}</span>
                  </h3>
                  <p className="text-xs text-slate-400">{topMatch.role}</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 space-y-1 text-xs text-slate-300">
                <p className="font-semibold text-cyan-300">Why this match is high synergy:</p>
                <p className="text-[11px] text-slate-400">
                  Priya teaches <strong>UI/UX Design & Figma</strong> which you want to learn, and she wants to learn <strong>React & Next.js</strong> from you!
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/matches"
                  className="w-full btn-primary py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 text-center"
                >
                  View Compatibility Breakdown
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* QR / OTP Check-In Modal */}
      {activeCheckInSession && (
        <QRCheckInModal
          session={activeCheckInSession}
          onClose={() => setActiveCheckInSession(null)}
          onVerified={() => {
            setSessions((prev) =>
              prev.map((s) =>
                s.id === activeCheckInSession.id ? { ...s, status: "COMPLETED" } : s
              )
            );
            setActiveCheckInSession(null);
          }}
        />
      )}

    </div>
  );
}
