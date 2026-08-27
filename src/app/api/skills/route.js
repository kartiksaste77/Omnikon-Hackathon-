// api/skills/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const category = searchParams.get("category");

  const where = {};
  if (category) where.category = category;
  if (q) where.name = { contains: q };

  const skills = await prisma.skill.findMany({ where, orderBy: { category: "asc" } });
  return NextResponse.json(skills);
}
