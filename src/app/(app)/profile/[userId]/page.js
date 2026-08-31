"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import apiClient from "@/lib/apiClient";
import Link from "next/link";
import {
  Star, MapPin, BookOpen, GraduationCap, Calendar, Users,
  MessageSquare, Zap, ArrowLeft, Trophy, CheckCircle2, Clock,
  Globe, AlertCircle
} from "lucide-react";

function StatBadge({ icon: Icon, value, label, color = "text-slate-300" }) {
  return (
    <div className="flex flex-col items-center gap-1 p-3 glass rounded-xl">
      <Icon className={`h-4 w-4 ${color}`} />
      <span className="text-lg font-extrabold text-white font-mono">{value}</span>
      <span className="text-[10px] text-slate-500 uppercase font-mono">{label}</span>
    </div>
  );
}

function SkillPill({ name, proficiency, type }) {
  const colors = type === "teach"
    ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
    : "bg-amber-500/10 text-amber-300 border-amber-500/20";
  return (
    <span className={`flex items-center gap-1.5 border px-2.5 py-1 rounded-xl text-xs font-medium ${colors}`}>
      {name}
      {proficiency && <span className="opacity-50">· {proficiency}</span>}
    </span>
  );
}

export default function PublicProfilePage() {
  const { userId } = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [connectStatus, setConnectStatus] = useState(null);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      setLoading(true);
      try {
        const data = await apiClient.get(`/api/users/${userId}`);
        setProfile(data);
        setConnectStatus(data.connectionStatus);
      } catch (e) {
        setError("Profile not found.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  const handleConnect = async () => {
    if (!currentUser) { router.push("/auth/login"); return; }
    setConnecting(true);
    try {
      await apiClient.post("/api/connections", { receiverId: userId });
      setConnectStatus("sent:pending");
    } catch (e) {
      alert(e.message || "Failed to send request");
    } finally {
      setConnecting(false);
    }
  };

  const handleChat = () => {
    router.push("/chat");
  };

  const initials = (name) => name?.split(" ").map(n => n[0]).join("").toUpperCase() || "?";

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
        <div className="skeleton h-40 rounded-2xl" />
        <div className="skeleton h-24 rounded-2xl" />
        <div className="skeleton h-40 rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Profile Not Found</h1>
        <p className="text-slate-400 mb-6">{error}</p>
        <button onClick={() => router.back()} className="btn-secondary">
          <ArrowLeft className="h-4 w-4" /> Go Back
        </button>
      </div>
    );
  }

  if (!profile) return null;

  const isConnected = connectStatus === "accepted";
  const isPendingSent = connectStatus === "pending_sent";
  const isPendingRecv = connectStatus === "pending_received";
  const isOwnProfile = profile.isOwnProfile;

  const avgRating = profile.receivedReviews?.length > 0
    ? (profile.receivedReviews.reduce((s, r) => s + r.rating, 0) / profile.receivedReviews.length).toFixed(1)
    : profile.rating || 0;

  return (
    <div className="max-w-3xl space-y-5 animate-fade-in">
      {/* Back button */}
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors group">
        <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" /> Back
      </button>

      {/* Profile Hero */}
      <div className="glass rounded-2xl overflow-hidden">
        {/* Banner */}
        <div className="h-24 bg-gradient-to-r from-red-900/40 via-red-600/20 to-amber-900/30 relative">
          <div className="absolute inset-0 bg-dots opacity-30" />
        </div>
        {/* Avatar + Info */}
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-8">
            <div className="flex items-end gap-4">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-red-600 to-amber-500 flex items-center justify-center text-white text-2xl font-bold ring-4 ring-[#09090D] shadow-xl">
                {initials(profile.name)}
              </div>
              <div className="pb-1">
                <h1 className="text-xl font-extrabold text-white font-[Outfit]">{profile.name}</h1>
                {profile.location && (
                  <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                    <MapPin className="h-3 w-3" /> {profile.location}
                  </div>
                )}
              </div>
            </div>
            {/* Action Buttons */}
            {!isOwnProfile && (
              <div className="flex items-center gap-2 pb-1 flex-wrap">
                {isConnected ? (
                  <button onClick={handleChat} className="btn-secondary text-sm">
                    <MessageSquare className="h-4 w-4" /> Message
                  </button>
                ) : isPendingSent ? (
                  <button disabled className="btn-secondary text-sm opacity-60 cursor-not-allowed">
                    <Clock className="h-4 w-4 text-amber-400" /> Request Sent
                  </button>
                ) : isPendingRecv ? (
                  <Link href="/connections" className="btn-primary text-sm bg-gradient-to-r from-amber-600 to-red-600">
                    <Users className="h-4 w-4" /> Respond to Request
                  </Link>
                ) : (
                  <button onClick={handleConnect} disabled={connecting} className="btn-primary text-sm">
                    <Users className="h-4 w-4" /> {connecting ? "Sending..." : "Connect"}
                  </button>
                )}
                {isConnected && (
                  <button onClick={() => router.push(`/sessions?with=${userId}`)} className="btn-primary text-sm">
                    <Calendar className="h-4 w-4" /> Schedule Session
                  </button>
                )}
              </div>
            )}
            {isOwnProfile && (
              <Link href="/profile" className="btn-secondary text-sm pb-1">Edit Profile</Link>
            )}
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-sm text-slate-300 mt-4 leading-relaxed">{profile.bio}</p>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-3">
        <StatBadge icon={Star} value={avgRating} label="Rating" color="text-amber-400" />
        <StatBadge icon={Calendar} value={profile.totalSessionsCompleted || 0} label="Sessions" color="text-blue-400" />
        <StatBadge icon={Trophy} value={profile.xp || 0} label="XP" color="text-purple-400" />
        <StatBadge icon={Zap} value={profile.skillCoins || 0} label="Coins" color="text-amber-400" />
      </div>

      {/* Skills */}
      <div className="glass rounded-2xl p-5 space-y-4">
        <h2 className="text-base font-bold text-white font-[Outfit]">Skills</h2>
        <div className="space-y-3">
          {profile.teachSkills?.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono font-bold text-emerald-400 mb-2">
                <BookOpen className="h-3 w-3" /> Can Teach
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.teachSkills.map((s, i) => (
                  <SkillPill key={i} name={s.skill?.name} proficiency={s.proficiency} type="teach" />
                ))}
              </div>
            </div>
          )}
          {profile.learnSkills?.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono font-bold text-amber-400 mb-2">
                <GraduationCap className="h-3 w-3" /> Wants to Learn
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.learnSkills.map((s, i) => (
                  <SkillPill key={i} name={s.skill?.name} type="learn" />
                ))}
              </div>
            </div>
          )}
          {!profile.teachSkills?.length && !profile.learnSkills?.length && (
            <p className="text-xs text-slate-500">No skills listed yet.</p>
          )}
        </div>
      </div>

      {/* Reviews */}
      {profile.receivedReviews?.length > 0 && (
        <div className="glass rounded-2xl p-5 space-y-4">
          <h2 className="text-base font-bold text-white font-[Outfit] flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-400 fill-amber-400" /> Reviews
            <span className="text-xs text-slate-500 font-normal font-mono">({profile.receivedReviews.length})</span>
          </h2>
          <div className="space-y-3">
            {profile.receivedReviews.map((review) => (
              <div key={review.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">{review.reviewer?.name}</span>
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${i < review.rating ? "text-amber-400 fill-amber-400" : "text-slate-600"}`}
                      />
                    ))}
                  </div>
                </div>
                {review.feedback && (
                  <p className="text-xs text-slate-400 leading-relaxed">"{review.feedback}"</p>
                )}
                <p className="text-[10px] text-slate-600 font-mono">
                  {new Date(review.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
