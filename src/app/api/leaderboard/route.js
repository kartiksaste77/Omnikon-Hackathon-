// api/leaderboard/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      avatar: true,
      xp: true,
      rating: true,
      streak: true,
      sessionsCompleted: true,
      skillCoins: true,
    },
    orderBy: { xp: "desc" },
    take: 50
  });

  const ranked = users.map((u, idx) => ({
    rank: idx + 1,
    ...u
  }));

  return NextResponse.json(ranked);
}
