"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import db from "@/lib/mockDatabase";
import { Calendar, Plus, CheckCircle2, XCircle, Clock, Video } from "lucide-react";
import confetti from "canvas-confetti";

export default function SessionsPage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [showNewSession, setShowNewSession] = useState(false);
  const [, refresh] = useState(0);

  // New session form state
  const [peerId, setPeerId] = useState("");
  const [skillId, setSkillId] = useState("");
  const [topic, setTopic] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("16:00");
  const [duration, setDuration] = useState(60);

  if (!user) return null;

  const sessions = db.getSessions(user.id);
  const upcoming = sessions.filter(s => s.status === "upcoming");
  const completed = sessions.filter(s => s.status === "completed");
  const cancelled = sessions.filter(s => s.status === "cancelled");

  const connections = db.getAcceptedConnections(user.id);
  const connectedUsers = connections.map(c => {
    const partnerId = c.senderId === user.id ? c.receiverId : c.senderId;
    return db.getUser(partnerId);
  }).filter(Boolean);

  const allSkills = db.getSkills();

  const handleCreateSession = (e) => {
    e.preventDefault();
    if (!peerId || !skillId || !date) return;
    db.createSession({
      mentorId: user.id,
      learnerId: peerId,
      skillId,
      topic: topic || allSkills.find(s => s.id === skillId)?.name || "Session",
      date,
      time,
      duration,
    });
    setShowNewSession(false);
    setPeerId(""); setSkillId(""); setTopic(""); setDate(""); setTime("16:00");
    refresh(n => n + 1);
  };

  const handleComplete = (sessionId) => {
    const session = db.completeSession(sessionId);
    if (session) {
      // Award SkillCoins
      if (session.mentorId === user.id) {
        db.addTransaction(user.id, "earned", 10, `Taught session: ${session.topic}`);
        db.updateUser(user.id, { xp: (user.xp || 0) + 10, sessionsCompleted: (user.sessionsCompleted || 0) + 1 });
      } else {
        db.addTransaction(user.id, "earned", 5, `Completed learning: ${session.topic}`);
        db.updateUser(user.id, { xp: (user.xp || 0) + 5, sessionsCompleted: (user.sessionsCompleted || 0) + 1 });
      }
      confetti({ particleCount: 80, spread: 60 });
      refreshUser();
      refresh(n => n + 1);
    }
  };

  const handleCancel = (sessionId) => {
    db.cancelSession(sessionId);
    refresh(n => n + 1);
  };

  const getInitials = (name) => name?.split(" ").map(n => n[0]).join("").toUpperCase() || "?";

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-[Outfit] flex items-center gap-2"><Calendar className="h-6 w-6 text-red-400" /> My Sessions</h1>
          <p className="text-sm text-slate-400 mt-1">Schedule, manage, and complete skill exchange sessions</p>
        </div>
        <button onClick={() => setShowNewSession(!showNewSession)} className="btn-primary text-sm"><Plus className="h-4 w-4" /> New Session</button>
      </div>

      {/* New Session Form */}
      {showNewSession && (
        <form onSubmit={handleCreateSession} className="glass rounded-2xl p-5 space-y-4 animate-slide-up">
          <h3 className="text-base font-bold text-white">Schedule New Session</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Peer</label>
              <select value={peerId} onChange={e => setPeerId(e.target.value)} required className="input-base text-xs">
                <option value="">Select a connected peer...</option>
                {connectedUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Skill/Topic</label>
              <select value={skillId} onChange={e => setSkillId(e.target.value)} required className="input-base text-xs">
                <option value="">Select a skill...</option>
                {allSkills.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="input-base text-xs" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Time</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} className="input-base text-xs" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary text-xs">Create Session</button>
            <button type="button" onClick={() => setShowNewSession(false)} className="btn-secondary text-xs">Cancel</button>
          </div>
        </form>
      )}

      {/* Upcoming Sessions */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-300 uppercase font-mono flex items-center gap-2"><Clock className="h-4 w-4 text-amber-400" /> Upcoming ({upcoming.length})</h2>
        {upcoming.length === 0 && <p className="text-sm text-slate-500 glass rounded-xl p-6 text-center">No upcoming sessions. Schedule one above!</p>}
        {upcoming.map(s => {
          const peer = db.getUser(s.mentorId === user.id ? s.learnerId : s.mentorId);
          const skill = allSkills.find(sk => sk.id === s.skillId);
          return (
            <div key={s.id} className="glass glass-hover rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-600 to-amber-500 flex items-center justify-center text-white text-xs font-bold">{getInitials(peer?.name)}</div>
                <div>
                  <div className="text-sm font-bold text-white">{s.topic || skill?.name}</div>
                  <div className="text-xs text-slate-400">with {peer?.name} • {s.date} at {s.time} • {s.duration}min</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded ${s.mentorId === user.id ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"}`}>
                  {s.mentorId === user.id ? "Teaching" : "Learning"}
                </span>
                <button onClick={() => router.push(`/session/${s.id}`)} className="text-xs px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 text-white transition-all">
                  <Video className="h-3.5 w-3.5" /> Join Live
                </button>
                <button onClick={() => handleComplete(s.id)} className="btn-primary text-xs px-3 py-1.5"><CheckCircle2 className="h-3.5 w-3.5" /> Complete</button>
                <button onClick={() => handleCancel(s.id)} className="btn-secondary text-xs px-3 py-1.5"><XCircle className="h-3.5 w-3.5" /> Cancel</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Completed Sessions */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-300 uppercase font-mono flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Completed ({completed.length})</h2>
        {completed.map(s => {
          const peer = db.getUser(s.mentorId === user.id ? s.learnerId : s.mentorId);
          const skill = allSkills.find(sk => sk.id === s.skillId);
          return (
            <div key={s.id} className="glass rounded-xl p-4 flex items-center justify-between gap-4 opacity-80">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 text-xs font-bold">{getInitials(peer?.name)}</div>
                <div>
                  <div className="text-sm font-medium text-slate-300">{s.topic || skill?.name}</div>
                  <div className="text-xs text-slate-500">with {peer?.name} • {s.date}</div>
                </div>
              </div>
              <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400">✓ Done</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
