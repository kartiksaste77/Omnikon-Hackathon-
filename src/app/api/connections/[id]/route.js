// api/connections/[id]/route.js — Accept or reject a connection request
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest, unauthorized } from "@/lib/apiAuth";

export async function PATCH(req, { params }) {
  const userId = getUserFromRequest(req);
  if (!userId) return unauthorized();

  try {
    const { id } = await params;
    const { status } = await req.json(); // "accepted" | "rejected"
    if (!["accepted", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const connection = await prisma.connection.findUnique({
      where: { id },
      include: {
        receiver: { select: { id: true, name: true } },
        sender: { select: { id: true, name: true } },
      },
    });

    if (!connection || (connection.receiverId !== userId && connection.senderId !== userId)) {
      return NextResponse.json({ error: "Connection not found or unauthorized" }, { status: 404 });
    }

    const updated = await prisma.connection.update({
      where: { id },
      data: { status },
      include: {
        receiver: { select: { id: true, name: true, avatar: true } },
        sender: { select: { id: true, name: true, avatar: true } },
      },
    });

    // Notify the other party when accepted
    if (status === "accepted") {
      const otherUserId = connection.senderId === userId ? connection.receiverId : connection.senderId;
      const currentUser = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });

      const notif = await prisma.notification.create({
        data: {
          userId: otherUserId,
          type: "connection",
          content: `🎉 ${currentUser?.name || "Someone"} accepted your connection request!`,
          read: false,
        },
      });

      try {
        if (global._io) {
          global._io.to(`user:${otherUserId}`).emit("notification:new", notif);
        }
      } catch {}
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Update connection error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
