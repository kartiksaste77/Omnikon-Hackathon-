import { NextResponse } from "next/server";
import { registerUser } from "@/lib/auth";

export async function POST(req) {
  try {
    const body = await req.json();
    const result = registerUser(body);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    const response = NextResponse.json({
      success: true,
      user: result.user,
      token: result.token
    });

    response.cookies.set("skillswap_token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/"
    });

    return response;
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
