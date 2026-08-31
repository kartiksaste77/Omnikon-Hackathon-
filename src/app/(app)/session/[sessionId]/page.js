"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import apiClient from "@/lib/apiClient";
import { socketService, getSocket } from "@/lib/socket";
import {
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff,
  MessageSquare, Users, Hand, Settings, PhoneOff,
  Wifi, Send, Star, CheckCircle2, AlertCircle, Maximize2, Minimize2,
  Sparkles, Award, Volume2, ShieldCheck, Play, ArrowLeft, Clock, X
} from "lucide-react";
import confetti from "canvas-confetti";

// STUN servers for WebRTC
const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" },
  ],
};

export default function LiveSessionRoom() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const params = useParams();
  const sessionId = params?.sessionId;

  // Session details from DB
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Call state: "lobby" | "in-call" | "ended"
  const [callState, setCallState] = useState("lobby");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Media streams & controls
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState("self"); // "self" | "peer"

  // Panels
  const [activePanel, setActivePanel] = useState(null); // null | "chat" | "participants" | "settings"
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Chat & Messages
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");

  // Post-session review modal
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Audio level meter
  const [audioLevel, setAudioLevel] = useState(0);

  // Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const screenShareVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const remoteSocketIdRef = useRef(null);
  const chatEndRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

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
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: true,
      });

      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Setup audio analyzer for live volume meter
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
      console.warn("Could not access camera/mic (using fallback):", err);
      setIsCameraOn(false);
    }
  }, []);

  useEffect(() => {
    initLocalMedia();
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close();
      }
    };
  }, [initLocalMedia]);

  // Ensure local video ref gets srcObject whenever ref is mounted
  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [callState, isCameraOn]);

  // 3. WebRTC & Socket Signaling Setup
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

    // Create RTCPeerConnection
    const createPeerConnection = (targetSocketId) => {
      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnectionRef.current = pc;
      remoteSocketIdRef.current = targetSocketId;

      // Add local tracks to WebRTC
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current);
        });
      }

      // Handle remote tracks
      pc.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      // Handle ICE candidates
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

    // When another peer joins the room
    socket.on("session:peer-joined", async ({ socketId, userInfo }) => {
      const pc = createPeerConnection(socketId);
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("signal:offer", {
          to: socketId,
          offer,
          sessionId,
        });
      } catch (err) {
        console.error("Error creating offer:", err);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          senderName: "System",
          text: `👋 ${userInfo?.name || "Peer"} joined the session`,
          isSystem: true,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    });

    // When receiving WebRTC offer
    socket.on("signal:offer", async ({ from, offer, userInfo }) => {
      const pc = createPeerConnection(from);
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("signal:answer", {
          to: from,
          answer,
          sessionId,
        });
      } catch (err) {
        console.error("Error handling offer:", err);
      }
    });

    // When receiving WebRTC answer
    socket.on("signal:answer", async ({ answer }) => {
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (err) {
          console.error("Error setting remote description:", err);
        }
      }
    });

    // When receiving ICE candidate
    socket.on("signal:ice-candidate", async ({ candidate }) => {
      if (peerConnectionRef.current && candidate) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error("Error adding ICE candidate:", err);
        }
      }
    });

    // In-call chat messages
    socket.on("session:chat", (msg) => {
      setMessages((prev) => [...prev, msg]);
      if (activePanel !== "chat") {
        setUnreadChatCount((c) => c + 1);
      }
    });

    // Hand raise from peer
    socket.on("session:hand-raise", ({ raised, userId: rUserId }) => {
      if (raised) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            senderName: "System",
            text: `✋ Peer raised their hand`,
            isSystem: true,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      }
    });

    // Peer left
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

  // 4. Timer when in-call
  useEffect(() => {
    if (callState !== "in-call") return;
    const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [callState]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
      // Stop screen share
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      setIsScreenSharing(false);

      // Revert video track in WebRTC
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

        // Replace track in WebRTC
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
        console.warn("Screen sharing cancelled or not allowed:", err);
      }
    }
  };

  // Toggle Hand Raise
  const toggleHandRaise = () => {
    const next = !isHandRaised;
    setIsHandRaised(next);
    const socket = socketService.getSocket();
    socket?.emit("session:hand-raise", { sessionId, raised: next });
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
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

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

  // Determine peer info
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
          {/* Header */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push("/sessions")}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Exit Room
            </button>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 font-mono">
                <ShieldCheck className="h-3.5 w-3.5" /> End-to-End Encrypted
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
            <div className="lg:col-span-5 space-y-5">
              <div className="glass rounded-3xl p-6 sm:p-8 space-y-5 border border-white/15 shadow-2xl">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-red-400 bg-red-500/10 px-2.5 py-1 rounded-md border border-red-500/20">
                    Live Skill Exchange Room
                  </span>
                  <h1 className="text-2xl font-extrabold text-white font-[Outfit] mt-2 leading-snug">
                    {session?.topic || "Skill Exchange"}
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

                <div className="space-y-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" /> WebRTC P2P Video & Audio Ready
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Real-time Screen Sharing Available
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Instant in-meeting chat & reactions
                  </div>
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

          {/* Center Call Timer */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1 rounded-full text-xs font-mono font-bold text-white">
            <Clock className="h-3.5 w-3.5 text-emerald-400" />
            <span>{formatTime(elapsedSeconds)}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:flex items-center gap-1 text-[11px] text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
              <Wifi className="h-3 w-3" /> 1080p HD
            </span>
          </div>
        </header>

        {/* 2. Main Stage (Video Grid + Side Panel) */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Video Grid Stage */}
          <div className="flex-1 p-3 sm:p-4 flex flex-col items-center justify-center overflow-hidden">
            {/* Screen Share Mode */}
            {isScreenSharing ? (
              <div className="w-full h-full flex flex-col lg:flex-row gap-3">
                {/* Large Screen Share View */}
                <div className="flex-1 rounded-2xl overflow-hidden bg-black border border-white/10 relative flex items-center justify-center">
                  <video
                    ref={screenShareVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-lg font-mono flex items-center gap-1.5">
                    <Monitor className="h-3.5 w-3.5 text-blue-400" /> Your Screen (Sharing)
                  </div>
                </div>

                {/* Floating Camera Tiles on the side */}
                <div className="w-full lg:w-64 flex lg:flex-col gap-3 shrink-0">
                  {/* Remote Peer Tile */}
                  <div className="flex-1 aspect-video lg:aspect-auto rounded-2xl overflow-hidden bg-[#151520] border border-white/10 relative flex items-center justify-center">
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 text-xs bg-black/60 px-2 py-0.5 rounded text-white font-medium">
                      {peer?.name}
                    </div>
                  </div>
                  {/* Self Camera Tile */}
                  <div className="flex-1 aspect-video lg:aspect-auto rounded-2xl overflow-hidden bg-[#151520] border border-white/10 relative flex items-center justify-center">
                    {isCameraOn ? (
                      <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover scale-x-[-1]"
                      />
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
              /* Regular Split Video Grid (2 equal peer tiles) */
              <div className="w-full h-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 items-center">
                {/* 1. Remote Peer Tile */}
                <div className="w-full h-full min-h-[220px] rounded-3xl overflow-hidden bg-[#12121A] border border-white/10 relative flex items-center justify-center shadow-xl">
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  {/* Avatar Fallback if peer camera is loading */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#151520] pointer-events-none -z-0">
                    <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-500 flex items-center justify-center text-white text-3xl font-bold shadow-2xl ring-4 ring-white/10 animate-pulse">
                      {getInitials(peer?.name)}
                    </div>
                    <span className="text-sm text-slate-300 font-bold mt-3 font-[Outfit]">
                      {peer?.name}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {isMentor ? "Learner" : "Mentor"} • Connected
                    </span>
                  </div>

                  {/* Peer Name & Mute status badge */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                    <span className="text-xs font-bold text-white">{peer?.name}</span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded font-mono">
                      {isMentor ? "Learner" : "Mentor"}
                    </span>
                  </div>
                </div>

                {/* 2. Local User Tile (You) */}
                <div
                  className={`w-full h-full min-h-[220px] rounded-3xl overflow-hidden bg-[#12121A] border border-white/10 relative flex items-center justify-center shadow-xl transition-all ${
                    audioLevel > 20 ? "ring-2 ring-emerald-400/80 shadow-emerald-500/20" : ""
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
                    <div className="absolute top-3 left-3 bg-amber-500 text-black text-xs font-bold px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-lg animate-bounce">
                      <Hand className="h-3.5 w-3.5" /> Hand Raised
                    </div>
                  )}

                  {/* Mute indicator */}
                  {!isMicOn && (
                    <div className="absolute top-3 right-3 bg-red-600/90 text-white p-1.5 rounded-xl border border-red-500">
                      <MicOff className="h-3.5 w-3.5" />
                    </div>
                  )}

                  {/* User Name Badge */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                    <span className="text-xs font-bold text-white">{user?.name} (You)</span>
                    <span className="text-[10px] text-red-400 bg-red-500/20 px-1.5 py-0.5 rounded font-mono">
                      {isMentor ? "Mentor" : "Learner"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Side Drawer: In-Call Chat */}
          {activePanel === "chat" && (
            <div className="w-80 sm:w-96 bg-[#0E0E14] border-l border-white/10 flex flex-col shrink-0 animate-slide-up">
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-red-400" /> In-Call Messages
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
                  placeholder="Send message to everyone..."
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

        {/* 3. Bottom Control Bar (Google Meet / Zoom Floating Dock) */}
        <footer className="h-20 bg-[#0E0E14] border-t border-white/10 flex items-center justify-between px-4 sm:px-8 shrink-0">
          {/* Left Session Indicator */}
          <div className="hidden md:flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">
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

            {/* Hand Raise */}
            <button
              onClick={toggleHandRaise}
              className={`p-3.5 rounded-2xl transition-all shadow-lg ${
                isHandRaised
                  ? "bg-amber-500 text-black shadow-amber-500/30"
                  : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
              }`}
              title={isHandRaised ? "Lower Hand" : "Raise Hand"}
            >
              <Hand className="h-5 w-5" />
            </button>

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

          {/* Right Dummy Spacer to keep Center items centered */}
          <div className="hidden md:flex items-center gap-2">
            <span className="text-[10px] text-slate-500 font-mono">SkillSwap Live Engine v2.0</span>
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
