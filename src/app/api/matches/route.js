// api/matches/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest, unauthorized } from "@/lib/apiAuth";

export async function GET(req) {
  const userId = getUserFromRequest(req);
  if (!userId) return unauthorized();

  // Get current user's skills
  const mySkills = await prisma.userSkill.findMany({
    where: { userId },
    include: { skill: true }
  });

  const myTeachSkillIds = mySkills.filter(s => s.type === "teach").map(s => s.skillId);
  const myLearnSkillIds = mySkills.filter(s => s.type === "learn").map(s => s.skillId);

  // Get all other users with their skills
  const otherUsers = await prisma.user.findMany({
    where: { id: { not: userId } },
    include: {
      userSkills: { include: { skill: true } },
      receivedReviews: true
    }
  });

  const matches = otherUsers.map(peer => {
    const peerTeach = peer.userSkills.filter(s => s.type === "teach");
    const peerLearn = peer.userSkills.filter(s => s.type === "learn");

    const peerTeachSkillIds = peerTeach.map(s => s.skillId);
    const peerLearnSkillIds = peerLearn.map(s => s.skillId);

    // Mutual skill match score
    const teachToLearnMatches = peerTeachSkillIds.filter(id => myLearnSkillIds.includes(id));
    const learnToTeachMatches = peerLearnSkillIds.filter(id => myTeachSkillIds.includes(id));

    let score = 50; // base score
    if (teachToLearnMatches.length > 0) score += 25;
    if (learnToTeachMatches.length > 0) score += 20;
    if (peer.rating >= 4.5) score += 5;

    const matchPercentage = Math.min(99, score);

    return {
      id: peer.id,
      name: peer.name,
      avatar: peer.avatar,
      bio: peer.bio || "SkillSwap Member",
      rating: peer.rating,
      reviewCount: peer.reviewCount,
      sessionsCompleted: peer.sessionsCompleted,
      matchPercentage,
      teaches: peerTeach.map(s => s.skill.name),
      wants: peerLearn.map(s => s.skill.name),
    };
  }).sort((a, b) => b.matchPercentage - a.matchPercentage);

  return NextResponse.json(matches);
}
