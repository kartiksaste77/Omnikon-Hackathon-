"use client";
// ============================================================================
// SkillSwap — Mock In-Memory Database
// Mirrors PostgreSQL schema: users, skills, user_skills, availability,
// matches, sessions, messages, reviews, notifications, badges, transactions
// ============================================================================

// ---------- Skill Categories & Seed Data ----------

export const SKILL_CATEGORIES = [
  "Programming",
  "Design",
  "Business",
  "Languages",
  "Music",
  "Photography",
  "Marketing",
  "Data Science",
  "DevOps",
  "Mathematics",
];

const SEED_SKILLS = [
  // Programming
  { id: "sk-001", name: "JavaScript", category: "Programming", description: "Core web programming language" },
  { id: "sk-002", name: "Python", category: "Programming", description: "General purpose & AI/ML language" },
  { id: "sk-003", name: "React", category: "Programming", description: "UI component library for web apps" },
  { id: "sk-004", name: "Node.js", category: "Programming", description: "Server-side JavaScript runtime" },
  { id: "sk-005", name: "TypeScript", category: "Programming", description: "Typed superset of JavaScript" },
  { id: "sk-006", name: "Java", category: "Programming", description: "Enterprise & Android development" },
  { id: "sk-007", name: "C++", category: "Programming", description: "Systems programming language" },
  { id: "sk-008", name: "Go", category: "Programming", description: "Cloud-native backend language" },
  { id: "sk-009", name: "Rust", category: "Programming", description: "Memory-safe systems language" },
  { id: "sk-010", name: "SQL", category: "Programming", description: "Database query language" },
  { id: "sk-011", name: "HTML/CSS", category: "Programming", description: "Web markup & styling" },
  { id: "sk-012", name: "Next.js", category: "Programming", description: "React framework for full-stack apps" },
  { id: "sk-013", name: "Flutter", category: "Programming", description: "Cross-platform mobile framework" },
  { id: "sk-014", name: "Django", category: "Programming", description: "Python web framework" },
  { id: "sk-015", name: "Data Structures & Algorithms", category: "Programming", description: "Core CS fundamentals" },
  // Design
  { id: "sk-016", name: "UI/UX Design", category: "Design", description: "User interface & experience design" },
  { id: "sk-017", name: "Figma", category: "Design", description: "Collaborative design tool" },
  { id: "sk-018", name: "Graphic Design", category: "Design", description: "Visual communication design" },
  { id: "sk-019", name: "Adobe Photoshop", category: "Design", description: "Photo editing & manipulation" },
  { id: "sk-020", name: "Motion Design", category: "Design", description: "Animation & motion graphics" },
  // Business
  { id: "sk-021", name: "Project Management", category: "Business", description: "Planning & executing projects" },
  { id: "sk-022", name: "Financial Analysis", category: "Business", description: "Evaluating financial data" },
  { id: "sk-023", name: "Public Speaking", category: "Business", description: "Effective oral communication" },
  { id: "sk-024", name: "Entrepreneurship", category: "Business", description: "Starting & running businesses" },
  // Languages
  { id: "sk-025", name: "Spanish", category: "Languages", description: "World's 4th most spoken language" },
  { id: "sk-026", name: "French", category: "Languages", description: "Romance language, spoken globally" },
  { id: "sk-027", name: "Japanese", category: "Languages", description: "East Asian language" },
  { id: "sk-028", name: "German", category: "Languages", description: "Central European language" },
  { id: "sk-029", name: "Mandarin Chinese", category: "Languages", description: "Most spoken language worldwide" },
  // Music
  { id: "sk-030", name: "Guitar", category: "Music", description: "String instrument" },
  { id: "sk-031", name: "Piano", category: "Music", description: "Keyboard instrument" },
  { id: "sk-032", name: "Music Production", category: "Music", description: "Creating & mixing music" },
  { id: "sk-033", name: "Singing", category: "Music", description: "Vocal performance" },
  // Photography
  { id: "sk-034", name: "Portrait Photography", category: "Photography", description: "Photographing people" },
  { id: "sk-035", name: "Photo Editing", category: "Photography", description: "Post-processing photos" },
  { id: "sk-036", name: "Video Editing", category: "Photography", description: "Editing video content" },
  // Marketing
  { id: "sk-037", name: "SEO", category: "Marketing", description: "Search engine optimization" },
  { id: "sk-038", name: "Social Media Marketing", category: "Marketing", description: "Marketing via social platforms" },
  { id: "sk-039", name: "Content Writing", category: "Marketing", description: "Creating written content" },
  { id: "sk-040", name: "Email Marketing", category: "Marketing", description: "Marketing through email campaigns" },
  // Data Science
  { id: "sk-041", name: "Machine Learning", category: "Data Science", description: "Building predictive models" },
  { id: "sk-042", name: "Data Analysis", category: "Data Science", description: "Analyzing datasets" },
  { id: "sk-043", name: "PyTorch", category: "Data Science", description: "Deep learning framework" },
  // DevOps
  { id: "sk-044", name: "Docker", category: "DevOps", description: "Container platform" },
  { id: "sk-045", name: "AWS", category: "DevOps", description: "Amazon cloud services" },
  { id: "sk-046", name: "Linux", category: "DevOps", description: "Open-source operating system" },
  // Mathematics
  { id: "sk-047", name: "Calculus", category: "Mathematics", description: "Mathematical analysis" },
  { id: "sk-048", name: "Linear Algebra", category: "Mathematics", description: "Vector spaces & matrices" },
  { id: "sk-049", name: "Statistics", category: "Mathematics", description: "Data collection & interpretation" },
];

