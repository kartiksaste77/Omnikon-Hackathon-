// api/auth/login/route.js
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    if (!email || !password)
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user)
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

    const secret = process.env.JWT_SECRET || "skillswap_jwt_secret_key_2026_omnikon_hackathon";
    const token = jwt.sign({ userId: user.id }, secret, { expiresIn: "7d" });
    const { password: _, ...safeUser } = user;
    return NextResponse.json({ token, user: safeUser });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
