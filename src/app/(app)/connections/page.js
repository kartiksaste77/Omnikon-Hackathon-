"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { 
  Users, 
  UserPlus, 
  Search, 
  MessageSquare, 
  Video, 
  Check, 
  X, 
  Sparkles, 
  Send, 
  ShieldCheck, 
  Clock, 
  Star,
  Trash2,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import confetti from "canvas-confetti";

export default function ConnectionsPage() {
  const { user, token, modifyXp } = useAuth();
  const [activeTab, setActiveTab] = useState("my-connections"); // 'my-connections' | 'pending' | 'discover'
  const [connections, setConnections] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [discoverPeers, setDiscoverPeers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Connect Modal State
  const [connectModalPeer, setConnectModalPeer] = useState(null);
  const [connectNote, setConnectNote] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionNotice, setActionNotice] = useState("");

  const fetchConnectionsData = async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch("/api/connections", { headers });
      if (res.ok) {
        const data = await res.json();
        setConnections(data.connections || []);
        setIncomingRequests(data.incomingRequests || []);
        setSentRequests(data.sentRequests || []);
        setDiscoverPeers(data.discoverPeers || []);
      }
    } catch (err) {
      console.error("Failed to load connections:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnectionsData();
  }, [token]);

  // Send Connection Request
  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!connectModalPeer) return;

    try {
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
      const res = await fetch("/api/connections", {
        method: "POST",
        headers,
        body: JSON.stringify({
          toUserId: connectModalPeer.id,
          note: connectNote
        })
      });

      const data = await res.json();
      if (data.success) {
        setActionNotice(`Connection request sent to ${connectModalPeer.name}!`);
        setConnectModalPeer(null);
        setConnectNote("");
        fetchConnectionsData();

        try {
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        } catch (e) {}

        setTimeout(() => setActionNotice(""), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Accept Connection Request
  const handleAcceptRequest = async (requestId, senderName) => {
    try {
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
      const res = await fetch("/api/connections", {
        method: "PUT",
        headers,
        body: JSON.stringify({ requestId, action: "ACCEPT" })
      });

      if (res.ok) {
        modifyXp(15);
        setActionNotice(`Connected with ${senderName}! +15 XP Awarded.`);
        fetchConnectionsData();

        try {
          confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
        } catch (e) {}

        setTimeout(() => setActionNotice(""), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Reject Connection Request
  const handleRejectRequest = async (requestId) => {
    try {
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
      await fetch("/api/connections", {
        method: "PUT",
        headers,
        body: JSON.stringify({ requestId, action: "REJECT" })
      });
      fetchConnectionsData();
    } catch (err) {
      console.error(err);
    }
  };

  // Remove Connection
  const handleRemoveConnection = async (targetUserId, targetName) => {
    if (!confirm(`Are you sure you want to disconnect from ${targetName}?`)) return;
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await fetch(`/api/connections?targetUserId=${targetUserId}`, {
        method: "DELETE",
        headers
      });
      fetchConnectionsData();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredDiscover = discoverPeers.filter((peer) => {
    const q = searchQuery.toLowerCase();
    return (
      peer.name.toLowerCase().includes(q) ||
      peer.role.toLowerCase().includes(q) ||
      peer.skillsOffered.some((s) => s.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-8 animate-in fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-2">
            <Users className="h-3.5 w-3.5 text-indigo-400" />
            Peer Network & Student Connections
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">My Campus Connections</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Connect with peer mentors to unlock direct live chat, video meetings, and skill exchange.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900 border border-white/10">
          <button
            onClick={() => setActiveTab("my-connections")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "my-connections"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            My Connections ({connections.length})
          </button>
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === "pending"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Pending Requests
            {incomingRequests.length > 0 && (
              <span className="h-5 w-5 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
                {incomingRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("discover")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "discover"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Discover & Add
          </button>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionNotice && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* TAB 1: MY CONNECTIONS */}
      {activeTab === "my-connections" && (
        <div className="space-y-6">
          {connections.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {connections.map((peer) => (
                <div
                  key={peer.id}
                  className="glass-card p-6 flex flex-col justify-between space-y-4 border border-white/10 hover:border-indigo-500/30 group transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={peer.avatar}
                            alt={peer.name}
                            className="h-12 w-12 rounded-2xl object-cover ring-2 ring-indigo-500/30"
                          />
                          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-[#090d16]" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                            {peer.name}
                            <span className="text-[11px] text-amber-400 font-semibold">★ {peer.rating}</span>
                          </h3>
                          <p className="text-xs text-slate-400">{peer.role}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveConnection(peer.id, peer.name)}
                        className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                        title="Remove Connection"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      "{peer.bio}"
                    </p>

                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Teaches:</span>
                      <div className="flex flex-wrap gap-1">
                        {peer.skillsOffered.slice(0, 3).map((s) => (
                          <span key={s} className="px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-medium">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-white/10 grid grid-cols-2 gap-2">
                    <Link
                      href={`/chat?partnerId=${peer.id}`}
                      className="btn-primary py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Live Chat
                    </Link>
                    <Link
                      href={`/session/sess_101`}
                      className="btn-secondary py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-white/10"
                    >
                      <Video className="h-3.5 w-3.5 text-cyan-400" />
                      Video Call
                    </Link>
                  </div>

                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 glass-card p-8 space-y-4">
              <div className="h-16 w-16 rounded-2xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center mx-auto">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="text-base font-bold text-white">No connections yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Connect with campus peers to unlock 1-on-1 live chat and WebRTC video meeting sessions!
              </p>
              <button
                onClick={() => setActiveTab("discover")}
                className="btn-primary px-5 py-2.5 rounded-xl text-xs font-bold"
              >
                Discover Campus Mentors
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PENDING REQUESTS */}
      {activeTab === "pending" && (
        <div className="space-y-6">
          {incomingRequests.length > 0 ? (
            <div className="space-y-4">
              {incomingRequests.map((req) => (
                <div
                  key={req.id}
                  className="glass-card p-5 border border-indigo-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={req.fromUserAvatar}
                      alt={req.fromUserName}
                      className="h-12 w-12 rounded-2xl object-cover ring-2 ring-indigo-500/40"
                    />
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        {req.fromUserName}
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300">
                          {req.fromUserRole}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-300 bg-slate-900/80 p-2.5 rounded-xl border border-white/5">
                        💬 "{req.note}"
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Sent {new Date(req.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-auto">
                    <button
                      onClick={() => handleRejectRequest(req.id)}
                      className="px-4 py-2 rounded-xl bg-white/5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-300 border border-white/10 text-xs font-semibold"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleAcceptRequest(req.id, req.fromUserName)}
                      className="btn-primary px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Accept (+15 XP)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 glass-card p-8 space-y-2">
              <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
              <h3 className="text-sm font-bold text-white">All caught up!</h3>
              <p className="text-xs text-slate-400">You have no pending connection requests at this time.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DISCOVER & ADD CONNECTIONS */}
      {activeTab === "discover" && (
        <div className="space-y-6">
          <div className="relative">
            <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search students by name, major, or skill (e.g. Python, Figma, React, Mobile)..."
              className="w-full glass-input pl-10 pr-4 py-2.5 text-xs text-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDiscover.map((peer) => (
              <div
                key={peer.id}
                className="glass-card p-6 flex flex-col justify-between space-y-4 border border-white/10 hover:border-indigo-500/30 group transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={peer.avatar}
                      alt={peer.name}
                      className="h-12 w-12 rounded-2xl object-cover ring-2 ring-white/10 group-hover:scale-105 transition-transform"
                    />
                    <div>
                      <h3 className="text-sm font-bold text-white">{peer.name}</h3>
                      <p className="text-xs text-slate-400">{peer.role}</p>
                      <p className="text-[10px] text-slate-500">{peer.department}</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    "{peer.bio}"
                  </p>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Teaches:</span>
                    <div className="flex flex-wrap gap-1">
                      {peer.skillsOffered.map((s) => (
                        <span key={s} className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 text-[10px]">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setConnectModalPeer(peer);
                    setConnectNote(`Hi ${peer.name}! I would love to connect on SkillSwap and collaborate on skills!`);
                  }}
                  className="w-full btn-primary py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Connect
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Personalized Connect Note Modal */}
      {connectModalPeer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl glass-panel p-6 shadow-2xl border border-white/10 space-y-4">
            <button
              onClick={() => setConnectModalPeer(null)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <img src={connectModalPeer.avatar} alt={connectModalPeer.name} className="h-10 w-10 rounded-full object-cover" />
              <div>
                <h3 className="text-sm font-bold text-white">Connect with {connectModalPeer.name}</h3>
                <p className="text-xs text-slate-400">{connectModalPeer.role}</p>
              </div>
            </div>

            <form onSubmit={handleSendRequest} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">Add a personalized message:</label>
                <textarea
                  required
                  value={connectNote}
                  onChange={(e) => setConnectNote(e.target.value)}
                  className="w-full glass-input p-3 text-xs text-white h-24 resize-none"
                  placeholder="Introduce yourself and share what skills you'd love to exchange..."
                />
              </div>

              <button
                type="submit"
                className="w-full btn-primary py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Send className="h-3.5 w-3.5" />
                Send Connection Request
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