// ---------- Seed Users ----------

const SEED_USERS = [
  {
    id: "user-001",
    name: "Kartik Saste",
    email: "kartik@campus.edu",
    password: "password123",
    avatar: "",
    bio: "Full-stack developer passionate about React, Node.js, and building products. Love teaching coding to peers.",
    location: "Mumbai, India",
    languages: ["English", "Hindi", "Marathi"],
    interests: ["Open Source", "Hackathons", "Startups"],
    createdAt: "2026-08-01",
    skillCoins: 120,
    xp: 340,
    streak: 7,
    sessionsCompleted: 14,
    rating: 4.9,
    reviewCount: 12,
  },
  {
    id: "user-002",
    name: "Karan Rathod",
    email: "karan@campus.edu",
    password: "password123",
    avatar: "",
    bio: "Electronics & IoT enthusiast with a knack for mobile app development. Eager to learn backend & system design.",
    location: "Pune, India",
    languages: ["English", "Hindi"],
    interests: ["Embedded Systems", "Mobile Apps", "Robotics"],
    createdAt: "2026-08-03",
    skillCoins: 95,
    xp: 280,
    streak: 5,
    sessionsCompleted: 10,
    rating: 4.95,
    reviewCount: 9,
  },
  {
    id: "user-003",
    name: "Sarah Chen",
    email: "sarah@campus.edu",
    password: "password123",
    avatar: "",
    bio: "Data scientist and ML researcher. Happy to break down neural networks in exchange for frontend guidance!",
    location: "Bangalore, India",
    languages: ["English", "Mandarin"],
    interests: ["AI Research", "Kaggle", "Open Data"],
    createdAt: "2026-07-20",
    skillCoins: 150,
    xp: 420,
    streak: 12,
    sessionsCompleted: 18,
    rating: 4.92,
    reviewCount: 16,
  },
  {
    id: "user-004",
    name: "Dev Patel",
    email: "dev@campus.edu",
    password: "password123",
    avatar: "",
    bio: "CTF player and Linux nerd. Wanting to master full-stack Express APIs for personal web projects.",
    location: "Delhi, India",
    languages: ["English", "Hindi", "Gujarati"],
    interests: ["Cybersecurity", "CTF", "Linux"],
    createdAt: "2026-08-10",
    skillCoins: 60,
    xp: 180,
    streak: 3,
    sessionsCompleted: 6,
    rating: 4.88,
    reviewCount: 5,
  },
  {
    id: "user-005",
    name: "Maya Lin",
    email: "maya@campus.edu",
    password: "password123",
    avatar: "",
    bio: "Design lead for student projects. Let's make software look and feel world-class together!",
    location: "Hyderabad, India",
    languages: ["English", "Telugu"],
    interests: ["Design Systems", "Typography", "Accessibility"],
    createdAt: "2026-07-15",
    skillCoins: 200,
    xp: 510,
    streak: 15,
    sessionsCompleted: 22,
    rating: 5.0,
    reviewCount: 20,
  },
  {
    id: "user-006",
    name: "Arjun Mehta",
    email: "arjun@campus.edu",
    password: "password123",
    avatar: "",
    bio: "Music producer and guitarist who also codes Python scripts. Looking to learn video editing and marketing.",
    location: "Chennai, India",
    languages: ["English", "Tamil", "Hindi"],
    interests: ["Music", "Podcasting", "Content Creation"],
    createdAt: "2026-08-05",
    skillCoins: 45,
    xp: 130,
    streak: 2,
    sessionsCompleted: 4,
    rating: 4.7,
    reviewCount: 3,
  },
  {
    id: "user-007",
    name: "Priya Sharma",
    email: "priya@campus.edu",
    password: "password123",
    avatar: "",
    bio: "Business student passionate about marketing and entrepreneurship. Eager to learn basic programming.",
    location: "Jaipur, India",
    languages: ["English", "Hindi"],
    interests: ["Startups", "Marketing", "Social Media"],
    createdAt: "2026-08-12",
    skillCoins: 30,
    xp: 90,
    streak: 1,
    sessionsCompleted: 3,
    rating: 4.6,
    reviewCount: 2,
  },
  {
    id: "user-008",
    name: "Ravi Kumar",
    email: "ravi@campus.edu",
    password: "password123",
    avatar: "",
    bio: "Cloud engineering student experienced in Docker & AWS. Would love to learn UI/UX and guitar on the side.",
    location: "Kolkata, India",
    languages: ["English", "Bengali", "Hindi"],
    interests: ["Cloud Native", "Kubernetes", "Music"],
    createdAt: "2026-08-08",
    skillCoins: 80,
    xp: 240,
    streak: 6,
    sessionsCompleted: 8,
    rating: 4.85,
    reviewCount: 7,
  },
];

