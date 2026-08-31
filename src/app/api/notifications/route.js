// api/notifications/route.js — Get, create, and mark notifications
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest, unauthorized } from "@/lib/apiAuth";

// GET /api/notifications — List notifications for current user
export async function GET(req) {
  const userId = getUserFromRequest(req);
  if (!userId) return unauthorized();

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(notifications);
}

// POST /api/notifications — Create a new notification (internal use)
export async function POST(req) {
  const userId = getUserFromRequest(req);
  if (!userId) return unauthorized();

  try {
    const { targetUserId, type, content } = await req.json();
    if (!targetUserId || !type || !content) {
      return NextResponse.json({ error: "targetUserId, type, and content required" }, { status: 400 });
    }

    const notification = await prisma.notification.create({
      data: {
        userId: targetUserId,
        type,
        content,
        read: false,
      },
    });

    // Emit real-time notification via Socket.io if server available
    try {
      if (global._io) {
        global._io.to(`user:${targetUserId}`).emit("notification:new", notification);
      }
    } catch (socketErr) {
      console.warn("Socket emit failed:", socketErr.message);
    }

    return NextResponse.json(notification, { status: 201 });
  } catch (err) {
    console.error("Create notification error:", err);
    return NextResponse.json({ error: "Failed to create notification" }, { status: 500 });
  }
}

// PATCH /api/notifications — Mark all as read
export async function PATCH(req) {
  const userId = getUserFromRequest(req);
  if (!userId) return unauthorized();

  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });

  return NextResponse.json({ success: true });
}
