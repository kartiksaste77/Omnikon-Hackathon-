import {
  INITIAL_USERS,
  INITIAL_SKILLS,
  INITIAL_SESSIONS,
  INITIAL_TRANSACTIONS,
  INITIAL_REVIEWS,
  INITIAL_ROADMAPS,
  INITIAL_CONNECTION_REQUESTS
} from "./seedData.js";

// Global in-memory storage with resilient persistence across API calls
const globalStore = {
  users: [...INITIAL_USERS],
  skills: [...INITIAL_SKILLS],
  sessions: [...INITIAL_SESSIONS],
  transactions: [...INITIAL_TRANSACTIONS],
  reviews: [...INITIAL_REVIEWS],
  roadmaps: [...INITIAL_ROADMAPS],
  connectionRequests: [...INITIAL_CONNECTION_REQUESTS],
  messages: [
    {
      id: "msg_1",
      senderId: "user_2",
      receiverId: "user_1",
      content: "Hey Alex! Excited for our Next.js App Router & Design Tokens session today.",
      timestamp: new Date(Date.now() - 3600000 * 3).toISOString()
    },
    {
      id: "msg_2",
      senderId: "user_1",
      receiverId: "user_2",
      content: "Hey Priya! Looking forward to it. We'll also test the live collaborative whiteboard in our WebRTC room.",
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    {
      id: "msg_3",
      senderId: "user_3",
      receiverId: "user_1",
      content: "Hey Alex, thanks for the DP session earlier! The subtree memoization explanation was super helpful.",
      timestamp: new Date(Date.now() - 3600000 * 20).toISOString()
    }
  ]
};

export const db = {
  // ==========================================
  // USERS
  // ==========================================
  getUsers: () => globalStore.users,
  getUserById: (id) => globalStore.users.find((u) => u.id === id),
  getUserByEmail: (email) => globalStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase()),
  createUser: (user) => {
    const newUser = {
      id: `user_${Date.now()}`,
      coins: 50,
      xp: 100,
      streak: 1,
      rating: 5.0,
      totalReviews: 0,
      completedHours: 0,
      badges: ["New Member"],
      skillsOffered: [],
      skillsWanted: [],
      availability: ["Mon 5-7 PM", "Sat 10 AM-2 PM"],
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
      connectedUserIds: [],
      ...user
    };
    globalStore.users.push(newUser);
    return newUser;
  },
  updateUser: (id, updates) => {
    const idx = globalStore.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    globalStore.users[idx] = { ...globalStore.users[idx], ...updates };
    return globalStore.users[idx];
  },

  // ==========================================
  // CONNECTIONS & PEER NETWORKING
  // ==========================================
  getConnections: (userId) => {
    const user = globalStore.users.find((u) => u.id === userId);
    if (!user || !user.connectedUserIds) return [];
    return globalStore.users.filter((u) => user.connectedUserIds.includes(u.id));
  },

  getConnectionRequests: (userId) => {
    return globalStore.connectionRequests.filter(
      (r) => r.toUserId === userId && r.status === "PENDING"
    );
  },

  getSentConnectionRequests: (userId) => {
    return globalStore.connectionRequests.filter(
      (r) => r.fromUserId === userId && r.status === "PENDING"
    );
  },

  sendConnectionRequest: (fromUserId, toUserId, note = "") => {
    const fromUser = globalStore.users.find((u) => u.id === fromUserId);
    const toUser = globalStore.users.find((u) => u.id === toUserId);
    if (!fromUser || !toUser) {
      return { success: false, message: "User not found" };
    }

    if (fromUserId === toUserId) {
      return { success: false, message: "You cannot connect with yourself." };
    }

    // Check if already connected
    if (fromUser.connectedUserIds?.includes(toUserId)) {
      return { success: false, message: "You are already connected with this student." };
    }

    // Check if pending request exists
    const existingReq = globalStore.connectionRequests.find(
      (r) => (r.fromUserId === fromUserId && r.toUserId === toUserId && r.status === "PENDING")
    );
    if (existingReq) {
      return { success: false, message: "A connection request is already pending." };
    }

    const newRequest = {
      id: `req_${Date.now()}`,
      fromUserId,
      fromUserName: fromUser.name,
      fromUserAvatar: fromUser.avatar,
      fromUserRole: fromUser.role,
      toUserId,
      toUserName: toUser.name,
      note: note || `Hi ${toUser.name}, I'd like to connect on SkillSwap to exchange skills!`,
      status: "PENDING",
      createdAt: new Date().toISOString()
    };

    globalStore.connectionRequests.unshift(newRequest);
    return { success: true, request: newRequest };
  },

  acceptConnectionRequest: (requestId) => {
    const req = globalStore.connectionRequests.find((r) => r.id === requestId);
    if (!req) return { success: false, message: "Request not found" };

    req.status = "ACCEPTED";

    const userA = globalStore.users.find((u) => u.id === req.fromUserId);
    const userB = globalStore.users.find((u) => u.id === req.toUserId);

    if (userA && userB) {
      if (!userA.connectedUserIds) userA.connectedUserIds = [];
      if (!userB.connectedUserIds) userB.connectedUserIds = [];

      if (!userA.connectedUserIds.includes(userB.id)) userA.connectedUserIds.push(userB.id);
      if (!userB.connectedUserIds.includes(userA.id)) userB.connectedUserIds.push(userA.id);

      // Award +15 XP for making a connection
      userA.xp = (userA.xp || 0) + 15;
      userB.xp = (userB.xp || 0) + 15;
    }

    return { success: true, request: req };
  },

  rejectConnectionRequest: (requestId) => {
    const req = globalStore.connectionRequests.find((r) => r.id === requestId);
    if (!req) return { success: false, message: "Request not found" };
    req.status = "REJECTED";
    return { success: true, request: req };
  },

  removeConnection: (userId1, userId2) => {
    const user1 = globalStore.users.find((u) => u.id === userId1);
    const user2 = globalStore.users.find((u) => u.id === userId2);
    if (user1 && user1.connectedUserIds) {
      user1.connectedUserIds = user1.connectedUserIds.filter((id) => id !== userId2);
    }
    if (user2 && user2.connectedUserIds) {
      user2.connectedUserIds = user2.connectedUserIds.filter((id) => id !== userId1);
    }
    return { success: true };
  },

  // ==========================================
  // LIVE CHAT & MESSAGES
  // ==========================================
  getConversation: (userId1, userId2) => {
    return globalStore.messages
      .filter(
        (m) =>
          (m.senderId === userId1 && m.receiverId === userId2) ||
          (m.senderId === userId2 && m.receiverId === userId1)
      )
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  },

  sendMessage: (senderId, receiverId, content) => {
    const newMsg = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      senderId,
      receiverId,
      content,
      isRead: false,
      timestamp: new Date().toISOString()
    };
    globalStore.messages.push(newMsg);
    return newMsg;
  },

  getRecentChatPartners: (currentUserId) => {
    const connectedUsers = db.getConnections(currentUserId);
    return connectedUsers.map((partner) => {
      const conv = db.getConversation(currentUserId, partner.id);
      const lastMessage = conv.length > 0 ? conv[conv.length - 1] : null;
      return {
        ...partner,
        lastMessage: lastMessage ? lastMessage.content : "Start a conversation...",
        lastMessageTime: lastMessage ? lastMessage.timestamp : null
      };
    });
  },

  // ==========================================
  // SKILLS
  // ==========================================
  getSkills: () => globalStore.skills,
  getSkillById: (id) => globalStore.skills.find((s) => s.id === id),
  createSkill: (skill) => {
    const newSkill = {
      id: `skill_${Date.now()}`,
      rating: 5.0,
      studentsTaught: 0,
      hourlyCostCoins: 10,
      ...skill
    };
    globalStore.skills.unshift(newSkill);
    return newSkill;
  },

  // ==========================================
  // SESSIONS
  // ==========================================
  getSessions: (userId = null) => {
    if (!userId) return globalStore.sessions;
    return globalStore.sessions.filter(
      (s) => s.mentorId === userId || s.learnerId === userId
    );
  },
  getSessionById: (id) => globalStore.sessions.find((s) => s.id === id),
  createSession: (sessionData) => {
    const newSession = {
      id: `sess_${Date.now()}`,
      status: "CONFIRMED",
      coinsEscrow: 10,
      otpCode: Math.floor(1000 + Math.random() * 9000).toString(),
      qrToken: `SKILLSWAP-SESS-${Date.now()}-KEY`,
      meetingRoomId: `room-${Date.now()}`,
      durationMinutes: 60,
      ...sessionData
    };
    globalStore.sessions.unshift(newSession);

    const learner = globalStore.users.find((u) => u.id === newSession.learnerId);
    if (learner && learner.coins >= 10) {
      learner.coins -= 10;
      globalStore.transactions.unshift({
        id: `tx_${Date.now()}`,
        userId: learner.id,
        amount: -10,
        type: "ESCROW_LOCK",
        description: `Escrow locked for session '${newSession.skillTitle}' with ${newSession.mentorName}`,
        date: new Date().toISOString()
      });
    }

    return newSession;
  },
  updateSession: (id, updates) => {
    const idx = globalStore.sessions.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    globalStore.sessions[idx] = { ...globalStore.sessions[idx], ...updates };
    return globalStore.sessions[idx];
  },
  verifyAndCompleteSession: (sessionId, verificationCode = null) => {
    const session = globalStore.sessions.find((s) => s.id === sessionId);
    if (!session) return { success: false, message: "Session not found" };

    if (verificationCode && session.otpCode && verificationCode !== session.otpCode) {
      return { success: false, message: "Invalid 4-digit verification OTP" };
    }

    session.status = "COMPLETED";

    const mentor = globalStore.users.find((u) => u.id === session.mentorId);
    if (mentor) {
      mentor.coins = (mentor.coins || 0) + 10;
      mentor.xp = (mentor.xp || 0) + 50;
      mentor.completedHours = (mentor.completedHours || 0) + 1;
      mentor.streak = (mentor.streak || 1) + 1;

      globalStore.transactions.unshift({
        id: `tx_${Date.now()}_m`,
        userId: mentor.id,
        amount: 10,
        type: "EARNED",
        description: `Earned 10 SkillCoins for teaching '${session.skillTitle}'`,
        date: new Date().toISOString()
      });
    }

    const learner = globalStore.users.find((u) => u.id === session.learnerId);
    if (learner) {
      learner.xp = (learner.xp || 0) + 25;
      learner.completedHours = (learner.completedHours || 0) + 1;
      learner.streak = (learner.streak || 1) + 1;
    }

    return { success: true, session };
  },

  // ==========================================
  // TRANSACTIONS & REVIEWS & ROADMAPS
  // ==========================================
  getTransactions: (userId = null) => {
    if (!userId) return globalStore.transactions;
    return globalStore.transactions.filter((tx) => tx.userId === userId);
  },
  getReviews: (mentorId = null) => {
    if (!mentorId) return globalStore.reviews;
    return globalStore.reviews.filter((r) => r.mentorId === mentorId);
  },
  createReview: (reviewData) => {
    const newReview = {
      id: `rev_${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...reviewData
    };
    globalStore.reviews.unshift(newReview);
    return newReview;
  },
  getRoadmaps: (userId = null) => {
    if (!userId) return globalStore.roadmaps;
    return globalStore.roadmaps.filter((r) => r.userId === userId);
  },
  createRoadmap: (roadmapData) => {
    const newRoadmap = {
      id: `road_${Date.now()}`,
      progress: 0,
      createdAt: new Date().toISOString(),
      ...roadmapData
    };
    globalStore.roadmaps.unshift(newRoadmap);
    return newRoadmap;
  }
};
