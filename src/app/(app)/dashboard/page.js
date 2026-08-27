"use client";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import db from "@/lib/mockDatabase";
import { Sparkles, Calendar, MessageSquare, Trophy, BookOpen, GraduationCap, ArrowRight, TrendingUp, Coins, Flame, Star, Users } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;

  const sessions = db.getSessions(user.id);
  const upcoming = sessions.filter(s => s.status === "upcoming");
  const completed = sessions.filter(s => s.status === "completed");
  const teachSkills = db.getUserTeachSkills(user.id);
  const learnSkills = db.getUserLearnSkills(user.id);
  const connections = db.getAcceptedConnections(user.id);
  const badges = db.getUserBadges(user.id);
  const txs = db.getTransactions(user.id);

  return (
    <div className="space-y-6 max-w-6xl animate-fade-in">
      {/* Welcome Banner */}
      <div className="glass-red rounded-2xl p-6 relative overflow-hidden">
        <div className="bg-dots absolute inset-0 opacity-20 pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-[Outfit]">
            Welcome back, {user.name?.split(" ")[0]}! 👋
          </h1>
          <p className="text-sm text-slate-300 mt-1">Ready to teach, learn, and grow today?</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/matches" className="btn-primary text-xs px-4 py-2"><Sparkles className="h-3.5 w-3.5" /> Find Matches</Link>
            <Link href="/ai/assistant" className="btn-secondary text-xs px-4 py-2">Ask AI Assistant</Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { label: "SkillCoins", value: user.skillCoins || 0, icon: <Coins className="h-4 w-4 text-amber-400" />, color: "amber" },
          { label: "XP", value: user.xp || 0, icon: <TrendingUp className="h-4 w-4 text-emerald-400" />, color: "emerald" },
          { label: "Streak", value: `${user.streak || 0}d`, icon: <Flame className="h-4 w-4 text-orange-400" />, color: "orange" },
          { label: "Sessions", value: user.sessionsCompleted || 0, icon: <Calendar className="h-4 w-4 text-sky-400" />, color: "sky" },
          { label: "Rating", value: user.rating || "—", icon: <Star className="h-4 w-4 text-yellow-400" />, color: "yellow" },
          { label: "Connections", value: connections.length, icon: <Users className="h-4 w-4 text-purple-400" />, color: "purple" },
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Sessions */}
        <div className="glass rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2"><Calendar className="h-4 w-4 text-red-400" /> Upcoming Sessions</h2>
            <Link href="/sessions" className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">View All <ArrowRight className="h-3 w-3" /></Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">No upcoming sessions. <Link href="/matches" className="text-red-400">Find a match!</Link></p>
          ) : (
            upcoming.slice(0, 3).map(s => {
              const peer = db.getUser(s.mentorId === user.id ? s.learnerId : s.mentorId);
              const skill = db.getSkills().find(sk => sk.id === s.skillId);
              return (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5 text-sm">
                  <div>
                    <div className="font-semibold text-white">{s.topic || skill?.name}</div>
                    <div className="text-xs text-slate-400">with {peer?.name} • {s.date} at {s.time}</div>
                  </div>
                  <span className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded ${s.mentorId === user.id ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"}`}>
                    {s.mentorId === user.id ? "Teaching" : "Learning"}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* My Skills Summary */}
        <div className="glass rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2"><BookOpen className="h-4 w-4 text-emerald-400" /> My Skills</h2>
            <Link href="/profile" className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">Edit <ArrowRight className="h-3 w-3" /></Link>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-[10px] uppercase font-mono text-emerald-400 font-bold mb-1.5">I Can Teach ({teachSkills.length})</div>
              <div className="flex flex-wrap gap-1.5">
                {teachSkills.map((s, i) => (
                  <span key={i} className="text-xs bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2.5 py-1 rounded-lg font-medium">
                    {s.skill?.name} <span className="text-emerald-500/60">({s.proficiency})</span>
                  </span>
                ))}
                {teachSkills.length === 0 && <span className="text-xs text-slate-500">None yet — <Link href="/profile" className="text-red-400">add skills</Link></span>}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono text-amber-400 font-bold mb-1.5">I Want to Learn ({learnSkills.length})</div>
              <div className="flex flex-wrap gap-1.5">
                {learnSkills.map((s, i) => (
                  <span key={i} className="text-xs bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2.5 py-1 rounded-lg font-medium">
                    {s.skill?.name} <span className="text-amber-500/60">({s.proficiency})</span>
                  </span>
                ))}
                {learnSkills.length === 0 && <span className="text-xs text-slate-500">None yet — <Link href="/profile" className="text-red-400">add goals</Link></span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Badges & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-5 space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2"><Trophy className="h-4 w-4 text-amber-400" /> My Badges</h2>
          {badges.length === 0 ? (
            <p className="text-sm text-slate-500 py-2">Complete sessions and activities to earn badges!</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {badges.map(b => (
                <div key={b.id} className="bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-xl text-xs flex items-center gap-2">
                  <span className="text-lg">{b.icon}</span>
                  <div>
                    <div className="font-bold text-white">{b.name}</div>
                    <div className="text-amber-400/70">{b.description}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass rounded-2xl p-5 space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2"><Coins className="h-4 w-4 text-amber-400" /> Recent Transactions</h2>
          {txs.length === 0 ? (
            <p className="text-sm text-slate-500 py-2">No transactions yet.</p>
          ) : (
            txs.slice(0, 4).map(tx => (
              <div key={tx.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-white/[0.02] border border-white/5">
                <div>
                  <div className="text-slate-200 font-medium">{tx.description}</div>
                  <div className="text-slate-500 text-[10px] font-mono">{tx.timestamp?.split("T")[0]}</div>
                </div>
                <span className={`font-mono font-bold ${tx.amount > 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {tx.amount > 0 ? "+" : ""}{tx.amount}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
