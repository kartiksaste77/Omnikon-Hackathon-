// api/transactions/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest, unauthorized } from "@/lib/apiAuth";

export async function GET(req) {
  const userId = getUserFromRequest(req);
  if (!userId) return unauthorized();

  const transactions = await prisma.transaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(transactions);
}
