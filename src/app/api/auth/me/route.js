// api/auth/me/route.js — get current user from JWT
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest, unauthorized } from "@/lib/apiAuth";

export async function GET(req) {
  const userId = getUserFromRequest(req);
  if (!userId) return unauthorized();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return unauthorized();
  const { password: _, ...safe } = user;
  return NextResponse.json(safe);
}
