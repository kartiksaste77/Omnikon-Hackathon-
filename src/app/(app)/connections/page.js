"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import apiClient from "@/lib/apiClient";
import { Users, Check, X, UserPlus, MessageSquare, Clock, UserCheck, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function ConnectionsPage() {
  const { user } = useAuth();
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});

  const loadConnections = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await apiClient.get("/api/connections");
      setConnections(data || []);
    } catch (e) {
      console.warn("Connections load failed:", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  const handleUpdateStatus = async (connId, status) => {
    setActionLoading((prev) => ({ ...prev, [connId]: true }));
    try {
      // Optimistically update UI
      setConnections((prev) =>
        prev.map((c) => (c.id === connId ? { ...c, status } : c))
      );
      await apiClient.patch(`/api/connections/${connId}`, { status });
      await loadConnections();
    } catch (e) {
      alert(e.message || `Failed to ${status} connection`);
      await loadConnections();
    } finally {
      setActionLoading((prev) => ({ ...prev, [connId]: false }));
    }
  };

  const getInitials = (name) =>
    name?.split(" ").map((n) => n[0]).join("").toUpperCase() || "?";

  if (!user) return null;

  // Categorize connections
  const pendingReceived = connections.filter(
    (c) => c.status === "pending" && c.receiverId === user.id
  );
  const pendingSent = connections.filter(
    (c) => c.status === "pending" && c.senderId === user.id
  );
  const accepted = connections.filter((c) => c.status === "accepted");

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white font-[Outfit] flex items-center gap-2">
          <Users className="h-6 w-6 text-red-400" /> Connections
        </h1>
        <button
          onClick={loadConnections}
          disabled={loading}
          className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {loading && connections.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-20 rounded-xl" />
          ))}
        </div>
      ) : null}

      {/* Pending Received */}
      {pendingReceived.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-amber-400 uppercase font-mono flex items-center gap-1.5">
            <UserPlus className="h-4 w-4" /> Pending Requests ({pendingReceived.length})
          </h2>
          {pendingReceived.map((c) => {
            const sender = c.sender;
            return (
              <div
                key={c.id}
                className="glass rounded-xl p-4 flex items-center justify-between flex-wrap gap-3 border border-amber-500/20 bg-amber-500/5"
              >
                <div className="flex items-center gap-3">
                  <Link href={`/profile/${sender?.id}`}>
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-500 to-red-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white/10 hover:ring-amber-400 transition-all">
                      {getInitials(sender?.name)}
                    </div>
                  </Link>
                  <div>
                    <Link
                      href={`/profile/${sender?.id}`}
                      className="text-sm font-bold text-white hover:text-amber-300 transition-colors"
                    >
                      {sender?.name}
                    </Link>
                    <div className="text-xs text-slate-400 line-clamp-1">{sender?.bio}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateStatus(c.id, "accepted")}
                    disabled={actionLoading[c.id]}
                    className="btn-primary text-xs px-3.5 py-1.5 disabled:opacity-50"
                  >
                    <Check className="h-3.5 w-3.5" /> Accept
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(c.id, "rejected")}
                    disabled={actionLoading[c.id]}
                    className="btn-secondary text-xs px-3.5 py-1.5 disabled:opacity-50"
                  >
                    <X className="h-3.5 w-3.5" /> Decline
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Active Connections */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-emerald-400 uppercase font-mono flex items-center gap-1.5">
          <UserCheck className="h-4 w-4" /> Active Connections ({accepted.length})
        </h2>
        {accepted.length === 0 && !loading && (
          <div className="glass rounded-xl p-8 text-center space-y-2">
            <Users className="h-10 w-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No active connections yet.</p>
            <Link href="/matches" className="btn-primary text-xs inline-flex items-center gap-1 mt-2">
              Explore Matches & Connect
            </Link>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {accepted.map((c) => {
            const partner = c.senderId === user.id ? c.receiver : c.sender;
            return (
              <div
                key={c.id}
                className="glass glass-hover rounded-xl p-4 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Link href={`/profile/${partner?.id}`} className="shrink-0">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-600 to-teal-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white/10 hover:ring-emerald-400 transition-all">
                      {getInitials(partner?.name)}
                    </div>
                  </Link>
                  <div className="min-w-0">
                    <Link
                      href={`/profile/${partner?.id}`}
                      className="text-sm font-bold text-white truncate block hover:text-emerald-300 transition-colors"
                    >
                      {partner?.name}
                    </Link>
                    <div className="text-xs text-slate-400 truncate">
                      {partner?.bio || "SkillSwap Partner"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Link href="/chat" className="btn-secondary text-xs px-3 py-1.5">
                    <MessageSquare className="h-3.5 w-3.5" /> Chat
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pending Sent */}
      {pendingSent.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-400 uppercase font-mono flex items-center gap-1.5">
            <Clock className="h-4 w-4" /> Sent Requests ({pendingSent.length})
          </h2>
          <div className="space-y-2">
            {pendingSent.map((c) => {
              const receiver = c.receiver;
              return (
                <div
                  key={c.id}
                  className="glass rounded-xl p-3.5 flex items-center justify-between opacity-80"
                >
                  <div className="flex items-center gap-3">
                    <Link href={`/profile/${receiver?.id}`}>
                      <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 text-xs font-bold ring-1 ring-white/10">
                        {getInitials(receiver?.name)}
                      </div>
                    </Link>
                    <div>
                      <Link
                        href={`/profile/${receiver?.id}`}
                        className="text-sm font-medium text-slate-200 hover:text-white"
                      >
                        {receiver?.name}
                      </Link>
                      <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                        <Clock className="h-3 w-3 text-amber-400" /> Awaiting response
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] bg-white/5 border border-white/10 text-slate-400 px-2.5 py-1 rounded-lg font-mono">
                    Pending
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
