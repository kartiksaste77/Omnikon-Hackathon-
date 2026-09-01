"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  MonitorUp, 
  PenTool, 
  Code2, 
  Eraser, 
  RotateCcw, 
  Play, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  Sparkles,
  Users,
  Square,
  Circle as CircleIcon,
  Minus,
  Download,
  Smile,
  Volume2,
  VolumeX,
  Flame,
  ThumbsUp,
  Heart,
  Lightbulb,
  Maximize2
} from "lucide-react";
import confetti from "canvas-confetti";

export default function WebRTCConference({ session, onComplete }) {
  const [activeTab, setActiveTab] = useState("whiteboard"); // 'whiteboard' | 'code' | 'chat'
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isCameraLive, setIsCameraLive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(3540); // 59 mins
  
  // Real Media Streams
  const userVideoRef = useRef(null);
  const screenVideoRef = useRef(null);
  const [mediaStream, setMediaStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);

  // Floating Emoji Reactions State
  const [floatingEmojis, setFloatingEmojis] = useState([]);

  // Whiteboard State
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawTool, setDrawTool] = useState("pen"); // 'pen' | 'rect' | 'circle' | 'line' | 'eraser'
  const [drawColor, setDrawColor] = useState("#6366f1");
  const [lineWidth, setLineWidth] = useState(3);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [canvasSnapshot, setCanvasSnapshot] = useState(null);

  // Live Code Playground State
  const CODE_PRESETS = {
    synergy: `// 1. Peer Skill Matching Algorithm
function computeSynergy(mentorSkills, learnerWants) {
  const match = mentorSkills.filter(s => learnerWants.some(w => s.toLowerCase().includes(w.toLowerCase())));
  return {
    matchedSkills: match,
    compatibility: Math.round((match.length / Math.max(1, learnerWants.length)) * 100) + "%",
    timeBankEscrow: "10 SkillCoins (Zero Cash Required)"
  };
}

console.log(computeSynergy(
  ["React 19", "Next.js App Router", "TypeScript", "Tailwind CSS"],
  ["React", "TypeScript", "AI Agents"]
));`,
    reactHook: `// 2. Custom React 19 State & Escrow Hook
function useEscrowTimer(initialMinutes = 60) {
  let secondsLeft = initialMinutes * 60;
  let isLocked = true;
  
  function checkIn(otpCode) {
    if (otpCode === "4892") {
      isLocked = false;
      return "Verification Passed! 10 SkillCoins released to mentor.";
    }
    return "Invalid OTP. Please re-enter.";
  }
  
  return { secondsLeft, isLocked, checkIn };
}

const session = useEscrowTimer(60);
console.log("Initial Escrow Status: Locked =", session.isLocked);
console.log(session.checkIn("4892"));`,
    algorithm: `// 3. Dynamic Programming: Subtree Maximum Value
function maxSubtreePath(root) {
  let maxSum = -Infinity;
  function dfs(node) {
    if (!node) return 0;
    const left = Math.max(0, dfs(node.left));
    const right = Math.max(0, dfs(node.right));
    maxSum = Math.max(maxSum, node.val + left + right);
    return node.val + Math.max(left, right);
  }
  dfs(root);
  return maxSum;
}

const mockTree = {
  val: 10,
  left: { val: 2, left: { val: 20, left: null, right: null }, right: { val: 1, left: null, right: null } },
  right: { val: 10, left: null, right: { val: -25, left: { val: 3, left: null, right: null }, right: { val: 4, left: null, right: null } } }
};

console.log("Maximum Path Sum in Binary Tree:", maxSubtreePath(mockTree));`
  };

  const [code, setCode] = useState(CODE_PRESETS.synergy);
  const [codeOutput, setCodeOutput] = useState("");

  // In-session chat messages
  const [chatMessages, setChatMessages] = useState([
    { sender: session?.mentorName || "Alex Rivera", text: "Welcome to our live video session! I have the whiteboard ready." },
    { sender: session?.learnerName || "Priya Sharma", text: "Hi Alex! Testing my audio and video. Excited to review the architecture!" }
  ]);
  const [chatInput, setChatInput] = useState("");

  // Session timer countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Toggle Live Webcam
  const toggleRealCamera = async () => {
    if (isCameraLive) {
      if (mediaStream) {
        mediaStream.getTracks().forEach(t => t.stop());
        setMediaStream(null);
      }
      setIsCameraLive(false);
      setIsVideoOff(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setMediaStream(stream);
        setIsCameraLive(true);
        setIsVideoOff(false);
        if (userVideoRef.current) {
          userVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        // If user denies permission, fallback to animated camera simulator
        setIsCameraLive(false);
        setIsVideoOff(!isVideoOff);
      }
    }
  };

  // Toggle Screen Sharing
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStream) {
        screenStream.getTracks().forEach(t => t.stop());
        setScreenStream(null);
      }
      setIsScreenSharing(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        setScreenStream(stream);
        setIsScreenSharing(true);
        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = stream;
        }
        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          setScreenStream(null);
        };
      } catch (err) {
        setIsScreenSharing(!isScreenSharing);
      }
    }
  };

  // Trigger Floating Emoji Reaction
  const triggerReaction = (emoji) => {
    const newEmoji = {
      id: Date.now() + Math.random(),
      emoji,
      left: Math.floor(20 + Math.random() * 60), // 20% to 80% horizontal
    };
    setFloatingEmojis((prev) => [...prev, newEmoji]);
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter(e => e.id !== newEmoji.id));
    }, 2500);
  };

  // Whiteboard Canvas Handlers
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setStartX(x);
    setStartY(y);
    setIsDrawing(true);

    if (drawTool === "pen" || drawTool === "eraser") {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.strokeStyle = drawTool === "eraser" ? "#090d16" : drawColor;
      ctx.lineWidth = drawTool === "eraser" ? 24 : lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    } else {
      // Save image snapshot for drag-preview shapes
      setCanvasSnapshot(ctx.getImageData(0, 0, canvas.width, canvas.height));
    }
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (drawTool === "pen" || drawTool === "eraser") {
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (canvasSnapshot) {
      ctx.putImageData(canvasSnapshot, 0, 0);
      ctx.strokeStyle = drawColor;
      ctx.lineWidth = lineWidth;
      ctx.fillStyle = drawColor + "33";

      if (drawTool === "rect") {
        ctx.strokeRect(startX, startY, x - startX, y - startY);
      } else if (drawTool === "circle") {
        const radius = Math.hypot(x - startX, y - startY);
        ctx.beginPath();
        ctx.arc(startX, startY, radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (drawTool === "line") {
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    setCanvasSnapshot(null);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `skillswap-whiteboard-${session?.id || "session"}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  // Run Code in Playground
  const runCode = () => {
    let logs = [];
    const customConsole = {
      log: (...args) => {
        logs.push(args.map(a => typeof a === "object" ? JSON.stringify(a, null, 2) : String(a)).join(" "));
      },
      error: (...args) => {
        logs.push("[ERROR] " + args.join(" "));
      }
    };

    try {
      const execute = new Function("console", code);
      execute(customConsole);
      setCodeOutput(logs.join("\n") || "✓ Code executed successfully with 0 errors.");
    } catch (err) {
      setCodeOutput(`Syntax/Runtime Error: ${err.message}`);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChatMessages((prev) => [...prev, { sender: "You", text: chatInput }]);
    setChatInput("");
  };

  const handleFinishSession = () => {
    try {
      confetti({ particleCount: 140, spread: 80, origin: { y: 0.6 } });
    } catch (e) {}

    if (onComplete) {
      onComplete();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] rounded-3xl overflow-hidden glass-panel border border-white/10 shadow-2xl relative">
      
      {/* Floating Emojis Reaction Layer */}
      <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
        {floatingEmojis.map((item) => (
          <div
            key={item.id}
            style={{ left: `${item.left}%` }}
            className="absolute bottom-16 text-3xl animate-float-up"
          >
            {item.emoji}
          </div>
        ))}
      </div>

      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              {session?.skillTitle || "React Server Components & Next.js 15 Deep Dive"}
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                10 SkillCoins Escrow
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Mentor: <strong className="text-slate-200">{session?.mentorName || "Alex Rivera"}</strong> • Learner: <strong className="text-slate-200">{session?.learnerName || "Priya Sharma"}</strong>
            </p>
          </div>
        </div>

        {/* Timer & Completion Button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-slate-200">
            <Clock className="h-4 w-4 text-indigo-400 animate-spin" />
            <span className="font-mono text-xs font-bold">{formatTime(timerSeconds)}</span>
          </div>

          <button
            onClick={handleFinishSession}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 hover:brightness-110 transition-all"
          >
            <CheckCircle2 className="h-4 w-4" />
            Verify & Complete (+10 Coins)
          </button>
        </div>
      </div>

      {/* Main Grid: Left Videos (4 cols) | Right Workspace (8 cols) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        
        {/* Left Video Call Column */}
        <div className="lg:col-span-4 border-r border-white/10 p-4 flex flex-col justify-between bg-slate-950/40 gap-4 overflow-y-auto">
          
          <div className="space-y-4">
            
            {/* Mentor Video Card */}
            <div className="relative rounded-2xl overflow-hidden aspect-video bg-slate-900 border border-indigo-500/30 shadow-lg group">
              {isCameraLive ? (
                <video
                  ref={userVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : isVideoOff ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-500 space-y-2">
                  <VideoOff className="h-8 w-8" />
                  <span className="text-xs">Camera Off</span>
                </div>
              ) : (
                <img
                  src={session?.mentorAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80"}
                  alt="Mentor Stream"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-between p-3">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5 bg-black/50 px-2.5 py-1 rounded-lg backdrop-blur-md">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                  {session?.mentorName || "Alex Rivera"} (Mentor)
                </span>

                <div className="flex items-center gap-1.5">
                  {!isMuted && (
                    <div className="flex items-center gap-0.5 px-2 py-1 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                      <span className="h-2 w-0.5 bg-emerald-400 animate-pulse" />
                      <span className="h-3 w-0.5 bg-emerald-400 animate-pulse" />
                      <span className="h-1.5 w-0.5 bg-emerald-400 animate-pulse" />
                      Speaking
                    </div>
                  )}
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-black" />
                </div>
              </div>
            </div>

            {/* Learner Video Card */}
            <div className="relative rounded-2xl overflow-hidden aspect-video bg-slate-900 border border-cyan-500/30 shadow-lg group">
              <img
                src={session?.learnerAvatar || "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80"}
                alt="Learner Stream"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-between p-3">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5 bg-black/50 px-2.5 py-1 rounded-lg backdrop-blur-md">
                  <Users className="h-3.5 w-3.5 text-cyan-400" />
                  {session?.learnerName || "Priya Sharma"} (Learner)
                </span>
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-black" />
              </div>
            </div>

            {/* Live Screen Share Preview (If active) */}
            {isScreenSharing && (
              <div className="relative rounded-2xl overflow-hidden aspect-video bg-black border border-amber-500/40 shadow-lg">
                <video
                  ref={screenVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                  Screen Share Active
                </div>
              </div>
            )}

          </div>

          {/* Media Control Bar & Emoji Reactions */}
          <div className="space-y-3">
            {/* Quick Emoji Reaction Row */}
            <div className="flex items-center justify-center gap-2 p-2 rounded-2xl bg-slate-900/60 border border-white/5">
              {["🔥", "👏", "💡", "❤️", "🚀", "🎉"].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => triggerReaction(emoji)}
                  className="p-1.5 text-lg hover:scale-125 transition-transform active:scale-95"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Hardware Controls */}
            <div className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-slate-900/90 border border-white/10 backdrop-blur-md">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-3 rounded-xl transition-all ${
                  isMuted ? "bg-rose-500/20 text-rose-300 border border-rose-500/40" : "bg-white/10 text-white hover:bg-white/20"
                }`}
                title={isMuted ? "Unmute Mic" : "Mute Mic"}
              >
                {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>

              <button
                onClick={toggleRealCamera}
                className={`p-3 rounded-xl transition-all ${
                  isCameraLive
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                    : isVideoOff
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
                title="Toggle WebRTC Webcam"
              >
                {isVideoOff ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
              </button>

              <button
                onClick={toggleScreenShare}
                className={`p-3 rounded-xl transition-all ${
                  isScreenSharing ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" : "bg-white/10 text-white hover:bg-white/20"
                }`}
                title="Share Screen"
              >
                <MonitorUp className="h-4 w-4" />
              </button>
            </div>
          </div>

        </div>

        {/* Right Interactive Classroom Workspace (8 cols) */}
        <div className="lg:col-span-8 flex flex-col h-full overflow-hidden bg-slate-950/20">
          
          {/* Workspace Tabs Header */}
          <div className="flex items-center justify-between px-6 py-2 border-b border-white/10 bg-slate-950/60">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("whiteboard")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === "whiteboard"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <PenTool className="h-3.5 w-3.5" />
                Collaborative Whiteboard
              </button>

              <button
                onClick={() => setActiveTab("code")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === "code"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Code2 className="h-3.5 w-3.5" />
                Live JS Code Runner
              </button>

              <button
                onClick={() => setActiveTab("chat")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === "chat"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Session Chat ({chatMessages.length})
              </button>
            </div>
          </div>

          {/* Active Tab Viewport */}
          <div className="flex-1 p-4 overflow-hidden flex flex-col">
            
            {/* Whiteboard Mode */}
            {activeTab === "whiteboard" && (
              <div className="flex-1 flex flex-col gap-3 h-full">
                
                {/* Whiteboard Toolbar */}
                <div className="flex flex-wrap items-center justify-between p-2 rounded-2xl bg-slate-900 border border-white/10 text-xs gap-2">
                  
                  {/* Drawing Tools */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setDrawTool("pen")}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                        drawTool === "pen" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white hover:bg-white/5"
                      }`}
                      title="Freehand Pen"
                    >
                      <PenTool className="h-3.5 w-3.5" />
                      Pen
                    </button>

                    <button
                      onClick={() => setDrawTool("rect")}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                        drawTool === "rect" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white hover:bg-white/5"
                      }`}
                      title="Draw Rectangle"
                    >
                      <Square className="h-3.5 w-3.5" />
                      Rect
                    </button>

                    <button
                      onClick={() => setDrawTool("circle")}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                        drawTool === "circle" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white hover:bg-white/5"
                      }`}
                      title="Draw Circle"
                    >
                      <CircleIcon className="h-3.5 w-3.5" />
                      Circle
                    </button>

                    <button
                      onClick={() => setDrawTool("line")}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                        drawTool === "line" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white hover:bg-white/5"
                      }`}
                      title="Draw Line"
                    >
                      <Minus className="h-3.5 w-3.5" />
                      Line
                    </button>

                    <button
                      onClick={() => setDrawTool("eraser")}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                        drawTool === "eraser" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white hover:bg-white/5"
                      }`}
                      title="Eraser"
                    >
                      <Eraser className="h-3.5 w-3.5" />
                      Eraser
                    </button>
                  </div>

                  {/* Colors & Actions */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 pr-2 border-r border-white/10">
                      {["#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#f43f5e", "#ffffff"].map((c) => (
                        <button
                          key={c}
                          onClick={() => {
                            setDrawColor(c);
                            if (drawTool === "eraser") setDrawTool("pen");
                          }}
                          style={{ backgroundColor: c }}
                          className={`h-5 w-5 rounded-full ring-2 transition-all ${
                            drawTool !== "eraser" && drawColor === c ? "ring-white scale-110" : "ring-transparent"
                          }`}
                        />
                      ))}
                    </div>

                    <button
                      onClick={downloadCanvas}
                      className="p-1.5 rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                      title="Download Whiteboard PNG"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={clearCanvas}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/20"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Clear
                    </button>
                  </div>

                </div>

                {/* Drawing Surface Canvas */}
                <div className="flex-1 rounded-2xl bg-[#090d16] border border-white/10 overflow-hidden relative cursor-crosshair">
                  <canvas
                    ref={canvasRef}
                    width={900}
                    height={550}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    className="w-full h-full block"
                  />
                </div>

              </div>
            )}

            {/* Code Playground Mode */}
            {activeTab === "code" && (
              <div className="flex-1 grid grid-rows-2 gap-3 h-full">
                <div className="flex flex-col rounded-2xl bg-[#0d1117] border border-white/10 overflow-hidden">
                  
                  {/* Preset Selector Header */}
                  <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-400">Exercise:</span>
                      <select
                        onChange={(e) => setCode(CODE_PRESETS[e.target.value])}
                        className="bg-slate-800 text-slate-200 text-xs rounded-lg px-2 py-1 border border-white/10"
                      >
                        <option value="synergy">1. Skill Synergy Algorithm</option>
                        <option value="reactHook">2. React 19 Escrow Hook</option>
                        <option value="algorithm">3. Binary Tree Max Subtree</option>
                      </select>
                    </div>

                    <button
                      onClick={runCode}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all"
                    >
                      <Play className="h-3.5 w-3.5 fill-white" />
                      Execute Code
                    </button>
                  </div>

                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="flex-1 w-full bg-transparent p-4 font-mono text-xs text-slate-200 resize-none focus:outline-none leading-relaxed"
                    spellCheck="false"
                  />
                </div>

                <div className="flex flex-col rounded-2xl bg-black border border-white/10 overflow-hidden">
                  <div className="px-4 py-2 bg-slate-900/80 border-b border-white/10 text-xs font-mono text-slate-400">
                    Execution Console Output
                  </div>
                  <pre className="flex-1 p-4 font-mono text-xs text-emerald-400 overflow-y-auto whitespace-pre-wrap">
                    {codeOutput || "Click 'Execute Code' above to run snippet live in browser..."}
                  </pre>
                </div>
              </div>
            )}

            {/* Chat Mode */}
            {activeTab === "chat" && (
              <div className="flex-1 flex flex-col justify-between h-full rounded-2xl glass-card border border-white/10 p-4">
                <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex flex-col ${
                        msg.sender === "You" ? "items-end" : "items-start"
                      }`}
                    >
                      <span className="text-[10px] text-slate-400 mb-1">{msg.sender}</span>
                      <div
                        className={`px-3.5 py-2 rounded-2xl text-xs max-w-[80%] ${
                          msg.sender === "You"
                            ? "bg-indigo-600 text-white rounded-br-none"
                            : "bg-slate-800 text-slate-200 rounded-bl-none border border-white/10"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendMessage} className="flex gap-2 mt-3 pt-3 border-t border-white/10">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type a message to your session partner..."
                    className="flex-1 glass-input px-3 py-2 text-xs"
                  />
                  <button
                    type="submit"
                    className="btn-primary px-4 py-2 rounded-xl text-xs font-semibold"
                  >
                    Send
                  </button>
                </form>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
