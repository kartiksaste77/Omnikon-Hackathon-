// src/lib/socket.js — Client-side Socket.io singleton
"use client";
import { io } from "socket.io-client";

let socket = null;

export function getSocket(token) {
  if (socket && socket.connected) return socket;

  // Disconnect stale socket
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  socket = io(typeof window !== "undefined" ? window.location.origin : "", {
    auth: { token: token || null },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on("connect", () => {
    console.log("[Socket.io] Connected:", socket.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("[Socket.io] Disconnected:", reason);
  });

  socket.on("connect_error", (err) => {
    console.warn("[Socket.io] Connection error:", err.message);
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export default getSocket;
