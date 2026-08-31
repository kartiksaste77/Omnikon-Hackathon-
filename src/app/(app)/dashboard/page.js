"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import apiClient from "@/lib/apiClient";
import db from "@/lib/mockDatabase";
import {
  Sparkles, Calendar, MessageSquare, Trophy, BookOpen, GraduationCap,
  ArrowRight, TrendingUp, Coins, Flame, Star, Users, UserPlus, Check, X, UserCheck, Video
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [connections, setConnections] = useState([]);
  const [userSkills, setUserSkills] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});

  const loadDashboardData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [sessData, connData, skillData, txData] = await Promise.all([
        apiClient.get("/api/sessions").catch(() => []),
        apiClient.get("/api/connections").catch(() => []),
        apiClient.get("/api/user-skills").catch(() => []),
        apiClient.get("/api/transactions").catch(() => []),
      ]);

      setSessions(sessData || []);
      setConnections(connData || []);
      setUserSkills(skillData || []);
      setTransactions(txData || []);
    } catch (e) {
      console.warn("Dashboard data load failed:", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleUpdateConnection = async (connId, status) => {
    setActionLoading((prev) => ({ ...prev, [connId]: true }));
    try {
      await apiClient.patch(`/api/connections/${connId}`, { status });
      await loadDashboardData();
    } catch (e) {
      alert(e.message || `Failed to update connection`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [connId]: false }));
    }
  };

  const getInitials = (name) =>
    name?.split(" ").map((n) => n[0]).join("").toUpperCase() || "?";

  if (!user) return null;

  // Categorize connections
  const pendingReceived = connections.filter(
    (c) => c.status === "pending" && c.receiverId === user.id
  );
  const pendingSent = connections.filter(
    (c) => c.status === "pending" && c.senderId === user.id
  );
  const acceptedConnections = connections.filter((c) => c.status === "accepted");

  // Categorize sessions
  const upcoming = sessions.filter((s) => s.status === "upcoming");

  // Categorize skills
  const teachSkills = userSkills.filter((us) => us.type === "teach");
  const learnSkills = userSkills.filter((us) => us.type === "learn");

  const badges = db.getUserBadges(user.id) || [];

  return (
    <div className="space-y-6 max-w-6xl animate-fade-in">
      {/* Welcome Banner */}
      <div className="glass-red rounded-2xl p-6 relative overflow-hidden">
        <div className="bg-dots absolute inset-0 opacity-20 pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-[Outfit]">
            Welcome back, {user.name?.split(" ")[0]}! 👋
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Ready to teach, learn, and exchange skills today?
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/matches" className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Find Matches
            </Link>
            <Link href="/session/instant-live-meeting" className="bg-gradient-to-r from-red-600 to-amber-500 hover:opacity-90 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5">
              <Video className="h-3.5 w-3.5" /> Instant Video Call
            </Link>
            <Link href="/ai/assistant" className="btn-secondary text-xs px-4 py-2">
              Ask AI Assistant
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { label: "SkillCoins", value: user.skillCoins || 0, icon: <Coins className="h-4 w-4 text-amber-400" /> },
          { label: "XP", value: user.xp || 0, icon: <TrendingUp className="h-4 w-4 text-emerald-400" /> },
          { label: "Streak", value: `${user.streak || 0}d`, icon: <Flame className="h-4 w-4 text-orange-400" /> },
          { label: "Sessions", value: user.sessionsCompleted || 0, icon: <Calendar className="h-4 w-4 text-sky-400" /> },
          { label: "Rating", value: user.rating || "—", icon: <Star className="h-4 w-4 text-yellow-400" /> },
          { label: "Connections", value: acceptedConnections.length, icon: <Users className="h-4 w-4 text-purple-400" /> },
        ].map((stat, i) => (
          <div key={i} className="glass rounded-xl p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono text-slate-400 font-bold">{stat.label}</span>
              {stat.icon}
            </div>
            <div className="text-xl font-extrabold text-white font-mono">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Pending Connection Requests Alert Box */}
      {pendingReceived.length > 0 && (
        <div className="glass rounded-2xl p-5 border border-amber-500/30 bg-amber-500/10 space-y-3 animate-slide-up">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-amber-300 uppercase font-mono flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-amber-400" /> Incoming Connection Requests ({pendingReceived.length})
            </h2>
            <Link href="/connections" className="text-xs text-amber-300 hover:underline">
              View All
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingReceived.map((c) => {
              const sender = c.sender;
              return (
                <div
                  key={c.id}
                  className="bg-slate-900/90 rounded-xl p-3.5 flex items-center justify-between gap-3 border border-amber-500/20"
                >
                  <div className="flex items-center gap-3">
                    <Link href={`/profile/${sender?.id}`}>
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-500 to-red-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-amber-400/50">
                        {getInitials(sender?.name)}
                      </div>
                    </Link>
                    <div>
                      <Link
                        href={`/profile/${sender?.id}`}
                        className="text-sm font-bold text-white hover:text-amber-300 transition-colors"
                      >
                        {sender?.name}
                      </Link>
                      <div className="text-xs text-slate-400 line-clamp-1">
                        {sender?.bio || "wants to connect with you"}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => handleUpdateConnection(c.id, "accepted")}
                      disabled={actionLoading[c.id]}
                      className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1 disabled:opacity-50"
                    >
                      <Check className="h-3.5 w-3.5" /> Accept
                    </button>
                    <button
                      onClick={() => handleUpdateConnection(c.id, "rejected")}
                      disabled={actionLoading[c.id]}
                      className="btn-secondary text-xs px-2.5 py-1.5 disabled:opacity-50"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Connections / Peers */}
        <div className="glass rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-purple-400" /> Active Connections ({acceptedConnections.length})
            </h2>
            <Link href="/connections" className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {acceptedConnections.length === 0 ? (
            <div className="text-center py-6">
              <Users className="h-8 w-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No active connections yet.</p>
              <Link href="/matches" className="btn-primary text-xs inline-flex items-center gap-1 mt-3">
                <Sparkles className="h-3.5 w-3.5" /> Discover Matches
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {acceptedConnections.slice(0, 4).map((c) => {
                const partner = c.senderId === user.id ? c.receiver : c.sender;
                return (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <Link href={`/profile/${partner?.id}`}>
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-purple-600 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                          {getInitials(partner?.name)}
                        </div>
                      </Link>
                      <div>
                        <Link href={`/profile/${partner?.id}`} className="font-bold text-white hover:text-purple-300">
                          {partner?.name}
                        </Link>
                        <div className="text-xs text-slate-400 line-clamp-1">{partner?.bio || "Connected SkillSwap Peer"}</div>
                      </div>
                    </div>
                    <Link href={`/chat?userId=${partner?.id}`} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5" /> Chat
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Upcoming Sessions */}
        <div className="glass rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="h-4 w-4 text-red-400" /> Upcoming Sessions ({upcoming.length})
            </h2>
            <Link href="/sessions" className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <div className="text-center py-6">
              <Calendar className="h-8 w-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No upcoming sessions scheduled.</p>
              <Link href="/sessions" className="btn-secondary text-xs inline-flex items-center gap-1 mt-3">
                Schedule Session
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {upcoming.slice(0, 3).map((s) => {
                const peer = s.mentorId === user.id ? s.learner : s.mentor;
                const isMentor = s.mentorId === user.id;
                return (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5 text-sm">
                    <div>
                      <div className="font-semibold text-white">{s.topic || s.skill?.name}</div>
                      <div className="text-xs text-slate-400">with {peer?.name} • {s.date} at {s.time}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded ${isMentor ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"}`}>
                        {isMentor ? "Teaching" : "Learning"}
                      </span>
                      <Link href={`/session/${s.id}`} className="bg-gradient-to-r from-red-600 to-amber-500 text-white text-xs px-2.5 py-1 rounded-lg font-bold flex items-center gap-1">
                        <Video className="h-3 w-3" /> Join
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Skills Summary & Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Skills Summary */}
        <div className="glass rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-emerald-400" /> My Skills
            </h2>
            <Link href="/profile" className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
              Edit <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-[10px] uppercase font-mono text-emerald-400 font-bold mb-1.5">
                I Can Teach ({teachSkills.length})
              </div>
              <div className="flex flex-wrap gap-1.5">
                {teachSkills.map((us, i) => (
                  <span key={i} className="text-xs bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2.5 py-1 rounded-lg font-medium">
                    {us.skill?.name} <span className="text-emerald-500/60">({us.proficiency})</span>
                  </span>
                ))}
                {teachSkills.length === 0 && (
                  <span className="text-xs text-slate-500">None added yet — <Link href="/profile" className="text-red-400">add skills</Link></span>
                )}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono text-amber-400 font-bold mb-1.5">
                I Want to Learn ({learnSkills.length})
              </div>
              <div className="flex flex-wrap gap-1.5">
                {learnSkills.map((us, i) => (
                  <span key={i} className="text-xs bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2.5 py-1 rounded-lg font-medium">
                    {us.skill?.name} <span className="text-amber-500/60">({us.proficiency})</span>
                  </span>
                ))}
                {learnSkills.length === 0 && (
                  <span className="text-xs text-slate-500">None added yet — <Link href="/profile" className="text-red-400">add goals</Link></span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Badges & Transactions */}
        <div className="glass rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-400" /> Badges & XP
            </h2>
            <Link href="/leaderboard" className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
              Leaderboard <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {badges.length === 0 ? (
            <p className="text-xs text-slate-500 py-2">Complete sessions and activities to unlock achievement badges!</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {badges.map((b) => (
                <div key={b.id} className="bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl text-xs flex items-center gap-2">
                  <span className="text-base">{b.icon}</span>
                  <div>
                    <div className="font-bold text-white">{b.name}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
