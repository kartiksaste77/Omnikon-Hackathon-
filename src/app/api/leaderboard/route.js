import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const users = db.getUsers();
    
    // Sort by XP descending for leaderboard
    const leaderboard = [...users]
      .sort((a, b) => (b.xp || 0) - (a.xp || 0))
      .map((u, idx) => ({
        rank: idx + 1,
        id: u.id,
        name: u.name,
        avatar: u.avatar,
        role: u.role,
        department: u.department,
        xp: u.xp || 100,
        coins: u.coins || 50,
        rating: u.rating || 5.0,
        completedHours: u.completedHours || 0,
        streak: u.streak || 1,
        badges: u.badges || []
      }));

    return NextResponse.json({ leaderboard });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
