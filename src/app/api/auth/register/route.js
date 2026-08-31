// api/auth/register/route.js
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

const SEED_SKILLS = [
  { name: "JavaScript", category: "Programming", description: "Core web programming language" },
  { name: "Python", category: "Programming", description: "General purpose & AI/ML language" },
  { name: "React", category: "Programming", description: "UI component library for web apps" },
  { name: "Node.js", category: "Programming", description: "Server-side JavaScript runtime" },
  { name: "TypeScript", category: "Programming", description: "Typed superset of JavaScript" },
  { name: "Java", category: "Programming", description: "Enterprise & Android development" },
  { name: "Next.js", category: "Programming", description: "React framework for full-stack apps" },
  { name: "Flutter", category: "Programming", description: "Cross-platform mobile framework" },
  { name: "SQL", category: "Programming", description: "Database query language" },
  { name: "HTML/CSS", category: "Programming", description: "Web markup & styling" },
  { name: "UI/UX Design", category: "Design", description: "User interface & experience design" },
  { name: "Figma", category: "Design", description: "Collaborative design tool" },
  { name: "Graphic Design", category: "Design", description: "Visual communication design" },
  { name: "Adobe Photoshop", category: "Design", description: "Photo editing & manipulation" },
  { name: "Project Management", category: "Business", description: "Planning & executing projects" },
  { name: "Public Speaking", category: "Business", description: "Effective oral communication" },
  { name: "Spanish", category: "Languages", description: "World's 4th most spoken language" },
  { name: "French", category: "Languages", description: "Romance language, spoken globally" },
  { name: "Japanese", category: "Languages", description: "East Asian language" },
  { name: "Guitar", category: "Music", description: "String instrument" },
  { name: "Piano", category: "Music", description: "Keyboard instrument" },
  { name: "Music Production", category: "Music", description: "Creating & mixing music" },
  { name: "Portrait Photography", category: "Photography", description: "Photographing people" },
  { name: "Video Editing", category: "Photography", description: "Editing video content" },
  { name: "SEO", category: "Marketing", description: "Search engine optimization" },
  { name: "Social Media Marketing", category: "Marketing", description: "Marketing via social platforms" },
  { name: "Machine Learning", category: "Data Science", description: "Building predictive models" },
  { name: "Data Analysis", category: "Data Science", description: "Analyzing datasets" },
  { name: "Docker", category: "DevOps", description: "Container platform" },
  { name: "AWS", category: "DevOps", description: "Amazon cloud services" },
];

async function seedSkills() {
  const count = await prisma.skill.count();
  if (count === 0) {
    await prisma.skill.createMany({ data: SEED_SKILLS });
  }
}

export async function POST(req) {
  try {
    const { name, email, password } = await req.json();
    if (!name || !email || !password)
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    if (password.length < 6)
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing)
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });

    await seedSkills();

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email: email.toLowerCase(), password: hashed },
    });

    const secret = process.env.JWT_SECRET || "skillswap_jwt_secret_key_2026_omnikon_hackathon";
    const token = jwt.sign({ userId: user.id }, secret, { expiresIn: "7d" });
    const { password: _, ...safeUser } = user;
    return NextResponse.json({ token, user: safeUser }, { status: 201 });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
