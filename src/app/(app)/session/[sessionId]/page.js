"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import db from "@/lib/mockDatabase";
import { useRouter, useParams } from "next/navigation";
import {
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff,
  MessageSquare, Users, Hand, Settings, PhoneOff,
  Wifi, WifiOff, X, Send, ChevronUp, Star,
  CheckCircle2, AlertTriangle, Maximize2, Minimize2
} from "lucide-react";
import confetti from "canvas-confetti";

// ─── Constants ─────────────────────────────────────────────────────────────────
const CHAT_SEEDS = [
  { from: "peer", text: "Hey! Ready to start?" },
  { from: "peer", text: "Can you share your screen for the demo?" },
  { from: "peer", text: "That makes total sense! Thanks 🙌" },
];

const CONNECTION_QUALITY = ["Excellent", "Good", "Fair", "Poor"];

// ─── Sub-components ─────────────────────────────────────────────────────────────

function VideoTile({ name, isSelf, isCameraOn, isMuted, isActiveSpeaker, role, large }) {
  const initials = name?.split(" ").map(n => n[0]).join("").toUpperCase() || "?";
  return (
    <div className={`relative rounded-xl overflow-hidden bg-[#1A1A24] flex items-center justify-center transition-all duration-300
      ${large ? "flex-1 min-h-0" : "h-28 w-full shrink-0"}
      ${isActiveSpeaker ? "ring-2 ring-blue-500" : ""}`}
    >
      {isCameraOn ? (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
          {/* Simulated video feed with gradient */}
          <div className="text-6xl select-none">{isSelf ? "🧑‍💻" : "👨‍🏫"}</div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
            {initials}
          </div>
        </div>
      )}
      {/* Name + badges */}
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
        <span className="bg-black/60 text-white text-xs px-2 py-0.5 rounded-md font-medium backdrop-blur-sm">
          {name}{isSelf ? " (You)" : ""}
        </span>
        {role && <span className="bg-blue-600/80 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">{role}</span>}
      </div>
      {isMuted && (
        <div className="absolute top-2 right-2 bg-red-600/80 rounded-full p-1"><MicOff className="h-3 w-3 text-white" /></div>
      )}
      {isActiveSpeaker && !isMuted && (
        <div className="absolute top-2 right-2 bg-green-500/80 rounded-full p-1 animate-pulse"><Mic className="h-3 w-3 text-white" /></div>
      )}
    </div>
  );
}

