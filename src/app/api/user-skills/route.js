// api/user-skills/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest, unauthorized } from "@/lib/apiAuth";

export async function GET(req) {
  const userId = getUserFromRequest(req);
  if (!userId) return unauthorized();

  const userSkills = await prisma.userSkill.findMany({
    where: { userId },
    include: { skill: true },
  });
  return NextResponse.json(userSkills);
}

export async function POST(req) {
  const userId = getUserFromRequest(req);
  if (!userId) return unauthorized();

  try {
    const { skillId, type, proficiency = "intermediate" } = await req.json();
    if (!skillId || !type) {
      return NextResponse.json({ error: "skillId and type required" }, { status: 400 });
    }

    const userSkill = await prisma.userSkill.upsert({
      where: {
        userId_skillId_type: { userId, skillId, type }
      },
      update: { proficiency },
      create: { userId, skillId, type, proficiency },
      include: { skill: true }
    });

    return NextResponse.json(userSkill, { status: 201 });
  } catch (err) {
    console.error("Add skill error:", err);
    return NextResponse.json({ error: "Failed to add skill" }, { status: 500 });
  }
}

export async function DELETE(req) {
  const userId = getUserFromRequest(req);
  if (!userId) return unauthorized();

  try {
    const { searchParams } = new URL(req.url);
    const skillId = searchParams.get("skillId");
    const type = searchParams.get("type");

    if (!skillId || !type) {
      return NextResponse.json({ error: "skillId and type required" }, { status: 400 });
    }

    await prisma.userSkill.deleteMany({
      where: { userId, skillId, type }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete skill error:", err);
    return NextResponse.json({ error: "Failed to remove skill" }, { status: 500 });
  }
}
