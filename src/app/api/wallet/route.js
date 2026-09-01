import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req) {
  try {
    const currentUser = getCurrentUser(req);
    const transactions = db.getTransactions(currentUser.id);
    const user = db.getUserById(currentUser.id);

    return NextResponse.json({
      coins: user?.coins || 50,
      xp: user?.xp || 100,
      completedHours: user?.completedHours || 0,
      transactions
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
