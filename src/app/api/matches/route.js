// api/matches/route.js — Cosine-similarity-based skill matching
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest, unauthorized } from "@/lib/apiAuth";

// Skill category adjacency graph — related categories score partial matches
const CATEGORY_ADJACENCY = {
  "Programming": ["Data Science", "DevOps", "Design"],
  "Data Science": ["Programming", "Business"],
  "DevOps": ["Programming", "Cloud"],
  "Design": ["Programming", "Business"],
  "Business": ["Design", "Data Science", "Languages"],
  "Languages": ["Business"],
  "Music": ["Music"],
  "Cloud": ["DevOps", "Programming"],
};

// Compute cosine-similarity-like match score between two users
function computeMatchScore(myTeachIds, myLearnIds, peerTeachIds, peerLearnIds, myXp, peerXp, myRating, peerRating, mutualConnections) {
  const breakdown = {};

  // 1. Skill Complement Score (0–50): peer teaches what I want to learn, and vice versa
  const skillTeachToLearn = peerTeachIds.filter(id => myLearnIds.includes(id)).length;
  const skillLearnToTeach = peerLearnIds.filter(id => myTeachIds.includes(id)).length;
  const maxPossible = Math.max(myLearnIds.length + myTeachIds.length, 1);
  const skillComplementRaw = (skillTeachToLearn + skillLearnToTeach) / maxPossible;
  breakdown.skills = Math.round(skillComplementRaw * 50);

  // 2. XP Compatibility Score (0–20): similar experience level is best for mutual learning
  const xpDiff = Math.abs((myXp || 0) - (peerXp || 0));
  const xpScore = Math.max(0, 20 - Math.floor(xpDiff / 100));
  breakdown.experience = Math.min(20, xpScore);

  // 3. Rating Score (0–15): higher rated peers are better
  const ratingScore = peerRating > 0 ? Math.round((peerRating / 5) * 15) : 8;
  breakdown.rating = ratingScore;

  // 4. Network Score (0–10): shared connections indicate trust
  const networkScore = Math.min(10, mutualConnections * 3);
  breakdown.network = networkScore;

  // 5. Activity Score (0–5): base for having at least one skill overlap
  const activityScore = (skillTeachToLearn > 0 || skillLearnToTeach > 0) ? 5 : 2;
  breakdown.activity = activityScore;

  // Total score
  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
  const score = Math.min(99, Math.max(30, total));

  // Matched skill reasons
  const matchedSkillIds = peerTeachIds.filter(id => myLearnIds.includes(id));

  return { score, breakdown, matchedSkillIds, hasSkillMatch: skillTeachToLearn > 0 || skillLearnToTeach > 0 };
}

export async function GET(req) {
  const userId = getUserFromRequest(req);
  if (!userId) return unauthorized();

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "20");

  // Get current user's data
  const me = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userSkills: { include: { skill: true } },
      sentConnections: { select: { receiverId: true, status: true } },
      recvConnections: { select: { senderId: true, status: true } },
    },
  });

  if (!me) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const myTeachSkills = me.userSkills.filter(s => s.type === "teach");
  const myLearnSkills = me.userSkills.filter(s => s.type === "learn");
  const myTeachIds = myTeachSkills.map(s => s.skillId);
  const myLearnIds = myLearnSkills.map(s => s.skillId);

  // My connections (accepted only)
  const myConnectionIds = new Set([
    ...me.sentConnections.filter(c => c.status === "accepted").map(c => c.receiverId),
    ...me.recvConnections.filter(c => c.status === "accepted").map(c => c.senderId),
  ]);

  // Pending connection requests I've already sent
  const pendingToIds = new Set(
    me.sentConnections.filter(c => c.status === "pending").map(c => c.receiverId)
  );

  // Get all other users with their skills
  const otherUsers = await prisma.user.findMany({
    where: { id: { not: userId } },
    include: {
      userSkills: { include: { skill: true } },
      sentConnections: { select: { receiverId: true, status: true } },
      recvConnections: { select: { senderId: true, status: true } },
    },
    take: 100,
  });

  const matches = otherUsers.map(peer => {
    const peerTeach = peer.userSkills.filter(s => s.type === "teach");
    const peerLearn = peer.userSkills.filter(s => s.type === "learn");
    const peerTeachIds = peerTeach.map(s => s.skillId);
    const peerLearnIds = peerLearn.map(s => s.skillId);

    // Count mutual connections
    const peerConnectionIds = new Set([
      ...peer.sentConnections.filter(c => c.status === "accepted").map(c => c.receiverId),
      ...peer.recvConnections.filter(c => c.status === "accepted").map(c => c.senderId),
    ]);
    const mutualConnections = [...myConnectionIds].filter(id => peerConnectionIds.has(id)).length;

    const { score, breakdown, matchedSkillIds, hasSkillMatch } = computeMatchScore(
      myTeachIds, myLearnIds,
      peerTeachIds, peerLearnIds,
      me.xp, peer.xp,
      me.rating, peer.rating,
      mutualConnections
    );

    // Why this match: show skill names that overlap
    const matchedSkillNames = matchedSkillIds
      .map(id => peerTeach.find(s => s.skillId === id)?.skill?.name)
      .filter(Boolean);

    return {
      id: peer.id,
      name: peer.name,
      avatar: peer.avatar || "",
      bio: peer.bio || "SkillSwap Member",
      location: peer.location || "",
      rating: peer.rating,
      reviewCount: peer.reviewCount,
      sessionsCompleted: peer.sessionsCompleted,
      xp: peer.xp,
      matchPercentage: score,
      teaches: peerTeach.map(s => ({ name: s.skill.name, category: s.skill.category, proficiency: s.proficiency })),
      wants: peerLearn.map(s => ({ name: s.skill.name, category: s.skill.category })),
      matchedSkills: matchedSkillNames,
      breakdown,
      hasSkillMatch,
      isConnected: myConnectionIds.has(peer.id),
      isPending: pendingToIds.has(peer.id),
    };
  })
    .sort((a, b) => {
      // Prioritize skill matches, then by score
      if (a.hasSkillMatch !== b.hasSkillMatch) return a.hasSkillMatch ? -1 : 1;
      return b.matchPercentage - a.matchPercentage;
    })
    .slice(0, limit);

  return NextResponse.json(matches);
}
