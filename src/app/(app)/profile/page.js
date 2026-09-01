"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { 
  User, 
  Sparkles, 
  Star, 
  Coins, 
  Clock, 
  Flame, 
  Award, 
  BookOpen, 
  CheckCircle2,
  Save,
  Plus
} from "lucide-react";
import confetti from "canvas-confetti";

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  
  const [bio, setBio] = useState(user?.bio || "Passionate about React, Next.js, and Generative AI. Love helping peers level up their frontend architectures.");
  const [skillsOfferedInput, setSkillsOfferedInput] = useState((user?.skillsOffered || ["React & Next.js", "TypeScript", "AI Agent Pipelines"]).join(", "));
  const [skillsWantedInput, setSkillsWantedInput] = useState((user?.skillsWanted || ["UI/UX Design", "Figma Prototyping", "Public Speaking"]).join(", "));
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateUser({
      bio,
      skillsOffered: skillsOfferedInput.split(",").map((s) => s.trim()).filter(Boolean),
      skillsWanted: skillsWantedInput.split(",").map((s) => s.trim()).filter(Boolean),
    });

    setIsSaved(true);
    try {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } catch (e) {}

    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="space-y-8 animate-in fade-in max-w-4xl mx-auto">
      
      {/* Profile Header Card */}
      <div className="glass-card p-6 sm:p-8 border border-white/10 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <img
            src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80"}
            alt={user?.name}
            className="h-24 w-24 rounded-3xl object-cover ring-4 ring-indigo-500/40 shadow-xl"
          />

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white">{user?.name || "Alex Rivera"}</h1>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {user?.role || "Full-Stack Engineer & AI Researcher"}
              </span>
            </div>

            <p className="text-xs text-slate-400">
              {user?.department || "Computer Science & Engineering"} • {user?.year || "Final Year"}
            </p>

            {/* Quick Metrics Bar */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2 text-xs">
              <span className="text-amber-300 font-bold flex items-center gap-1">
                <Coins className="h-3.5 w-3.5 text-amber-400" /> {user?.coins ?? 50} Coins
              </span>
              <span className="text-indigo-300 font-bold flex items-center gap-1">
                <Award className="h-3.5 w-3.5 text-indigo-400" /> {user?.xp ?? 450} XP
              </span>
              <span className="text-rose-300 font-bold flex items-center gap-1">
                <Flame className="h-3.5 w-3.5 fill-rose-400" /> {user?.streak ?? 12}d Streak
              </span>
              <span className="text-emerald-300 font-bold flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-emerald-400" /> {user?.completedHours ?? 32} hrs Taught
              </span>
            </div>
          </div>
        </div>

        {/* Badges Row */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 mr-2">Achievements:</span>
          {(user?.badges || ["Master Mentor", "Fast Responder", "AI Pioneer", "Top Contributor"]).map((b) => (
            <span
              key={b}
              className="text-[11px] font-semibold px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-slate-200"
            >
              🏆 {b}
            </span>
          ))}
        </div>
      </div>

      {/* Edit Profile & Skills Form */}
      <form onSubmit={handleSaveProfile} className="glass-card p-6 sm:p-8 border border-white/10 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <User className="h-4 w-4 text-indigo-400" />
            Edit Profile & Skill Portfolio
          </h2>

          {isSaved && (
            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" /> Profile Updated!
            </span>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Campus Bio & Experience</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full glass-input p-3 text-xs text-white h-24 resize-none"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
            Skills You Offer to Teach (Comma-separated)
          </label>
          <input
            type="text"
            value={skillsOfferedInput}
            onChange={(e) => setSkillsOfferedInput(e.target.value)}
            className="w-full glass-input px-4 py-2.5 text-xs text-white"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
            Skills You Want to Learn (Used by AI Match Engine)
          </label>
          <input
            type="text"
            value={skillsWantedInput}
            onChange={(e) => setSkillsWantedInput(e.target.value)}
            className="w-full glass-input px-4 py-2.5 text-xs text-white"
          />
        </div>

        <button
          type="submit"
          className="btn-primary px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30"
        >
          <Save className="h-4 w-4" />
          Save Profile Updates
        </button>
      </form>

    </div>
  );
}
