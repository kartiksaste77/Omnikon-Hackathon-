"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { 
  MessageSquare, 
  Send, 
  Video, 
  Coins, 
  Search, 
  Users, 
  UserPlus, 
  Clock, 
  Sparkles
} from "lucide-react";

function ChatComponent() {
  const { user, token } = useAuth();
  const searchParams = useSearchParams();
  const initialPartnerId = searchParams.get("partnerId");

  const [connectedPartners, setConnectedPartners] = useState([]);
  const [activePartner, setActivePartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const messagesEndRef = useRef(null);
  const chatBroadcast = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // BroadcastChannel for 0ms cross-tab live messaging
  useEffect(() => {
    try {
      chatBroadcast.current = new BroadcastChannel("skillswap-chat-channel");
      chatBroadcast.current.onmessage = (event) => {
        const incomingMsg = event.data;
        if (
          activePartner &&
          ((incomingMsg.senderId === activePartner.id && incomingMsg.receiverId === user?.id) ||
           (incomingMsg.senderId === user?.id && incomingMsg.receiverId === activePartner.id))
        ) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === incomingMsg.id)) return prev;
            return [...prev, incomingMsg];
          });
        }
      };
    } catch (e) {}

    return () => {
      if (chatBroadcast.current) chatBroadcast.current.close();
    };
  }, [activePartner, user]);

  // Fetch Connected Partners
  const fetchChatPartners = async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch("/api/connections", { headers });
      if (res.ok) {
        const data = await res.json();
        const connections = data.connections || [];
        setConnectedPartners(connections);

        if (connections.length > 0) {
          if (initialPartnerId) {
            const found = connections.find((p) => p.id === initialPartnerId);
            setActivePartner(found || connections[0]);
          } else if (!activePartner) {
            setActivePartner(connections[0]);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load chat partners:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChatPartners();
  }, [token, initialPartnerId]);

  // Fetch Active Conversation
  const fetchConversation = async () => {
    if (!activePartner) return;
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`/api/messages?partnerId=${activePartner.id}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    }
  };

  useEffect(() => {
    fetchConversation();
    const interval = setInterval(fetchConversation, 1500);
    return () => clearInterval(interval);
  }, [activePartner, token]);

  // Send Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputVal.trim() || !activePartner) return;

    const messageText = inputVal;
    setInputVal("");

    const tempMessage = {
      id: `msg_temp_${Date.now()}`,
      senderId: user?.id || "user_1",
      receiverId: activePartner.id,
      content: messageText,
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, tempMessage]);

    if (chatBroadcast.current) {
      try {
        chatBroadcast.current.postMessage(tempMessage);
      } catch (e) {}
    }

    try {
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
      await fetch("/api/messages", {
        method: "POST",
        headers,
        body: JSON.stringify({
          receiverId: activePartner.id,
          content: messageText
        })
      });
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const filteredPartners = connectedPartners.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-7rem)] rounded-3xl glass-panel border border-white/10 overflow-hidden grid grid-cols-1 md:grid-cols-12 shadow-2xl animate-in fade-in">
      
      {/* Left Column: Connected Peers (4 cols) */}
      <div className="md:col-span-4 border-r border-white/10 flex flex-col bg-slate-950/40">
        
        {/* Top Search & Connections Count */}
        <div className="p-4 border-b border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-indigo-400" />
              Connected Messages
            </h2>
            <Link
              href="/connections"
              className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <UserPlus className="h-3 w-3" />
              Manage ({connectedPartners.length})
            </Link>
          </div>

          <div className="relative">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search connected peers..."
              className="w-full glass-input pl-9 pr-3 py-1.5 text-xs text-white"
            />
          </div>
        </div>

        {/* Partners List */}
        <div className="flex-1 overflow-y-auto divide-y divide-white/5">
          {filteredPartners.length > 0 ? (
            filteredPartners.map((peer) => {
              const isSelected = activePartner?.id === peer.id;
              return (
                <button
                  key={peer.id}
                  onClick={() => setActivePartner(peer)}
                  className={`w-full p-4 flex items-center gap-3 text-left transition-all ${
                    isSelected
                      ? "bg-indigo-600/20 border-l-4 border-indigo-500 text-white"
                      : "hover:bg-white/5 text-slate-300"
                  }`}
                >
                  <div className="relative">
                    <img
                      src={peer.avatar}
                      alt={peer.name}
                      className="h-10 w-10 rounded-2xl object-cover ring-2 ring-indigo-500/30"
                    />
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#090d16]" />
                  </div>

                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-white truncate">{peer.name}</p>
                      <span className="text-[10px] text-slate-500">Active</span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{peer.role}</p>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="p-6 text-center space-y-3">
              <Users className="h-8 w-8 text-slate-500 mx-auto" />
              <p className="text-xs text-slate-400">No connected peers found.</p>
              <Link
                href="/connections"
                className="btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Add Connections
              </Link>
            </div>
          )}
        </div>

      </div>

      {/* Right Column: Live Chat Thread (8 cols) */}
      <div className="md:col-span-8 flex flex-col justify-between bg-slate-950/20">
        
        {activePartner ? (
          <>
            {/* Chat Top Bar */}
            <div className="p-4 border-b border-white/10 bg-slate-950/60 backdrop-blur-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={activePartner.avatar}
                    alt={activePartner.name}
                    className="h-10 w-10 rounded-2xl object-cover ring-2 ring-indigo-500/40"
                  />
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#090d16]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    {activePartner.name}
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      Connected Peer
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">{activePartner.role} • {activePartner.department}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/session/sess_101"
                  className="btn-primary px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
                  title="Start Instant Google Meet / Zoom Video Call"
                >
                  <Video className="h-3.5 w-3.5" />
                  Live Meeting
                </Link>

                <Link
                  href="/skills"
                  className="btn-secondary px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 text-amber-300 border-amber-500/30 hover:bg-amber-500/10"
                  title="Book 1-Hour Skill Session"
                >
                  <Coins className="h-3.5 w-3.5 text-amber-400" />
                  Book (10 Coins)
                </Link>
              </div>
            </div>

            {/* Messages Thread */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="text-center py-2">
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                  End-to-End Encrypted Peer Chat
                </span>
              </div>

              {messages.map((m) => {
                const isMe = m.senderId === (user?.id || "user_1");
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                  >
                    <span className="text-[10px] text-slate-500 mb-0.5">
                      {isMe ? "You" : activePartner.name} • {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-xs max-w-[75%] leading-relaxed ${
                        isMe
                          ? "bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-600/30"
                          : "bg-slate-900 border border-white/10 text-slate-200 rounded-bl-none"
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Emoji Reaction Row + Input Form */}
            <div className="p-4 border-t border-white/10 bg-slate-950/60 backdrop-blur-xl space-y-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500 font-medium mr-1">Quick reply:</span>
                {["🔥", "👏", "💡", "❤️", "🚀", "Ready for session!"].map((quick, i) => (
                  <button
                    key={i}
                    onClick={() => setInputVal((prev) => prev ? `${prev} ${quick}` : quick)}
                    className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs transition-colors"
                  >
                    {quick}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder={`Message ${activePartner.name}...`}
                  className="flex-1 glass-input px-4 py-2.5 text-xs text-white"
                />
                <button
                  type="submit"
                  className="btn-primary px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
                >
                  <Send className="h-3.5 w-3.5" />
                  Send
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="h-16 w-16 rounded-2xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
              <MessageSquare className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-white">Select a connection to chat</h3>
            <p className="text-xs text-slate-400 max-w-sm">
              Connect with campus mentors to chat live, coordinate study schedules, and launch Google Meet / Zoom style video rooms.
            </p>
            <Link
              href="/connections"
              className="btn-primary px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <UserPlus className="h-4 w-4" />
              Manage & Add Connections
            </Link>
          </div>
        )}

      </div>

    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400 text-xs">Loading Live Messages...</div>}>
      <ChatComponent />
    </Suspense>
  );
}
