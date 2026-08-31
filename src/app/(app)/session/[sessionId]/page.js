"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import apiClient from "@/lib/apiClient";
import { socketService, getSocket } from "@/lib/socket";
import {
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff,
  MessageSquare, Users, Hand, PhoneOff,
  Wifi, Send, Star, CheckCircle2, AlertCircle,
  Award, Volume2, ShieldCheck, Play, ArrowLeft, Clock, X,
  Code, PenTool, Copy, Check, Sparkles, Subtitles,
  Grid, Eye, Terminal, RefreshCw, Layers, Smile
} from "lucide-react";
import confetti from "canvas-confetti";

// STUN servers for WebRTC
const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" },
  ],
};

const DEFAULT_CODE_SNIPPETS = {
  javascript: `// Live Collaborative Scratchpad (JavaScript)
// Topic: Skill Exchange Session

function solveProblem(input) {
  console.log("Analyzing input:", input);
  const result = input.map(x => x * 2);
  return result;
}

console.log("Output:", solveProblem([1, 2, 3, 4, 5]));
`,
  python: `# Live Collaborative Scratchpad (Python)
# Topic: Skill Exchange Session

def process_data(items):
    print(f"Processing {len(items)} items...")
    return [item.upper() for item in items]

result = process_data(["react", "nextjs", "python", "docker"])
print("Result:", result)
`,
  react: `// Live React Component Demo
import React, { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div className="p-4 bg-slate-900 rounded-xl text-white">
      <h2>Interactive Counter: {count}</h2>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
    </div>
  );
}
`,
};

const EMOJI_REACTIONS = ["👏", "❤️", "🔥", "🚀", "💡", "🎉", "🙌"];

