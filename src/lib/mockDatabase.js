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

const SEED_USERS = [];

// ---------- Seed User Skills ----------

const SEED_USER_SKILLS = [];

// ---------- Seed Availability ----------

const SEED_AVAILABILITY = [];

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

const SEED_SESSIONS = [];

// ---------- Seed Messages ----------

const SEED_MESSAGES = [];

// ---------- Seed Transactions ----------

const SEED_TRANSACTIONS = [];

// ---------- Seed Reviews ----------

const SEED_REVIEWS = [];

// ---------- Seed Connections ----------

const SEED_CONNECTIONS = [];

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

  getSession(sessionId) {
    this._loadFromStorage();
    return this.sessions.find(s => s.id === sessionId) || null;
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
