// api/transactions/send/route.js — Transfer SkillCoins between users
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest, unauthorized } from "@/lib/apiAuth";

export async function POST(req) {
  const senderId = getUserFromRequest(req);
  if (!senderId) return unauthorized();

  try {
    const { receiverId, amount, note } = await req.json();

    if (!receiverId || !amount) {
      return NextResponse.json({ error: "receiverId and amount required" }, { status: 400 });
    }
    if (amount < 1 || amount > 1000) {
      return NextResponse.json({ error: "Amount must be between 1 and 1000" }, { status: 400 });
    }
    if (receiverId === senderId) {
      return NextResponse.json({ error: "Cannot send coins to yourself" }, { status: 400 });
    }

    const sender = await prisma.user.findUnique({ where: { id: senderId } });
    const receiver = await prisma.user.findUnique({ where: { id: receiverId } });

    if (!sender || !receiver) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (sender.skillCoins < amount) {
      return NextResponse.json({ error: "Insufficient SkillCoins balance" }, { status: 400 });
    }

    // Atomic transaction: debit sender, credit receiver, log both
    const [senderTx, receiverTx] = await prisma.$transaction([
      // Debit sender
      prisma.transaction.create({
        data: {
          userId: senderId,
          type: "sent",
          amount: -amount,
          description: `Sent ${amount} SkillCoin${amount > 1 ? "s" : ""} to ${receiver.name}${note ? ` — "${note}"` : ""}`,
        },
      }),
      // Credit receiver
      prisma.transaction.create({
        data: {
          userId: receiverId,
          type: "received",
          amount: +amount,
          description: `Received ${amount} SkillCoin${amount > 1 ? "s" : ""} from ${sender.name}${note ? ` — "${note}"` : ""}`,
        },
      }),
      // Update balances
      prisma.user.update({
        where: { id: senderId },
        data: { skillCoins: { decrement: amount } },
      }),
      prisma.user.update({
        where: { id: receiverId },
        data: { skillCoins: { increment: amount } },
      }),
      // Notify receiver
      prisma.notification.create({
        data: {
          userId: receiverId,
          type: "skillcoin",
          content: `🪙 You received ${amount} SkillCoin${amount > 1 ? "s" : ""} from ${sender.name}!`,
          read: false,
        },
      }),
    ]);

    // Emit real-time notification to receiver
    try {
      if (global._io) {
        global._io.to(`user:${receiverId}`).emit("notification:new", {
          type: "skillcoin",
          content: `🪙 You received ${amount} SkillCoin${amount > 1 ? "s" : ""} from ${sender.name}!`,
          createdAt: new Date().toISOString(),
          read: false,
        });
      }
    } catch {}

    return NextResponse.json({
      success: true,
      newBalance: sender.skillCoins - amount,
      transaction: senderTx,
    }, { status: 201 });
  } catch (err) {
    console.error("Send coins error:", err);
    return NextResponse.json({ error: "Transaction failed" }, { status: 500 });
  }
}
