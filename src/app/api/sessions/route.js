// api/sessions/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest, unauthorized } from "@/lib/apiAuth";

export async function GET(req) {
  const userId = getUserFromRequest(req);
  if (!userId) return unauthorized();

  const sessions = await prisma.session.findMany({
    where: {
      OR: [{ mentorId: userId }, { learnerId: userId }]
    },
    include: {
      mentor: { select: { id: true, name: true, avatar: true, rating: true } },
      learner: { select: { id: true, name: true, avatar: true, rating: true } },
      skill: true
    },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(sessions);
}

export async function POST(req) {
  const userId = getUserFromRequest(req);
  if (!userId) return unauthorized();

  try {
    const { peerId, skillId, topic, date, time = "16:00", duration = 60, role = "teach" } = await req.json();

    if (!peerId || !date) {
      return NextResponse.json({ error: "peerId and date required" }, { status: 400 });
    }

    const mentorId = role === "teach" ? userId : peerId;
    const learnerId = role === "teach" ? peerId : userId;

    const session = await prisma.session.create({
      data: {
        mentorId,
        learnerId,
        skillId: skillId || null,
        topic: topic || "Skill Exchange Session",
        date,
        time,
        duration: parseInt(duration, 10) || 60,
        status: "upcoming"
      },
      include: {
        mentor: { select: { id: true, name: true, avatar: true } },
        learner: { select: { id: true, name: true, avatar: true } },
        skill: true
      }
    });

    // Notify both parties
    const otherUserId = userId === mentorId ? learnerId : mentorId;
    const currentUser = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    const notifContent = `📅 New session scheduled: "${session.topic}" on ${date} at ${time}`;
    
    const notif = await prisma.notification.create({
      data: { userId: otherUserId, type: "session", content: notifContent, read: false }
    });
    try {
      if (global._io) {
        global._io.to(`user:${otherUserId}`).emit("notification:new", notif);
      }
    } catch {}

    return NextResponse.json(session, { status: 201 });
  } catch (err) {
    console.error("Create session error:", err);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}
