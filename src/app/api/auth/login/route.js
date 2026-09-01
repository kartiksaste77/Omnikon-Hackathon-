import { NextResponse } from "next/server";
import { loginUser } from "@/lib/auth";

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    const result = loginUser(email, password);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 401 });
    }

    const response = NextResponse.json({
      success: true,
      user: result.user,
      token: result.token
    });

    // Set secure cookie
    response.cookies.set("skillswap_token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/"
    });

    return response;
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
