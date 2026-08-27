// api/connections/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest, unauthorized } from "@/lib/apiAuth";

export async function GET(req) {
  const userId = getUserFromRequest(req);
  if (!userId) return unauthorized();

  const connections = await prisma.connection.findMany({
    where: {
      OR: [{ senderId: userId }, { receiverId: userId }]
    },
    include: {
      sender: { select: { id: true, name: true, avatar: true, rating: true, bio: true } },
      receiver: { select: { id: true, name: true, avatar: true, rating: true, bio: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(connections);
}

export async function POST(req) {
  const userId = getUserFromRequest(req);
  if (!userId) return unauthorized();

  try {
    const { receiverId } = await req.json();
    if (!receiverId || receiverId === userId) {
      return NextResponse.json({ error: "Invalid receiver" }, { status: 400 });
    }

    const existing = await prisma.connection.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId },
          { senderId: receiverId, receiverId: userId }
        ]
      }
    });

    if (existing) {
      return NextResponse.json(existing);
    }

    const connection = await prisma.connection.create({
      data: {
        senderId: userId,
        receiverId,
        status: "pending"
      },
      include: {
        receiver: { select: { id: true, name: true, avatar: true } }
      }
    });

    // Add notification
    const sender = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: "connection_request",
        content: `${sender?.name || "Someone"} sent you a connection request`
      }
    });

    return NextResponse.json(connection, { status: 201 });
  } catch (err) {
    console.error("Connection request error:", err);
    return NextResponse.json({ error: "Failed to send connection request" }, { status: 500 });
  }
}
