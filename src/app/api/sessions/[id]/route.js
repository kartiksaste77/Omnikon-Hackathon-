// api/sessions/[id]/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest, unauthorized } from "@/lib/apiAuth";

export async function GET(req, { params }) {
  const userId = getUserFromRequest(req);
  if (!userId) return unauthorized();

  const { id } = await params;
  const session = await prisma.session.findUnique({
    where: { id },
    include: {
      mentor: { select: { id: true, name: true, avatar: true, rating: true } },
      learner: { select: { id: true, name: true, avatar: true, rating: true } },
      skill: true,
      reviews: true,
    },
  });

  if (!session) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, avatar: true, rating: true } });
    return NextResponse.json({
      id,
      topic: "Instant Live Video Skill Exchange",
      date: "Today",
      time: "Live Now",
      duration: 60,
      status: "upcoming",
      mentorId: userId,
      learnerId: "peer-demo",
      mentor: user || { id: userId, name: "You", avatar: null, rating: 5 },
      learner: { id: "peer-demo", name: "Peer Participant", avatar: null, rating: 5.0 },
      skill: { name: "Live Skill Share" },
      reviews: []
    });
  }

  return NextResponse.json(session);
}

export async function PATCH(req, { params }) {
  const userId = getUserFromRequest(req);
  if (!userId) return unauthorized();

  try {
    const { id } = await params;
    const { status } = await req.json(); // "completed" | "cancelled"
    if (!["completed", "cancelled"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const session = await prisma.session.findUnique({
      where: { id },
      include: { mentor: true, learner: true },
    });

    if (!session || (session.mentorId !== userId && session.learnerId !== userId)) {
      return NextResponse.json({ error: "Unauthorized or not found" }, { status: 404 });
    }

    const updated = await prisma.session.update({
      where: { id },
      data: { status },
    });

    // If completed, award SkillCoins & XP
    if (status === "completed" && session.status !== "completed") {
      // Mentor gets 10 coins + 10 XP
      await prisma.user.update({
        where: { id: session.mentorId },
        data: {
          skillCoins: { increment: 10 },
          xp: { increment: 10 },
          sessionsCompleted: { increment: 1 },
        },
      });
      await prisma.transaction.create({
        data: {
          userId: session.mentorId,
          type: "earned",
          amount: 10,
          description: `Taught session: ${session.topic}`,
        },
      });

      // Learner gets 5 coins + 5 XP
      await prisma.user.update({
        where: { id: session.learnerId },
        data: {
          skillCoins: { increment: 5 },
          xp: { increment: 5 },
          sessionsCompleted: { increment: 1 },
        },
      });
      await prisma.transaction.create({
        data: {
          userId: session.learnerId,
          type: "earned",
          amount: 5,
          description: `Completed learning: ${session.topic}`,
        },
      });
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Update session error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
