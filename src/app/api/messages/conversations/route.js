// api/messages/conversations/route.js — Get all conversations for current user
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest, unauthorized } from "@/lib/apiAuth";

export async function GET(req) {
  const userId = getUserFromRequest(req);
  if (!userId) return unauthorized();

  // Get all messages involving this user
  const messages = await prisma.message.findMany({
    where: {
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
    include: {
      sender: { select: { id: true, name: true, location: true } },
      receiver: { select: { id: true, name: true, location: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Build conversation map: partnerId → latest message + unread count
  const convMap = new Map();
  for (const msg of messages) {
    const partner = msg.senderId === userId ? msg.receiver : msg.sender;
    if (partner && !convMap.has(partner.id)) {
      convMap.set(partner.id, {
        partnerId: partner.id,
        partnerName: partner.name,
        partnerLocation: partner.location || "",
        lastMessage: msg.content,
        lastMessageAt: msg.createdAt,
        unreadCount: 0,
      });
    }
    // Count unread (messages sent to me, not read)
    if (partner && msg.receiverId === userId && !msg.read) {
      const conv = convMap.get(partner.id);
      if (conv) conv.unreadCount = (conv.unreadCount || 0) + 1;
    }
  }

  // Also fetch all accepted connections for this user so they appear in conversation sidebar
  const connections = await prisma.connection.findMany({
    where: {
      OR: [{ senderId: userId }, { receiverId: userId }],
      status: "accepted",
    },
    include: {
      sender: { select: { id: true, name: true, location: true } },
      receiver: { select: { id: true, name: true, location: true } },
    },
  });

  for (const conn of connections) {
    const partner = conn.senderId === userId ? conn.receiver : conn.sender;
    if (partner && !convMap.has(partner.id)) {
      convMap.set(partner.id, {
        partnerId: partner.id,
        partnerName: partner.name,
        partnerLocation: partner.location || "",
        lastMessage: "Start a conversation",
        lastMessageAt: conn.updatedAt || new Date(0),
        unreadCount: 0,
      });
    }
  }

  // Fallback: If no connections yet, load other platform users so chatting is always possible
  if (convMap.size === 0) {
    const otherUsers = await prisma.user.findMany({
      where: { id: { not: userId } },
      select: { id: true, name: true, location: true },
      take: 10,
    });
    for (const u of otherUsers) {
      convMap.set(u.id, {
        partnerId: u.id,
        partnerName: u.name,
        partnerLocation: u.location || "",
        lastMessage: "Start a conversation",
        lastMessageAt: new Date(0),
        unreadCount: 0,
      });
    }
  }

  const conversations = Array.from(convMap.values()).sort(
    (a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0)
  );

  return NextResponse.json(conversations);
}
