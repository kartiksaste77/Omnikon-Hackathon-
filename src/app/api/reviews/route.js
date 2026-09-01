import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const mentorId = searchParams.get("mentorId");
    const reviews = db.getReviews(mentorId);
    return NextResponse.json({ reviews });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const currentUser = getCurrentUser(req);

    if (!body.mentorId || !body.rating) {
      return NextResponse.json({ error: "mentorId and rating are required" }, { status: 400 });
    }

    const review = db.createReview({
      learnerId: currentUser.id,
      learnerName: currentUser.name,
      learnerAvatar: currentUser.avatar,
      ...body
    });

    return NextResponse.json({ success: true, review });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