// ---------- Seed User Skills ----------

const SEED_USER_SKILLS = [
  // Kartik — teaches JS/React/Node, learns Python/ML/System Design
  { userId: "user-001", skillId: "sk-001", type: "teach", proficiency: "advanced" },
  { userId: "user-001", skillId: "sk-003", type: "teach", proficiency: "advanced" },
  { userId: "user-001", skillId: "sk-004", type: "teach", proficiency: "advanced" },
  { userId: "user-001", skillId: "sk-012", type: "teach", proficiency: "intermediate" },
  { userId: "user-001", skillId: "sk-015", type: "teach", proficiency: "advanced" },
  { userId: "user-001", skillId: "sk-002", type: "learn", proficiency: "beginner" },
  { userId: "user-001", skillId: "sk-041", type: "learn", proficiency: "beginner" },
  { userId: "user-001", skillId: "sk-016", type: "learn", proficiency: "beginner" },
  // Karan — teaches Flutter/Figma, learns DSA/SQL
  { userId: "user-002", skillId: "sk-013", type: "teach", proficiency: "advanced" },
  { userId: "user-002", skillId: "sk-017", type: "teach", proficiency: "intermediate" },
  { userId: "user-002", skillId: "sk-011", type: "teach", proficiency: "intermediate" },
  { userId: "user-002", skillId: "sk-015", type: "learn", proficiency: "beginner" },
  { userId: "user-002", skillId: "sk-010", type: "learn", proficiency: "beginner" },
  { userId: "user-002", skillId: "sk-004", type: "learn", proficiency: "beginner" },
  // Sarah — teaches ML/Python/PyTorch/Stats, learns React/Docker
  { userId: "user-003", skillId: "sk-041", type: "teach", proficiency: "advanced" },
  { userId: "user-003", skillId: "sk-002", type: "teach", proficiency: "advanced" },
  { userId: "user-003", skillId: "sk-043", type: "teach", proficiency: "advanced" },
  { userId: "user-003", skillId: "sk-049", type: "teach", proficiency: "advanced" },
  { userId: "user-003", skillId: "sk-048", type: "teach", proficiency: "intermediate" },
  { userId: "user-003", skillId: "sk-003", type: "learn", proficiency: "beginner" },
  { userId: "user-003", skillId: "sk-044", type: "learn", proficiency: "beginner" },
  // Dev — teaches Linux/Go, learns Node/React
  { userId: "user-004", skillId: "sk-046", type: "teach", proficiency: "advanced" },
  { userId: "user-004", skillId: "sk-008", type: "teach", proficiency: "intermediate" },
  { userId: "user-004", skillId: "sk-004", type: "learn", proficiency: "beginner" },
  { userId: "user-004", skillId: "sk-003", type: "learn", proficiency: "beginner" },
  // Maya — teaches UI/UX/Figma/Graphic Design, learns React/CSS Animations
  { userId: "user-005", skillId: "sk-016", type: "teach", proficiency: "advanced" },
  { userId: "user-005", skillId: "sk-017", type: "teach", proficiency: "advanced" },
  { userId: "user-005", skillId: "sk-018", type: "teach", proficiency: "advanced" },
  { userId: "user-005", skillId: "sk-003", type: "learn", proficiency: "beginner" },
  { userId: "user-005", skillId: "sk-011", type: "learn", proficiency: "intermediate" },
  // Arjun — teaches Guitar/Music Production/Python, learns Video Editing/Marketing
  { userId: "user-006", skillId: "sk-030", type: "teach", proficiency: "advanced" },
  { userId: "user-006", skillId: "sk-032", type: "teach", proficiency: "intermediate" },
  { userId: "user-006", skillId: "sk-002", type: "teach", proficiency: "intermediate" },
  { userId: "user-006", skillId: "sk-036", type: "learn", proficiency: "beginner" },
  { userId: "user-006", skillId: "sk-038", type: "learn", proficiency: "beginner" },
  // Priya — teaches Marketing/Public Speaking, learns JavaScript/Python
  { userId: "user-007", skillId: "sk-038", type: "teach", proficiency: "advanced" },
  { userId: "user-007", skillId: "sk-023", type: "teach", proficiency: "advanced" },
  { userId: "user-007", skillId: "sk-039", type: "teach", proficiency: "intermediate" },
  { userId: "user-007", skillId: "sk-001", type: "learn", proficiency: "beginner" },
  { userId: "user-007", skillId: "sk-002", type: "learn", proficiency: "beginner" },
  // Ravi — teaches Docker/AWS/Linux, learns UI/UX/Guitar
  { userId: "user-008", skillId: "sk-044", type: "teach", proficiency: "advanced" },
  { userId: "user-008", skillId: "sk-045", type: "teach", proficiency: "advanced" },
  { userId: "user-008", skillId: "sk-046", type: "teach", proficiency: "intermediate" },
  { userId: "user-008", skillId: "sk-016", type: "learn", proficiency: "beginner" },
  { userId: "user-008", skillId: "sk-030", type: "learn", proficiency: "beginner" },
];

