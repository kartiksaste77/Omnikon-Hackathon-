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

    socket.on("disconnect", () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
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
