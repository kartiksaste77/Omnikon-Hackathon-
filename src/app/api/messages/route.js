import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req) {
  try {
    const currentUser = getCurrentUser(req);
    const { searchParams } = new URL(req.url);
    const partnerId = searchParams.get("partnerId");

    if (partnerId) {
      const messages = db.getConversation(currentUser.id, partnerId);
      return NextResponse.json({ messages });
    }

    // Return all connected chat partners with last message
    const partners = db.getRecentChatPartners(currentUser.id);
    return NextResponse.json({ partners });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const currentUser = getCurrentUser(req);
    const body = await req.json();
    const { receiverId, content } = body;

    if (!receiverId || !content) {
      return NextResponse.json({ error: "receiverId and content are required" }, { status: 400 });
    }

    const message = db.sendMessage(currentUser.id, receiverId, content);
    return NextResponse.json({ success: true, message });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