// ---------- Seed Availability ----------

const SEED_AVAILABILITY = [
  { userId: "user-001", day: "Monday", startTime: "16:00", endTime: "18:00" },
  { userId: "user-001", day: "Wednesday", startTime: "14:00", endTime: "17:00" },
  { userId: "user-001", day: "Saturday", startTime: "10:00", endTime: "13:00" },
  { userId: "user-002", day: "Tuesday", startTime: "15:00", endTime: "18:00" },
  { userId: "user-002", day: "Thursday", startTime: "16:00", endTime: "19:00" },
  { userId: "user-002", day: "Saturday", startTime: "11:00", endTime: "15:00" },
  { userId: "user-003", day: "Monday", startTime: "16:00", endTime: "18:00" },
  { userId: "user-003", day: "Wednesday", startTime: "15:00", endTime: "17:00" },
  { userId: "user-003", day: "Friday", startTime: "14:00", endTime: "16:00" },
  { userId: "user-004", day: "Wednesday", startTime: "14:00", endTime: "17:00" },
  { userId: "user-004", day: "Saturday", startTime: "10:00", endTime: "13:00" },
  { userId: "user-005", day: "Thursday", startTime: "13:00", endTime: "16:00" },
  { userId: "user-005", day: "Saturday", startTime: "11:00", endTime: "14:00" },
  { userId: "user-006", day: "Friday", startTime: "17:00", endTime: "20:00" },
  { userId: "user-006", day: "Sunday", startTime: "10:00", endTime: "13:00" },
  { userId: "user-007", day: "Tuesday", startTime: "10:00", endTime: "12:00" },
  { userId: "user-007", day: "Thursday", startTime: "14:00", endTime: "16:00" },
  { userId: "user-008", day: "Monday", startTime: "18:00", endTime: "20:00" },
  { userId: "user-008", day: "Saturday", startTime: "09:00", endTime: "12:00" },
];

// ---------- Seed Badges ----------

