"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import apiClient from "@/lib/apiClient";
import Link from "next/link";
import {
  Sparkles, Search, Star, BookOpen, GraduationCap, Users, ArrowRight,
  Brain, ChevronDown, ChevronUp, CheckCircle2, Clock, Zap, UserCheck, UserPlus, RefreshCw
} from "lucide-react";

const CATEGORIES = ["All", "Programming", "Design", "Business", "Languages", "Music", "Data Science", "DevOps"];

function MatchCard({ match, currentUserId, onConnect }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [status, setStatus] = useState(
    match.connectionStatus || (match.isConnected ? "accepted" : match.isPending ? "pending_sent" : "none")
  );

  useEffect(() => {
    setStatus(
      match.connectionStatus || (match.isConnected ? "accepted" : match.isPending ? "pending_sent" : "none")
    );
  }, [match.connectionStatus, match.isConnected, match.isPending]);

  const initials = match.name?.split(" ").map(n => n[0]).join("").toUpperCase() || "?";

  const handleConnect = async () => {
    if (status !== "none") return;
    setConnecting(true);
    try {
      await apiClient.post("/api/connections", { receiverId: match.id });
      setStatus("pending_sent");
      onConnect?.();
    } catch (e) {
      alert(e.message || "Failed to connect");
    } finally {
      setConnecting(false);
    }
  };

  const scoreColor = match.matchPercentage >= 80
    ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
    : match.matchPercentage >= 60
    ? "text-red-400 border-red-500/30 bg-red-500/10"
    : "text-slate-400 border-slate-500/30 bg-slate-500/10";

  return (
    <div className="glass glass-hover rounded-2xl p-5 space-y-4 transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <Link href={`/profile/${match.id}`} className="shrink-0 hover:opacity-80 transition-opacity">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-red-600 to-amber-500 flex items-center justify-center text-white font-bold text-sm ring-2 ring-white/5">
              {initials}
            </div>
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <Link href={`/profile/${match.id}`} className="text-lg font-bold text-white font-[Outfit] hover:text-red-400 transition-colors">
                {match.name}
              </Link>
              {match.location && (
                <span className="text-[10px] font-mono bg-white/10 px-1.5 py-0.5 rounded text-slate-300">
                  {match.location}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{match.bio}</p>
            <div className="flex items-center gap-3 mt-1 text-xs">
              <span className="flex items-center gap-1 text-amber-400">
                <Star className="h-3 w-3 fill-amber-400" /> {match.rating > 0 ? match.rating.toFixed(1) : "New"}
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">{match.sessionsCompleted} sessions</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400 flex items-center gap-0.5"><Zap className="h-3 w-3 text-purple-400" />{match.xp} XP</span>
            </div>
          </div>
        </div>

        {/* Match Score Badge */}
        <div className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl border shrink-0 ${scoreColor}`}>
          <Sparkles className="h-3.5 w-3.5" />
          <span className="text-lg font-extrabold font-mono leading-none">{match.matchPercentage}%</span>
          <span className="text-[9px] uppercase font-mono opacity-70">match</span>
        </div>
      </div>

      {/* Skill Tags */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <span className="text-[10px] uppercase font-mono text-emerald-400 font-bold mb-1.5 flex items-center gap-1">
            <BookOpen className="h-3 w-3" /> Teaches
          </span>
          <div className="flex flex-wrap gap-1">
            {match.teaches?.slice(0, 4).map((s, i) => (
              <span key={i} className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-lg text-[11px]">
                {s.name || s}
              </span>
            ))}
            {match.teaches?.length > 4 && (
              <span className="text-slate-500 text-[11px] px-1">+{match.teaches.length - 4}</span>
            )}
          </div>
        </div>
        <div>
          <span className="text-[10px] uppercase font-mono text-amber-400 font-bold mb-1.5 flex items-center gap-1">
            <GraduationCap className="h-3 w-3" /> Learning
          </span>
          <div className="flex flex-wrap gap-1">
            {match.wants?.slice(0, 4).map((s, i) => (
              <span key={i} className="bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-lg text-[11px]">
                {s.name || s}
              </span>
            ))}
            {match.wants?.length > 4 && (
              <span className="text-slate-500 text-[11px] px-1">+{match.wants.length - 4}</span>
            )}
          </div>
        </div>
      </div>

      {/* Why Matched pills */}
      {match.matchedSkills?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {match.matchedSkills.slice(0, 3).map((reason, i) => (
            <span key={i} className="bg-red-500/10 text-red-300 border border-red-500/20 px-2 py-0.5 rounded-lg text-[10px] font-mono">
              <Brain className="h-3 w-3 inline mr-0.5" /> {reason}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-white/8">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
        >
          {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {isExpanded ? "Hide" : "Show"} Score Breakdown
        </button>
        <div className="flex items-center gap-2">
          <Link href={`/profile/${match.id}`} className="btn-secondary text-xs px-3 py-1.5">
            View Profile
          </Link>
          {status === "accepted" ? (
            <div className="flex items-center gap-1.5">
              <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold px-2 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <UserCheck className="h-3.5 w-3.5" /> Connected
              </span>
              <Link href="/chat" className="btn-primary text-xs px-3 py-1.5">
                Chat
              </Link>
            </div>
          ) : status === "pending_sent" ? (
            <span className="flex items-center gap-1 text-xs text-slate-400 font-semibold px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
              <Clock className="h-3.5 w-3.5 text-amber-400" /> Request Sent
            </span>
          ) : status === "pending_received" ? (
            <Link href="/connections" className="btn-primary text-xs px-3 py-1.5 bg-gradient-to-r from-amber-600 to-red-600">
              <UserPlus className="h-3.5 w-3.5" /> Respond
            </Link>
          ) : (
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="btn-primary text-xs px-3 py-1.5 disabled:opacity-50"
            >
              <Users className="h-3.5 w-3.5" />
              {connecting ? "Sending..." : "Connect"}
              {!connecting && <ArrowRight className="h-3 w-3" />}
            </button>
          )}
        </div>
      </div>

      {/* Score Breakdown */}
      {isExpanded && match.breakdown && (
        <div className="grid grid-cols-5 gap-2 pt-2 animate-fade-in">
          {Object.entries(match.breakdown).map(([key, val]) => (
            <div key={key} className="bg-white/[0.03] rounded-lg p-2 text-center border border-white/5">
              <div className="text-sm font-bold text-white font-mono">{val}</div>
              <div className="text-[9px] text-slate-500 uppercase mt-0.5">{key}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MatchesPage() {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [refresh, setRefresh] = useState(0);

  const loadMatches = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await apiClient.get("/api/matches?limit=20");
      setMatches(data || []);
    } catch (e) {
      console.warn("Matches load failed:", e);
    } finally {
      setLoading(false);
    }
  }, [user, refresh]);

  useEffect(() => { loadMatches(); }, [loadMatches]);

  const filtered = matches.filter(m => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q
      || m.name?.toLowerCase().includes(q)
      || m.teaches?.some(s => (s.name || s)?.toLowerCase().includes(q))
      || m.wants?.some(s => (s.name || s)?.toLowerCase().includes(q));
    const matchesCat = selectedCategory === "All"
      || m.teaches?.some(s => s.category === selectedCategory)
      || m.wants?.some(s => s.category === selectedCategory);
    return matchesSearch && matchesCat;
  });

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-5xl animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white font-[Outfit] flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-red-400" /> AI-Powered Matches
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Smart scoring: skill complement + experience + network trust
          </p>
        </div>
        <button
          onClick={() => setRefresh(n => n + 1)}
          disabled={loading}
          className="btn-secondary text-xs px-3 py-2 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Search & Filters */}
      <div className="glass rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, skill, or topic..."
            className="input-base pl-10 text-sm"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 flex-nowrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat ? "bg-red-600 text-white" : "bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton h-52 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Brain className="h-10 w-10 text-slate-500 mx-auto mb-3" />
          <p className="text-sm text-slate-400 mb-2">
            {matches.length === 0
              ? "No matches yet. Add more skills to your profile to find peers!"
              : "No matches for this search. Try different filters."}
          </p>
          {matches.length === 0 && (
            <Link href="/profile" className="btn-secondary text-xs mt-2">Update My Skills</Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-xs text-slate-500 font-mono px-1">
            {filtered.length} match{filtered.length !== 1 ? "es" : ""} found
            {filtered.filter(m => m.hasSkillMatch).length > 0 && (
              <span className="text-emerald-400 ml-2">
                · {filtered.filter(m => m.hasSkillMatch).length} with direct skill matches ✨
              </span>
            )}
          </div>
          {filtered.map(match => (
            <MatchCard
              key={match.id}
              match={match}
              currentUserId={user.id}
              onConnect={loadMatches}
            />
          ))}
        </div>
      )}
    </div>
  );
}
