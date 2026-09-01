"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { INITIAL_SESSIONS } from "@/lib/seedData";
import RealVideoMeeting from "@/components/RealVideoMeeting";

export default function LiveSessionRoomPage() {
  const params = useParams();
  const router = useRouter();
  const { modifyCoins, modifyXp } = useAuth();

  const sessionId = params?.id || "sess_101";
  const session = INITIAL_SESSIONS.find((s) => s.id === sessionId) || INITIAL_SESSIONS[0];

  const [isCompleted, setIsCompleted] = useState(false);

  const handleSessionComplete = () => {
    modifyCoins(10);
    modifyXp(50);
    setIsCompleted(true);
  };

  return (
    <div className="space-y-3 animate-in fade-in">
      
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/sessions"
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Sessions Hub
        </Link>

        {isCompleted && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold animate-pulse">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            Session Verified: +10 SkillCoins & +50 XP Awarded!
          </div>
        )}
      </div>

      {/* Real Google Meet / Zoom WebRTC Video Meeting Suite */}
      <RealVideoMeeting
        session={session}
        onComplete={handleSessionComplete}
      />

    </div>
  );
}