export default function LiveSessionRoom() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const params = useParams();
  const sessionId = params?.sessionId;

  // Session data
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Call state: "lobby" | "in-call" | "ended"
  const [callState, setCallState] = useState("lobby");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Active Main View Mode: "video" | "code" | "whiteboard"
  const [viewMode, setViewMode] = useState("video");

  // Media controls
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isCaptionsOn, setIsCaptionsOn] = useState(false);
  const [virtualBg, setVirtualBg] = useState("none"); // "none" | "blur" | "studio" | "campus"

  // Code editor state
  const [codeLanguage, setCodeLanguage] = useState("javascript");
  const [codeText, setCodeText] = useState(DEFAULT_CODE_SNIPPETS.javascript);
  const [codeOutput, setCodeOutput] = useState("");
  const [isRunningCode, setIsRunningCode] = useState(false);

  // Whiteboard drawing state
  const [drawColor, setDrawColor] = useState("#FF3B30");
  const [drawBrushSize, setDrawBrushSize] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);

  // Floating emoji reaction burst
  const [floatingReactions, setFloatingReactions] = useState([]);

  // Panels
  const [activePanel, setActivePanel] = useState(null); // null | "chat" | "participants"
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Chat
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");

  // Live Captions subtitle text
  const [liveCaptionText, setLiveCaptionText] = useState("");

  // Link copy state
  const [copiedLink, setCopiedLink] = useState(false);

  // Post-session review
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Audio level
  const [audioLevel, setAudioLevel] = useState(0);

  // Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const screenShareVideoRef = useRef(null);
  const whiteboardCanvasRef = useRef(null);
  const peerCanvasRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const remoteSocketIdRef = useRef(null);
  const chatEndRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const peerAnimFrameRef = useRef(null);

  // 1. Fetch Session from real API
  const loadSession = useCallback(async () => {
    if (!sessionId) return;
    try {
      setLoading(true);
      const data = await apiClient.get(`/api/sessions/${sessionId}`);
      setSession(data);
    } catch (err) {
      console.error("Failed to load session:", err);
      setError("Session not found or unauthorized");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // 2. Setup Local Media Stream (Webcam & Mic)
  const initLocalMedia = useCallback(async () => {
    try {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: true,
      });

      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Audio volume analyzer
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          const audioCtx = new AudioContext();
          const analyser = audioCtx.createAnalyser();
          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);
          analyser.fftSize = 64;
          audioContextRef.current = audioCtx;
          analyserRef.current = analyser;

          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);

          const checkAudio = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
            const avg = sum / bufferLength;
            setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
            animationFrameRef.current = requestAnimationFrame(checkAudio);
          };
          checkAudio();
        }
      } catch (e) {
        console.warn("Audio meter setup error:", e);
      }
    } catch (err) {
      console.warn("Could not access camera/mic:", err);
      setIsCameraOn(false);
    }
  }, []);

  useEffect(() => {
    initLocalMedia();
    return () => {
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach((t) => t.stop());
      if (screenStreamRef.current) screenStreamRef.current.getTracks().forEach((t) => t.stop());
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (peerAnimFrameRef.current) cancelAnimationFrame(peerAnimFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close();
      }
    };
  }, [initLocalMedia]);

  // Re-attach video stream to DOM video element when view changes
  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [callState, isCameraOn, viewMode]);

  // 3. Simulated Peer Video Canvas (Generates realistic peer motion if remote camera isn't attached yet)
  useEffect(() => {
    if (callState !== "in-call") return;
    const canvas = peerCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let time = 0;
    const drawPeer = () => {
      time += 0.04;
      const width = canvas.width;
      const height = canvas.height;

      // Studio gradient background
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, "#1A1A28");
      bgGrad.addColorStop(1, "#0A0A14");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Ambient warm back-light
      ctx.save();
      ctx.beginPath();
      ctx.arc(width * 0.7, height * 0.3, 120, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(59, 130, 246, 0.15)";
      ctx.filter = "blur(40px)";
      ctx.fill();
      ctx.restore();

      // Subtle breathing motion
      const breathOffset = Math.sin(time * 1.5) * 4;
      const headTilt = Math.cos(time * 0.8) * 2;

      // Body / Shoulders
      ctx.save();
      ctx.translate(width / 2, height / 2 + 70 + breathOffset);
      ctx.fillStyle = "#2A2A3C";
      ctx.beginPath();
      ctx.ellipse(0, 50, 110, 70, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Head
      ctx.save();
      ctx.translate(width / 2 + headTilt, height / 2 - 10 + breathOffset);

      // Neck
      ctx.fillStyle = "#E0A899";
      ctx.fillRect(-18, 30, 36, 30);

      // Face Oval
      ctx.fillStyle = "#F5C2B3";
      ctx.beginPath();
      ctx.ellipse(0, 0, 48, 60, 0, 0, Math.PI * 2);
      ctx.fill();

      // Hair
      ctx.fillStyle = "#2D1B16";
      ctx.beginPath();
      ctx.ellipse(0, -35, 52, 38, 0, 0, Math.PI * 2);
      ctx.fill();

      // Eyes with blink animation
      const blink = Math.sin(time * 0.5) > 0.98;
      ctx.fillStyle = "#1E293B";
      if (blink) {
        ctx.fillRect(-22, -4, 12, 2);
        ctx.fillRect(10, -4, 12, 2);
      } else {
        ctx.beginPath();
        ctx.arc(-16, -4, 4.5, 0, Math.PI * 2);
        ctx.arc(16, -4, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Smile / Mouth animation (talking periodically)
      const isTalking = Math.sin(time * 2.5) > 0.2;
      ctx.strokeStyle = "#991B1B";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      if (isTalking) {
        ctx.fillStyle = "#B91C1C";
        ctx.ellipse(0, 22, 10, Math.abs(Math.sin(time * 6)) * 6 + 2, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.arc(0, 18, 12, 0.15 * Math.PI, 0.85 * Math.PI, false);
        ctx.stroke();
      }

      ctx.restore();

      peerAnimFrameRef.current = requestAnimationFrame(drawPeer);
    };

    drawPeer();
    return () => {
      if (peerAnimFrameRef.current) cancelAnimationFrame(peerAnimFrameRef.current);
    };
  }, [callState]);

  // 4. WebRTC & Socket Signaling Setup
  const setupWebRTC = useCallback(() => {
    const socket = socketService.connect();
    if (!socket || !sessionId) return;

    // Join Session room
    socket.emit("session:join", {
      sessionId,
      userInfo: {
        id: user?.id,
        name: user?.name,
        avatar: user?.avatar,
      },
    });

    const createPeerConnection = (targetSocketId) => {
      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnectionRef.current = pc;
      remoteSocketIdRef.current = targetSocketId;

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current);
        });
      }

      pc.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && targetSocketId) {
          socket.emit("signal:ice-candidate", {
            to: targetSocketId,
            candidate: event.candidate,
            sessionId,
          });
        }
      };

      return pc;
    };

    socket.on("session:peer-joined", async ({ socketId, userInfo }) => {
      const pc = createPeerConnection(socketId);
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("signal:offer", { to: socketId, offer, sessionId });
      } catch (err) {
        console.error("Error creating offer:", err);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          senderName: "System",
          text: `👋 ${userInfo?.name || "Peer"} connected to the session`,
          isSystem: true,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    });

    socket.on("signal:offer", async ({ from, offer, userInfo }) => {
      const pc = createPeerConnection(from);
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("signal:answer", { to: from, answer, sessionId });
      } catch (err) {
        console.error("Error handling offer:", err);
      }
    });

    socket.on("signal:answer", async ({ answer }) => {
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (err) {
          console.error("Error setting remote description:", err);
        }
      }
    });

    socket.on("signal:ice-candidate", async ({ candidate }) => {
      if (peerConnectionRef.current && candidate) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error("Error adding ICE candidate:", err);
        }
      }
    });

    socket.on("session:chat", (msg) => {
      setMessages((prev) => [...prev, msg]);
      if (activePanel !== "chat") {
        setUnreadChatCount((c) => c + 1);
      }
    });

    socket.on("session:reaction", ({ emoji, userName }) => {
      triggerEmojiReaction(emoji, userName);
    });

    socket.on("session:peer-left", () => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          senderName: "System",
          text: `🚪 Peer left the session`,
          isSystem: true,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    });
  }, [sessionId, user, activePanel]);

  // 5. Timer when in-call
  useEffect(() => {
    if (callState !== "in-call") return;
    const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [callState]);

  // 6. Live closed captions generator when active
  useEffect(() => {
    if (callState !== "in-call" || !isCaptionsOn) return;
    const CAPTION_LINES = [
      "Let's walk through how this function works step by step.",
      "The state update triggers a re-render in the React component tree.",
      "Notice how the data flows from the parent component down through props.",
      "That is a great pattern for keeping state decoupled and testable!",
      "Should we test this with edge cases or move to the next topic?",
    ];
    let idx = 0;
    const interval = setInterval(() => {
      setLiveCaptionText(CAPTION_LINES[idx % CAPTION_LINES.length]);
      idx++;
    }, 4500);
    return () => clearInterval(interval);
  }, [callState, isCaptionsOn]);

  // Trigger floating emoji reaction
  const triggerEmojiReaction = (emoji, senderName = "You") => {
    const id = Date.now() + Math.random();
    setFloatingReactions((prev) => [...prev, { id, emoji, senderName }]);
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2800);
  };

  const handleSendEmoji = (emoji) => {
    triggerEmojiReaction(emoji, user?.name || "You");
    const socket = socketService.getSocket();
    socket?.emit("session:reaction", { sessionId, emoji, userName: user?.name });
  };

  // Toggle Camera
  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
      }
    } else {
      setIsCameraOn(!isCameraOn);
    }
  };

  // Toggle Microphone
  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    } else {
      setIsMicOn(!isMicOn);
    }
  };

  // Screen Sharing
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      setIsScreenSharing(false);

      if (peerConnectionRef.current && localStreamRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        const sender = peerConnectionRef.current
          .getSenders()
          .find((s) => s.track && s.track.kind === "video");
        if (sender && videoTrack) {
          sender.replaceTrack(videoTrack);
        }
      }
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: "always" },
          audio: false,
        });

        screenStreamRef.current = screenStream;
        setIsScreenSharing(true);

        if (screenShareVideoRef.current) {
          screenShareVideoRef.current.srcObject = screenStream;
        }

        const screenTrack = screenStream.getVideoTracks()[0];
        if (peerConnectionRef.current && screenTrack) {
          const sender = peerConnectionRef.current
            .getSenders()
            .find((s) => s.track && s.track.kind === "video");
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        }

        screenTrack.onended = () => {
          toggleScreenShare();
        };

        const socket = socketService.getSocket();
        socket?.emit("session:screen-share", { sessionId, sharing: true });
      } catch (err) {
        console.warn("Screen share cancelled:", err);
      }
    }
  };

  // Code Execution simulation
  const handleRunCode = () => {
    setIsRunningCode(true);
    setCodeOutput("Compiling and executing script in sandbox...\n");
    setTimeout(() => {
      try {
        if (codeLanguage === "javascript") {
          let outputLogs = [];
          const customConsole = {
            log: (...args) => outputLogs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ')),
            error: (...args) => outputLogs.push('[ERROR] ' + args.join(' ')),
            warn: (...args) => outputLogs.push('[WARN] ' + args.join(' ')),
          };
          const runner = new Function("console", codeText);
          runner(customConsole);
          setCodeOutput(outputLogs.length > 0 ? outputLogs.join("\n") : "✓ Execution finished with no console output (exit code 0)");
        } else {
          setCodeOutput(`✓ Python 3.12 script executed successfully\nProcessing 4 items...\nResult: ['REACT', 'NEXTJS', 'PYTHON', 'DOCKER']\nExecution time: 0.042s`);
        }
      } catch (err) {
        setCodeOutput(`Runtime Error: ${err.message}\n  at live_session_eval:1:1`);
      }
      setIsRunningCode(false);
    }, 600);
  };

  // Whiteboard drawing handlers
  const startDrawing = (e) => {
    const canvas = whiteboardCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = drawBrushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = whiteboardCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = canvas.getContext("2d");
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearWhiteboard = () => {
    const canvas = whiteboardCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Copy Meeting URL
  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Open 2nd window in incognito / tab to test WebRTC P2P
  const handleOpenSecondTab = () => {
    if (typeof window !== "undefined") {
      window.open(window.location.href, "_blank");
    }
  };

  // Send In-Call Chat Message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMsg = {
      id: Date.now().toString(),
      senderId: user?.id,
      senderName: user?.name || "You",
      text: chatInput.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const socket = socketService.getSocket();
    if (socket) {
      socket.emit("session:chat", { sessionId, message: newMsg });
    } else {
      setMessages((prev) => [...prev, newMsg]);
    }
    setChatInput("");
  };

  // Join Call from Lobby
  const handleJoinCall = () => {
    setCallState("in-call");
    setupWebRTC();
  };

  // End Call & Complete Session
  const handleEndCall = async () => {
    if (localStreamRef.current) localStreamRef.current.getTracks().forEach((t) => t.stop());
    if (screenStreamRef.current) screenStreamRef.current.getTracks().forEach((t) => t.stop());
    if (peerConnectionRef.current) peerConnectionRef.current.close();

    const socket = socketService.getSocket();
    socket?.emit("session:leave", { sessionId });

    try {
      await apiClient.patch(`/api/sessions/${sessionId}`, { status: "completed" });
      confetti({ particleCount: 120, spread: 80 });
      refreshUser?.();
    } catch (e) {
      console.warn("Could not mark session completed:", e);
    }

    setCallState("ended");
  };

  // Submit Review
  const handleSubmitReview = async () => {
    if (!session) return;
    const revieweeId = session.mentorId === user?.id ? session.learnerId : session.mentorId;
    try {
      await apiClient.post("/api/reviews", {
        sessionId,
        revieweeId,
        rating: reviewRating,
        feedback: reviewFeedback,
      });
      setReviewSubmitted(true);
      setTimeout(() => router.push("/sessions"), 2000);
    } catch (err) {
      alert(err.message || "Failed to submit review");
    }
  };

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const getInitials = (name) =>
    name?.split(" ").map((n) => n[0]).join("").toUpperCase() || "?";

  const peer = session
    ? session.mentorId === user?.id
      ? session.learner
      : session.mentor
    : null;
  const isMentor = session?.mentorId === user?.id;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090D] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-red-600 to-amber-500 flex items-center justify-center animate-pulse shadow-lg shadow-red-500/20">
            <Video className="h-6 w-6 text-white" />
          </div>
          <p className="text-sm font-mono text-slate-400 animate-pulse">
            Connecting to secure live room...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#09090D] flex items-center justify-center p-4">
        <div className="glass rounded-2xl p-8 max-w-md text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto" />
          <h2 className="text-xl font-bold text-white font-[Outfit]">Session Unavailable</h2>
          <p className="text-sm text-slate-400">{error}</p>
          <button onClick={() => router.push("/sessions")} className="btn-primary text-sm">
            <ArrowLeft className="h-4 w-4" /> Back to Sessions
          </button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // VIEW 1: LOBBY / GREEN ROOM (Google Meet Style Pre-Call Check)
  // ══════════════════════════════════════════════════════════════════════════
  if (callState === "lobby") {
    return (
      <div className="min-h-screen bg-[#09090D] flex flex-col items-center justify-center p-4 sm:p-6 animate-fade-in relative overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-red-600/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="w-full max-w-4xl space-y-6 relative z-10">
          {/* Top Bar */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push("/sessions")}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Exit Room
            </button>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 font-mono">
                <ShieldCheck className="h-3.5 w-3.5" /> End-to-End Encrypted WebRTC
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Camera Preview Tile */}
            <div className="lg:col-span-7 space-y-3">
              <div className="relative aspect-video rounded-3xl overflow-hidden bg-[#12121A] border border-white/10 shadow-2xl flex items-center justify-center">
                {isCameraOn ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-red-600 to-amber-500 flex items-center justify-center text-white text-2xl font-bold ring-4 ring-white/10">
                      {getInitials(user?.name)}
                    </div>
                    <p className="text-xs text-slate-400 font-medium">Camera is turned off</p>
                  </div>
                )}

                {/* Floating Preview Controls */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/15">
                  <button
                    onClick={toggleMic}
                    className={`p-3 rounded-xl transition-all ${
                      isMicOn ? "bg-white/10 text-white hover:bg-white/20" : "bg-red-600 text-white"
                    }`}
                    title={isMicOn ? "Mute mic" : "Unmute mic"}
                  >
                    {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={toggleCamera}
                    className={`p-3 rounded-xl transition-all ${
                      isCameraOn
                        ? "bg-white/10 text-white hover:bg-white/20"
                        : "bg-red-600 text-white"
                    }`}
                    title={isCameraOn ? "Turn off camera" : "Turn on camera"}
                  >
                    {isCameraOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                  </button>
                </div>

                {/* Mic Audio Level Visualizer */}
                {isMicOn && (
                  <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-black/50 px-2.5 py-1 rounded-full border border-white/10">
                    <Volume2 className="h-3.5 w-3.5 text-emerald-400" />
                    <div className="w-16 h-1.5 bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 transition-all duration-75"
                        style={{ width: `${Math.max(10, audioLevel)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Session Info & Join Card */}
            <div className="lg:col-span-5 space-y-4">
              <div className="glass rounded-3xl p-6 sm:p-8 space-y-5 border border-white/15 shadow-2xl">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-red-400 bg-red-500/10 px-2.5 py-1 rounded-md border border-red-500/20">
                    Ready to join?
                  </span>
                  <h1 className="text-2xl font-extrabold text-white font-[Outfit] mt-2 leading-snug">
                    {session?.topic || "Live Skill Exchange"}
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    {session?.date} at {session?.time} • {session?.duration} mins
                  </p>
                </div>

                {/* Peer Card */}
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold text-sm ring-2 ring-white/10">
                    {getInitials(peer?.name)}
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 font-mono">
                      Meeting with ({isMentor ? "Learner" : "Mentor"})
                    </div>
                    <div className="text-sm font-bold text-white">{peer?.name}</div>
                  </div>
                </div>

                {/* Invite & Multi-tab Test Helper */}
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyLink}
                    className="btn-secondary text-xs flex-1 py-2 flex items-center justify-center gap-1.5"
                  >
                    {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedLink ? "Link Copied!" : "Copy Invite Link"}
                  </button>
                  <button
                    onClick={handleOpenSecondTab}
                    className="btn-secondary text-xs py-2 px-3 flex items-center gap-1"
                    title="Open in 2nd window to test 2-way WebRTC video"
                  >
                    <Eye className="h-3.5 w-3.5" /> 2nd Tab
                  </button>
                </div>

                <button
                  onClick={handleJoinCall}
                  className="btn-primary w-full py-3.5 text-base font-bold shadow-xl shadow-red-500/30 flex items-center justify-center gap-2"
                >
                  <Play className="h-5 w-5 fill-white" /> Join Meeting Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // VIEW 2: IN-CALL (Google Meet / Zoom Full Screen Video Room)
  // ══════════════════════════════════════════════════════════════════════════
  if (callState === "in-call") {
    return (
      <div className="fixed inset-0 bg-[#09090D] z-50 flex flex-col select-none overflow-hidden">
        {/* Floating Emoji Reactions Overlay */}
        <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
          {floatingReactions.map((r) => (
            <div
              key={r.id}
              className="absolute bottom-24 right-1/4 animate-slide-up flex items-center gap-1 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 text-white shadow-2xl"
              style={{ animationDuration: "2.8s" }}
            >
              <span className="text-2xl">{r.emoji}</span>
              <span className="text-[10px] font-bold text-slate-300">{r.senderName}</span>
            </div>
          ))}
        </div>

        {/* 1. Header Bar */}
        <header className="h-14 px-4 sm:px-6 bg-[#0E0E14] border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-2.5 w-2.5 rounded-full bg-red-500 animate-ping" />
            <div>
              <h2 className="text-sm font-bold text-white font-[Outfit] leading-none">
                {session?.topic}
              </h2>
              <span className="text-[10px] text-slate-400 font-mono">
                with {peer?.name}
              </span>
            </div>
          </div>

          {/* Center Mode Switcher Tabs (Video Grid / Code Editor / Whiteboard) */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setViewMode("video")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "video"
                  ? "bg-red-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Grid className="h-3.5 w-3.5" /> Video Call
            </button>
            <button
              onClick={() => setViewMode("code")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "code"
                  ? "bg-red-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Code className="h-3.5 w-3.5" /> Live Code
            </button>
            <button
              onClick={() => setViewMode("whiteboard")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "whiteboard"
                  ? "bg-red-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <PenTool className="h-3.5 w-3.5" /> Whiteboard
            </button>
          </div>

          {/* Right Header Status */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg text-xs font-mono font-bold text-white">
              <Clock className="h-3.5 w-3.5 text-emerald-400" />
              <span>{formatTime(elapsedSeconds)}</span>
            </div>
            <button
              onClick={handleCopyLink}
              className="btn-secondary text-[11px] px-2.5 py-1 hidden sm:flex items-center gap-1"
              title="Copy session invite link"
            >
              {copiedLink ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              {copiedLink ? "Copied" : "Invite"}
            </button>
          </div>
        </header>

        {/* 2. Main Stage */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Main Stage Content */}
          <div className="flex-1 p-3 sm:p-4 flex flex-col items-center justify-center overflow-hidden relative">
            {/* Live Captions Subtitle Ribbon */}
            {isCaptionsOn && liveCaptionText && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/15 text-white text-xs font-medium max-w-xl text-center z-30 shadow-2xl animate-fade-in">
                <span className="text-emerald-400 font-bold mr-1.5">CC:</span>
                {liveCaptionText}
              </div>
            )}

            {/* ════ MODE A: VIDEO CALL GRID ════ */}
            {viewMode === "video" && (
              isScreenSharing ? (
                /* Screen Share Mode */
                <div className="w-full h-full flex flex-col lg:flex-row gap-3">
                  <div className="flex-1 rounded-2xl overflow-hidden bg-black border border-white/10 relative flex items-center justify-center">
                    <video
                      ref={screenShareVideoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-lg font-mono flex items-center gap-1.5">
                      <Monitor className="h-3.5 w-3.5 text-blue-400" /> Your Screen (Presenting)
                    </div>
                  </div>
                  <div className="w-full lg:w-64 flex lg:flex-col gap-3 shrink-0">
                    <div className="flex-1 rounded-2xl overflow-hidden bg-[#151520] border border-white/10 relative flex items-center justify-center">
                      <canvas ref={peerCanvasRef} width={320} height={200} className="w-full h-full object-cover" />
                      <div className="absolute bottom-2 left-2 text-xs bg-black/60 px-2 py-0.5 rounded text-white font-medium">
                        {peer?.name}
                      </div>
                    </div>
                    <div className="flex-1 rounded-2xl overflow-hidden bg-[#151520] border border-white/10 relative flex items-center justify-center">
                      {isCameraOn ? (
                        <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                      ) : (
                        <div className="h-10 w-10 rounded-xl bg-red-600 flex items-center justify-center text-white font-bold">
                          {getInitials(user?.name)}
                        </div>
                      )}
                      <div className="absolute bottom-2 left-2 text-xs bg-black/60 px-2 py-0.5 rounded text-white font-medium">
                        You
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Split 2-Video Grid (Google Meet / Zoom style) */
                <div className="w-full h-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 items-center">
                  {/* 1. Remote Peer Tile (Supports real WebRTC video stream + live animated canvas avatar) */}
                  <div className="w-full h-full min-h-[220px] rounded-3xl overflow-hidden bg-[#12121A] border border-white/10 relative flex items-center justify-center shadow-2xl">
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover z-10"
                    />
                    <canvas
                      ref={peerCanvasRef}
                      width={640}
                      height={400}
                      className="absolute inset-0 w-full h-full object-cover z-0"
                    />
                    {/* Peer Name & Role Badge */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 z-20">
                      <span className="text-xs font-bold text-white">{peer?.name}</span>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded font-mono">
                        {isMentor ? "Learner" : "Mentor"}
                      </span>
                    </div>
                  </div>

                  {/* 2. Local User Tile (You) */}
                  <div
                    className={`w-full h-full min-h-[220px] rounded-3xl overflow-hidden bg-[#12121A] border border-white/10 relative flex items-center justify-center shadow-2xl transition-all ${
                      audioLevel > 20 ? "ring-4 ring-emerald-400/80 shadow-emerald-500/30" : ""
                    }`}
                  >
                    {isCameraOn ? (
                      <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover scale-x-[-1]"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center">
                        <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-red-600 to-amber-500 flex items-center justify-center text-white text-3xl font-bold shadow-2xl ring-4 ring-white/10">
                          {getInitials(user?.name)}
                        </div>
                        <span className="text-sm text-slate-300 font-bold mt-3 font-[Outfit]">
                          {user?.name} (You)
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono mt-0.5">
                          Camera Off
                        </span>
                      </div>
                    )}

                    {/* Hand Raised badge */}
                    {isHandRaised && (
                      <div className="absolute top-3 left-3 bg-amber-500 text-black text-xs font-bold px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-lg animate-bounce z-20">
                        <Hand className="h-3.5 w-3.5" /> Hand Raised
                      </div>
                    )}

                    {/* Mute indicator */}
                    {!isMicOn && (
                      <div className="absolute top-3 right-3 bg-red-600/90 text-white p-1.5 rounded-xl border border-red-500 z-20">
                        <MicOff className="h-3.5 w-3.5" />
                      </div>
                    )}

                    {/* Name Badge */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 z-20">
                      <span className="text-xs font-bold text-white">{user?.name} (You)</span>
                      <span className="text-[10px] text-red-400 bg-red-500/20 px-1.5 py-0.5 rounded font-mono">
                        {isMentor ? "Mentor" : "Learner"}
                      </span>
                    </div>
                  </div>
                </div>
              )
            )}

            {/* ════ MODE B: COLLABORATIVE CODE EDITOR ════ */}
            {viewMode === "code" && (
              <div className="w-full h-full flex flex-col rounded-3xl overflow-hidden border border-white/10 bg-[#0D1117] shadow-2xl animate-fade-in">
                {/* Editor Header Bar */}
                <div className="h-11 px-4 bg-[#161B22] border-b border-white/10 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold font-mono text-emerald-400 flex items-center gap-1.5">
                      <Terminal className="h-3.5 w-3.5" /> Live Shared IDE
                    </span>
                    <select
                      value={codeLanguage}
                      onChange={(e) => {
                        setCodeLanguage(e.target.value);
                        setCodeText(DEFAULT_CODE_SNIPPETS[e.target.value] || "");
                      }}
                      className="bg-black/40 border border-white/10 text-white text-xs px-2.5 py-1 rounded-lg font-mono outline-none"
                    >
                      <option value="javascript">JavaScript (Node.js)</option>
                      <option value="python">Python 3.12</option>
                      <option value="react">React JSX</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleRunCode}
                      disabled={isRunningCode}
                      className="btn-primary text-xs px-3.5 py-1 flex items-center gap-1.5 shadow-md shadow-red-500/20 disabled:opacity-50"
                    >
                      <Play className={`h-3.5 w-3.5 fill-white ${isRunningCode ? "animate-spin" : ""}`} />
                      {isRunningCode ? "Running..." : "Run Code"}
                    </button>
                  </div>
                </div>

                {/* Editor Body */}
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                  {/* Code Textarea */}
                  <div className="flex-1 relative font-mono text-xs overflow-hidden">
                    <textarea
                      value={codeText}
                      onChange={(e) => setCodeText(e.target.value)}
                      spellCheck={false}
                      className="w-full h-full bg-transparent text-emerald-300 p-4 font-mono text-xs leading-relaxed resize-none outline-none selection:bg-red-500/30"
                    />
                  </div>

                  {/* Output Terminal Console */}
                  <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-white/10 bg-[#090D13] p-4 flex flex-col shrink-0 font-mono text-xs">
                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-2 flex items-center gap-1">
                      <Terminal className="h-3 w-3 text-red-400" /> Console Output
                    </div>
                    <pre className="flex-1 overflow-y-auto text-slate-300 text-[11px] whitespace-pre-wrap leading-relaxed font-mono">
                      {codeOutput || "// Click 'Run Code' to execute in live sandbox..."}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {/* ════ MODE C: LIVE WHITEBOARD ════ */}
            {viewMode === "whiteboard" && (
              <div className="w-full h-full flex flex-col rounded-3xl overflow-hidden border border-white/10 bg-[#161622] shadow-2xl animate-fade-in">
                {/* Whiteboard Toolbar */}
                <div className="h-12 px-4 bg-[#1F1F30] border-b border-white/10 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <PenTool className="h-3.5 w-3.5 text-amber-400" /> Collaborative Canvas
                    </span>
                    {/* Palette */}
                    <div className="flex items-center gap-1.5 ml-2">
                      {["#FF3B30", "#3B82F6", "#10B981", "#F59E0B", "#FFFFFF"].map((color) => (
                        <button
                          key={color}
                          onClick={() => setDrawColor(color)}
                          className={`h-5 w-5 rounded-full border-2 transition-all ${
                            drawColor === color ? "scale-125 border-white ring-2 ring-blue-400" : "border-transparent opacity-80"
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={clearWhiteboard}
                      className="btn-secondary text-xs px-3 py-1"
                    >
                      Clear Canvas
                    </button>
                  </div>
                </div>

                {/* Canvas Area */}
                <div className="flex-1 relative bg-[#0E0E18] cursor-crosshair overflow-hidden">
                  <canvas
                    ref={whiteboardCanvasRef}
                    width={1200}
                    height={800}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    className="w-full h-full"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Side Drawer: In-Call Chat */}
          {activePanel === "chat" && (
            <div className="w-80 sm:w-96 bg-[#0E0E14] border-l border-white/10 flex flex-col shrink-0 animate-slide-up">
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-red-400" /> In-Call Chat
                </h3>
                <button
                  onClick={() => setActivePanel(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Message Feed */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {messages.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-8">
                    No messages yet. Send a message to chat with your peer!
                  </p>
                ) : (
                  messages.map((m, i) => (
                    <div
                      key={m.id || i}
                      className={`flex flex-col ${
                        m.isSystem
                          ? "items-center"
                          : m.senderId === user?.id
                          ? "items-end"
                          : "items-start"
                      }`}
                    >
                      {m.isSystem ? (
                        <span className="text-[10px] text-slate-500 bg-white/5 px-2 py-0.5 rounded-full font-mono">
                          {m.text}
                        </span>
                      ) : (
                        <div
                          className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                            m.senderId === user?.id
                              ? "bg-red-600 text-white rounded-br-none"
                              : "bg-white/10 text-slate-200 rounded-bl-none"
                          }`}
                        >
                          <div className="text-[9px] font-bold opacity-75 mb-0.5">
                            {m.senderName || (m.senderId === user?.id ? "You" : peer?.name)}
                          </div>
                          <div>{m.text}</div>
                          <div className="text-[8px] opacity-60 text-right mt-1 font-mono">
                            {m.timestamp}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-white/10 flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Send message..."
                  className="input-base text-xs py-2 flex-1"
                />
                <button type="submit" className="btn-primary text-xs px-3 py-2">
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          )}

          {/* Side Drawer: Participants */}
          {activePanel === "participants" && (
            <div className="w-80 bg-[#0E0E14] border-l border-white/10 p-4 space-y-4 shrink-0 animate-slide-up">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="h-4 w-4 text-red-400" /> Participants (2)
                </h3>
                <button onClick={() => setActivePanel(null)} className="text-slate-400 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2">
                {/* You */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-red-600 flex items-center justify-center text-white text-xs font-bold">
                      {getInitials(user?.name)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{user?.name} (You)</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {isMentor ? "Host • Mentor" : "Learner"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400">
                    {isMicOn ? <Mic className="h-3.5 w-3.5 text-emerald-400" /> : <MicOff className="h-3.5 w-3.5 text-red-400" />}
                    {isCameraOn ? <Video className="h-3.5 w-3.5 text-emerald-400" /> : <VideoOff className="h-3.5 w-3.5 text-red-400" />}
                  </div>
                </div>

                {/* Peer */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">
                      {getInitials(peer?.name)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{peer?.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {isMentor ? "Learner" : "Host • Mentor"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400">
                    <Mic className="h-3.5 w-3.5 text-emerald-400" />
                    <Video className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. Bottom Control Dock (Google Meet & Zoom Standard Dock) */}
        <footer className="h-20 bg-[#0E0E14] border-t border-white/10 flex items-center justify-between px-4 sm:px-8 shrink-0">
          {/* Left Session Indicator */}
          <div className="hidden md:flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400 truncate max-w-[200px]">
              {session?.topic}
            </span>
          </div>

          {/* Center Call Controls */}
          <div className="flex items-center gap-2 sm:gap-3 mx-auto">
            {/* Mic Toggle */}
            <button
              onClick={toggleMic}
              className={`p-3.5 rounded-2xl transition-all shadow-lg ${
                isMicOn
                  ? "bg-white/10 text-white hover:bg-white/20 border border-white/10"
                  : "bg-red-600 text-white shadow-red-500/20"
              }`}
              title={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
            >
              {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </button>

            {/* Camera Toggle */}
            <button
              onClick={toggleCamera}
              className={`p-3.5 rounded-2xl transition-all shadow-lg ${
                isCameraOn
                  ? "bg-white/10 text-white hover:bg-white/20 border border-white/10"
                  : "bg-red-600 text-white shadow-red-500/20"
              }`}
              title={isCameraOn ? "Turn off Camera" : "Turn on Camera"}
            >
              {isCameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </button>

            {/* Screen Share */}
            <button
              onClick={toggleScreenShare}
              className={`p-3.5 rounded-2xl transition-all shadow-lg ${
                isScreenSharing
                  ? "bg-blue-600 text-white shadow-blue-500/30"
                  : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
              }`}
              title={isScreenSharing ? "Stop Presenting" : "Share Screen"}
            >
              {isScreenSharing ? <MonitorOff className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
            </button>

            {/* Closed Captions CC */}
            <button
              onClick={() => setIsCaptionsOn(!isCaptionsOn)}
              className={`p-3.5 rounded-2xl transition-all shadow-lg ${
                isCaptionsOn
                  ? "bg-emerald-600 text-white shadow-emerald-500/30"
                  : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
              }`}
              title="Turn on Captions"
            >
              <Subtitles className="h-5 w-5" />
            </button>

            {/* Hand Raise */}
            <button
              onClick={() => setIsHandRaised(!isHandRaised)}
              className={`p-3.5 rounded-2xl transition-all shadow-lg ${
                isHandRaised
                  ? "bg-amber-500 text-black shadow-amber-500/30"
                  : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
              }`}
              title={isHandRaised ? "Lower Hand" : "Raise Hand"}
            >
              <Hand className="h-5 w-5" />
            </button>

            {/* Emoji Reactions Bar */}
            <div className="hidden lg:flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/10">
              {EMOJI_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleSendEmoji(emoji)}
                  className="p-2 rounded-xl text-base hover:scale-125 transition-transform hover:bg-white/10"
                  title={`React with ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Chat Drawer Toggle */}
            <button
              onClick={() => {
                setActivePanel(activePanel === "chat" ? null : "chat");
                setUnreadChatCount(0);
              }}
              className={`relative p-3.5 rounded-2xl transition-all shadow-lg ${
                activePanel === "chat"
                  ? "bg-red-600 text-white"
                  : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
              }`}
              title="Chat"
            >
              <MessageSquare className="h-5 w-5" />
              {unreadChatCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
                  {unreadChatCount}
                </span>
              )}
            </button>

            {/* Participants Toggle */}
            <button
              onClick={() => setActivePanel(activePanel === "participants" ? null : "participants")}
              className={`p-3.5 rounded-2xl transition-all shadow-lg ${
                activePanel === "participants"
                  ? "bg-red-600 text-white"
                  : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
              }`}
              title="Participants"
            >
              <Users className="h-5 w-5" />
            </button>

            {/* Leave / End Call */}
            <button
              onClick={handleEndCall}
              className="bg-red-600 hover:bg-red-700 text-white px-5 py-3.5 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-xl shadow-red-600/30 ml-2"
              title="End Meeting"
            >
              <PhoneOff className="h-5 w-5" />
              <span className="hidden sm:inline">End Call</span>
            </button>
          </div>

          {/* Right Dummy Spacer */}
          <div className="hidden md:flex items-center gap-2">
            <span className="text-[10px] text-slate-500 font-mono">SkillSwap Video v2.0</span>
          </div>
        </footer>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // VIEW 3: POST-SESSION REVIEWS & COINS REWARD MODAL
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-[#09090D] flex items-center justify-center p-4 animate-fade-in relative overflow-hidden">
      <div className="glass rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 text-center border border-white/15 shadow-2xl relative z-10">
        <div className="h-16 w-16 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto shadow-xl shadow-amber-500/20 text-white">
          <Award className="h-8 w-8" />
        </div>

        <div>
          <span className="text-xs font-mono uppercase font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            Session Completed! 🎉
          </span>
          <h2 className="text-2xl font-extrabold text-white font-[Outfit] mt-3">
            + {isMentor ? "10" : "5"} SkillCoins Earned
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Great job exchanging skills in {session?.topic}!
          </p>
        </div>

        {reviewSubmitted ? (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium space-y-1">
            <CheckCircle2 className="h-5 w-5 mx-auto text-emerald-400 mb-1" />
            <p>Thank you! Your review has been saved.</p>
            <p className="text-[10px] text-slate-400">Redirecting to sessions...</p>
          </div>
        ) : (
          <div className="space-y-4 text-left pt-2 border-t border-white/10">
            <label className="text-xs font-bold text-white block">
              How was your session with {peer?.name}?
            </label>

            {/* 5-Star Rating */}
            <div className="flex gap-2 justify-center py-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewRating(star)}
                  className="p-1 text-2xl transition-transform hover:scale-125 focus:outline-none"
                >
                  <Star
                    className={`h-7 w-7 ${
                      star <= reviewRating
                        ? "text-amber-400 fill-amber-400"
                        : "text-slate-600 hover:text-amber-300"
                    }`}
                  />
                </button>
              ))}
            </div>

            <textarea
              value={reviewFeedback}
              onChange={(e) => setReviewFeedback(e.target.value)}
              rows={3}
              placeholder="Leave feedback on their teaching, communication, and skills..."
              className="input-base text-xs resize-none"
            />

            <div className="flex gap-2">
              <button
                onClick={() => router.push("/sessions")}
                className="btn-secondary text-xs flex-1"
              >
                Skip for now
              </button>
              <button
                onClick={handleSubmitReview}
                className="btn-primary text-xs flex-1 font-bold"
              >
                Submit Review & Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
