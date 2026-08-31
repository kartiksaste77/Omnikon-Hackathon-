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
    if (!convMap.has(partner.id)) {
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
    if (msg.receiverId === userId && !msg.read) {
      const conv = convMap.get(partner.id);
      conv.unreadCount = (conv.unreadCount || 0) + 1;
    }
  }

  const conversations = Array.from(convMap.values()).sort(
    (a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
  );

  return NextResponse.json(conversations);
}
