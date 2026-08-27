// api/messages/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest, unauthorized } from "@/lib/apiAuth";

export async function GET(req) {
  const userId = getUserFromRequest(req);
  if (!userId) return unauthorized();

  const { searchParams } = new URL(req.url);
  const partnerId = searchParams.get("partnerId");

  if (!partnerId) {
    // Get all conversations
    const messages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }]
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
        receiver: { select: { id: true, name: true, avatar: true } }
      },
      orderBy: { createdAt: "asc" }
    });
    return NextResponse.json(messages);
  }

  // Get conversation with specific partner
  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: userId, receiverId: partnerId },
        { senderId: partnerId, receiverId: userId }
      ]
    },
    orderBy: { createdAt: "asc" }
  });

  // Mark unread messages as read
  await prisma.message.updateMany({
    where: {
      senderId: partnerId,
      receiverId: userId,
      read: false
    },
    data: { read: true }
  });

  return NextResponse.json(messages);
}

export async function POST(req) {
  const userId = getUserFromRequest(req);
  if (!userId) return unauthorized();

  try {
    const { receiverId, content } = await req.json();
    if (!receiverId || !content?.trim()) {
      return NextResponse.json({ error: "Receiver and content required" }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        senderId: userId,
        receiverId,
        content: content.trim(),
        read: false
      }
    });

    return NextResponse.json(message, { status: 201 });
  } catch (err) {
    console.error("Send message error:", err);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
