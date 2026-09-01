"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { 
  Star, 
  MessageSquare, 
  CheckCircle2, 
  Award, 
  ThumbsUp, 
  Sparkles,
  Send
} from "lucide-react";
import { INITIAL_REVIEWS, INITIAL_USERS } from "@/lib/seedData";
import confetti from "canvas-confetti";

export default function ReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState(INITIAL_REVIEWS);
  const [rating, setRating] = useState(5);
  const [selectedMentor, setSelectedMentor] = useState(INITIAL_USERS[1].id); // Priya
  const [comment, setComment] = useState("");
  const [selectedBadges, setSelectedBadges] = useState(["Crystal Clear Explanations"]);
  const [isSuccess, setIsSuccess] = useState(false);

  const availableBadges = [
    "Crystal Clear Explanations",
    "Patient & Thorough",
    "Hands-on Code Expert",
    "Super Fast Response",
    "Great Energy & Encouraging"
  ];

  const handleToggleBadge = (badge) => {
    if (selectedBadges.includes(badge)) {
      setSelectedBadges(selectedBadges.filter((b) => b !== badge));
    } else {
      setSelectedBadges([...selectedBadges, badge]);
    }
  };

  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    const mentorObj = INITIAL_USERS.find((u) => u.id === selectedMentor);

    const newRev = {
      id: `rev_${Date.now()}`,
      sessionId: `sess_${Date.now()}`,
      mentorId: selectedMentor,
      mentorName: mentorObj?.name || "Peer Mentor",
      learnerId: user?.id || "user_1",
      learnerName: user?.name || "Alex Rivera",
      learnerAvatar: user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      rating: Number(rating),
      comment,
      badges: selectedBadges,
      createdAt: new Date().toISOString()
    };

    setReviews([newRev, ...reviews]);
    setComment("");
    setIsSuccess(true);

    try {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    } catch (e) {}

    setTimeout(() => setIsSuccess(false), 3000);
  };

  return (
    <div className="space-y-8 animate-in fade-in max-w-5xl mx-auto">
      
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-2">
          <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
          Campus Trust & Reliability
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Peer Ratings & Reviews</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Every completed session builds verifiable peer reputation and unlocks mentor badges.
        </p>
      </div>

      {/* Grid: Submit Review + Reviews Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Submit Review Card (5 cols) */}
        <div className="lg:col-span-5 glass-card p-6 border border-white/10 space-y-5">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
              Submit a Mentor Review
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Rate your recent 1-on-1 session experience.</p>
          </div>

          {isSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Review submitted! Updated mentor reliability score.</span>
            </div>
          )}

          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">Select Mentor</label>
              <select
                value={selectedMentor}
                onChange={(e) => setSelectedMentor(e.target.value)}
                className="w-full glass-input px-3 py-2 text-xs text-white bg-slate-900"
              >
                {INITIAL_USERS.slice(1).map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role.split("&")[0]})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Star Rating</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-125 transition-transform"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        star <= rating
                          ? "text-amber-400 fill-amber-400"
                          : "text-slate-600"
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-amber-300 ml-2">{rating} / 5 Stars</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">Feedback & Comments</label>
              <textarea
                required
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="How was the session? What did you accomplish together?"
                className="w-full glass-input p-3 text-xs text-white h-24 resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Award Badges</label>
              <div className="flex flex-wrap gap-1.5">
                {availableBadges.map((b) => {
                  const isSelected = selectedBadges.includes(b);
                  return (
                    <button
                      type="button"
                      key={b}
                      onClick={() => handleToggleBadge(b)}
                      className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-all ${
                        isSelected
                          ? "bg-indigo-600 text-white border border-indigo-400 shadow-sm"
                          : "bg-white/5 text-slate-400 hover:text-white border border-white/5"
                      }`}
                    >
                      + {b}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              className="w-full btn-primary py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30"
            >
              <Send className="h-3.5 w-3.5" />
              Post Review
            </button>
          </form>
        </div>

        {/* Reviews Stream (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-bold text-white">Recent Verified Reviews ({reviews.length})</h3>
            <span className="text-xs text-amber-300 font-bold">Campus Average: 4.96 ★</span>
          </div>

          <div className="space-y-4">
            {reviews.map((rev) => (
              <div key={rev.id} className="glass-card p-5 border border-white/10 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={rev.learnerAvatar}
                      alt={rev.learnerName}
                      className="h-10 w-10 rounded-full object-cover ring-2 ring-indigo-500/30"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-white">{rev.learnerName}</h4>
                      <p className="text-[11px] text-slate-400">
                        Reviewed Mentor: <strong className="text-slate-200">{rev.mentorName}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed italic">
                  "{rev.comment}"
                </p>

                {rev.badges && rev.badges.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {rev.badges.map((b) => (
                      <span
                        key={b}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-300"
                      >
                        🏷️ {b}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
