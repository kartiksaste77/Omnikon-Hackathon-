"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import apiClient from "@/lib/apiClient";
import getSocket from "@/lib/socket";
import { MessageSquare, Send, User, Wifi, WifiOff, Circle } from "lucide-react";

export default function ChatPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activePartner, setActivePartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgInput, setMsgInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [connected, setConnected] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);
  const typingTimer = useRef(null);
  const socketRef = useRef(null);

  // Fetch conversations list
  const loadConversations = useCallback(async () => {
    if (!user) return;
    try {
      const data = await apiClient.get("/api/messages/conversations");
      setConversations(data || []);
    } catch (e) {
      console.warn("Conversations load failed:", e);
    }
  }, [user]);

  // Fetch messages with active partner
  const loadMessages = useCallback(async (partnerId) => {
    if (!user || !partnerId) return;
    try {
      const data = await apiClient.get(`/api/messages?partnerId=${partnerId}`);
      setMessages(data || []);
    } catch (e) {
      console.warn("Messages load failed:", e);
    }
  }, [user]);

  // Initialize Socket.io
  useEffect(() => {
    if (!user) return;
    const token = apiClient.getToken();
    const socket = getSocket(token);
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    setConnected(socket.connected);

    // Receive real-time messages
    socket.on("message:receive", (msg) => {
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      // Update conversation list preview
      loadConversations();
    });

    // Typing indicators
    socket.on("typing:start", ({ senderId }) => {
      if (senderId === activePartner?.id) setPartnerTyping(true);
    });
    socket.on("typing:stop", ({ senderId }) => {
      if (senderId === activePartner?.id) setPartnerTyping(false);
    });

    loadConversations();
    return () => {
      socket.off("message:receive");
      socket.off("typing:start");
      socket.off("typing:stop");
    };
  }, [user, loadConversations]);

  // Re-bind typing events when partner changes
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    const handleTypingStart = ({ senderId }) => {
      if (senderId === activePartner?.id) setPartnerTyping(true);
    };
    const handleTypingStop = ({ senderId }) => {
      if (senderId === activePartner?.id) setPartnerTyping(false);
    };
    socket.on("typing:start", handleTypingStart);
    socket.on("typing:stop", handleTypingStop);
    return () => {
      socket.off("typing:start", handleTypingStart);
      socket.off("typing:stop", handleTypingStop);
    };
  }, [activePartner]);

  useEffect(() => {
    if (activePartner) loadMessages(activePartner.id);
    setPartnerTyping(false);
  }, [activePartner, loadMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, partnerTyping]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!msgInput.trim() || !activePartner || sending) return;
    const content = msgInput.trim();
    const tempId = `temp-${Date.now()}`;
    setSending(true);
    setMsgInput("");

    // Optimistic UI update
    const optimisticMsg = {
      id: tempId,
      senderId: user.id,
      receiverId: activePartner.id,
      content,
      createdAt: new Date().toISOString(),
      read: false,
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    // Stop typing indicator
    if (socketRef.current) {
      socketRef.current.emit("typing:stop", { receiverId: activePartner.id });
    }

    try {
      // Persist to DB
      const saved = await apiClient.post("/api/messages", {
        receiverId: activePartner.id,
        content,
      });

      // Replace optimistic msg with real one
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...saved, senderId: user.id } : m))
      );

      // Broadcast via socket
      if (socketRef.current) {
        socketRef.current.emit("message:send", {
          senderId: user.id,
          receiverId: activePartner.id,
          content,
          messageId: saved.id || tempId,
          timestamp: saved.createdAt,
        });
      }

      loadConversations();
    } catch (err) {
      console.error("Send failed:", err);
      // Revert optimistic update on failure
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setMsgInput(content);
    } finally {
      setSending(false);
    }
  };

  const handleInputChange = (e) => {
    setMsgInput(e.target.value);
    if (!socketRef.current || !activePartner) return;
    // Emit typing:start
    if (!isTyping) {
      setIsTyping(true);
      socketRef.current.emit("typing:start", { receiverId: activePartner.id });
    }
    // Reset debounce timer
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      setIsTyping(false);
      socketRef.current?.emit("typing:stop", { receiverId: activePartner.id });
    }, 1500);
  };

  const initials = (name) =>
    name?.split(" ").map((n) => n[0]).join("").toUpperCase() || "?";

  const formatTime = (ts) =>
    new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const formatDate = (ts) => {
    const d = new Date(ts);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return "Today";
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  if (!user) return null;

  return (
    <div className="flex h-[calc(100vh-64px)] -m-4 sm:-m-6 lg:-m-8 animate-fade-in">
      {/* Conversation List Sidebar */}
      <div className="w-72 lg:w-80 border-r border-white/10 bg-[#0A0A10] flex flex-col shrink-0">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-red-400" /> Messages
          </h2>
          <div className="flex items-center gap-1.5 text-[10px] font-mono">
            {connected ? (
              <><Circle className="h-2 w-2 fill-emerald-400 text-emerald-400" /><span className="text-emerald-400">Live</span></>
            ) : (
              <><WifiOff className="h-3 w-3 text-slate-500" /><span className="text-slate-500">Offline</span></>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 && (
            <div className="p-6 text-center">
              <MessageSquare className="h-8 w-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500">No conversations yet.<br />Connect with a match to start chatting!</p>
            </div>
          )}
          {conversations.map((conv) => (
            <button
              key={conv.partnerId}
              onClick={() => setActivePartner({ id: conv.partnerId, name: conv.partnerName, location: conv.partnerLocation })}
              className={`w-full flex items-center gap-3 p-3 text-left transition-all border-b border-white/5 ${activePartner?.id === conv.partnerId ? "bg-red-600/10 border-l-2 border-l-red-500" : "hover:bg-white/5"}`}
            >
              <div className="relative shrink-0">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-red-600 to-amber-500 flex items-center justify-center text-white text-xs font-bold">
                  {initials(conv.partnerName)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white truncate">{conv.partnerName}</span>
                  <div className="flex items-center gap-1.5">
                    {conv.unreadCount > 0 && (
                      <span className="h-5 min-w-5 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {conv.unreadCount}
                      </span>
                    )}
                    {conv.lastMessageAt && (
                      <span className="text-[10px] text-slate-600 font-mono">{formatDate(conv.lastMessageAt)}</span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-500 truncate">{conv.lastMessage || "Start a conversation"}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col bg-[#09090D]">
        {!activePartner ? (
          <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 text-slate-700" />
              <p className="text-slate-400 font-medium">Select a conversation</p>
              <p className="text-xs text-slate-600 mt-1">Messages are delivered in real-time ⚡</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-[#0A0A10]">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-red-600 to-amber-500 flex items-center justify-center text-white text-xs font-bold">
                {initials(activePartner.name)}
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-white">{activePartner.name}</div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {partnerTyping ? (
                    <span className="text-emerald-400 animate-pulse">typing...</span>
                  ) : (
                    activePartner.location || "Online"
                  )}
                </div>
              </div>
              {connected ? (
                <Wifi className="h-4 w-4 text-emerald-400 opacity-60" />
              ) : (
                <WifiOff className="h-4 w-4 text-slate-600" />
              )}
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.length === 0 && (
                <div className="text-center text-xs text-slate-600 py-6">
                  No messages yet. Say hello! 👋
                </div>
              )}
              {messages.map((msg, i) => {
                const isMine = msg.senderId === user.id;
                const showDate = i === 0 || formatDate(messages[i - 1]?.createdAt) !== formatDate(msg.createdAt);
                return (
                  <div key={msg.id}>
                    {showDate && (
                      <div className="text-center my-3">
                        <span className="text-[10px] text-slate-600 bg-white/5 px-3 py-1 rounded-full font-mono">
                          {formatDate(msg.createdAt)}
                        </span>
                      </div>
                    )}
                    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                          isMine
                            ? "bg-red-600 text-white rounded-br-sm"
                            : "bg-white/10 text-slate-200 rounded-bl-sm"
                        } ${msg.id?.startsWith("temp-") ? "opacity-70" : ""}`}
                      >
                        <p className="leading-relaxed">{msg.content}</p>
                        <div className={`text-[10px] mt-1 flex items-center gap-1 ${isMine ? "text-red-200 justify-end" : "text-slate-500"}`}>
                          {formatTime(msg.createdAt)}
                          {isMine && msg.read && <span className="text-emerald-300">✓✓</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {/* Typing indicator */}
              {partnerTyping && (
                <div className="flex justify-start animate-fade-in">
                  <div className="bg-white/10 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-3 border-t border-white/10 bg-[#0A0A10] flex gap-2">
              <input
                value={msgInput}
                onChange={handleInputChange}
                placeholder="Type a message..."
                className="input-base flex-1 text-sm"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={sending || !msgInput.trim()}
                className="btn-primary px-4 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
