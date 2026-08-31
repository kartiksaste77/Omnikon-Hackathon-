// server.js — Custom Next.js HTTP server with Socket.io
import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import jwt from "jsonwebtoken";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  // ────────────────────────────────────────────────────────
  // Socket.io Setup
  // ────────────────────────────────────────────────────────
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Middleware: verify JWT on connect
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      // Allow unauthenticated connections but without userId
      socket.userId = null;
      return next();
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "skillswap_secret");
      socket.userId = decoded.userId;
      next();
    } catch {
      socket.userId = null;
      next();
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.userId;
    console.log(`[Socket.io] Client connected: ${socket.id} (userId: ${userId || "anon"})`);

    // Join user's personal room for targeted notifications
    if (userId) {
      socket.join(`user:${userId}`);
    }

    // ── Real-time Chat ──
    socket.on("message:send", (data) => {
      // data = { senderId, receiverId, content, messageId, timestamp }
      if (!data?.receiverId) return;
      // Broadcast to receiver's room
      io.to(`user:${data.receiverId}`).emit("message:receive", {
        id: data.messageId || Date.now().toString(),
        senderId: data.senderId || userId,
        receiverId: data.receiverId,
        content: data.content,
        createdAt: data.timestamp || new Date().toISOString(),
        read: false,
      });
      // Also confirm to sender (for multi-tab sync)
      socket.emit("message:sent", { messageId: data.messageId });
    });

    // ── Notifications ──
    socket.on("notification:send", (data) => {
      // data = { targetUserId, type, content }
      if (!data?.targetUserId) return;
      io.to(`user:${data.targetUserId}`).emit("notification:new", {
        id: Date.now().toString(),
        type: data.type,
        content: data.content,
        read: false,
        createdAt: new Date().toISOString(),
      });
    });

    // ── Typing indicators ──
    socket.on("typing:start", ({ receiverId }) => {
      if (receiverId) {
        io.to(`user:${receiverId}`).emit("typing:start", { senderId: userId });
      }
    });

    socket.on("typing:stop", ({ receiverId }) => {
      if (receiverId) {
        io.to(`user:${receiverId}`).emit("typing:stop", { senderId: userId });
      }
    });

    // ── Live Video Session & WebRTC Signaling ──
    socket.on("session:join", ({ sessionId, userInfo }) => {
      if (!sessionId) return;
      const roomName = `session:${sessionId}`;
      socket.join(roomName);
      socket.sessionId = sessionId;
      socket.userInfo = userInfo;

      // Broadcast to existing participants that a new peer joined
      socket.to(roomName).emit("session:peer-joined", {
        socketId: socket.id,
        userId: userId || socket.id,
        userInfo: userInfo || { name: "Peer" },
      });

      console.log(`[Socket.io] Socket ${socket.id} joined ${roomName}`);
    });

    socket.on("signal:offer", ({ to, offer, sessionId }) => {
      io.to(to).emit("signal:offer", {
        from: socket.id,
        offer,
        sessionId,
        userInfo: socket.userInfo,
      });
    });

    socket.on("signal:answer", ({ to, answer, sessionId }) => {
      io.to(to).emit("signal:answer", {
        from: socket.id,
        answer,
        sessionId,
      });
    });

    socket.on("signal:ice-candidate", ({ to, candidate, sessionId }) => {
      io.to(to).emit("signal:ice-candidate", {
        from: socket.id,
        candidate,
        sessionId,
      });
    });

    socket.on("session:chat", ({ sessionId, message }) => {
      if (!sessionId) return;
      io.to(`session:${sessionId}`).emit("session:chat", {
        ...message,
        id: message.id || Date.now().toString(),
        senderId: userId || socket.id,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on("session:hand-raise", ({ sessionId, raised }) => {
      if (!sessionId) return;
      socket.to(`session:${sessionId}`).emit("session:hand-raise", {
        socketId: socket.id,
        userId,
        raised,
      });
    });

    socket.on("session:screen-share", ({ sessionId, sharing }) => {
      if (!sessionId) return;
      socket.to(`session:${sessionId}`).emit("session:screen-share", {
        socketId: socket.id,
        userId,
        sharing,
      });
    });

    socket.on("session:leave", ({ sessionId }) => {
      if (sessionId) {
        socket.leave(`session:${sessionId}`);
        socket.to(`session:${sessionId}`).emit("session:peer-left", {
          socketId: socket.id,
          userId,
        });
      }
    });

    socket.on("disconnect", () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
      if (socket.sessionId) {
        socket.to(`session:${socket.sessionId}`).emit("session:peer-left", {
          socketId: socket.id,
          userId: socket.userId,
        });
      }
    });
  });

  // Expose io globally for API routes to emit events
  global._io = io;

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
