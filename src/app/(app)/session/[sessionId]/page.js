"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import apiClient from "@/lib/apiClient";
import { socketService } from "@/lib/socket";
import {
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff,
  MessageSquare, Users, Hand, PhoneOff,
  Send, Star, CheckCircle2, AlertCircle,
  Volume2, ShieldCheck, Play, ArrowLeft, Clock, X,
  Code, PenTool, Copy, Check, Terminal, ExternalLink,
  RefreshCw, Radio
} from "lucide-react";
import confetti from "canvas-confetti";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

const DEFAULT_CODE = `// Live Collaborative Code Editor
// Real-time peer programming session

function calculateSkillMatch(skillsA, skillsB) {
  const common = skillsA.filter(s => skillsB.includes(s));
  return {
    overlap: common,
    score: Math.round((common.length / Math.max(skillsA.length, skillsB.length)) * 100)
  };
}

console.log("Result:", calculateSkillMatch(["React", "Node", "Python"], ["Python", "React", "Docker"]));
`;

export default function LiveSessionRoom() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const params = useParams();
  const sessionId = params?.sessionId;

  // Session details from DB
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Call status: "lobby" | "in-call" | "ended"
  const [callState, setCallState] = useState("lobby");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // View Mode: "video" | "code" | "whiteboard"
  const [viewMode, setViewMode] = useState("video");

  // Media state
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRemoteConnected, setIsRemoteConnected] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [cameraPermissionError, setCameraPermissionError] = useState(null);

  // Active side panel: null | "chat" | "participants"
  const [activePanel, setActivePanel] = useState(null);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Chat messages
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");

  // Code editor state
  const [codeText, setCodeText] = useState(DEFAULT_CODE);
  const [codeOutput, setCodeOutput] = useState("");
  const [isRunningCode, setIsRunningCode] = useState(false);

  // Whiteboard drawing state
  const [drawColor, setDrawColor] = useState("#FFFFFF");
  const [isDrawing, setIsDrawing] = useState(false);

  // Link copy state
  const [copiedLink, setCopiedLink] = useState(false);

  // Review modal
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Media Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const screenShareVideoRef = useRef(null);
  const whiteboardCanvasRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
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

  // 2. Request Genuine Local Media Stream (Webcam & Mic)
  const initLocalMedia = useCallback(async () => {
    try {
      setCameraPermissionError(null);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }

      // Request real webcam and microphone from browser
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: true,
      });

      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Setup live audio meter using Web Audio API
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
        console.warn("Audio meter init error:", e);
      }
    } catch (err) {
      console.warn("Camera/Mic access error:", err);
      setCameraPermissionError(
        "Camera/Microphone access was denied or not found. Please allow permissions in your browser URL bar to stream live video."
      );
      setIsCameraOn(false);
    }
  }, []);

  useEffect(() => {
    initLocalMedia();
    return () => {
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach((t) => t.stop());
      if (screenStreamRef.current) screenStreamRef.current.getTracks().forEach((t) => t.stop());
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close();
      }
    };
  }, [initLocalMedia]);

  // Ensure DOM video elements always receive srcObject
  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [callState, isCameraOn, viewMode]);

  // 3. Real WebRTC P2P Connection via Socket.io Signaling
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
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }

      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnectionRef.current = pc;

      // Add local audio & video tracks to WebRTC connection
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current);
        });
      }

      // When remote video/audio track is received from peer
      pc.ontrack = (event) => {
        console.log("[WebRTC] Received remote stream track:", event.track.kind);
        setIsRemoteConnected(true);
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      // Send local ICE candidates to peer
      pc.onicecandidate = (event) => {
        if (event.candidate && targetSocketId) {
          socket.emit("signal:ice-candidate", {
            to: targetSocketId,
            candidate: event.candidate,
            sessionId,
          });
        }
      };

      pc.onconnectionstatechange = () => {
        console.log("[WebRTC] Connection state:", pc.connectionState);
        if (pc.connectionState === "connected") {
          setIsRemoteConnected(true);
        } else if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
          setIsRemoteConnected(false);
        }
      };

      return pc;
    };

    // When another peer joins the room -> Create SDP Offer
    socket.on("session:peer-joined", async ({ socketId, userInfo }) => {
      console.log("[WebRTC] Peer joined room:", socketId, userInfo);
      const pc = createPeerConnection(socketId);
      try {
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        await pc.setLocalDescription(offer);
        socket.emit("signal:offer", { to: socketId, offer, sessionId });
      } catch (err) {
        console.error("[WebRTC] Error creating offer:", err);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          senderName: "System",
          text: `👋 ${userInfo?.name || "Peer"} joined the live room`,
          isSystem: true,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    });

    // When receiving SDP Offer -> Create SDP Answer
    socket.on("signal:offer", async ({ from, offer, userInfo }) => {
      console.log("[WebRTC] Received offer from:", from);
      const pc = createPeerConnection(from);
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("signal:answer", { to: from, answer, sessionId });
      } catch (err) {
        console.error("[WebRTC] Error handling offer:", err);
      }
    });

    // When receiving SDP Answer -> Set Remote Description
    socket.on("signal:answer", async ({ answer }) => {
      console.log("[WebRTC] Received answer");
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (err) {
          console.error("[WebRTC] Error setting remote description:", err);
        }
      }
    });

    // When receiving ICE candidate
    socket.on("signal:ice-candidate", async ({ candidate }) => {
      if (peerConnectionRef.current && candidate) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error("[WebRTC] Error adding ICE candidate:", err);
        }
      }
    });

    // In-call live chat
    socket.on("session:chat", (msg) => {
      setMessages((prev) => [...prev, msg]);
      if (activePanel !== "chat") {
        setUnreadChatCount((c) => c + 1);
      }
    });

    // Remote peer left
    socket.on("session:peer-left", () => {
      setIsRemoteConnected(false);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          senderName: "System",
          text: `🚪 Peer left the meeting`,
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

  // Toggle Camera Track
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

  // Toggle Mic Track
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

  // Real Screen Sharing
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
        console.warn("Screen sharing cancelled:", err);
      }
    }
  };

  // Code Sandbox Runner
  const handleRunCode = () => {
    setIsRunningCode(true);
    setCodeOutput("Executing JavaScript in sandbox...\n");
    setTimeout(() => {
      try {
        let logs = [];
        const customConsole = {
          log: (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
          error: (...args) => logs.push('[ERROR] ' + args.join(' ')),
          warn: (...args) => logs.push('[WARN] ' + args.join(' ')),
        };
        const runner = new Function("console", codeText);
        runner(customConsole);
        setCodeOutput(logs.length > 0 ? logs.join("\n") : "✓ Execution finished with exit code 0");
      } catch (err) {
        setCodeOutput(`Runtime Error: ${err.message}`);
      }
      setIsRunningCode(false);
    }, 400);
  };

  // Whiteboard drawing
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
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-white text-black flex items-center justify-center animate-pulse shadow-2xl">
            <Video className="h-6 w-6" />
          </div>
          <p className="text-sm font-mono text-zinc-400 animate-pulse">
            Connecting to secure WebRTC room...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="glass rounded-2xl p-8 max-w-md text-center space-y-4 border border-zinc-800">
          <AlertCircle className="h-12 w-12 text-zinc-400 mx-auto" />
          <h2 className="text-xl font-bold text-white font-[Outfit]">Session Unavailable</h2>
          <p className="text-sm text-zinc-400">{error}</p>
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
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 sm:p-6 animate-fade-in relative overflow-hidden">
        <div className="w-full max-w-4xl space-y-6 relative z-10">
          {/* Top Bar */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push("/sessions")}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Exit Room
            </button>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs text-white bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800 font-mono">
                <ShieldCheck className="h-3.5 w-3.5" /> End-to-End Encrypted WebRTC
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Real Camera Preview Tile */}
            <div className="lg:col-span-7 space-y-3">
              <div className="relative aspect-video rounded-3xl overflow-hidden bg-zinc-950 border border-zinc-800 shadow-2xl flex items-center justify-center">
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
                    <div className="h-20 w-20 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white text-2xl font-bold">
                      {getInitials(user?.name)}
                    </div>
                    <p className="text-xs text-zinc-400 font-medium">Camera is turned off</p>
                  </div>
                )}

                {/* Floating Preview Controls */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-zinc-700">
                  <button
                    onClick={toggleMic}
                    className={`p-3 rounded-xl transition-all ${
                      isMicOn ? "bg-zinc-800 text-white hover:bg-zinc-700" : "bg-white text-black font-bold"
                    }`}
                    title={isMicOn ? "Mute mic" : "Unmute mic"}
                  >
                    {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={toggleCamera}
                    className={`p-3 rounded-xl transition-all ${
                      isCameraOn ? "bg-zinc-800 text-white hover:bg-zinc-700" : "bg-white text-black font-bold"
                    }`}
                    title={isCameraOn ? "Turn off camera" : "Turn on camera"}
                  >
                    {isCameraOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                  </button>
                </div>

                {/* Live Mic Audio Level Visualizer */}
                {isMicOn && (
                  <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-black/70 px-3 py-1 rounded-full border border-zinc-800">
                    <Volume2 className="h-3.5 w-3.5 text-white" />
                    <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white transition-all duration-75"
                        style={{ width: `${Math.max(10, audioLevel)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {cameraPermissionError && (
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-300 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-white shrink-0 mt-0.5" />
                  <div>{cameraPermissionError}</div>
                </div>
              )}
            </div>

            {/* Session Info & Join Card */}
            <div className="lg:col-span-5 space-y-4">
              <div className="glass rounded-3xl p-6 sm:p-8 space-y-5 border border-zinc-800 shadow-2xl">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-white bg-zinc-800 px-2.5 py-1 rounded-md border border-zinc-700">
                    Live Video Room
                  </span>
                  <h1 className="text-2xl font-extrabold text-white font-[Outfit] mt-2 leading-snug">
                    {session?.topic || "Live Skill Exchange"}
                  </h1>
                  <p className="text-xs text-zinc-400 mt-1">
                    {session?.date} at {session?.time} • {session?.duration} mins
                  </p>
                </div>

                {/* Peer Card */}
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800">
                  <div className="h-11 w-11 rounded-xl bg-white text-black flex items-center justify-center font-bold text-sm">
                    {getInitials(peer?.name)}
                  </div>
                  <div>
                    <div className="text-xs text-zinc-400 font-mono">
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
                    {copiedLink ? <Check className="h-3.5 w-3.5 text-white" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedLink ? "Link Copied!" : "Copy Meeting Link"}
                  </button>
                  <button
                    onClick={handleOpenSecondTab}
                    className="btn-secondary text-xs py-2 px-3 flex items-center gap-1"
                    title="Open in 2nd tab to test 2-way WebRTC video streaming"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> 2nd Tab Test
                  </button>
                </div>

                <button
                  onClick={handleJoinCall}
                  className="btn-primary w-full py-3.5 text-base font-bold shadow-xl flex items-center justify-center gap-2"
                >
                  <Play className="h-5 w-5 fill-black" /> Join Meeting Now
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
      <div className="fixed inset-0 bg-black text-white z-50 flex flex-col select-none overflow-hidden font-sans">
        {/* 1. Header Bar */}
        <header className="h-14 px-4 sm:px-6 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-2.5 w-2.5 rounded-full bg-white animate-ping" />
            <div>
              <h2 className="text-sm font-bold text-white font-[Outfit] leading-none">
                {session?.topic}
              </h2>
              <span className="text-[10px] text-zinc-400 font-mono">
                with {peer?.name}
              </span>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setViewMode("video")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === "video"
                  ? "bg-white text-black shadow"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Video className="h-3.5 w-3.5" /> Video Call
            </button>
            <button
              onClick={() => setViewMode("code")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === "code"
                  ? "bg-white text-black shadow"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Code className="h-3.5 w-3.5" /> Live Code
            </button>
            <button
              onClick={() => setViewMode("whiteboard")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === "whiteboard"
                  ? "bg-white text-black shadow"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <PenTool className="h-3.5 w-3.5" /> Whiteboard
            </button>
          </div>

          {/* Right Header Status */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-lg text-xs font-mono font-bold text-white">
              <Clock className="h-3.5 w-3.5" />
              <span>{formatTime(elapsedSeconds)}</span>
            </div>
            <button
              onClick={handleCopyLink}
              className="btn-secondary text-[11px] px-2.5 py-1 hidden sm:flex items-center gap-1"
            >
              {copiedLink ? <Check className="h-3 w-3 text-white" /> : <Copy className="h-3 w-3" />}
              {copiedLink ? "Copied" : "Copy Link"}
            </button>
          </div>
        </header>

        {/* 2. Main Stage */}
        <div className="flex-1 flex overflow-hidden relative bg-black">
          {/* Main Stage Content */}
          <div className="flex-1 p-3 sm:p-4 flex flex-col items-center justify-center overflow-hidden relative">
            {/* ════ MODE A: VIDEO CALL GRID ════ */}
            {viewMode === "video" && (
              isScreenSharing ? (
                /* Screen Share Mode */
                <div className="w-full h-full flex flex-col lg:flex-row gap-3">
                  <div className="flex-1 rounded-2xl overflow-hidden bg-black border border-zinc-800 relative flex items-center justify-center">
                    <video
                      ref={screenShareVideoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-lg font-mono flex items-center gap-1.5 border border-zinc-700">
                      <Monitor className="h-3.5 w-3.5 text-white" /> Your Screen (Presenting)
                    </div>
                  </div>
                  <div className="w-full lg:w-64 flex lg:flex-col gap-3 shrink-0">
                    {/* Remote Video Tile */}
                    <div className="flex-1 rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 relative flex items-center justify-center">
                      <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 left-2 text-xs bg-black/70 px-2 py-0.5 rounded text-white font-medium">
                        {peer?.name}
                      </div>
                    </div>
                    {/* Local Video Tile */}
                    <div className="flex-1 rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 relative flex items-center justify-center">
                      {isCameraOn ? (
                        <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                      ) : (
                        <div className="h-10 w-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white font-bold">
                          {getInitials(user?.name)}
                        </div>
                      )}
                      <div className="absolute bottom-2 left-2 text-xs bg-black/70 px-2 py-0.5 rounded text-white font-medium">
                        You
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Dual Real Video Grid (Google Meet / Zoom Split Screen) */
                <div className="w-full h-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 items-center">
                  {/* 1. Remote Peer Video Tile */}
                  <div className="w-full h-full min-h-[220px] rounded-3xl overflow-hidden bg-zinc-950 border border-zinc-800 relative flex items-center justify-center shadow-2xl">
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />

                    {/* Waiting state if 2nd user has not joined yet */}
                    {!isRemoteConnected && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 p-6 text-center space-y-3">
                        <div className="h-20 w-20 rounded-3xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white text-2xl font-bold animate-pulse">
                          {getInitials(peer?.name)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white font-[Outfit]">
                            Waiting for {peer?.name} to join...
                          </div>
                          <p className="text-xs text-zinc-400 mt-1 max-w-xs">
                            Open this link in another tab or send it to your peer to start 2-way live video:
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleOpenSecondTab}
                            className="btn-primary text-xs px-3.5 py-1.5 flex items-center gap-1"
                          >
                            <ExternalLink className="h-3.5 w-3.5" /> Test as 2nd Participant
                          </button>
                          <button
                            onClick={handleCopyLink}
                            className="btn-secondary text-xs px-3 py-1.5"
                          >
                            {copiedLink ? "Copied!" : "Copy Link"}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Peer Name Tag */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-zinc-800">
                      <span className="text-xs font-bold text-white">{peer?.name}</span>
                      <span className="text-[10px] text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded font-mono">
                        {isMentor ? "Learner" : "Mentor"}
                      </span>
                    </div>
                  </div>

                  {/* 2. Local User Video Tile (You) */}
                  <div
                    className={`w-full h-full min-h-[220px] rounded-3xl overflow-hidden bg-zinc-950 border border-zinc-800 relative flex items-center justify-center shadow-2xl transition-all ${
                      audioLevel > 20 ? "ring-2 ring-white shadow-2xl" : ""
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
                        <div className="h-20 w-20 rounded-3xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white text-2xl font-bold shadow-2xl">
                          {getInitials(user?.name)}
                        </div>
                        <span className="text-sm text-zinc-300 font-bold mt-3 font-[Outfit]">
                          {user?.name} (You)
                        </span>
                        <span className="text-[11px] text-zinc-500 font-mono mt-0.5">
                          Camera Off
                        </span>
                      </div>
                    )}

                    {/* Hand Raised badge */}
                    {isHandRaised && (
                      <div className="absolute top-3 left-3 bg-white text-black text-xs font-bold px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-lg animate-bounce">
                        <Hand className="h-3.5 w-3.5" /> Hand Raised
                      </div>
                    )}

                    {/* Mute indicator */}
                    {!isMicOn && (
                      <div className="absolute top-3 right-3 bg-white text-black p-1.5 rounded-xl">
                        <MicOff className="h-3.5 w-3.5" />
                      </div>
                    )}

                    {/* User Name Badge */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-zinc-800">
                      <span className="text-xs font-bold text-white">{user?.name} (You)</span>
                      <span className="text-[10px] text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded font-mono">
                        {isMentor ? "Mentor" : "Learner"}
                      </span>
                    </div>
                  </div>
                </div>
              )
            )}

            {/* ════ MODE B: LIVE CODE EDITOR ════ */}
            {viewMode === "code" && (
              <div className="w-full h-full flex flex-col rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-2xl animate-fade-in">
                <div className="h-11 px-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold font-mono text-white flex items-center gap-1.5">
                      <Terminal className="h-3.5 w-3.5" /> Live Shared Editor
                    </span>
                  </div>
                  <button
                    onClick={handleRunCode}
                    disabled={isRunningCode}
                    className="btn-primary text-xs px-3.5 py-1 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Play className={`h-3.5 w-3.5 fill-black ${isRunningCode ? "animate-spin" : ""}`} />
                    {isRunningCode ? "Running..." : "Run Code"}
                  </button>
                </div>
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                  <div className="flex-1 relative font-mono text-xs overflow-hidden">
                    <textarea
                      value={codeText}
                      onChange={(e) => setCodeText(e.target.value)}
                      spellCheck={false}
                      className="w-full h-full bg-black text-white p-4 font-mono text-xs leading-relaxed resize-none outline-none"
                    />
                  </div>
                  <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-zinc-800 bg-zinc-950 p-4 flex flex-col shrink-0 font-mono text-xs">
                    <div className="text-[10px] uppercase font-bold text-zinc-400 mb-2 flex items-center gap-1">
                      <Terminal className="h-3 w-3" /> Console Output
                    </div>
                    <pre className="flex-1 overflow-y-auto text-zinc-300 text-[11px] whitespace-pre-wrap leading-relaxed font-mono">
                      {codeOutput || "// Click 'Run Code' to execute..."}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {/* ════ MODE C: WHITEBOARD ════ */}
            {viewMode === "whiteboard" && (
              <div className="w-full h-full flex flex-col rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-2xl animate-fade-in">
                <div className="h-12 px-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <PenTool className="h-3.5 w-3.5" /> Shared Whiteboard
                    </span>
                    <div className="flex items-center gap-1.5 ml-2">
                      {["#FFFFFF", "#71717A", "#3B82F6", "#10B981", "#EF4444"].map((color) => (
                        <button
                          key={color}
                          onClick={() => setDrawColor(color)}
                          className={`h-5 w-5 rounded-full border-2 transition-all ${
                            drawColor === color ? "scale-125 border-white ring-2 ring-white" : "border-transparent opacity-80"
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  <button onClick={clearWhiteboard} className="btn-secondary text-xs px-3 py-1">
                    Clear Canvas
                  </button>
                </div>
                <div className="flex-1 relative bg-black cursor-crosshair overflow-hidden">
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

          {/* Side Drawer: Chat */}
          {activePanel === "chat" && (
            <div className="w-80 sm:w-96 bg-zinc-950 border-l border-zinc-800 flex flex-col shrink-0 animate-slide-up">
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" /> In-Call Chat
                </h3>
                <button onClick={() => setActivePanel(null)} className="p-1 rounded-lg text-zinc-400 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {messages.length === 0 ? (
                  <p className="text-xs text-zinc-500 text-center py-8">
                    No messages yet. Send a message to your peer!
                  </p>
                ) : (
                  messages.map((m, i) => (
                    <div
                      key={m.id || i}
                      className={`flex flex-col ${
                        m.isSystem ? "items-center" : m.senderId === user?.id ? "items-end" : "items-start"
                      }`}
                    >
                      {m.isSystem ? (
                        <span className="text-[10px] text-zinc-400 bg-zinc-900 px-2.5 py-0.5 rounded-full font-mono border border-zinc-800">
                          {m.text}
                        </span>
                      ) : (
                        <div
                          className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                            m.senderId === user?.id
                              ? "bg-white text-black font-medium rounded-br-none"
                              : "bg-zinc-900 text-zinc-200 rounded-bl-none border border-zinc-800"
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
              <form onSubmit={handleSendMessage} className="p-3 border-t border-zinc-800 flex gap-2">
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
            <div className="w-80 bg-zinc-950 border-l border-zinc-800 p-4 space-y-4 shrink-0 animate-slide-up">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="h-4 w-4" /> Participants
                </h3>
                <button onClick={() => setActivePanel(null)} className="text-zinc-400 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2">
                {/* You */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-white text-black flex items-center justify-center text-xs font-bold">
                      {getInitials(user?.name)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{user?.name} (You)</div>
                      <div className="text-[10px] text-zinc-400 font-mono">
                        {isMentor ? "Host • Mentor" : "Learner"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-zinc-400">
                    {isMicOn ? <Mic className="h-3.5 w-3.5 text-white" /> : <MicOff className="h-3.5 w-3.5 text-zinc-500" />}
                    {isCameraOn ? <Video className="h-3.5 w-3.5 text-white" /> : <VideoOff className="h-3.5 w-3.5 text-zinc-500" />}
                  </div>
                </div>

                {/* Peer */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-zinc-800 text-white flex items-center justify-center text-xs font-bold">
                      {getInitials(peer?.name)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{peer?.name}</div>
                      <div className="text-[10px] text-zinc-400 font-mono">
                        {isRemoteConnected ? "Connected" : "Invited"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-zinc-400">
                    <Radio className={`h-3.5 w-3.5 ${isRemoteConnected ? "text-white animate-pulse" : "text-zinc-600"}`} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. Bottom Control Dock (Google Meet & Zoom Standard Dock) */}
        <footer className="h-20 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between px-4 sm:px-8 shrink-0">
          <div className="hidden md:flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-400 truncate max-w-[200px]">
              {session?.topic}
            </span>
          </div>

          {/* Center Call Controls */}
          <div className="flex items-center gap-2 sm:gap-3 mx-auto">
            {/* Mic Toggle */}
            <button
              onClick={toggleMic}
              className={`p-3.5 rounded-2xl transition-all shadow-lg ${
                isMicOn ? "bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-700" : "bg-white text-black font-bold"
              }`}
              title={isMicOn ? "Mute Mic" : "Unmute Mic"}
            >
              {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </button>

            {/* Camera Toggle */}
            <button
              onClick={toggleCamera}
              className={`p-3.5 rounded-2xl transition-all shadow-lg ${
                isCameraOn ? "bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-700" : "bg-white text-black font-bold"
              }`}
              title={isCameraOn ? "Turn off Camera" : "Turn on Camera"}
            >
              {isCameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </button>

            {/* Screen Share */}
            <button
              onClick={toggleScreenShare}
              className={`p-3.5 rounded-2xl transition-all shadow-lg ${
                isScreenSharing ? "bg-white text-black font-bold" : "bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-700"
              }`}
              title={isScreenSharing ? "Stop Sharing" : "Share Screen"}
            >
              {isScreenSharing ? <MonitorOff className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
            </button>

            {/* Hand Raise */}
            <button
              onClick={() => setIsHandRaised(!isHandRaised)}
              className={`p-3.5 rounded-2xl transition-all shadow-lg ${
                isHandRaised ? "bg-white text-black font-bold" : "bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-700"
              }`}
              title={isHandRaised ? "Lower Hand" : "Raise Hand"}
            >
              <Hand className="h-5 w-5" />
            </button>

            {/* In-Call Chat */}
            <button
              onClick={() => {
                setActivePanel(activePanel === "chat" ? null : "chat");
                setUnreadChatCount(0);
              }}
              className={`relative p-3.5 rounded-2xl transition-all shadow-lg ${
                activePanel === "chat" ? "bg-white text-black font-bold" : "bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-700"
              }`}
              title="Chat"
            >
              <MessageSquare className="h-5 w-5" />
              {unreadChatCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-white text-black text-[10px] font-bold flex items-center justify-center">
                  {unreadChatCount}
                </span>
              )}
            </button>

            {/* Participants */}
            <button
              onClick={() => setActivePanel(activePanel === "participants" ? null : "participants")}
              className={`p-3.5 rounded-2xl transition-all shadow-lg ${
                activePanel === "participants" ? "bg-white text-black font-bold" : "bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-700"
              }`}
              title="Participants"
            >
              <Users className="h-5 w-5" />
            </button>

            {/* Leave / End Call */}
            <button
              onClick={handleEndCall}
              className="bg-zinc-900 border border-zinc-700 hover:bg-white hover:text-black text-white px-5 py-3.5 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all ml-2"
              title="End Call"
            >
              <PhoneOff className="h-5 w-5" />
              <span className="hidden sm:inline">End Meeting</span>
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <span className="text-[10px] text-zinc-500 font-mono">WebRTC P2P Live</span>
          </div>
        </footer>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // VIEW 3: POST-SESSION REVIEWS & COINS REWARD MODAL
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 animate-fade-in relative overflow-hidden">
      <div className="glass rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 text-center border border-zinc-800 shadow-2xl relative z-10">
        <div className="h-16 w-16 rounded-3xl bg-white text-black flex items-center justify-center mx-auto shadow-2xl">
          <Award className="h-8 w-8" />
        </div>

        <div>
          <span className="text-xs font-mono uppercase font-bold text-white bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
            Session Completed! 🎉
          </span>
          <h2 className="text-2xl font-extrabold text-white font-[Outfit] mt-3">
            + {isMentor ? "10" : "5"} SkillCoins Earned
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Great job exchanging skills in {session?.topic}!
          </p>
        </div>

        {reviewSubmitted ? (
          <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-white text-xs font-medium space-y-1">
            <CheckCircle2 className="h-5 w-5 mx-auto text-white mb-1" />
            <p>Thank you! Your review has been saved.</p>
            <p className="text-[10px] text-zinc-400">Redirecting to sessions...</p>
          </div>
        ) : (
          <div className="space-y-4 text-left pt-2 border-t border-zinc-800">
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
                        ? "text-white fill-white"
                        : "text-zinc-700 hover:text-zinc-400"
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