const SEED_BADGES = [
  { id: "badge-001", name: "First Exchange", description: "Complete your first skill exchange session", icon: "🎯", criteria: "sessionsCompleted >= 1" },
  { id: "badge-002", name: "Helpful Mentor", description: "Teach 5 sessions", icon: "🌟", criteria: "teachingSessions >= 5" },
  { id: "badge-003", name: "Quick Learner", description: "Learn 5 different skills", icon: "🚀", criteria: "learningSkills >= 5" },
  { id: "badge-004", name: "5-Star Mentor", description: "Maintain a 5.0 rating", icon: "⭐", criteria: "rating === 5.0" },
  { id: "badge-005", name: "Learning Streak", description: "7-day learning streak", icon: "🔥", criteria: "streak >= 7" },
  { id: "badge-006", name: "Community Builder", description: "Connect with 10+ peers", icon: "🤝", criteria: "connections >= 10" },
  { id: "badge-007", name: "Skill Master", description: "Complete 20 sessions", icon: "👑", criteria: "sessionsCompleted >= 20" },
  { id: "badge-008", name: "Rising Star", description: "Earn 100 SkillCoins", icon: "💫", criteria: "skillCoins >= 100" },
];

// ---------- Seed Sessions ----------

const SEED_SESSIONS = [
  {
    id: "sess-001",
    mentorId: "user-001",
    learnerId: "user-002",
    skillId: "sk-015",
    topic: "Binary Trees & Graph Traversal",
    date: "2026-08-25",
    time: "16:00",
    duration: 60,
    status: "completed",
    rating: 5,
    feedback: "Kartik explained trees and graphs so clearly! Great session.",
  },
  {
    id: "sess-002",
    mentorId: "user-003",
    learnerId: "user-001",
    skillId: "sk-041",
    topic: "Intro to Neural Networks with PyTorch",
    date: "2026-08-26",
    time: "16:00",
    duration: 60,
    status: "completed",
    rating: 5,
    feedback: "Sarah broke down backpropagation beautifully. Highly recommend!",
  },
  {
    id: "sess-003",
    mentorId: "user-005",
    learnerId: "user-001",
    skillId: "sk-016",
    topic: "Design Systems & Component Libraries",
    date: "2026-08-28",
    time: "14:00",
    duration: 60,
    status: "upcoming",
  },
];

// ---------- Seed Messages ----------

const SEED_MESSAGES = [
  { id: "msg-001", senderId: "user-003", receiverId: "user-001", content: "Hey Kartik! Excited for our PyTorch session. Have you installed the latest version?", timestamp: "2026-08-26T15:30:00", read: true },
  { id: "msg-002", senderId: "user-001", receiverId: "user-003", content: "Hi Sarah! Yes, all set up. Looking forward to it!", timestamp: "2026-08-26T15:35:00", read: true },
  { id: "msg-003", senderId: "user-005", receiverId: "user-001", content: "Hi! I'd love to learn React from you. Want to schedule a swap session?", timestamp: "2026-08-27T08:00:00", read: false },
];

// ---------- Seed Transactions ----------

const SEED_TRANSACTIONS = [
  { id: "tx-001", userId: "user-001", type: "earned", amount: 10, description: "Taught DSA to Karan Rathod", timestamp: "2026-08-25T17:00:00" },
  { id: "tx-002", userId: "user-001", type: "spent", amount: -10, description: "Learned ML from Sarah Chen", timestamp: "2026-08-26T17:00:00" },
  { id: "tx-003", userId: "user-001", type: "bonus", amount: 5, description: "Learning streak bonus (7 days)", timestamp: "2026-08-27T00:00:00" },
];

// ---------- Seed Reviews ----------

const SEED_REVIEWS = [
  { id: "rev-001", sessionId: "sess-001", reviewerId: "user-002", revieweeId: "user-001", rating: 5, feedback: "Kartik explained trees and graphs so clearly! Great session.", timestamp: "2026-08-25T17:10:00" },
  { id: "rev-002", sessionId: "sess-002", reviewerId: "user-001", revieweeId: "user-003", rating: 5, feedback: "Sarah broke down backpropagation beautifully. Highly recommend!", timestamp: "2026-08-26T17:10:00" },
];

// ---------- Seed Connections ----------

const SEED_CONNECTIONS = [
  { id: "conn-001", senderId: "user-001", receiverId: "user-003", status: "accepted", timestamp: "2026-08-20T10:00:00" },
  { id: "conn-002", senderId: "user-002", receiverId: "user-001", status: "accepted", timestamp: "2026-08-22T14:00:00" },
  { id: "conn-003", senderId: "user-005", receiverId: "user-001", status: "pending", timestamp: "2026-08-27T08:00:00" },
];

