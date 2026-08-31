"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import apiClient from "@/lib/apiClient";
import { Star, Send, CheckCircle2, MessageSquare, RefreshCw } from "lucide-react";

export default function ReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [completedSessions, setCompletedSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Review form state
  const [selectedSession, setSelectedSession] = useState("");
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [reviewsData, sessionsData] = await Promise.all([
        apiClient.get(`/api/reviews?userId=${user.id}`),
        apiClient.get("/api/sessions"),
      ]);
      setReviews(reviewsData || []);
      const completed = (sessionsData || []).filter((s) => s.status === "completed");
      setCompletedSessions(completed);
    } catch (e) {
      console.warn("Reviews load failed:", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!selectedSession) return;
    const session = completedSessions.find((s) => s.id === selectedSession);
    if (!session) return;
    const revieweeId = session.mentorId === user.id ? session.learnerId : session.mentorId;

    setSubmitting(true);
    try {
      await apiClient.post("/api/reviews", {
        sessionId: selectedSession,
        revieweeId,
        rating,
        feedback,
      });
      setSubmitted(true);
      setSelectedSession("");
      setRating(5);
      setFeedback("");
      await loadData();
      setTimeout(() => setSubmitted(false), 3000);
    } catch (err) {
      alert(err.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const getInitials = (name) =>
    name?.split(" ").map((n) => n[0]).join("").toUpperCase() || "?";

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-3xl animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white font-[Outfit] flex items-center gap-2">
          <Star className="h-6 w-6 text-amber-400 fill-amber-400" /> Reviews & Ratings
        </h1>
        <button
          onClick={loadData}
          disabled={loading}
          className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {submitted && (
        <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 p-3 rounded-xl text-sm flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="h-4 w-4" /> Review submitted successfully! Thank you for your feedback.
        </div>
      )}

      {/* Submit Review */}
      {completedSessions.length > 0 && (
        <div className="glass rounded-2xl p-5 space-y-4">
          <h2 className="text-base font-bold text-white">Leave a Review</h2>
          <form onSubmit={handleSubmitReview} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Session</label>
              <select
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
                required
                className="input-base text-xs"
              >
                <option value="">Select a completed session...</option>
                {completedSessions.map((s) => {
                  const peer = s.mentorId === user.id ? s.learner : s.mentor;
                  return (
                    <option key={s.id} value={s.id}>
                      {s.topic || s.skill?.name} — with {peer?.name} ({s.date})
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Rating</label>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    className="p-1 text-lg transition-transform hover:scale-125 focus:outline-none"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        n <= rating
                          ? "text-amber-400 fill-amber-400"
                          : "text-slate-600 hover:text-amber-400"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Feedback (optional)
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
                placeholder="How was the session? What did you learn?"
                className="input-base text-xs resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={submitting || !selectedSession}
              className="btn-primary text-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
          </form>
        </div>
      )}

      {/* Reviews Received */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-white">
          Reviews Received ({reviews.length})
        </h2>
        {reviews.length === 0 && !loading && (
          <div className="glass rounded-xl p-8 text-center space-y-2">
            <Star className="h-8 w-8 text-slate-600 mx-auto" />
            <p className="text-sm text-slate-500">
              No reviews yet. Complete sessions to earn ratings and badges!
            </p>
          </div>
        )}
        {reviews.map((r) => (
          <div key={r.id} className="glass rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-500 to-red-500 flex items-center justify-center text-white text-xs font-bold ring-1 ring-white/10">
                  {getInitials(r.reviewer?.name)}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{r.reviewer?.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {r.session?.topic || "Skill Session"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={`h-3.5 w-3.5 ${
                      n <= r.rating ? "text-amber-400 fill-amber-400" : "text-slate-700"
                    }`}
                  />
                ))}
              </div>
            </div>
            {r.feedback && (
              <p className="text-xs text-slate-300 italic pl-10">"{r.feedback}"</p>
            )}
            <div className="text-[10px] text-slate-600 font-mono text-right">
              {new Date(r.createdAt).toLocaleDateString([], {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
