// api/users/[id]/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest, unauthorized } from "@/lib/apiAuth";

export async function GET(req, { params }) {
  const userId = getUserFromRequest(req);
  if (!userId) return unauthorized();
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      userSkills: { include: { skill: true } },
      receivedReviews: { include: { reviewer: { select: { name: true, avatar: true } } } },
    },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const { password: _, ...safe } = user;
  return NextResponse.json(safe);
}

export async function PATCH(req, { params }) {
  const userId = getUserFromRequest(req);
  if (!userId || userId !== params.id) return unauthorized();
  const data = await req.json();
  const { password: _, email: __, ...safeData } = data;
  const updated = await prisma.user.update({ where: { id: params.id }, data: safeData });
  const { password: _p, ...safe } = updated;
  return NextResponse.json(safe);
}
