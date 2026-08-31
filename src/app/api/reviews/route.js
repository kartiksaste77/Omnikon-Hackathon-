// api/reviews/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest, unauthorized } from "@/lib/apiAuth";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  const where = userId ? { revieweeId: userId } : {};

  const reviews = await prisma.review.findMany({
    where,
    include: {
      reviewer: { select: { id: true, name: true, avatar: true } },
      session: { select: { topic: true, date: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(reviews);
}

export async function POST(req) {
  const userId = getUserFromRequest(req);
  if (!userId) return unauthorized();

  try {
    const { sessionId, revieweeId, rating, feedback = "" } = await req.json();

    if (!sessionId || !revieweeId || !rating) {
      return NextResponse.json({ error: "Missing required review fields" }, { status: 400 });
    }

    const review = await prisma.review.create({
      data: {
        sessionId,
        reviewerId: userId,
        revieweeId,
        rating: Math.min(5, Math.max(1, parseInt(rating, 10))),
        feedback
      }
    });

    // Recompute reviewee's average rating
    const allReviews = await prisma.review.findMany({
      where: { revieweeId }
    });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await prisma.user.update({
      where: { id: revieweeId },
      data: {
        rating: Math.round(avgRating * 10) / 10,
        reviewCount: allReviews.length
      }
    });

    const reviewer = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    const stars = "⭐".repeat(review.rating);
    const notif = await prisma.notification.create({
      data: {
        userId: revieweeId,
        type: "review",
        content: `${stars} ${reviewer?.name} left you a ${review.rating}-star review!`,
        read: false,
      }
    });
    try {
      if (global._io) {
        global._io.to(`user:${revieweeId}`).emit("notification:new", notif);
      }
    } catch {}

    return NextResponse.json(review, { status: 201 });
  } catch (err) {
    console.error("Create review error:", err);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
