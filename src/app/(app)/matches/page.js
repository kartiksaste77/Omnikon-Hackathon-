"use client";
import { useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import aiService from "@/lib/aiService";
import db from "@/lib/mockDatabase";
import { Sparkles, Search, Star, MapPin, BookOpen, GraduationCap, Users, ArrowRight, Brain, ChevronDown, ChevronUp } from "lucide-react";

export default function MatchesPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [expandedMatch, setExpandedMatch] = useState(null);

  const matches = useMemo(() => {
    if (!user) return [];
    return aiService.getMatchesForUser(user.id);
  }, [user]);

  const categories = ["All", "Programming", "Design", "Business", "Languages", "Music", "Data Science", "DevOps"];

  const filtered = matches.filter(m => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || m.user.name.toLowerCase().includes(q) || m.teachSkills.some(s => s.skill?.name.toLowerCase().includes(q)) || m.learnSkills.some(s => s.skill?.name.toLowerCase().includes(q));
    const matchesCat = selectedCategory === "All" || m.teachSkills.some(s => s.skill?.category === selectedCategory) || m.learnSkills.some(s => s.skill?.category === selectedCategory);
    return matchesSearch && matchesCat;
  });

  const handleConnect = (peerId) => {
    if (!user) return;
    db.sendConnectionRequest(user.id, peerId);
    alert("Connection request sent!");
  };

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-5xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white font-[Outfit] flex items-center gap-2"><Sparkles className="h-6 w-6 text-red-400" /> AI-Powered Matches</h1>
        <p className="text-sm text-slate-400 mt-1">Intelligent matching that understands related skills — not just exact keywords</p>
      </div>

      {/* Search & Filters */}
      <div className="glass rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by name, skill, or topic..." className="input-base pl-10 text-sm" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {categories.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${selectedCategory === cat ? "bg-red-600 text-white" : "bg-white/5 text-slate-300 hover:bg-white/10"}`}
            >{cat}</button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        {filtered.length === 0 && (
          <div className="glass rounded-2xl p-12 text-center">
            <Brain className="h-10 w-10 text-slate-500 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No matches found. Try a different search or add more skills to your profile.</p>
          </div>
        )}

        {filtered.map((match) => {
          const isExpanded = expandedMatch === match.user.id;
          const initials = match.user.name.split(" ").map(n => n[0]).join("").toUpperCase();
          return (
            <div key={match.user.id} className="glass glass-hover rounded-2xl p-5 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-red-600 to-amber-500 flex items-center justify-center text-white font-bold text-sm shrink-0">{initials}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white font-[Outfit]">{match.user.name}</h3>
                      <span className="text-[10px] font-mono bg-white/10 px-1.5 py-0.5 rounded text-slate-300">{match.user.location}</span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1">{match.user.bio}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs">
                      <span className="flex items-center gap-1 text-amber-400"><Star className="h-3 w-3 fill-amber-400" /> {match.user.rating || "New"}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400">{match.user.sessionsCompleted} sessions</span>
                    </div>
                  </div>
                </div>

                {/* Match Score */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 px-3 py-1.5 rounded-xl">
                    <Sparkles className="h-4 w-4 text-red-400" />
                    <span className="text-sm font-extrabold text-red-400 font-mono">{match.score}%</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">AI Match Score</span>
                </div>
              </div>

              {/* Skill Tags */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-mono text-emerald-400 font-bold mb-1 block"><BookOpen className="h-3 w-3 inline mr-1" />Can Teach</span>
                  <div className="flex flex-wrap gap-1">{match.teachSkills.map((s, i) => (
                    <span key={i} className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-lg text-[11px]">{s.skill?.name}</span>
                  ))}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-amber-400 font-bold mb-1 block"><GraduationCap className="h-3 w-3 inline mr-1" />Wants to Learn</span>
                  <div className="flex flex-wrap gap-1">{match.learnSkills.map((s, i) => (
                    <span key={i} className="bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-lg text-[11px]">{s.skill?.name}</span>
                  ))}</div>
                </div>
              </div>

              {/* Matched Skills Reasons */}
              {match.matchedSkills?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {match.matchedSkills.slice(0, 3).map((reason, i) => (
                    <span key={i} className="bg-red-500/10 text-red-300 border border-red-500/20 px-2 py-0.5 rounded-lg text-[10px] font-mono">
                      <Brain className="h-3 w-3 inline mr-0.5" /> {reason}
                    </span>
                  ))}
                </div>
              )}

              {/* Breakdown (expandable) */}
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <button onClick={() => setExpandedMatch(isExpanded ? null : match.user.id)} className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
                  {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  {isExpanded ? "Hide" : "Show"} Match Breakdown
                </button>
                <button onClick={() => handleConnect(match.user.id)} className="btn-primary text-xs px-4 py-2">
                  <Users className="h-3.5 w-3.5" /> Connect <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              {isExpanded && (
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-2 animate-fade-in">
                  {Object.entries(match.breakdown).map(([key, val]) => (
                    <div key={key} className="bg-white/[0.03] rounded-lg p-2 text-center border border-white/5">
                      <div className="text-sm font-bold text-white font-mono">{val}%</div>
                      <div className="text-[9px] text-slate-500 uppercase">{key}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
