"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import db from "@/lib/mockDatabase";
import { Users, Check, X, ArrowRight, UserPlus, MessageSquare } from "lucide-react";
import Link from "next/link";

export default function ConnectionsPage() {
  const { user } = useAuth();
  const [, refresh] = useState(0);

  if (!user) return null;

  const pendingReceived = db.getPendingReceived(user.id);
  const pendingSent = db.getPendingSent(user.id);
  const accepted = db.getAcceptedConnections(user.id);

  const handleAccept = (connId) => { db.acceptConnection(connId); refresh(n => n + 1); };
  const handleReject = (connId) => { db.rejectConnection(connId); refresh(n => n + 1); };

  const getInitials = (name) => name?.split(" ").map(n => n[0]).join("").toUpperCase() || "?";

  return (
    <div className="space-y-6 max-w-3xl animate-fade-in">
      <h1 className="text-2xl font-bold text-white font-[Outfit] flex items-center gap-2"><Users className="h-6 w-6 text-red-400" /> Connections</h1>

      {/* Pending Received */}
      {pendingReceived.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-amber-400 uppercase font-mono"><UserPlus className="h-4 w-4 inline mr-1" /> Pending Requests ({pendingReceived.length})</h2>
          {pendingReceived.map(c => {
            const sender = db.getUser(c.senderId);
            return (
              <div key={c.id} className="glass rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-red-600 to-amber-500 flex items-center justify-center text-white text-xs font-bold">{getInitials(sender?.name)}</div>
                  <div>
                    <div className="text-sm font-bold text-white">{sender?.name}</div>
                    <div className="text-xs text-slate-400">{sender?.bio?.slice(0, 60)}...</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleAccept(c.id)} className="btn-primary text-xs px-3 py-1.5"><Check className="h-3.5 w-3.5" /> Accept</button>
                  <button onClick={() => handleReject(c.id)} className="btn-secondary text-xs px-3 py-1.5"><X className="h-3.5 w-3.5" /> Decline</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Active Connections */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-emerald-400 uppercase font-mono"><Users className="h-4 w-4 inline mr-1" /> Active Connections ({accepted.length})</h2>
        {accepted.length === 0 && <p className="text-sm text-slate-500 glass rounded-xl p-6 text-center">No connections yet. <Link href="/matches" className="text-red-400">Find matches!</Link></p>}
        {accepted.map(c => {
          const partnerId = c.senderId === user.id ? c.receiverId : c.senderId;
          const partner = db.getUser(partnerId);
          return (
            <div key={c.id} className="glass glass-hover rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-600 to-teal-500 flex items-center justify-center text-white text-xs font-bold">{getInitials(partner?.name)}</div>
                <div>
                  <div className="text-sm font-bold text-white">{partner?.name}</div>
                  <div className="text-xs text-slate-400">{partner?.location}</div>
                </div>
              </div>
              <Link href="/chat" className="btn-secondary text-xs px-3 py-1.5"><MessageSquare className="h-3.5 w-3.5" /> Chat</Link>
            </div>
          );
        })}
      </div>

      {/* Pending Sent */}
      {pendingSent.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-400 uppercase font-mono">Sent Requests ({pendingSent.length})</h2>
          {pendingSent.map(c => {
            const receiver = db.getUser(c.receiverId);
            return (
              <div key={c.id} className="glass rounded-xl p-4 flex items-center justify-between opacity-60">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 text-xs font-bold">{getInitials(receiver?.name)}</div>
                  <div>
                    <div className="text-sm font-medium text-slate-300">{receiver?.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">Pending...</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
