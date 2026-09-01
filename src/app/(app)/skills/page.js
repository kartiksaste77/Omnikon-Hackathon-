"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { 
  BookOpen, 
  Search, 
  Plus, 
  Star, 
  Coins, 
  Clock, 
  Users, 
  ArrowRight,
  Sparkles,
  Tag,
  CheckCircle2,
  X
} from "lucide-react";
import { INITIAL_SKILLS } from "@/lib/seedData";
import confetti from "canvas-confetti";

const CATEGORIES = ["All", "Web Development", "Design & Creative", "Computer Science", "Mobile Development", "DevOps & Cloud", "Personal Development"];

export default function SkillsPage() {
  const { user, modifyCoins } = useAuth();
  const [skills, setSkills] = useState(INITIAL_SKILLS);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [bookingSkill, setBookingSkill] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // New Skill Form State
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Web Development");
  const [newDesc, setNewDesc] = useState("");
  const [newLevel, setNewLevel] = useState("Intermediate");
  const [newTags, setNewTags] = useState("");

  const filteredSkills = skills.filter((skill) => {
    const matchesCategory = selectedCategory === "All" || skill.category === selectedCategory;
    const matchesSearch =
      skill.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleCreateSkill = (e) => {
    e.preventDefault();
    const createdSkill = {
      id: `skill_${Date.now()}`,
      userId: user?.id || "user_1",
      userName: user?.name || "Alex Rivera",
      userAvatar: user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      userRating: 5.0,
      title: newTitle,
      category: newCategory,
      description: newDesc,
      level: newLevel,
      tags: newTags.split(",").map((t) => t.trim()).filter(Boolean),
      hourlyCostCoins: 10,
      studentsTaught: 0,
      rating: 5.0,
    };

    setSkills([createdSkill, ...skills]);
    setIsAddModalOpen(false);
    setNewTitle("");
    setNewDesc("");
    setNewTags("");

    try {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    } catch (e) {}
  };

  const handleBookSession = () => {
    if (!bookingSkill) return;
    modifyCoins(-10);
    setBookingSuccess(true);

    try {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch (e) {}

    setTimeout(() => {
      setBookingSuccess(false);
      setBookingSkill(null);
    }, 1800);
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-2">
            <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
            Campus Skills Marketplace
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Explore Peer-Taught Skills</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Book 1-on-1 mentorship sessions for 10 SkillCoins per hour. Zero money required.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="btn-primary px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30"
        >
          <Plus className="h-4 w-4" />
          Offer a Skill to Teach
        </button>
      </div>

      {/* Filter and Search */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search skills, topics, or mentors (e.g., React, Figma, LeetCode, Flutter)..."
            className="w-full glass-input pl-10 pr-4 py-2.5 text-xs text-white"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
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

      {/* Skills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSkills.map((skill) => (
          <div
            key={skill.id}
            className="glass-card p-6 flex flex-col justify-between space-y-4 border border-white/10 hover:border-indigo-500/40 group transition-all"
          >
            <div className="space-y-3">
              {/* Category & Level Badges */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
                  {skill.category}
                </span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/5 text-slate-400">
                  {skill.level}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                {skill.title}
              </h3>

              {/* Description */}
              <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                {skill.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {skill.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md border border-white/5"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Mentor Info & Booking Action */}
            <div className="pt-4 border-t border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src={skill.userAvatar}
                    alt={skill.userName}
                    className="h-7 w-7 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-xs font-semibold text-white">{skill.userName}</p>
                    <p className="text-[10px] text-amber-400 flex items-center gap-1">
                      ★ {skill.rating} <span className="text-slate-500">({skill.studentsTaught} taught)</span>
                    </p>
                  </div>
                </div>

                <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                  <Coins className="h-3.5 w-3.5 text-amber-400" />
                  10 Coins/hr
                </span>
              </div>

              <button
                onClick={() => setBookingSkill(skill)}
                className="w-full btn-primary py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30"
              >
                Book 1-Hour Session
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

          </div>
        ))}
      </div>

      {/* Offer Skill Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl glass-panel p-6 shadow-2xl border border-white/10 space-y-5">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-white">Offer a New Skill to Teach</h3>
              <p className="text-xs text-slate-400">Earn 10 SkillCoins for every hour you mentor peers.</p>
            </div>

            <form onSubmit={handleCreateSkill} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">Skill Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Next.js 15 Server Actions & API Design"
                  className="w-full glass-input px-3.5 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full glass-input px-3 py-2 text-xs text-white bg-slate-900"
                  >
                    {CATEGORIES.filter((c) => c !== "All").map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">Level</label>
                  <select
                    value={newLevel}
                    onChange={(e) => setNewLevel(e.target.value)}
                    className="w-full glass-input px-3 py-2 text-xs text-white bg-slate-900"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="All Levels">All Levels</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">Description & What You'll Cover</label>
                <textarea
                  required
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Detail what students will learn in your 1-hour session..."
                  className="w-full glass-input p-3 text-xs text-white h-20 resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">Tags (Comma-separated)</label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="e.g. React, Next.js, Web, Frontend"
                  className="w-full glass-input px-3.5 py-2 text-xs text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full btn-primary py-2.5 rounded-xl text-xs font-bold"
              >
                Publish Skill Offer
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Book Session Modal */}
      {bookingSkill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl glass-panel p-6 shadow-2xl border border-white/10 space-y-4">
            <button
              onClick={() => setBookingSkill(null)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>

            {bookingSuccess ? (
              <div className="text-center py-6 space-y-3">
                <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto animate-bounce" />
                <h3 className="text-base font-bold text-white">Booking Confirmed!</h3>
                <p className="text-xs text-slate-300">
                  10 SkillCoins placed into escrow for <strong>{bookingSkill.title}</strong> with {bookingSkill.userName}.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-white">Confirm Skill Booking</h3>
                <div className="p-3 rounded-2xl bg-slate-900 border border-white/10 space-y-1 text-xs">
                  <p className="font-semibold text-white">{bookingSkill.title}</p>
                  <p className="text-slate-400">Mentor: {bookingSkill.userName}</p>
                  <p className="text-amber-400 font-bold mt-2">Cost: 10 SkillCoins (Zero Cash)</p>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Your 10 SkillCoins will be safely locked in Escrow and only released when the session is verified via live video or OTP check-in.
                </p>

                <button
                  onClick={handleBookSession}
                  className="w-full btn-primary py-2.5 rounded-xl text-xs font-semibold"
                >
                  Confirm Escrow & Book
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
