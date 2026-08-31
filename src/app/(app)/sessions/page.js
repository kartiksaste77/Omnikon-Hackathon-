"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import apiClient from "@/lib/apiClient";
import { Calendar, Plus, CheckCircle2, XCircle, Clock, Video, RefreshCw } from "lucide-react";
import confetti from "canvas-confetti";

export default function SessionsPage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState([]);
  const [connections, setConnections] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewSession, setShowNewSession] = useState(false);
  const [creating, setCreating] = useState(false);

  // New session form state
  const [peerId, setPeerId] = useState("");
  const [skillId, setSkillId] = useState("");
  const [topic, setTopic] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("16:00");
  const [duration, setDuration] = useState(60);
  const [role, setRole] = useState("teach");

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [sessionsData, connsData, skillsData] = await Promise.all([
        apiClient.get("/api/sessions"),
        apiClient.get("/api/connections"),
        apiClient.get("/api/skills"),
      ]);
      setSessions(sessionsData || []);
      setConnections(connsData || []);
      setAllSkills(skillsData || []);
    } catch (e) {
      console.warn("Sessions load failed:", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const acceptedConnections = connections.filter((c) => c.status === "accepted");
  const connectedUsers = acceptedConnections
    .map((c) => (c.senderId === user?.id ? c.receiver : c.sender))
    .filter(Boolean);

  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!peerId || !date) return;
    setCreating(true);
    try {
      const selectedSkill = allSkills.find((s) => s.id === skillId);
      await apiClient.post("/api/sessions", {
        peerId,
        skillId: skillId || null,
        topic: topic || selectedSkill?.name || "Skill Exchange Session",
        date,
        time,
        duration: parseInt(duration, 10) || 60,
        role,
      });
      setShowNewSession(false);
      setPeerId("");
      setSkillId("");
      setTopic("");
      setDate("");
      setTime("16:00");
      await loadData();
    } catch (err) {
      alert(err.message || "Failed to create session");
    } finally {
      setCreating(false);
    }
  };

  const handleComplete = async (sessionId) => {
    try {
      await apiClient.patch(`/api/sessions/${sessionId}`, { status: "completed" });
      confetti({ particleCount: 80, spread: 60 });
      refreshUser?.();
      await loadData();
    } catch (err) {
      alert(err.message || "Failed to complete session");
    }
  };

  const handleCancel = async (sessionId) => {
    if (!confirm("Are you sure you want to cancel this session?")) return;
    try {
      await apiClient.patch(`/api/sessions/${sessionId}`, { status: "cancelled" });
      await loadData();
    } catch (err) {
      alert(err.message || "Failed to cancel session");
    }
  };

  const getInitials = (name) =>
    name?.split(" ").map((n) => n[0]).join("").toUpperCase() || "?";

  if (!user) return null;

  const upcoming = sessions.filter((s) => s.status === "upcoming");
  const completed = sessions.filter((s) => s.status === "completed");

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white font-[Outfit] flex items-center gap-2">
            <Calendar className="h-6 w-6 text-red-400" /> My Sessions
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Schedule, manage, and complete skill exchange sessions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="btn-secondary text-xs px-3 py-2 flex items-center gap-1"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowNewSession(!showNewSession)}
            className="btn-primary text-sm"
          >
            <Plus className="h-4 w-4" /> New Session
          </button>
        </div>
      </div>

      {/* New Session Form */}
      {showNewSession && (
        <form onSubmit={handleCreateSession} className="glass rounded-2xl p-5 space-y-4 animate-slide-up border border-red-500/30 bg-slate-900/90">
          <h3 className="text-base font-bold text-white">Schedule New Session</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Peer</label>
              <select
                value={peerId}
                onChange={(e) => setPeerId(e.target.value)}
                required
                className="input-base text-xs"
              >
                <option value="">Select a connected peer...</option>
                {connectedUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
              {connectedUsers.length === 0 && (
                <p className="text-[10px] text-amber-400 mt-1">
                  You need at least 1 active connection to schedule a session. Connect with peers in Find Matches!
                </p>
              )}
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">I will be</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="input-base text-xs"
              >
                <option value="teach">Teaching (Mentor)</option>
                <option value="learn">Learning (Learner)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Skill/Topic</label>
              <select
                value={skillId}
                onChange={(e) => setSkillId(e.target.value)}
                className="input-base text-xs"
              >
                <option value="">Select a skill (optional)...</option>
                {allSkills.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.category})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Session Topic / Goal</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. React hooks walkthrough"
                className="input-base text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="input-base text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="input-base text-xs"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={creating || !peerId || !date}
              className="btn-primary text-xs disabled:opacity-50"
            >
              {creating ? "Scheduling..." : "Create Session"}
            </button>
            <button
              type="button"
              onClick={() => setShowNewSession(false)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Upcoming Sessions */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-300 uppercase font-mono flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-400" /> Upcoming ({upcoming.length})
        </h2>
        {upcoming.length === 0 && !loading && (
          <p className="text-sm text-slate-500 glass rounded-xl p-6 text-center">
            No upcoming sessions. Connect with peers and schedule one!
          </p>
        )}
        {upcoming.map((s) => {
          const peer = s.mentorId === user.id ? s.learner : s.mentor;
          const isMentor = s.mentorId === user.id;
          return (
            <div
              key={s.id}
              className="glass glass-hover rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-600 to-amber-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white/10">
                  {getInitials(peer?.name)}
                </div>
                <div>
                  <div className="text-sm font-bold text-white">{s.topic || s.skill?.name}</div>
                  <div className="text-xs text-slate-400">
                    with {peer?.name} • {s.date} at {s.time} • {s.duration}min
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded ${
                    isMentor
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                  }`}
                >
                  {isMentor ? "Teaching" : "Learning"}
                </span>
                <button
                  onClick={() => router.push(`/session/${s.id}`)}
                  className="text-xs px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 text-white transition-all shadow-md shadow-blue-500/20"
                >
                  <Video className="h-3.5 w-3.5" /> Join Live
                </button>
                <button
                  onClick={() => handleComplete(s.id)}
                  className="btn-primary text-xs px-3 py-1.5"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Complete
                </button>
                <button
                  onClick={() => handleCancel(s.id)}
                  className="btn-secondary text-xs px-3 py-1.5"
                >
                  <XCircle className="h-3.5 w-3.5" /> Cancel
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Completed Sessions */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-300 uppercase font-mono flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Completed ({completed.length})
        </h2>
        {completed.map((s) => {
          const peer = s.mentorId === user.id ? s.learner : s.mentor;
          return (
            <div
              key={s.id}
              className="glass rounded-xl p-4 flex items-center justify-between gap-4 opacity-80"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 text-xs font-bold">
                  {getInitials(peer?.name)}
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-300">
                    {s.topic || s.skill?.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    with {peer?.name} • {s.date}
                  </div>
                </div>
              </div>
              <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                ✓ Completed
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
