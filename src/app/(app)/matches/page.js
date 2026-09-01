"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { 
  Sparkles, 
  Search, 
  Calendar, 
  Coins, 
  Clock, 
  Star, 
  CheckCircle2, 
  ArrowRight,
  MessageSquare,
  Flame,
  X
} from "lucide-react";
import { INITIAL_USERS } from "@/lib/seedData";
import { calculateMatchScore } from "@/lib/matchEngine";
import confetti from "canvas-confetti";

export default function MatchesPage() {
  const { user, modifyCoins } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [bookingPeer, setBookingPeer] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [sessionNotes, setSessionNotes] = useState("");

  const currentUser = user || INITIAL_USERS[0];

  // Calculate scores for all peers
  const matches = INITIAL_USERS
    .filter((u) => u.id !== currentUser.id)
    .map((peer) => {
      const matchResult = calculateMatchScore(currentUser, peer);
      return {
        peer,
        ...matchResult
      };
    })
    .sort((a, b) => b.score - a.score);

  const filteredMatches = matches.filter(({ peer }) => {
    const matchesSearch =
      peer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      peer.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      peer.skillsOffered.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

    if (selectedCategory === "All") return matchesSearch;
    return matchesSearch && peer.role.toLowerCase().includes(selectedCategory.toLowerCase());
  });

  const handleBookSession = (e) => {
    e.preventDefault();
    if (!bookingPeer) return;

    modifyCoins(-10);
    setBookingSuccess(true);

    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {}

    setTimeout(() => {
      setBookingSuccess(false);
      setBookingPeer(null);
    }, 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-2">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            AI Compatibility Scoring
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">AI-Powered Peer Match Engine</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Matches dynamically scored based on skill complementary fit, schedule overlap, and mutual exchange synergy.
          </p>
        </div>

        {/* Live Escrow Info */}
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
          <Coins className="h-4 w-4 text-amber-400" />
          <span><strong>10 Coins</strong> per 1-hour session (held in escrow)</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by mentor name, skill (e.g. Figma, React, Python, Docker)..."
            className="w-full glass-input pl-10 pr-4 py-2.5 text-xs text-white"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {["All", "Design", "Computer Science", "Mobile", "Cloud"].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                selectedCategory === cat
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "bg-white/5 text-slate-400 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Match Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredMatches.map(({ peer, score, isHighMatch, reasons, complementarySkills }) => (
          <div
            key={peer.id}
            className="glass-card p-6 flex flex-col justify-between space-y-5 border border-white/10 hover:border-indigo-500/30 group transition-all"
          >
            <div className="space-y-4">
              
              {/* Card Header: Avatar + Compatibility Pill */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <img
                    src={peer.avatar}
                    alt={peer.name}
                    className="h-12 w-12 rounded-2xl object-cover ring-2 ring-indigo-500/30 group-hover:scale-105 transition-transform"
                  />
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                      {peer.name}
                      <span className="text-xs text-amber-400 font-semibold">★ {peer.rating}</span>
                    </h3>
                    <p className="text-xs text-slate-400">{peer.role}</p>
                    <p className="text-[11px] text-slate-500">{peer.department} • {peer.year}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                      score >= 80
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                    }`}
                  >
                    <Sparkles className="h-3 w-3" />
                    {score}% Match
                  </span>
                </div>
              </div>

              {/* Bio */}
              <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                "{peer.bio}"
              </p>

              {/* Skills Offered & Wanted */}
              <div className="space-y-2 pt-1">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">Teaches:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {peer.skillsOffered.map((skill) => (
                      <span
                        key={skill}
                        className="px-2.5 py-0.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">Looking to Learn:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {peer.skillsWanted.map((skill) => (
                      <span
                        key={skill}
                        className="px-2.5 py-0.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px] font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI Synergy Reasons */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> AI Synergy Breakdown
                </span>
                {reasons.slice(0, 2).map((r, idx) => (
                  <p key={idx} className="text-[11px] text-slate-300 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                    {r}
                  </p>
                ))}
              </div>

            </div>

            {/* Action Bar */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                {peer.availability[0] || "Flexible"}
              </span>

              <button
                onClick={() => setBookingPeer(peer)}
                className="btn-primary px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
              >
                Book Session (10 Coins)
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

          </div>
        ))}
      </div>

      {/* Booking Modal */}
      {bookingPeer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl glass-panel p-6 shadow-2xl border border-white/10 space-y-5">
            <button
              onClick={() => setBookingPeer(null)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>

            {bookingSuccess ? (
              <div className="text-center py-6 space-y-4 animate-in zoom-in-95">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="h-8 w-8 animate-bounce" />
                </div>
                <h3 className="text-xl font-bold text-white">Session Booked!</h3>
                <p className="text-xs text-slate-300">
                  10 SkillCoins have been placed in escrow. You can join the virtual classroom or meet on campus with OTP verification.
                </p>
              </div>
            ) : (
              <form onSubmit={handleBookSession} className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                  <img src={bookingPeer.avatar} alt={bookingPeer.name} className="h-10 w-10 rounded-full object-cover" />
                  <div>
                    <h3 className="text-sm font-bold text-white">Book Session with {bookingPeer.name}</h3>
                    <p className="text-xs text-slate-400">{bookingPeer.role}</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center justify-between">
                  <span>Session Fee (Time-Bank Escrow):</span>
                  <strong>10 SkillCoins (1 Hour)</strong>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">What would you like to focus on?</label>
                  <textarea
                    required
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                    placeholder="e.g. Master Figma Auto-Layout variables and review my design system..."
                    className="w-full glass-input p-3 text-xs text-white h-24 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full btn-primary py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
                >
                  Confirm & Lock 10 Coins in Escrow
                </button>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
