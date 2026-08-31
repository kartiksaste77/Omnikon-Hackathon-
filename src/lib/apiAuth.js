// lib/apiAuth.js — JWT verification helper for API routes
import jwt from "jsonwebtoken";

export function getUserFromRequest(req) {
  try {
    const auth = req.headers.get("authorization") || "";
    const token = auth.replace("Bearer ", "").trim();
    const secret = process.env.JWT_SECRET || "skillswap_jwt_secret_key_2026_omnikon_hackathon";
    const decoded = jwt.verify(token, secret);
    return decoded.userId;
  } catch {
    return null;
  }
}

export function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
