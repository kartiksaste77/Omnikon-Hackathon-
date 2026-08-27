"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import db from "@/lib/mockDatabase";
import { Star, Send } from "lucide-react";

export default function ReviewsPage() {
  const { user } = useAuth();
  const [, refresh] = useState(0);

  // Review form state
  const [selectedSession, setSelectedSession] = useState("");
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!user) return null;

  const reviews = db.getReviewsForUser(user.id);
  const completedSessions = db.getSessions(user.id).filter(s => s.status === "completed");

  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (!selectedSession) return;
    const session = completedSessions.find(s => s.id === selectedSession);
    if (!session) return;
    const revieweeId = session.mentorId === user.id ? session.learnerId : session.mentorId;
    db.addReview({ sessionId: selectedSession, reviewerId: user.id, revieweeId, rating, feedback });
    setSubmitted(true);
    setSelectedSession(""); setRating(5); setFeedback("");
    setTimeout(() => setSubmitted(false), 3000);
    refresh(n => n + 1);
  };

  return (
    <div className="space-y-6 max-w-3xl animate-fade-in">
      <h1 className="text-2xl font-bold text-white font-[Outfit] flex items-center gap-2"><Star className="h-6 w-6 text-amber-400" /> Reviews & Ratings</h1>

      {submitted && (
        <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 p-3 rounded-xl text-sm">✓ Review submitted! Thank you for your feedback.</div>
      )}

      {/* Submit Review */}
      <div className="glass rounded-2xl p-5 space-y-4">
        <h2 className="text-base font-bold text-white">Leave a Review</h2>
        <form onSubmit={handleSubmitReview} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Session</label>
            <select value={selectedSession} onChange={e => setSelectedSession(e.target.value)} required className="input-base text-xs">
              <option value="">Select a completed session...</option>
              {completedSessions.map(s => {
                const peer = db.getUser(s.mentorId === user.id ? s.learnerId : s.mentorId);
                return <option key={s.id} value={s.id}>{s.topic} — with {peer?.name} ({s.date})</option>;
              })}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} type="button" onClick={() => setRating(n)} className="p-1">
                  <Star className={`h-6 w-6 ${n <= rating ? "text-amber-400 fill-amber-400" : "text-slate-600"}`} />
                </button>
              ))}
              <span className="text-sm text-slate-300 ml-2 font-mono">{rating}.0</span>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Feedback</label>
            <textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={3} placeholder="Share your experience..." className="input-base resize-none text-sm" />
          </div>
          <button type="submit" className="btn-primary text-sm"><Send className="h-4 w-4" /> Submit Review</button>
        </form>
      </div>

      {/* My Reviews Received */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-300 uppercase font-mono">Reviews About Me ({reviews.length})</h2>
        {reviews.length === 0 && <p className="text-sm text-slate-500 glass rounded-xl p-6 text-center">No reviews yet.</p>}
        {reviews.map(r => {
          const reviewer = db.getUser(r.reviewerId);
          return (
            <div key={r.id} className="glass rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">{reviewer?.name}</span>
                  <div className="flex">
                    {[1,2,3,4,5].map(n => <Star key={n} className={`h-3.5 w-3.5 ${n <= r.rating ? "text-amber-400 fill-amber-400" : "text-slate-600"}`} />)}
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">{r.timestamp?.split("T")[0]}</span>
              </div>
              {r.feedback && <p className="text-sm text-slate-300">"{r.feedback}"</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
