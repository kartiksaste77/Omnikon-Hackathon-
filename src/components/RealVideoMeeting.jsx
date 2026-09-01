"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  MonitorUp, 
  MonitorOff,
  Hand,
  Smile,
  MessageSquare,
  Users,
  Info,
  PenTool,
  Code2,
  PhoneOff,
  Copy,
  Check,
  Sparkles,
  Maximize2,
  Volume2,
  ShieldCheck,
  Clock,
  Play,
  Download,
  RotateCcw,
  Eraser,
  Square,
  Circle as CircleIcon,
  Minus,
  CheckCircle2
} from "lucide-react";
import confetti from "canvas-confetti";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ]
};

export default function RealVideoMeeting({ session, onComplete }) {
  const roomId = session?.id || "sess_101";

  // Pre-join vs In-Meeting
  const [joined, setJoined] = useState(false);
  const [displayName, setDisplayName] = useState(session?.learnerName || session?.mentorName || "Alex Rivera");
  
  // Hardware Media States
  const [localStream, setLocalStream] = useState(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState(null);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // WebRTC Peer States
  const [remotePeers, setRemotePeers] = useState([]); // [{ id, name, stream, isMicOn, isCameraOn, isHandRaised }]
  const peerConnections = useRef(new Map()); // peerId -> RTCPeerConnection
  const myPeerId = useRef(`peer_${Math.random().toString(36).substring(2, 9)}`);
  const broadcastChannel = useRef(null);
  const signalingInterval = useRef(null);
  const lastSignalTime = useRef(0);

  // Video Element Refs
  const localVideoRef = useRef(null);
  const lobbyVideoRef = useRef(null);
  const remoteVideoRefs = useRef(new Map()); // peerId -> HTMLVideoElement

  // Active Side Drawer: null | 'chat' | 'participants' | 'info' | 'whiteboard' | 'code'
  const [activeDrawer, setActiveDrawer] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [meetingDuration, setMeetingDuration] = useState(3540); // 59 mins
  const [floatingReactions, setFloatingReactions] = useState([]);

  // In-call Chat Messages
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: session?.mentorName || "Alex Rivera", text: "Welcome to the live video meeting room! You can present your screen, draw on the whiteboard, or run live code.", time: "Just now" }
  ]);
  const [chatInput, setChatInput] = useState("");

  // Whiteboard State
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawTool, setDrawTool] = useState("pen");
  const [drawColor, setDrawColor] = useState("#6366f1");
  const [lineWidth, setLineWidth] = useState(3);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [canvasSnapshot, setCanvasSnapshot] = useState(null);

  // Code Playground State
  const [code, setCode] = useState(
`// Live Code Runner - Test JavaScript Functions
function calculateSynergy(skillsA, skillsB) {
  const mutual = skillsA.filter(s => skillsB.includes(s));
  return {
    sharedCount: mutual.length,
    synergyScore: (mutual.length * 25) + "%",
    escrow: "10 SkillCoins Verified"
  };
}

console.log(calculateSynergy(
  ["React 19", "Next.js", "TypeScript"],
  ["React 19", "TypeScript", "AI Roadmaps"]
));`
  );
  const [codeOutput, setCodeOutput] = useState("");

  // Initialize Media Stream in Lobby
  useEffect(() => {
    let streamInstance = null;
    const startLobbyMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true
        });
        streamInstance = stream;
        setLocalStream(stream);
        if (lobbyVideoRef.current) {
          lobbyVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn("Camera/Mic access not granted or unavailable, continuing with canvas fallback:", err);
      }
    };
    startLobbyMedia();

    return () => {
      if (streamInstance) {
        streamInstance.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Audio Level Activity Detection
  useEffect(() => {
    if (!localStream) return;
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(localStream);
      const javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

      analyser.smoothingTimeConstant = 0.8;
      analyser.fftSize = 1024;
      microphone.connect(analyser);
      analyser.connect(javascriptNode);
      javascriptNode.connect(audioContext.destination);

      javascriptNode.onaudioprocess = () => {
        if (!isMicOn) {
          setIsSpeaking(false);
          return;
        }
        const array = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(array);
        let values = 0;
        for (let i = 0; i < array.length; i++) values += array[i];
        const average = values / array.length;
        setIsSpeaking(average > 18);
      };

      return () => {
        javascriptNode.disconnect();
        analyser.disconnect();
        microphone.disconnect();
        audioContext.close();
      };
    } catch (e) {}
  }, [localStream, isMicOn]);

  // Meeting Timer Countdown
  useEffect(() => {
    if (!joined) return;
    const timer = setInterval(() => {
      setMeetingDuration((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [joined]);

  // WebRTC Signaling & Connection Setup
  const sendSignal = useCallback((type, payload, targetPeerId = null) => {
    const signalData = {
      roomId,
      from: myPeerId.current,
      to: targetPeerId,
      name: displayName,
      type,
      payload
    };

    // 1. BroadcastChannel for 0ms latency multi-tab testing
    if (broadcastChannel.current) {
      try {
        broadcastChannel.current.postMessage(signalData);
      } catch (e) {}
    }

    // 2. HTTP Signaling API
    fetch("/api/webrtc/signal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(signalData)
    }).catch(() => {});
  }, [roomId, displayName]);

  const handleReceiveSignal = useCallback(async (signal) => {
    if (!signal || signal.from === myPeerId.current) return;
    const { from: remoteId, name: remoteName, type, payload } = signal;

    if (type === "join") {
      // Create Peer Connection as Caller
      let pc = peerConnections.current.get(remoteId);
      if (!pc) {
        pc = createPeerConnection(remoteId, remoteName);
      }
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sendSignal("offer", offer, remoteId);
    } 
    else if (type === "offer") {
      let pc = peerConnections.current.get(remoteId);
      if (!pc) {
        pc = createPeerConnection(remoteId, remoteName);
      }
      await pc.setRemoteDescription(new RTCSessionDescription(payload));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sendSignal("answer", answer, remoteId);
    } 
    else if (type === "answer") {
      const pc = peerConnections.current.get(remoteId);
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(payload));
      }
    } 
    else if (type === "candidate") {
      const pc = peerConnections.current.get(remoteId);
      if (pc && payload) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(payload));
        } catch (e) {}
      }
    } 
    else if (type === "chat") {
      setChatMessages((prev) => [...prev, payload]);
    } 
    else if (type === "reaction") {
      triggerReaction(payload.emoji, false);
    } 
    else if (type === "hand") {
      setRemotePeers((prev) =>
        prev.map((p) => (p.id === remoteId ? { ...p, isHandRaised: payload.isHandRaised } : p))
      );
    } 
    else if (type === "media_state") {
      setRemotePeers((prev) =>
        prev.map((p) => (p.id === remoteId ? { ...p, isMicOn: payload.isMicOn, isCameraOn: payload.isCameraOn } : p))
      );
    } 
    else if (type === "leave") {
      const pc = peerConnections.current.get(remoteId);
      if (pc) {
        pc.close();
        peerConnections.current.delete(remoteId);
      }
      setRemotePeers((prev) => prev.filter((p) => p.id !== remoteId));
    }
  }, [sendSignal]);

  const createPeerConnection = (remoteId, remoteName = "Peer") => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add local media tracks
    if (localStream) {
      localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal("candidate", event.candidate, remoteId);
      }
    };

    pc.ontrack = (event) => {
      const stream = event.streams[0];
      setRemotePeers((prev) => {
        const existing = prev.find((p) => p.id === remoteId);
        if (existing) {
          return prev.map((p) => (p.id === remoteId ? { ...p, stream, name: remoteName || p.name } : p));
        }
        return [...prev, { id: remoteId, name: remoteName || "Peer", stream, isMicOn: true, isCameraOn: true, isHandRaised: false }];
      });

      setTimeout(() => {
        const videoEl = remoteVideoRefs.current.get(remoteId);
        if (videoEl && stream) {
          videoEl.srcObject = stream;
        }
      }, 100);
    };

    peerConnections.current.set(remoteId, pc);
    return pc;
  };

  // Join Call Execution
  const handleJoinMeeting = () => {
    setJoined(true);

    // Bind local video element
    setTimeout(() => {
      if (localVideoRef.current && localStream) {
        localVideoRef.current.srcObject = localStream;
      }
    }, 100);

    // Initialize Broadcast Channel
    try {
      broadcastChannel.current = new BroadcastChannel(`skillswap-room-${roomId}`);
      broadcastChannel.current.onmessage = (event) => {
        handleReceiveSignal(event.data);
      };
    } catch (e) {}

    // Announce join to the room
    sendSignal("join", { name: displayName });

    // Signaling Polling loop for cross-device support
    signalingInterval.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/webrtc/signal?roomId=${roomId}&peerId=${myPeerId.current}&since=${lastSignalTime.current}`);
        const data = await res.json();
        if (data?.signals) {
          lastSignalTime.current = data.latestTimestamp || Date.now();
          data.signals.forEach((s) => handleReceiveSignal(s));
        }
      } catch (e) {}
    }, 1500);

    // Add Simulated Peer if alone to demonstrate multi-party Zoom view
    setTimeout(() => {
      setRemotePeers((prev) => {
        if (prev.length === 0) {
          const simulatedPartner = session?.mentorId === "user_1" ? {
            id: "sim_learner_2",
            name: session?.learnerName || "Priya Sharma",
            avatar: session?.learnerAvatar || "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80",
            isMicOn: true,
            isCameraOn: true,
            isHandRaised: false
          } : {
            id: "sim_mentor_1",
            name: session?.mentorName || "Alex Rivera",
            avatar: session?.mentorAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80",
            isMicOn: true,
            isCameraOn: true,
            isHandRaised: false
          };
          return [simulatedPartner];
        }
        return prev;
      });
    }, 1200);
  };

  // Toggle Mic
  const toggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !isMicOn;
      });
    }
    const nextState = !isMicOn;
    setIsMicOn(nextState);
    sendSignal("media_state", { isMicOn: nextState, isCameraOn });
  };

  // Toggle Camera
  const toggleCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !isCameraOn;
      });
    }
    const nextState = !isCameraOn;
    setIsCameraOn(nextState);
    sendSignal("media_state", { isMicOn, isCameraOn: nextState });
  };

  // Toggle Screen Share
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStream) {
        screenStream.getTracks().forEach((t) => t.stop());
        setScreenStream(null);
      }
      setIsScreenSharing(false);

      // Revert tracks on peer connections to camera
      if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        peerConnections.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
          if (sender && videoTrack) sender.replaceTrack(videoTrack);
        });
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        setScreenStream(stream);
        setIsScreenSharing(true);

        const screenTrack = stream.getVideoTracks()[0];
        peerConnections.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
          if (sender && screenTrack) sender.replaceTrack(screenTrack);
        });

        screenTrack.onended = () => {
          toggleScreenShare();
        };
      } catch (err) {
        console.warn("Screen share cancelled:", err);
      }
    }
  };

  // Toggle Hand Raise
  const toggleHandRaise = () => {
    const nextState = !isHandRaised;
    setIsHandRaised(nextState);
    sendSignal("hand", { isHandRaised: nextState });
    if (nextState) {
      triggerReaction("✋", true);
    }
  };

  // Floating Emoji Reaction
  const triggerReaction = (emoji, broadcast = true) => {
    const newEmoji = {
      id: Date.now() + Math.random(),
      emoji,
      left: Math.floor(20 + Math.random() * 60)
    };
    setFloatingReactions((prev) => [...prev, newEmoji]);
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((e) => e.id !== newEmoji.id));
    }, 2400);

    if (broadcast) {
      sendSignal("reaction", { emoji });
    }
  };

  // Send In-call Chat Message
  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: displayName,
      text: chatInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages((prev) => [...prev, newMsg]);
    sendSignal("chat", newMsg);
    setChatInput("");
  };

  // Copy Room Link
  const copyMeetingLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Leave / Complete Session
  const handleLeaveCall = () => {
    sendSignal("leave", {});
    if (broadcastChannel.current) broadcastChannel.current.close();
    if (signalingInterval.current) clearInterval(signalingInterval.current);
    if (localStream) localStream.getTracks().forEach((t) => t.stop());

    try {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    } catch (e) {}

    if (onComplete) onComplete();
  };

  // Whiteboard Canvas Drawing Logic
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
      ctx.strokeStyle = drawTool === "eraser" ? "#0f172a" : drawColor;
      ctx.lineWidth = drawTool === "eraser" ? 22 : lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    } else {
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
    const a = document.createElement("a");
    a.download = `meeting-whiteboard-${roomId}.png`;
    a.href = canvas.toDataURL();
    a.click();
  };

  // Run Code Playground
  const runCode = () => {
    let logs = [];
    const customConsole = {
      log: (...args) => logs.push(args.map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a))).join(" ")),
      error: (...args) => logs.push("[ERROR] " + args.join(" "))
    };
    try {
      const fn = new Function("console", code);
      fn(customConsole);
      setCodeOutput(logs.join("\n") || "✓ Executed successfully with zero errors.");
    } catch (err) {
      setCodeOutput(`Runtime Error: ${err.message}`);
    }
  };

  // ==========================================
  // VIEW 1: PRE-JOIN GREEN ROOM LOBBY (Google Meet style)
  // ==========================================
  if (!joined) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl">
          
          {/* Left: Camera & Audio Preview (7 cols) */}
          <div className="md:col-span-7 space-y-4">
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-indigo-500/30 shadow-xl flex items-center justify-center">
              {isCameraOn ? (
                <video
                  ref={lobbyVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-500 space-y-2">
                  <VideoOff className="h-12 w-12" />
                  <span className="text-xs">Camera is turned off</span>
                </div>
              )}

              {/* Live Audio Meter & Speaking indicator */}
              <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                {isMicOn ? (
                  <div className="flex items-center gap-1">
                    <span className={`h-2.5 w-1 rounded-full ${isSpeaking ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
                    <span className={`h-4 w-1 rounded-full ${isSpeaking ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
                    <span className={`h-2 w-1 rounded-full ${isSpeaking ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
                    <span className="text-[11px] font-semibold text-slate-200 ml-1">
                      {isSpeaking ? "Audio Active" : "Mic On"}
                    </span>
                  </div>
                ) : (
                  <span className="text-[11px] font-semibold text-rose-400 flex items-center gap-1">
                    <MicOff className="h-3 w-3" /> Muted
                  </span>
                )}
              </div>

              {/* Floating Quick Controls */}
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <button
                  onClick={toggleMic}
                  className={`p-3 rounded-full transition-all ${
                    isMicOn ? "bg-white/10 text-white hover:bg-white/20" : "bg-rose-500 text-white"
                  }`}
                  title={isMicOn ? "Mute Mic" : "Unmute Mic"}
                >
                  {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                </button>
                <button
                  onClick={toggleCamera}
                  className={`p-3 rounded-full transition-all ${
                    isCameraOn ? "bg-white/10 text-white hover:bg-white/20" : "bg-rose-500 text-white"
                  }`}
                  title={isCameraOn ? "Turn Camera Off" : "Turn Camera On"}
                >
                  {isCameraOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-400 text-center">
              Check your camera and microphone before entering the room.
            </p>
          </div>

          {/* Right: Meeting Info & Join Action (5 cols) */}
          <div className="md:col-span-5 space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                Encrypted Peer-to-Peer WebRTC
              </div>
              <h1 className="text-2xl font-extrabold text-white">
                {session?.skillTitle || "Live Peer Mentorship Meeting"}
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                Time-Bank Room: <strong className="text-amber-300">10 SkillCoins Escrow</strong> locked.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">Your Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full glass-input px-4 py-2.5 text-xs text-white"
                  placeholder="Enter your name"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10 flex items-center justify-between text-xs text-slate-300">
                <span className="truncate pr-2 font-mono text-[11px] text-slate-400">Room: {roomId}</span>
                <button
                  onClick={copyMeetingLink}
                  className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold shrink-0"
                >
                  {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedLink ? "Copied!" : "Copy Link"}
                </button>
              </div>
            </div>

            <button
              onClick={handleJoinMeeting}
              className="w-full btn-primary py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/30 text-base"
            >
              <Video className="h-4 w-4" />
              Join Meeting Now
            </button>
          </div>

        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: FULL-FEATURED LIVE MEETING ROOM (Google Meet / Zoom Experience)
  // ==========================================
  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] rounded-3xl overflow-hidden bg-[#090d16] border border-white/10 shadow-2xl relative select-none">
      
      {/* Floating Emojis Layer */}
      <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
        {floatingReactions.map((item) => (
          <div
            key={item.id}
            style={{ left: `${item.left}%` }}
            className="absolute bottom-20 text-4xl animate-float-up"
          >
            {item.emoji}
          </div>
        ))}
      </div>

      {/* Top Header Bar */}
      <header className="h-14 px-6 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <h2 className="text-xs sm:text-sm font-bold text-white truncate max-w-[280px] sm:max-w-md">
            {session?.skillTitle || "Live Peer Mentorship Room"}
          </h2>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 hidden sm:inline">
            10 SkillCoins Escrow
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Live Timer */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 border border-white/10 text-slate-200 text-xs font-mono font-semibold">
            <Clock className="h-3.5 w-3.5 text-indigo-400" />
            <span>{Math.floor(meetingDuration / 60).toString().padStart(2, "0")}:{(meetingDuration % 60).toString().padStart(2, "0")}</span>
          </div>

          {/* Copy Invite Link */}
          <button
            onClick={copyMeetingLink}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs transition-colors"
            title="Copy Meeting Invite Link"
          >
            {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
            <span className="hidden md:inline">{copiedLink ? "Copied" : "Share"}</span>
          </button>
        </div>
      </header>

      {/* Center Stage & Side Drawer Grid */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Main Video Tiles Canvas */}
        <div className="flex-1 p-4 flex flex-col justify-center items-center overflow-hidden bg-slate-950/40">
          
          <div className={`w-full h-full max-h-[820px] grid gap-4 items-center justify-center ${
            remotePeers.length === 0
              ? "grid-cols-1"
              : remotePeers.length === 1
              ? "grid-cols-1 md:grid-cols-2"
              : "grid-cols-2 md:grid-cols-3"
          }`}>

            {/* Local Video Tile (Self) */}
            <div className={`relative w-full h-full rounded-3xl overflow-hidden bg-slate-900 border transition-all duration-300 flex items-center justify-center ${
              isSpeaking ? "border-emerald-400 ring-2 ring-emerald-400/30" : "border-indigo-500/30"
            }`}>
              {isCameraOn ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white text-2xl font-bold shadow-xl">
                    {displayName.charAt(0)}
                  </div>
                  <p className="text-xs text-slate-400">{displayName} (Camera Off)</p>
                </div>
              )}

              {/* Bottom Tag */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-white bg-black/60 px-3 py-1 rounded-xl backdrop-blur-md flex items-center gap-1.5 border border-white/10">
                  {displayName} (You)
                  {!isMicOn && <MicOff className="h-3 w-3 text-rose-400 ml-1" />}
                </span>

                {isHandRaised && (
                  <span className="h-8 w-8 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-sm shadow-lg animate-bounce">
                    ✋
                  </span>
                )}
              </div>
            </div>

            {/* Remote Peers Video Tiles */}
            {remotePeers.map((peer) => (
              <div
                key={peer.id}
                className="relative w-full h-full rounded-3xl overflow-hidden bg-slate-900 border border-cyan-500/30 flex items-center justify-center shadow-lg"
              >
                {peer.stream ? (
                  <video
                    ref={(el) => {
                      if (el) {
                        remoteVideoRefs.current.set(peer.id, el);
                        el.srcObject = peer.stream;
                      }
                    }}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : peer.avatar ? (
                  <div className="w-full h-full relative group">
                    <img src={peer.avatar} alt={peer.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/20" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center text-white text-2xl font-bold shadow-xl">
                      {peer.name.charAt(0)}
                    </div>
                    <p className="text-xs text-slate-400">{peer.name}</p>
                  </div>
                )}

                {/* Bottom Tag */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <span className="text-xs font-semibold text-white bg-black/60 px-3 py-1 rounded-xl backdrop-blur-md flex items-center gap-1.5 border border-white/10">
                    {peer.name}
                    {!peer.isMicOn && <MicOff className="h-3 w-3 text-rose-400 ml-1" />}
                  </span>

                  {peer.isHandRaised && (
                    <span className="h-8 w-8 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-sm shadow-lg animate-bounce">
                      ✋
                    </span>
                  )}
                </div>
              </div>
            ))}

          </div>

        </div>

        {/* Side Drawer Component (Chat, Participants, Whiteboard, Code) */}
        {activeDrawer && (
          <aside className="w-96 border-l border-white/10 bg-slate-950/90 backdrop-blur-2xl flex flex-col justify-between p-4 z-20 animate-in slide-in-from-right duration-200">
            
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                {activeDrawer === "chat" && <><MessageSquare className="h-4 w-4 text-indigo-400" /> In-Call Messages</>}
                {activeDrawer === "participants" && <><Users className="h-4 w-4 text-cyan-400" /> People ({remotePeers.length + 1})</>}
                {activeDrawer === "whiteboard" && <><PenTool className="h-4 w-4 text-emerald-400" /> Collaborative Whiteboard</>}
                {activeDrawer === "code" && <><Code2 className="h-4 w-4 text-amber-400" /> Live JS Code Runner</>}
              </h3>
              <button
                onClick={() => setActiveDrawer(null)}
                className="text-slate-400 hover:text-white text-xs font-bold p-1 rounded-lg hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto py-3 space-y-3">
              
              {/* CHAT DRAWER */}
              {activeDrawer === "chat" && (
                <div className="space-y-3">
                  {chatMessages.map((msg) => {
                    const isMe = msg.sender === displayName;
                    return (
                      <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                        <span className="text-[10px] text-slate-500 mb-0.5">{msg.sender} • {msg.time}</span>
                        <div className={`p-3 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                          isMe ? "bg-indigo-600 text-white rounded-br-none" : "bg-slate-900 border border-white/10 text-slate-200 rounded-bl-none"
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* PARTICIPANTS DRAWER */}
              {activeDrawer === "participants" && (
                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs text-white">
                        {displayName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{displayName} (Host/You)</p>
                        <p className="text-[10px] text-slate-400">Active Peer</p>
                      </div>
                    </div>
                    {isMicOn ? <Volume2 className="h-4 w-4 text-emerald-400" /> : <MicOff className="h-4 w-4 text-rose-400" />}
                  </div>

                  {remotePeers.map((p) => (
                    <div key={p.id} className="p-3 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-cyan-600 flex items-center justify-center font-bold text-xs text-white">
                          {p.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">{p.name}</p>
                          <p className="text-[10px] text-slate-400">Connected</p>
                        </div>
                      </div>
                      {p.isMicOn ? <Volume2 className="h-4 w-4 text-emerald-400" /> : <MicOff className="h-4 w-4 text-rose-400" />}
                    </div>
                  ))}
                </div>
              )}

              {/* WHITEBOARD DRAWER */}
              {activeDrawer === "whiteboard" && (
                <div className="space-y-3 flex flex-col h-full">
                  <div className="flex flex-wrap items-center justify-between gap-1 p-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs">
                    <button onClick={() => setDrawTool("pen")} className={`p-1.5 rounded-lg ${drawTool === "pen" ? "bg-indigo-600 text-white" : "text-slate-400"}`} title="Pen"><PenTool className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setDrawTool("rect")} className={`p-1.5 rounded-lg ${drawTool === "rect" ? "bg-indigo-600 text-white" : "text-slate-400"}`} title="Rectangle"><Square className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setDrawTool("circle")} className={`p-1.5 rounded-lg ${drawTool === "circle" ? "bg-indigo-600 text-white" : "text-slate-400"}`} title="Circle"><CircleIcon className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setDrawTool("eraser")} className={`p-1.5 rounded-lg ${drawTool === "eraser" ? "bg-indigo-600 text-white" : "text-slate-400"}`} title="Eraser"><Eraser className="h-3.5 w-3.5" /></button>
                    <button onClick={downloadCanvas} className="p-1.5 rounded-lg text-slate-400 hover:text-white" title="Download PNG"><Download className="h-3.5 w-3.5" /></button>
                    <button onClick={clearCanvas} className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10" title="Clear"><RotateCcw className="h-3.5 w-3.5" /></button>
                  </div>

                  <div className="flex-1 rounded-2xl bg-[#090d16] border border-white/10 overflow-hidden relative cursor-crosshair h-64">
                    <canvas
                      ref={canvasRef}
                      width={350}
                      height={280}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      className="w-full h-full block"
                    />
                  </div>
                </div>
              )}

              {/* CODE DRAWER */}
              {activeDrawer === "code" && (
                <div className="space-y-3 flex flex-col h-full">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-400">playground.js</span>
                    <button
                      onClick={runCode}
                      className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                    >
                      <Play className="h-3 w-3 fill-white" /> Run
                    </button>
                  </div>
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full h-44 bg-[#0d1117] p-3 rounded-xl border border-white/10 font-mono text-[11px] text-slate-200 resize-none focus:outline-none"
                    spellCheck="false"
                  />
                  <pre className="p-3 rounded-xl bg-black border border-white/10 text-[10px] font-mono text-emerald-400 overflow-y-auto max-h-32 whitespace-pre-wrap">
                    {codeOutput || "Click Run to execute code..."}
                  </pre>
                </div>
              )}

            </div>

            {/* Chat Input Bar */}
            {activeDrawer === "chat" && (
              <form onSubmit={handleSendChat} className="flex gap-2 pt-2 border-t border-white/10">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Send a message to everyone..."
                  className="flex-1 glass-input px-3 py-2 text-xs text-white"
                />
                <button type="submit" className="btn-primary px-3 py-2 rounded-xl text-xs font-semibold">
                  Send
                </button>
              </form>
            )}

          </aside>
        )}

      </div>

      {/* Google Meet / Zoom Bottom Control Dock */}
      <footer className="h-20 px-6 bg-slate-950/90 border-t border-white/10 backdrop-blur-2xl flex items-center justify-between z-10 shrink-0">
        
        {/* Left: Meeting Info / Code */}
        <div className="hidden lg:flex items-center gap-3">
          <span className="text-xs font-mono font-bold text-slate-400">Room: {roomId}</span>
          <span className="text-slate-600">|</span>
          <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
            <CheckCircle2 className="h-3.5 w-3.5" /> Peer Connected
          </span>
        </div>

        {/* Center: Primary Media Controls Dock */}
        <div className="flex items-center gap-2 sm:gap-3 mx-auto">
          
          {/* Mic */}
          <button
            onClick={toggleMic}
            className={`p-3.5 rounded-2xl transition-all shadow-lg ${
              isMicOn ? "bg-slate-800 text-white hover:bg-slate-700" : "bg-rose-600 text-white shadow-rose-600/30"
            }`}
            title={isMicOn ? "Turn off microphone" : "Turn on microphone"}
          >
            {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </button>

          {/* Camera */}
          <button
            onClick={toggleCamera}
            className={`p-3.5 rounded-2xl transition-all shadow-lg ${
              isCameraOn ? "bg-slate-800 text-white hover:bg-slate-700" : "bg-rose-600 text-white shadow-rose-600/30"
            }`}
            title={isCameraOn ? "Turn off camera" : "Turn on camera"}
          >
            {isCameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </button>

          {/* Screen Share */}
          <button
            onClick={toggleScreenShare}
            className={`p-3.5 rounded-2xl transition-all shadow-lg ${
              isScreenSharing ? "bg-indigo-600 text-white shadow-indigo-600/30" : "bg-slate-800 text-white hover:bg-slate-700"
            }`}
            title={isScreenSharing ? "Stop presenting" : "Present screen now"}
          >
            {isScreenSharing ? <MonitorOff className="h-5 w-5" /> : <MonitorUp className="h-5 w-5" />}
          </button>

          {/* Raise Hand */}
          <button
            onClick={toggleHandRaise}
            className={`p-3.5 rounded-2xl transition-all shadow-lg ${
              isHandRaised ? "bg-amber-500 text-slate-950 shadow-amber-500/30 font-bold" : "bg-slate-800 text-white hover:bg-slate-700"
            }`}
            title="Raise / Lower Hand"
          >
            <Hand className="h-5 w-5" />
          </button>

          {/* Emoji Reactions Popup */}
          <div className="relative group">
            <button
              className="p-3.5 rounded-2xl bg-slate-800 text-white hover:bg-slate-700 transition-all"
              title="Send Reaction"
            >
              <Smile className="h-5 w-5" />
            </button>
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center gap-1.5 p-2 rounded-2xl glass-panel border border-white/10 shadow-2xl bg-slate-900 z-50">
              {["🔥", "👏", "💡", "❤️", "🚀", "🎉"].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => triggerReaction(emoji)}
                  className="p-1.5 text-xl hover:scale-125 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Red Leave / Complete Call Button */}
          <button
            onClick={handleLeaveCall}
            className="px-5 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all hover:scale-105"
            title="End Session & Release 10 SkillCoins"
          >
            <PhoneOff className="h-5 w-5" />
            <span className="hidden sm:inline">End Call & Release Coins</span>
          </button>

        </div>

        {/* Right: Feature Toggles (Chat, Participants, Whiteboard, Code) */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveDrawer(activeDrawer === "whiteboard" ? null : "whiteboard")}
            className={`p-3 rounded-2xl transition-all ${
              activeDrawer === "whiteboard" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300 hover:text-white"
            }`}
            title="Open Collaborative Whiteboard"
          >
            <PenTool className="h-4 w-4" />
          </button>

          <button
            onClick={() => setActiveDrawer(activeDrawer === "code" ? null : "code")}
            className={`p-3 rounded-2xl transition-all ${
              activeDrawer === "code" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300 hover:text-white"
            }`}
            title="Open Live JS Code Runner"
          >
            <Code2 className="h-4 w-4" />
          </button>

          <button
            onClick={() => setActiveDrawer(activeDrawer === "chat" ? null : "chat")}
            className={`p-3 rounded-2xl transition-all ${
              activeDrawer === "chat" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300 hover:text-white"
            }`}
            title="In-call Chat"
          >
            <MessageSquare className="h-4 w-4" />
          </button>

          <button
            onClick={() => setActiveDrawer(activeDrawer === "participants" ? null : "participants")}
            className={`p-3 rounded-2xl transition-all ${
              activeDrawer === "participants" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300 hover:text-white"
            }`}
            title="Participants List"
          >
            <Users className="h-4 w-4" />
          </button>
        </div>

      </footer>

    </div>
  );
}
