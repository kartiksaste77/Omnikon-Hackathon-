import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const sessions = db.getSessions(userId);
    return NextResponse.json({ sessions });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const currentUser = getCurrentUser(req);

    if (!body.mentorId || !body.skillTitle) {
      return NextResponse.json({ error: "mentorId and skillTitle are required" }, { status: 400 });
    }

    const mentor = db.getUserById(body.mentorId);

    const sessionData = {
      mentorId: body.mentorId,
      mentorName: mentor?.name || body.mentorName || "Peer Mentor",
      mentorAvatar: mentor?.avatar || body.mentorAvatar,
      learnerId: currentUser.id,
      learnerName: currentUser.name,
      learnerAvatar: currentUser.avatar,
      skillTitle: body.skillTitle,
      category: body.category || "General",
      scheduledAt: body.scheduledAt || new Date(Date.now() + 3600000 * 24).toISOString(),
      type: body.type || "VIRTUAL",
      notes: body.notes || "Collaborative peer session booked via SkillSwap."
    };

    const newSession = db.createSession(sessionData);
    return NextResponse.json({ success: true, session: newSession });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
