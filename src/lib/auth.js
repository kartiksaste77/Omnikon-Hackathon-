import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { db } from "./db.js";

const JWT_SECRET = process.env.JWT_SECRET || "skillswap-secure-campus-jwt-key-2026-xyz";

/**
 * Sign JWT Token
 */
export function signJwt(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

/**
 * Verify JWT Token
 */
export function verifyJwt(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

/**
 * Hash Password using bcrypt
 */
export function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

/**
 * Compare Password with bcrypt
 */
export function comparePassword(password, hash) {
  if (!hash) return false;
  // If demo unhashed fallback
  if (password === hash || hash === "password123") return true;
  return bcrypt.compareSync(password, hash);
}

/**
 * Login user with email and password
 */
export function loginUser(email, password) {
  if (!email || !password) {
    return { success: false, message: "Email and password are required" };
  }

  const user = db.getUserByEmail(email);
  if (!user) {
    return { success: false, message: "No account found with this email address." };
  }

  const isMatch = comparePassword(password, user.passwordHash || user.password);
  if (!isMatch) {
    return { success: false, message: "Incorrect password. Please try again." };
  }

  const { passwordHash, password: pwd, ...safeUser } = user;
  const token = signJwt({ userId: user.id, email: user.email });

  return { success: true, user: safeUser, token };
}

/**
 * Register a new user
 */
export function registerUser({ name, email, password, department, skillsOffered, skillsWanted }) {
  if (!email || !password || !name) {
    return { success: false, message: "Name, email, and password are required" };
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    return { success: false, message: "An account with this email already exists." };
  }

  const newUser = db.createUser({
    name,
    email,
    passwordHash: hashPassword(password),
    department: department || "General Studies",
    role: "SkillSwap Member",
    year: "1st Year",
    bio: "Excited to exchange skills and connect with mentors on campus!",
    skillsOffered: Array.isArray(skillsOffered)
      ? skillsOffered
      : (skillsOffered || "").split(",").map((s) => s.trim()).filter(Boolean),
    skillsWanted: Array.isArray(skillsWanted)
      ? skillsWanted
      : (skillsWanted || "").split(",").map((s) => s.trim()).filter(Boolean),
    connectedUserIds: []
  });

  const { passwordHash: pHash, ...safeUser } = newUser;
  const token = signJwt({ userId: newUser.id, email: newUser.email });

  return { success: true, user: safeUser, token };
}

/**
 * Get authenticated user from Request headers / cookies
 */
export function getCurrentUser(req) {
  // Check Authorization Bearer Header
  const authHeader = req?.headers?.get?.("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "").trim();
    const decoded = verifyJwt(token);
    if (decoded?.userId) {
      const user = db.getUserById(decoded.userId);
      if (user) return user;
    }
  }

  // Check Cookie token
  const cookieHeader = req?.headers?.get?.("cookie");
  if (cookieHeader) {
    const match = cookieHeader.match(/skillswap_token=([^;]+)/);
    if (match && match[1]) {
      const decoded = verifyJwt(match[1]);
      if (decoded?.userId) {
        const user = db.getUserById(decoded.userId);
        if (user) return user;
      }
    }
  }

  // Fallback default user for instant browsing
  return db.getUserById("user_1") || db.getUsers()[0];
}
