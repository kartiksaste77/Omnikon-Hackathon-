import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req) {
  try {
    const user = getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { passwordHash, ...safeUser } = user;
    return NextResponse.json({ success: true, user: safeUser });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
