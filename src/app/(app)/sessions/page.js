"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { 
  CalendarCheck2, 
  Video, 
  Clock, 
  Coins, 
  KeyRound, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  User
} from "lucide-react";
import { INITIAL_SESSIONS } from "@/lib/seedData";
import QRCheckInModal from "@/components/QRCheckInModal";

export default function SessionsPage() {
  const { user, modifyCoins, modifyXp } = useAuth();
  const [sessions, setSessions] = useState(INITIAL_SESSIONS);
  const [activeTab, setActiveTab] = useState("UPCOMING"); // 'UPCOMING' | 'COMPLETED'
  const [activeCheckInSession, setActiveCheckInSession] = useState(null);

  const displayedSessions = sessions.filter((s) =>
    activeTab === "UPCOMING" ? s.status === "CONFIRMED" || s.status === "PENDING" : s.status === "COMPLETED"
  );

  const handleVerified = () => {
    if (!activeCheckInSession) return;
    setSessions((prev) =>
      prev.map((s) => (s.id === activeCheckInSession.id ? { ...s, status: "COMPLETED" } : s))
    );
    modifyCoins(10);
    modifyXp(50);
    setActiveCheckInSession(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-2">
            <CalendarCheck2 className="h-3.5 w-3.5 text-indigo-400" />
            Session Hub & Attendance
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">My Peer Sessions</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Join WebRTC live video rooms or verify attendance with 4-digit OTP / animated QR scan.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-900 border border-white/10">
          <button
            onClick={() => setActiveTab("UPCOMING")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "UPCOMING"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Upcoming / Active ({sessions.filter((s) => s.status === "CONFIRMED").length})
          </button>
          <button
            onClick={() => setActiveTab("COMPLETED")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "COMPLETED"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Completed ({sessions.filter((s) => s.status === "COMPLETED").length})
          </button>
        </div>
      </div>

      {/* Sessions List */}
      <div className="space-y-4">
        {displayedSessions.length > 0 ? (
          displayedSessions.map((session) => (
            <div
              key={session.id}
              className="glass-card p-6 border border-white/10 hover:border-indigo-500/30 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`text-[11px] font-bold px-3 py-1 rounded-full ${
                      session.status === "COMPLETED"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                    }`}
                  >
                    {session.status}
                  </span>
                  <span className="text-xs text-slate-400">
                    {session.type === "VIRTUAL" ? "🌐 WebRTC Virtual Room" : "🏫 Campus In-Person"}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white">{session.skillTitle}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Mentor: <strong className="text-slate-200">{session.mentorName}</strong> • Learner: <strong className="text-slate-200">{session.learnerName}</strong>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-indigo-400" />
                    {session.durationMinutes} Minutes (1 Hr)
                  </span>
                  <span className="flex items-center gap-1.5 text-amber-300">
                    <Coins className="h-3.5 w-3.5 text-amber-400" />
                    10 SkillCoins {session.status === "COMPLETED" ? "Transferred" : "in Escrow"}
                  </span>
                  {session.otpCode && (
                    <span className="flex items-center gap-1.5 font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                      <KeyRound className="h-3 w-3" /> OTP: {session.otpCode}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                {session.status === "CONFIRMED" && (
                  <>
                    <button
                      onClick={() => setActiveCheckInSession(session)}
                      className="btn-secondary px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                    >
                      <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
                      Verify OTP Check-In
                    </button>

                    <Link
                      href={`/session/${session.id}`}
                      className="btn-primary px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/30"
                    >
                      <Video className="h-3.5 w-3.5" />
                      Launch Live Room
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </>
                )}

                {session.status === "COMPLETED" && (
                  <Link
                    href="/reviews"
                    className="btn-secondary px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    Leave 5-Star Review
                  </Link>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-16 glass-card p-8 space-y-3">
            <p className="text-sm text-slate-400">No {activeTab.toLowerCase()} sessions found.</p>
            <Link href="/matches" className="btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" /> Find a Mentor
            </Link>
          </div>
        )}
      </div>

      {/* Check-In Modal */}
      {activeCheckInSession && (
        <QRCheckInModal
          session={activeCheckInSession}
          onClose={() => setActiveCheckInSession(null)}
          onVerified={handleVerified}
        />
      )}

    </div>
  );
}
