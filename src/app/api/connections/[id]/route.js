// api/connections/[id]/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest, unauthorized } from "@/lib/apiAuth";

export async function PATCH(req, { params }) {
  const userId = getUserFromRequest(req);
  if (!userId) return unauthorized();

  try {
    const { status } = await req.json(); // "accepted" | "rejected"
    if (!["accepted", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const connection = await prisma.connection.findUnique({
      where: { id: params.id }
    });

    if (!connection || (connection.receiverId !== userId && connection.senderId !== userId)) {
      return NextResponse.json({ error: "Connection not found or unauthorized" }, { status: 404 });
    }

    const updated = await prisma.connection.update({
      where: { id: params.id },
      data: { status }
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Update connection error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