// ============================================================================
// Database Class — wraps all tables with CRUD operations
// ============================================================================

class MockDatabase {
  constructor() {
    this._loaded = false;
  }

  _loadFromStorage() {
    if (this._loaded) return;
    if (typeof window === "undefined") {
      this._initSeed();
      return;
    }
    try {
      const saved = localStorage.getItem("skillswap_db");
      if (saved) {
        const parsed = JSON.parse(saved);
        this.users = parsed.users || [...SEED_USERS];
        this.skills = parsed.skills || [...SEED_SKILLS];
        this.userSkills = parsed.userSkills || [...SEED_USER_SKILLS];
        this.availability = parsed.availability || [...SEED_AVAILABILITY];
        this.badges = parsed.badges || [...SEED_BADGES];
        this.sessions = parsed.sessions || [...SEED_SESSIONS];
        this.messages = parsed.messages || [...SEED_MESSAGES];
        this.transactions = parsed.transactions || [...SEED_TRANSACTIONS];
        this.reviews = parsed.reviews || [...SEED_REVIEWS];
        this.connections = parsed.connections || [...SEED_CONNECTIONS];
        this.notifications = parsed.notifications || [];
      } else {
        this._initSeed();
      }
    } catch {
      this._initSeed();
    }
    this._loaded = true;
  }

  _initSeed() {
    this.users = [...SEED_USERS];
    this.skills = [...SEED_SKILLS];
    this.userSkills = [...SEED_USER_SKILLS];
    this.availability = [...SEED_AVAILABILITY];
    this.badges = [...SEED_BADGES];
    this.sessions = [...SEED_SESSIONS];
    this.messages = [...SEED_MESSAGES];
    this.transactions = [...SEED_TRANSACTIONS];
    this.reviews = [...SEED_REVIEWS];
    this.connections = [...SEED_CONNECTIONS];
    this.notifications = [];
    this._loaded = true;
  }

