import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculateMatchScore } from "@/lib/matchEngine";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req) {
  try {
    const currentUser = getCurrentUser(req);
    const allUsers = db.getUsers();

    // Calculate match score against all other peers
    const matches = allUsers
      .filter((u) => u.id !== currentUser.id)
      .map((peer) => {
        const matchResult = calculateMatchScore(currentUser, peer);
        return {
          peer,
          matchScore: matchResult.score,
          isHighMatch: matchResult.isHighMatch,
          reasons: matchResult.reasons,
          complementarySkills: matchResult.complementarySkills
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);

    return NextResponse.json({ matches, currentUser });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
