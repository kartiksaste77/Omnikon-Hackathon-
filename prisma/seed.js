// prisma/seed.js — Seed database with skills and rich demo peers
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";
import path from "path";

const dbPath = path.resolve(process.cwd(), "dev.db").replace(/\\/g, "/");
const adapter = new PrismaLibSql({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

const SKILLS = [
  // Programming
  { name: "JavaScript", category: "Programming", description: "Core web programming language" },
  { name: "Python", category: "Programming", description: "General purpose & AI/ML language" },
  { name: "React", category: "Programming", description: "UI component library for web apps" },
  { name: "Node.js", category: "Programming", description: "Server-side JavaScript runtime" },
  { name: "TypeScript", category: "Programming", description: "Typed superset of JavaScript" },
  { name: "Next.js", category: "Programming", description: "React framework for full-stack apps" },
  { name: "Flutter", category: "Programming", description: "Cross-platform mobile framework" },
  { name: "SQL", category: "Programming", description: "Database query language" },
  { name: "Rust", category: "Programming", description: "Memory-safe systems language" },
  // Design
  { name: "UI/UX Design", category: "Design", description: "User interface & experience design" },
  { name: "Figma", category: "Design", description: "Collaborative design tool" },
  { name: "Graphic Design", category: "Design", description: "Visual communication design" },
  { name: "Motion Design", category: "Design", description: "Animation & motion graphics" },
  // Business
  { name: "Project Management", category: "Business", description: "Planning & executing projects" },
  { name: "Public Speaking", category: "Business", description: "Effective oral communication" },
  { name: "Financial Analysis", category: "Business", description: "Evaluating financial data" },
  // Languages
  { name: "Spanish", category: "Languages", description: "World's 4th most spoken language" },
  { name: "French", category: "Languages", description: "Romance language, spoken globally" },
  { name: "Japanese", category: "Languages", description: "East Asian language" },
  { name: "German", category: "Languages", description: "Central European language" },
  // Music
  { name: "Guitar", category: "Music", description: "String instrument" },
  { name: "Piano", category: "Music", description: "Keyboard instrument" },
  { name: "Music Production", category: "Music", description: "Creating & mixing music" },
  // Data Science
  { name: "Machine Learning", category: "Data Science", description: "Building predictive models" },
  { name: "Data Analysis", category: "Data Science", description: "Analyzing datasets" },
  { name: "PyTorch", category: "Data Science", description: "Deep learning framework" },
  // DevOps
  { name: "Docker", category: "DevOps", description: "Container platform" },
  { name: "AWS", category: "DevOps", description: "Amazon cloud services" },
  { name: "Linux", category: "DevOps", description: "Open-source operating system" },
];

const DEMO_PEERS = [
  {
    name: "Sarah Chen",
    email: "sarah@campus.edu",
    bio: "Full-stack developer & open-source contributor. Love teaching React and Python! Looking to master UI/UX Design and Spanish.",
    location: "San Francisco, CA",
    skillCoins: 45,
    xp: 350,
    streak: 12,
    rating: 4.9,
    reviewCount: 14,
    sessionsCompleted: 16,
    teachSkills: [
      { name: "React", proficiency: "advanced" },
      { name: "JavaScript", proficiency: "advanced" },
      { name: "Node.js", proficiency: "intermediate" },
      { name: "Python", proficiency: "intermediate" },
    ],
    learnSkills: [
      { name: "UI/UX Design", proficiency: "beginner" },
      { name: "Spanish", proficiency: "beginner" },
      { name: "Figma", proficiency: "beginner" },
    ],
  },
  {
    name: "Alex Rivera",
    email: "alex@campus.edu",
    bio: "Product designer with 4 years of experience. Excited to teach Figma and Design Systems, and want to learn Python & Machine Learning.",
    location: "Austin, TX",
    skillCoins: 60,
    xp: 420,
    streak: 15,
    rating: 5.0,
    reviewCount: 19,
    sessionsCompleted: 22,
    teachSkills: [
      { name: "Figma", proficiency: "advanced" },
      { name: "UI/UX Design", proficiency: "advanced" },
      { name: "Graphic Design", proficiency: "advanced" },
    ],
    learnSkills: [
      { name: "Python", proficiency: "beginner" },
      { name: "Machine Learning", proficiency: "beginner" },
      { name: "JavaScript", proficiency: "beginner" },
    ],
  },
  {
    name: "Marcus Johnson",
    email: "marcus@campus.edu",
    bio: "Data scientist working on LLMs and computer vision. Happy to teach Python, PyTorch & SQL. Want to learn Guitar and Public Speaking.",
    location: "Boston, MA",
    skillCoins: 30,
    xp: 280,
    streak: 8,
    rating: 4.8,
    reviewCount: 9,
    sessionsCompleted: 11,
    teachSkills: [
      { name: "Python", proficiency: "advanced" },
      { name: "Data Analysis", proficiency: "advanced" },
      { name: "Machine Learning", proficiency: "advanced" },
      { name: "SQL", proficiency: "intermediate" },
    ],
    learnSkills: [
      { name: "Guitar", proficiency: "beginner" },
      { name: "Public Speaking", proficiency: "beginner" },
      { name: "React", proficiency: "beginner" },
    ],
  },
  {
    name: "Elena Rostova",
    email: "elena@campus.edu",
    bio: "Polyglot and classical pianist. Native French speaker, fluent in German and Spanish. Want to learn Web Development & Next.js!",
    location: "New York, NY",
    skillCoins: 40,
    xp: 310,
    streak: 9,
    rating: 4.9,
    reviewCount: 12,
    sessionsCompleted: 14,
    teachSkills: [
      { name: "French", proficiency: "advanced" },
      { name: "German", proficiency: "advanced" },
      { name: "Piano", proficiency: "advanced" },
    ],
    learnSkills: [
      { name: "Next.js", proficiency: "beginner" },
      { name: "React", proficiency: "beginner" },
      { name: "JavaScript", proficiency: "beginner" },
    ],
  },
  {
    name: "Priya Sharma",
    email: "priya@campus.edu",
    bio: "Cloud & DevOps architect. Love Docker, AWS, and Linux. Eager to teach infrastructure automation and learn Motion Design & Piano.",
    location: "Seattle, WA",
    skillCoins: 50,
    xp: 390,
    streak: 14,
    rating: 4.95,
    reviewCount: 16,
    sessionsCompleted: 18,
    teachSkills: [
      { name: "Docker", proficiency: "advanced" },
      { name: "AWS", proficiency: "advanced" },
      { name: "Linux", proficiency: "advanced" },
    ],
    learnSkills: [
      { name: "Motion Design", proficiency: "beginner" },
      { name: "Piano", proficiency: "beginner" },
      { name: "Python", proficiency: "intermediate" },
    ],
  },
  {
    name: "Liam Wilson",
    email: "liam@campus.edu",
    bio: "Mobile engineer specialized in Flutter and cross-platform apps. Can teach Flutter & TypeScript. Looking to learn French & Docker.",
    location: "Chicago, IL",
    skillCoins: 25,
    xp: 210,
    streak: 5,
    rating: 4.7,
    reviewCount: 8,
    sessionsCompleted: 9,
    teachSkills: [
      { name: "Flutter", proficiency: "advanced" },
      { name: "TypeScript", proficiency: "intermediate" },
      { name: "JavaScript", proficiency: "intermediate" },
    ],
    learnSkills: [
      { name: "French", proficiency: "beginner" },
      { name: "Docker", proficiency: "beginner" },
      { name: "AWS", proficiency: "beginner" },
    ],
  },
];

async function seed() {
  console.log("Seeding database...");

  // 1. Seed Skills
  for (const s of SKILLS) {
    await prisma.skill.upsert({
      where: { name: s.name },
      update: { category: s.category, description: s.description },
      create: s,
    });
  }
  console.log(`Seeded ${SKILLS.length} skills`);

  // 2. Fetch all skills into a map
  const allDbSkills = await prisma.skill.findMany();
  const skillMap = new Map(allDbSkills.map((s) => [s.name, s.id]));

  // 3. Seed Demo Users & UserSkills
  const defaultPassword = await bcrypt.hash("password123", 10);

  for (const peer of DEMO_PEERS) {
    const user = await prisma.user.upsert({
      where: { email: peer.email },
      update: {
        name: peer.name,
        bio: peer.bio,
        location: peer.location,
        skillCoins: peer.skillCoins,
        xp: peer.xp,
        streak: peer.streak,
        rating: peer.rating,
        reviewCount: peer.reviewCount,
        sessionsCompleted: peer.sessionsCompleted,
      },
      create: {
        name: peer.name,
        email: peer.email,
        password: defaultPassword,
        bio: peer.bio,
        location: peer.location,
        skillCoins: peer.skillCoins,
        xp: peer.xp,
        streak: peer.streak,
        rating: peer.rating,
        reviewCount: peer.reviewCount,
        sessionsCompleted: peer.sessionsCompleted,
      },
    });

    // Seed teach skills
    for (const ts of peer.teachSkills) {
      const skillId = skillMap.get(ts.name);
      if (skillId) {
        await prisma.userSkill.upsert({
          where: {
            userId_skillId_type: {
              userId: user.id,
              skillId,
              type: "teach",
            },
          },
          update: { proficiency: ts.proficiency },
          create: {
            userId: user.id,
            skillId,
            type: "teach",
            proficiency: ts.proficiency,
          },
        });
      }
    }

    // Seed learn skills
    for (const ls of peer.learnSkills) {
      const skillId = skillMap.get(ls.name);
      if (skillId) {
        await prisma.userSkill.upsert({
          where: {
            userId_skillId_type: {
              userId: user.id,
              skillId,
              type: "learn",
            },
          },
          update: { proficiency: ls.proficiency },
          create: {
            userId: user.id,
            skillId,
            type: "learn",
            proficiency: ls.proficiency,
          },
        });
      }
    }
  }

  console.log(`Seeded ${DEMO_PEERS.length} demo peers with skills!`);
}

seed()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  });