  _persist() {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("skillswap_db", JSON.stringify({
        users: this.users,
        skills: this.skills,
        userSkills: this.userSkills,
        availability: this.availability,
        badges: this.badges,
        sessions: this.sessions,
        messages: this.messages,
        transactions: this.transactions,
        reviews: this.reviews,
        connections: this.connections,
        notifications: this.notifications,
      }));
    } catch { /* quota exceeded - ignore */ }
  }

  // ---------- Users ----------

  getUsers() { this._loadFromStorage(); return this.users; }

  getUser(id) { this._loadFromStorage(); return this.users.find(u => u.id === id); }

  getUserByEmail(email) { this._loadFromStorage(); return this.users.find(u => u.email === email); }

  createUser(data) {
    this._loadFromStorage();
    const user = {
      id: `user-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString().split("T")[0],
      skillCoins: 10, // welcome bonus
      xp: 0,
      streak: 0,
      sessionsCompleted: 0,
      rating: 0,
      reviewCount: 0,
      avatar: "",
      bio: "",
      location: "",
      languages: [],
      interests: [],
      ...data,
    };
    this.users.push(user);
    this._persist();
    return user;
  }

  updateUser(id, updates) {
    this._loadFromStorage();
    const idx = this.users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    this.users[idx] = { ...this.users[idx], ...updates };
    this._persist();
    return this.users[idx];
  }

  // ---------- Skills ----------

  getSkills() { this._loadFromStorage(); return this.skills; }

  getSkillsByCategory(category) { this._loadFromStorage(); return this.skills.filter(s => s.category === category); }

  searchSkills(query) {
    this._loadFromStorage();
    const q = query.toLowerCase();
    return this.skills.filter(s => s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q) || s.description.toLowerCase().includes(q));
  }

  // ---------- User Skills ----------

  getUserSkills(userId) { this._loadFromStorage(); return this.userSkills.filter(us => us.userId === userId); }

  getUserTeachSkills(userId) {
    this._loadFromStorage();
    return this.userSkills.filter(us => us.userId === userId && us.type === "teach")
      .map(us => ({ ...us, skill: this.skills.find(s => s.id === us.skillId) }));
  }

  getUserLearnSkills(userId) {
    this._loadFromStorage();
    return this.userSkills.filter(us => us.userId === userId && us.type === "learn")
      .map(us => ({ ...us, skill: this.skills.find(s => s.id === us.skillId) }));
  }

  addUserSkill(userId, skillId, type, proficiency) {
    this._loadFromStorage();
    const exists = this.userSkills.find(us => us.userId === userId && us.skillId === skillId && us.type === type);
    if (exists) return exists;
    const entry = { userId, skillId, type, proficiency };
    this.userSkills.push(entry);
    this._persist();
    return entry;
  }

  removeUserSkill(userId, skillId, type) {
    this._loadFromStorage();
    this.userSkills = this.userSkills.filter(us => !(us.userId === userId && us.skillId === skillId && us.type === type));
    this._persist();
  }

  // ---------- Availability ----------

  getUserAvailability(userId) { this._loadFromStorage(); return this.availability.filter(a => a.userId === userId); }

  setUserAvailability(userId, slots) {
    this._loadFromStorage();
    this.availability = this.availability.filter(a => a.userId !== userId);
    slots.forEach(slot => this.availability.push({ userId, ...slot }));
    this._persist();
  }

  // ---------- Connections ----------

  getConnections(userId) {
    this._loadFromStorage();
    return this.connections.filter(c => (c.senderId === userId || c.receiverId === userId));
  }

  getAcceptedConnections(userId) {
    return this.getConnections(userId).filter(c => c.status === "accepted");
  }

  getPendingReceived(userId) {
    this._loadFromStorage();
    return this.connections.filter(c => c.receiverId === userId && c.status === "pending");
  }

  getPendingSent(userId) {
    this._loadFromStorage();
    return this.connections.filter(c => c.senderId === userId && c.status === "pending");
  }

  sendConnectionRequest(senderId, receiverId) {
    this._loadFromStorage();
    const exists = this.connections.find(c =>
      (c.senderId === senderId && c.receiverId === receiverId) ||
      (c.senderId === receiverId && c.receiverId === senderId)
    );
    if (exists) return exists;
    const conn = { id: `conn-${Date.now().toString(36)}`, senderId, receiverId, status: "pending", timestamp: new Date().toISOString() };
    this.connections.push(conn);
    this.addNotification(receiverId, "connection_request", `${this.getUser(senderId)?.name} sent you a connection request`);
    this._persist();
    return conn;
  }

  acceptConnection(connectionId) {
    this._loadFromStorage();
    const idx = this.connections.findIndex(c => c.id === connectionId);
    if (idx === -1) return null;
    this.connections[idx].status = "accepted";
    this._persist();
    return this.connections[idx];
  }

  rejectConnection(connectionId) {
    this._loadFromStorage();
    const idx = this.connections.findIndex(c => c.id === connectionId);
    if (idx === -1) return null;
    this.connections[idx].status = "rejected";
    this._persist();
    return this.connections[idx];
  }

  // ---------- Sessions ----------

  getSessions(userId) {
    this._loadFromStorage();
    return this.sessions.filter(s => s.mentorId === userId || s.learnerId === userId);
  }

  createSession(data) {
    this._loadFromStorage();
    const session = { id: `sess-${Date.now().toString(36)}`, status: "upcoming", ...data };
    this.sessions.push(session);
    this._persist();
    return session;
  }

  completeSession(sessionId) {
    this._loadFromStorage();
    const idx = this.sessions.findIndex(s => s.id === sessionId);
    if (idx === -1) return null;
    this.sessions[idx].status = "completed";
    this._persist();
    return this.sessions[idx];
  }

  cancelSession(sessionId) {
    this._loadFromStorage();
    const idx = this.sessions.findIndex(s => s.id === sessionId);
    if (idx === -1) return null;
    this.sessions[idx].status = "cancelled";
    this._persist();
    return this.sessions[idx];
  }

  // ---------- Messages ----------

  getConversation(user1Id, user2Id) {
    this._loadFromStorage();
    return this.messages.filter(m =>
      (m.senderId === user1Id && m.receiverId === user2Id) ||
      (m.senderId === user2Id && m.receiverId === user1Id)
    ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  getConversationPartners(userId) {
    this._loadFromStorage();
    const partnerIds = new Set();
    this.messages.forEach(m => {
      if (m.senderId === userId) partnerIds.add(m.receiverId);
      if (m.receiverId === userId) partnerIds.add(m.senderId);
    });
    // Also add accepted connections that haven't messaged yet
    this.getAcceptedConnections(userId).forEach(c => {
      const partnerId = c.senderId === userId ? c.receiverId : c.senderId;
      partnerIds.add(partnerId);
    });
    return [...partnerIds].map(id => {
      const user = this.getUser(id);
      const msgs = this.getConversation(userId, id);
      const lastMsg = msgs[msgs.length - 1];
      const unread = msgs.filter(m => m.receiverId === userId && !m.read).length;
      return { user, lastMessage: lastMsg, unreadCount: unread };
    }).sort((a, b) => {
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp);
    });
  }

  sendMessage(senderId, receiverId, content) {
    this._loadFromStorage();
    const msg = { id: `msg-${Date.now().toString(36)}`, senderId, receiverId, content, timestamp: new Date().toISOString(), read: false };
    this.messages.push(msg);
    this._persist();
    return msg;
  }

  markMessagesRead(userId, partnerId) {
    this._loadFromStorage();
    this.messages.forEach(m => {
      if (m.senderId === partnerId && m.receiverId === userId) {
        m.read = true;
      }
    });
    this._persist();
  }

  // ---------- Reviews ----------

  getReviewsForUser(userId) {
    this._loadFromStorage();
    return this.reviews.filter(r => r.revieweeId === userId);
  }

  addReview(data) {
    this._loadFromStorage();
    const review = { id: `rev-${Date.now().toString(36)}`, timestamp: new Date().toISOString(), ...data };
    this.reviews.push(review);
    // Update reviewee's rating
    const reviewee = this.getUser(data.revieweeId);
    if (reviewee) {
      const allReviews = this.getReviewsForUser(data.revieweeId);
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      this.updateUser(data.revieweeId, { rating: Math.round(avgRating * 100) / 100, reviewCount: allReviews.length });
    }
    this._persist();
    return review;
  }

  // ---------- Transactions ----------

  getTransactions(userId) {
    this._loadFromStorage();
    return this.transactions.filter(t => t.userId === userId).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  addTransaction(userId, type, amount, description) {
    this._loadFromStorage();
    const tx = { id: `tx-${Date.now().toString(36)}`, userId, type, amount, description, timestamp: new Date().toISOString() };
    this.transactions.push(tx);
    const user = this.getUser(userId);
    if (user) {
      this.updateUser(userId, { skillCoins: (user.skillCoins || 0) + amount });
    }
    this._persist();
    return tx;
  }

  // ---------- Notifications ----------

  getNotifications(userId) {
    this._loadFromStorage();
    return this.notifications.filter(n => n.userId === userId).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  addNotification(userId, type, content) {
    this._loadFromStorage();
    const notif = { id: `notif-${Date.now().toString(36)}`, userId, type, content, read: false, timestamp: new Date().toISOString() };
    this.notifications.push(notif);
    this._persist();
    return notif;
  }

  markNotificationRead(notifId) {
    this._loadFromStorage();
    const n = this.notifications.find(n => n.id === notifId);
    if (n) n.read = true;
    this._persist();
  }

  // ---------- Badges ----------

  getBadges() { this._loadFromStorage(); return this.badges; }

  getUserBadges(userId) {
    const user = this.getUser(userId);
    if (!user) return [];
    return this.badges.filter(b => {
      if (b.criteria.includes("sessionsCompleted >= 1") && user.sessionsCompleted >= 1) return true;
      if (b.criteria.includes("sessionsCompleted >= 20") && user.sessionsCompleted >= 20) return true;
      if (b.criteria.includes("teachingSessions >= 5")) {
        const teachCount = this.sessions.filter(s => s.mentorId === userId && s.status === "completed").length;
        return teachCount >= 5;
      }
      if (b.criteria.includes("rating === 5.0") && user.rating === 5.0) return true;
      if (b.criteria.includes("streak >= 7") && user.streak >= 7) return true;
      if (b.criteria.includes("skillCoins >= 100") && user.skillCoins >= 100) return true;
      if (b.criteria.includes("connections >= 10") && this.getAcceptedConnections(userId).length >= 10) return true;
      return false;
    });
  }

  // ---------- Leaderboard ----------

  getLeaderboard() {
    this._loadFromStorage();
    return [...this.users].sort((a, b) => (b.xp || 0) - (a.xp || 0)).map((u, i) => ({
      rank: i + 1,
      ...u,
      badges: this.getUserBadges(u.id),
    }));
  }

  // ---------- Reset ----------

  resetDatabase() {
    this._loaded = false;
    if (typeof window !== "undefined") {
      localStorage.removeItem("skillswap_db");
    }
    this._initSeed();
  }
}

const db = new MockDatabase();
export default db;