function ControlBtn({ icon, label, active, danger, onClick, badge }) {
  return (
    <button onClick={onClick}
      className={`relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all text-xs font-medium
        ${danger ? "bg-red-600 hover:bg-red-700 text-white" : active ? "bg-blue-600/30 text-blue-400" : "bg-white/5 hover:bg-white/10 text-slate-300"}`}>
      {icon}
      <span className="hidden sm:block">{label}</span>
      {badge > 0 && (
        <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{badge}</span>
      )}
    </button>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function LiveSessionPage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const params = useParams();
  const sessionId = params?.sessionId;
  const chatEndRef = useRef(null);

  // Session data
  const [session, setSession] = useState(null);
  const [peer, setPeer] = useState(null);

  // Media controls
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState("peer"); // "self" | "peer"

  // Panels
  const [chatOpen, setChatOpen] = useState(false);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [handRaised, setHandRaised] = useState(false);

  // Chat
  const [messages, setMessages] = useState([
    { id: 1, from: "system", text: "Session started", ts: new Date() },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [unread, setUnread] = useState(0);

  // Timer
  const [elapsed, setElapsed] = useState(0);

  // End / post session
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Connection
  const [quality, setQuality] = useState(0); // index into CONNECTION_QUALITY

  // Phase: "waiting" | "live" | "ended"
  const [phase, setPhase] = useState("waiting");

  // ─── Load session data ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!user || !sessionId) return;
    const s = db.getSession ? db.getSession(sessionId) : db.getSessions(user.id).find(x => x.id === sessionId);
    if (s) {
      setSession(s);
      const peerId = s.mentorId === user.id ? s.learnerId : s.mentorId;
      setPeer(db.getUser(peerId));
    }
  }, [user, sessionId]);

  // ─── Timer ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "live") return;
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // ─── Auto join after 2s on waiting ─────────────────────────────────────────
  useEffect(() => {
    if (phase !== "waiting") return;
    const t = setTimeout(() => {
      setPhase("live");
      setMessages(prev => [...prev, { id: Date.now(), from: "system", text: `${peer?.name || "Peer"} joined the session`, ts: new Date() }]);
    }, 2500);
    return () => clearTimeout(t);
  }, [phase, peer]);

  // ─── Simulate active speaker toggle ────────────────────────────────────────
  useEffect(() => {
    if (phase !== "live") return;
    const t = setInterval(() => setActiveSpeaker(prev => prev === "peer" ? "self" : "peer"), 8000);
    return () => clearInterval(t);
  }, [phase]);

  // ─── Simulate peer chat messages ────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "live") return;
    const timers = CHAT_SEEDS.map((seed, i) =>
      setTimeout(() => {
        const msg = { id: Date.now() + i, from: "peer", text: seed.text, ts: new Date() };
        setMessages(prev => [...prev, msg]);
        if (!chatOpen) setUnread(n => n + 1);
      }, (i + 1) * 12000)
    );
    return () => timers.forEach(clearTimeout);
  }, [phase]);

  // ─── Auto-scroll chat ───────────────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ─── Quality simulation ─────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "live") return;
    const t = setInterval(() => setQuality(Math.floor(Math.random() * 2)), 15000);
    return () => clearInterval(t);
  }, [phase]);

  // ─── Send chat message ──────────────────────────────────────────────────────
  const sendMsg = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setMessages(prev => [...prev, { id: Date.now(), from: "self", text: chatInput.trim(), ts: new Date() }]);
    setChatInput("");
  };

  // ─── Open chat and clear badge ──────────────────────────────────────────────
  const handleChatOpen = () => {
    setChatOpen(o => !o);
    setParticipantsOpen(false);
    setUnread(0);
  };

  // ─── End session ───────────────────────────────────────────────────────────
  const handleEndSession = () => {
    if (session) {
      db.completeSession(session.id);
      const coins = session.mentorId === user.id ? 10 : 5;
      db.addTransaction(user.id, "earned", coins, `Completed session: ${session.topic}`);
      db.updateUser(user.id, {
        xp: (user.xp || 0) + coins,
        sessionsCompleted: (user.sessionsCompleted || 0) + 1,
        skillCoins: (user.skillCoins || 0) + coins,
      });
      refreshUser();
    }
    setShowEndDialog(false);
    setSessionEnded(true);
    setPhase("ended");
    confetti({ particleCount: 100, spread: 80 });
  };

  // ─── Submit review ──────────────────────────────────────────────────────────
  const handleSubmitReview = () => {
    if (session && peer) {
      db.addReview({ sessionId: session.id, reviewerId: user.id, revieweeId: peer.id, rating, feedback: reviewText });
    }
    setReviewSubmitted(true);
    setTimeout(() => router.push("/dashboard"), 2000);
  };

  if (!user) return null;

  // ─── Skill + roles ──────────────────────────────────────────────────────────
  const allSkills = db.getSkills();
  const skillName = session ? (allSkills.find(s => s.id === session.skillId)?.name || session.topic || "Skill Session") : "Skill Session";
  const isMentor = session?.mentorId === user.id;

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── WAITING ROOM ──────────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  if (phase === "waiting") {
    return (
      <div className="fixed inset-0 bg-[#0A0A10] flex items-center justify-center z-50 p-4">
        <div className="glass rounded-3xl p-8 max-w-sm w-full text-center space-y-6 animate-fade-in">
          <div className="text-sm font-bold text-red-400 font-mono">SKILLSWAP LIVE</div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white">{skillName}</h2>
            <p className="text-xs text-slate-400">
              {isMentor ? `Teaching: ${peer?.name}` : `Learning from: ${peer?.name}`}
            </p>
          </div>
          {/* Pulse animation */}
          <div className="relative flex items-center justify-center my-4">
            <div className="absolute h-32 w-32 rounded-full bg-blue-600/20 animate-ping" />
            <div className="absolute h-24 w-24 rounded-full bg-blue-600/30 animate-pulse" />
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-2xl z-10">
              {peer?.name?.split(" ").map(n => n[0]).join("") || "?"}
            </div>
          </div>
          <p className="text-slate-400 text-sm">Waiting for {peer?.name} to join...</p>
          <div className="flex justify-center gap-4">
            <div className={`flex items-center gap-1.5 text-xs ${micOn ? "text-green-400" : "text-red-400"}`}>
              {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              <button onClick={() => setMicOn(m => !m)}>Mic {micOn ? "On" : "Off"}</button>
            </div>
            <div className={`flex items-center gap-1.5 text-xs ${cameraOn ? "text-green-400" : "text-red-400"}`}>
              {cameraOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
              <button onClick={() => setCameraOn(c => !c)}>Camera {cameraOn ? "On" : "Off"}</button>
            </div>
          </div>
          <div className="text-[10px] text-slate-600">Connecting... Please allow camera & microphone access</div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── POST SESSION ──────────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  if (phase === "ended") {
    return (
      <div className="fixed inset-0 bg-[#0A0A10] flex items-center justify-center z-50 p-4">
        <div className="glass rounded-3xl p-8 max-w-md w-full space-y-6 animate-fade-in">
          <div className="text-center space-y-2">
            <CheckCircle2 className="h-14 w-14 text-emerald-400 mx-auto" />
            <h2 className="text-xl font-bold text-white font-[Outfit]">Session Completed ✓</h2>
          </div>
          <div className="glass rounded-xl p-4 space-y-2 text-sm">
            {[
              ["Skill", skillName],
              [isMentor ? "Learner" : "Teacher", peer?.name],
              ["Duration", fmtTime(elapsed)],
              ["Date", new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })],
              ["SkillCoins Earned", `+${isMentor ? 10 : 5} 🪙`],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-slate-400">{label}</span>
                <span className="text-white font-medium">{val}</span>
              </div>
            ))}
          </div>

          {!reviewSubmitted ? (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white text-center">How was your session?</h3>
              <div className="flex justify-center gap-1">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setRating(n)}>
                    <Star className={`h-8 w-8 ${n <= rating ? "text-amber-400 fill-amber-400" : "text-slate-600"}`} />
                  </button>
                ))}
              </div>
              <textarea value={reviewText} onChange={e => setReviewText(e.target.value)}
                rows={3} placeholder="Share your experience..."
                className="input-base w-full resize-none text-sm" />
              <button onClick={handleSubmitReview} className="btn-primary w-full text-sm">Submit Review</button>
            </div>
          ) : (
            <div className="text-center text-emerald-400 text-sm font-medium animate-fade-in">
              ✓ Review submitted! Redirecting...
            </div>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── LIVE SESSION ──────────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  const qualityColor = quality === 0 ? "text-green-400" : quality === 1 ? "text-green-400" : quality === 2 ? "text-amber-400" : "text-red-400";

  return (
    <div className="fixed inset-0 bg-[#0A0A10] flex flex-col z-50 overflow-hidden">

      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#111118] border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-white font-[Outfit]">SkillSwap</span>
          <span className="hidden md:block text-slate-500 text-xs">|</span>
          <div className="hidden md:block">
            <div className="text-xs font-semibold text-white">{skillName}</div>
            <div className="text-[10px] text-slate-500">
              {isMentor ? "Teaching" : "Learning from"}: {peer?.name}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-red-400 text-sm font-bold font-mono">
            <span className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
            LIVE {fmtTime(elapsed)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Wifi className={`h-4 w-4 ${qualityColor}`} />
          <span className={`text-[10px] font-mono ${qualityColor}`}>{CONNECTION_QUALITY[quality]}</span>
        </div>
      </div>

      {/* ── Main Area ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── Video Area ── */}
        <div className={`flex flex-col flex-1 min-w-0 p-2 gap-2 transition-all ${(chatOpen || participantsOpen) ? "lg:mr-72" : ""}`}>

          {sharing ? (
            // Screen share view
            <div className="flex flex-col flex-1 min-h-0 gap-2">
              <div className="flex-1 bg-[#1A1A24] rounded-xl flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute top-3 left-3 flex items-center gap-2 bg-green-600/80 text-white text-xs px-3 py-1 rounded-full">
                  <Monitor className="h-3 w-3" /> You are sharing your screen
                </div>
                <div className="font-mono text-slate-500 text-sm">[ Screen Share Active ]</div>
                <div className="mt-4 bg-[#111] rounded-lg p-4 text-left w-[60%] max-w-xl font-mono text-xs space-y-1">
                  <div className="text-purple-400">def <span className="text-yellow-400">fibonacci</span>(n):</div>
                  <div className="text-slate-400 pl-4">if n &lt;= 1:</div>
                  <div className="text-slate-400 pl-8">return n</div>
                  <div className="text-slate-400 pl-4">return <span className="text-yellow-400">fibonacci</span>(n-1) + <span className="text-yellow-400">fibonacci</span>(n-2)</div>
                  <div className="text-green-400 mt-2">print(<span className="text-amber-400">fibonacci</span>(10)) <span className="text-slate-600"># 55</span></div>
                </div>
                <button onClick={() => setSharing(false)} className="mt-4 bg-red-600 hover:bg-red-700 text-white text-xs px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                  <MonitorOff className="h-3.5 w-3.5" /> Stop Sharing
                </button>
              </div>
              <div className="flex gap-2 h-24">
                <VideoTile name={peer?.name} isCameraOn={true} isMuted={false} isActiveSpeaker={activeSpeaker === "peer"} role={isMentor ? "Learner" : "Teacher"} />
                <VideoTile name={user.name} isSelf isCameraOn={cameraOn} isMuted={!micOn} isActiveSpeaker={activeSpeaker === "self"} role={isMentor ? "Teacher" : "Learner"} />
              </div>
            </div>
          ) : (
            // Normal view: large main + small self
            <div className="flex flex-col flex-1 min-h-0 gap-2">
              <VideoTile name={peer?.name} isCameraOn={true} isMuted={false} isActiveSpeaker={activeSpeaker === "peer"} role={isMentor ? "Learner" : "Teacher"} large />
              <div className="h-28 w-44 self-end">
                <VideoTile name={user.name} isSelf isCameraOn={cameraOn} isMuted={!micOn} isActiveSpeaker={activeSpeaker === "self"} role={isMentor ? "Teacher" : "Learner"} />
              </div>
            </div>
          )}
        </div>

        {/* ── Chat Panel ── */}
        {chatOpen && (
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-[#111118] border-l border-white/10 flex flex-col z-10 animate-slide-up">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <span className="text-sm font-bold text-white">Session Chat</span>
              <button onClick={() => setChatOpen(false)}><X className="h-4 w-4 text-slate-400" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.map(msg => (
                <div key={msg.id} className={msg.from === "system" ? "text-center" : msg.from === "self" ? "flex justify-end" : "flex justify-start"}>
                  {msg.from === "system" ? (
                    <span className="text-[10px] text-slate-500 bg-white/5 px-2 py-0.5 rounded">{msg.text}</span>
                  ) : (
                    <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs ${msg.from === "self" ? "bg-blue-600 text-white rounded-br-sm" : "bg-white/10 text-slate-200 rounded-bl-sm"}`}>
                      <p>{msg.text}</p>
                      <div className={`text-[9px] mt-1 ${msg.from === "self" ? "text-blue-200" : "text-slate-500"}`}>
                        {msg.ts?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={sendMsg} className="flex gap-2 p-3 border-t border-white/10">
              <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Type a message..." className="input-base flex-1 text-xs" />
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 p-2 rounded-lg transition-colors"><Send className="h-3.5 w-3.5 text-white" /></button>
            </form>
          </div>
        )}

        {/* ── Participants Panel ── */}
        {participantsOpen && !chatOpen && (
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-[#111118] border-l border-white/10 flex flex-col z-10 animate-slide-up">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <span className="text-sm font-bold text-white">Participants (2)</span>
              <button onClick={() => setParticipantsOpen(false)}><X className="h-4 w-4 text-slate-400" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {[
                { name: peer?.name, isMuted: false, isCamOn: true, role: isMentor ? "Learner" : "Teacher", quality: "Good" },
                { name: user.name, isMuted: !micOn, isCamOn: cameraOn, role: isMentor ? "Teacher" : "Learner", quality: "Excellent" },
              ].map((p, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-xl bg-white/5">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {p.name?.split(" ").map(n => n[0]).join("") || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-white truncate">{p.name}{i === 1 ? " (You)" : ""}</div>
                    <div className="text-[10px] text-slate-500">{p.role} • {p.quality}</div>
                  </div>
                  <div className="flex gap-1.5">
                    {p.isMuted ? <MicOff className="h-3.5 w-3.5 text-red-400" /> : <Mic className="h-3.5 w-3.5 text-green-400" />}
                    {p.isCamOn ? <Video className="h-3.5 w-3.5 text-green-400" /> : <VideoOff className="h-3.5 w-3.5 text-red-400" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom Controls ── */}
      <div className="bg-[#111118] border-t border-white/5 px-4 py-3 flex items-center justify-center gap-2 sm:gap-3 shrink-0">
        <ControlBtn icon={micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />} label={micOn ? "Mute" : "Unmute"} active={!micOn} onClick={() => setMicOn(m => !m)} />
        <ControlBtn icon={cameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />} label={cameraOn ? "Camera" : "Start Cam"} active={!cameraOn} onClick={() => setCameraOn(c => !c)} />
        <ControlBtn icon={sharing ? <MonitorOff className="h-5 w-5" /> : <Monitor className="h-5 w-5" />} label={sharing ? "Stop Share" : "Share"} active={sharing} onClick={() => setSharing(s => !s)} />
        <ControlBtn icon={<MessageSquare className="h-5 w-5" />} label="Chat" active={chatOpen} badge={unread} onClick={handleChatOpen} />
        <ControlBtn icon={<Users className="h-5 w-5" />} label="People" active={participantsOpen} onClick={() => { setParticipantsOpen(p => !p); setChatOpen(false); }} />
        <ControlBtn icon={<Hand className="h-5 w-5" />} label={handRaised ? "Lower" : "Raise"} active={handRaised} onClick={() => setHandRaised(h => !h)} />
        <ControlBtn icon={<Settings className="h-5 w-5" />} label="Settings" onClick={() => {}} />
        <ControlBtn icon={<PhoneOff className="h-5 w-5" />} label="Leave" danger onClick={() => setShowEndDialog(true)} />
      </div>

      {/* ── End Session Dialog ── */}
      {showEndDialog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass rounded-2xl p-6 max-w-sm w-full mx-4 space-y-4 animate-slide-up">
            <AlertTriangle className="h-10 w-10 text-amber-400 mx-auto" />
            <h3 className="text-base font-bold text-white text-center">End this session?</h3>
            <p className="text-xs text-slate-400 text-center">Your session will be marked as completed and both users will receive their SkillCoins.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowEndDialog(false)} className="btn-secondary flex-1 text-sm">Cancel</button>
              <button onClick={handleEndSession} className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2 rounded-xl transition-colors">End Session</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
