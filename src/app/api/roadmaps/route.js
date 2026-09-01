import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateRoadmap, generateAiMentorResponse } from "@/lib/aiService";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req) {
  try {
    const currentUser = getCurrentUser(req);
    const roadmaps = db.getRoadmaps(currentUser.id);
    return NextResponse.json({ roadmaps });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const currentUser = getCurrentUser(req);

    // If chat prompt
    if (body.type === "CHAT") {
      const reply = generateAiMentorResponse(body.message, body.history);
      return NextResponse.json({ reply });
    }

    // Otherwise generate structured roadmap
    if (!body.goalSkill) {
      return NextResponse.json({ error: "goalSkill is required" }, { status: 400 });
    }

    const generated = generateRoadmap(body.goalSkill, body.targetWeeks || 4, body.weeklyHours || 6);
    const saved = db.createRoadmap({
      userId: currentUser.id,
      ...generated
    });

    return NextResponse.json({ success: true, roadmap: saved });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
