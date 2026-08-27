"use client";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import db from "@/lib/mockDatabase";
import { MessageSquare, Send, User } from "lucide-react";

const AUTO_REPLIES = [
  "That sounds great! When are you available this week?",
  "I'd love to learn that! Let's schedule a session 🎉",
  "Sure, I can teach you the basics. How about Saturday?",
  "Thanks for reaching out! I'll check my schedule and get back to you.",
  "Awesome, looking forward to our skill swap session!",
];

export default function ChatPage() {
  const { user } = useAuth();
  const [activePartner, setActivePartner] = useState(null);
  const [msgInput, setMsgInput] = useState("");
  const [, refresh] = useState(0);
  const scrollRef = useRef(null);

  if (!user) return null;

  const partners = db.getConversationPartners(user.id);
  const messages = activePartner ? db.getConversation(user.id, activePartner.user.id) : [];

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length, activePartner]);

  useEffect(() => {
    if (activePartner) db.markMessagesRead(user.id, activePartner.user.id);
  }, [activePartner, user.id]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!msgInput.trim() || !activePartner) return;
    db.sendMessage(user.id, activePartner.user.id, msgInput.trim());
    setMsgInput("");
    refresh(n => n + 1);
    // Simulate auto-reply
    setTimeout(() => {
      const reply = AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)];
      db.sendMessage(activePartner.user.id, user.id, reply);
      refresh(n => n + 1);
    }, 1200 + Math.random() * 1500);
  };

  const initials = (name) => name?.split(" ").map(n => n[0]).join("").toUpperCase() || "?";

  return (
    <div className="flex h-[calc(100vh-64px)] -m-4 sm:-m-6 lg:-m-8 animate-fade-in">
      {/* Conversation List Sidebar */}
      <div className="w-72 lg:w-80 border-r border-white/10 bg-[#0A0A10] flex flex-col shrink-0">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-base font-bold text-white flex items-center gap-2"><MessageSquare className="h-4 w-4 text-red-400" /> Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {partners.length === 0 && (
            <p className="text-xs text-slate-500 text-center py-8 px-4">No conversations yet. Connect with a match to start chatting!</p>
          )}
          {partners.map((p) => (
            <button
              key={p.user.id}
              onClick={() => setActivePartner(p)}
              className={`w-full flex items-center gap-3 p-3 text-left transition-all border-b border-white/5 ${activePartner?.user.id === p.user.id ? "bg-red-600/10 border-l-2 border-l-red-500" : "hover:bg-white/5"}`}
            >
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-red-600 to-amber-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {initials(p.user.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white truncate">{p.user.name}</span>
                  {p.unreadCount > 0 && (
                    <span className="h-5 min-w-5 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{p.unreadCount}</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 truncate">{p.lastMessage?.content || "Start a conversation"}</p>
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
              <MessageSquare className="h-10 w-10 mx-auto mb-3 text-slate-600" />
              <p>Select a conversation to start chatting</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-[#0A0A10]">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-red-600 to-amber-500 flex items-center justify-center text-white text-xs font-bold">
                {initials(activePartner.user.name)}
              </div>
              <div>
                <div className="text-sm font-bold text-white">{activePartner.user.name}</div>
                <div className="text-[10px] text-slate-500 font-mono">{activePartner.user.location || "Online"}</div>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.senderId === user.id ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${msg.senderId === user.id ? "bg-red-600 text-white rounded-br-sm" : "bg-white/10 text-slate-200 rounded-bl-sm"}`}>
                    <p>{msg.content}</p>
                    <div className={`text-[10px] mt-1 ${msg.senderId === user.id ? "text-red-200" : "text-slate-500"}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-3 border-t border-white/10 bg-[#0A0A10] flex gap-2">
              <input value={msgInput} onChange={e => setMsgInput(e.target.value)} placeholder="Type a message..." className="input-base flex-1 text-sm" />
              <button type="submit" className="btn-primary px-4 py-2.5"><Send className="h-4 w-4" /></button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
