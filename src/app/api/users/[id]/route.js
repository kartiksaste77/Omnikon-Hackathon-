// api/users/[id]/route.js — Public user profile endpoint
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/apiAuth";

export async function GET(req, { params }) {
  const { id } = await params;
  const viewerId = getUserFromRequest(req);

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      userSkills: { include: { skill: true } },
      receivedReviews: {
        include: {
          reviewer: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      mentorSessions: { where: { status: "completed" }, select: { id: true } },
      learnerSessions: { where: { status: "completed" }, select: { id: true } },
      sentConnections: viewerId
        ? { where: { receiverId: viewerId }, select: { status: true } }
        : false,
      recvConnections: viewerId
        ? { where: { senderId: viewerId }, select: { status: true } }
        : false,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Determine connection status between viewer and this user
  let connectionStatus = null;
  if (viewerId && viewerId !== id) {
    const sent = user.sentConnections?.[0];
    const recv = user.recvConnections?.[0];
    if (sent) connectionStatus = `sent:${sent.status}`;
    else if (recv) connectionStatus = `received:${recv.status}`;
  }

  const { password, ...safe } = user;

  return NextResponse.json({
    ...safe,
    teachSkills: user.userSkills.filter((s) => s.type === "teach"),
    learnSkills: user.userSkills.filter((s) => s.type === "learn"),
    totalSessionsCompleted: user.mentorSessions.length + user.learnerSessions.length,
    connectionStatus,
    isOwnProfile: viewerId === id,
  });
}

export async function PATCH(req, { params }) {
  const { id } = await params;
  const viewerId = getUserFromRequest(req);
  if (!viewerId || viewerId !== id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const updates = await req.json();
    const allowed = ["name", "bio", "location", "avatar"];
    const data = Object.fromEntries(
      Object.entries(updates).filter(([k]) => allowed.includes(k))
    );

    const updated = await prisma.user.update({ where: { id }, data });
    const { password, ...safe } = updated;
    return NextResponse.json(safe);
  } catch (err) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
