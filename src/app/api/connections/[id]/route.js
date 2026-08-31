// api/connections/[id]/route.js — Accept or reject a connection request
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest, unauthorized } from "@/lib/apiAuth";

export async function PATCH(req, { params }) {
  const userId = getUserFromRequest(req);
  if (!userId) return unauthorized();

  try {
    const { status } = await req.json(); // "accepted" | "rejected"
    if (!["accepted", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const connection = await prisma.connection.findUnique({
      where: { id: params.id },
      include: {
        receiver: { select: { id: true, name: true } },
        sender: { select: { id: true, name: true } },
      }
    });

    if (!connection || (connection.receiverId !== userId && connection.senderId !== userId)) {
      return NextResponse.json({ error: "Connection not found or unauthorized" }, { status: 404 });
    }

    const updated = await prisma.connection.update({
      where: { id: params.id },
      data: { status }
    });

    // Notify the original sender that their request was accepted
    if (status === "accepted") {
      const notif = await prisma.notification.create({
        data: {
          userId: connection.senderId,
          type: "connection",
          content: `🎉 ${connection.receiver.name} accepted your connection request!`,
          read: false,
        },
      });
      try {
        if (global._io) {
          global._io.to(`user:${connection.senderId}`).emit("notification:new", notif);
        }
      } catch {}
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Update connection error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
