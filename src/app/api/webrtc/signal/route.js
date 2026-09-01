import { NextResponse } from "next/server";

// In-memory signaling store for WebRTC rooms
// Maps roomId -> { peers: [], signals: [] }
const roomSignals = new Map();

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get("roomId");
    const peerId = searchParams.get("peerId");
    const since = Number(searchParams.get("since") || "0");

    if (!roomId || !peerId) {
      return NextResponse.json({ error: "roomId and peerId are required" }, { status: 400 });
    }

    if (!roomSignals.has(roomId)) {
      roomSignals.set(roomId, { peers: new Map(), signals: [] });
    }

    const room = roomSignals.get(roomId);
    
    // Register/Heartbeat peer
    room.peers.set(peerId, Date.now());

    // Clean up dead peers (no heartbeat > 30s)
    const now = Date.now();
    for (const [pId, lastSeen] of room.peers.entries()) {
      if (now - lastSeen > 30000) {
        room.peers.delete(pId);
      }
    }

    // Get signals directed to this peer or broadcast to room (excluding own signals)
    const newSignals = room.signals.filter(
      (s) => s.timestamp > since && s.from !== peerId && (!s.to || s.to === peerId)
    );

    const activePeers = Array.from(room.peers.keys());

    return NextResponse.json({
      activePeers,
      signals: newSignals,
      latestTimestamp: now
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { roomId, from, to, type, payload } = body;

    if (!roomId || !from || !type) {
      return NextResponse.json({ error: "roomId, from, and type are required" }, { status: 400 });
    }

    if (!roomSignals.has(roomId)) {
      roomSignals.set(roomId, { peers: new Map(), signals: [] });
    }

    const room = roomSignals.get(roomId);
    const signalItem = {
      id: `sig_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      roomId,
      from,
      to: to || null,
      type, // 'offer' | 'answer' | 'candidate' | 'join' | 'leave' | 'chat' | 'hand' | 'reaction'
      payload,
      timestamp: Date.now()
    };

    room.signals.push(signalItem);

    // Keep only recent 100 signals per room
    if (room.signals.length > 100) {
      room.signals = room.signals.slice(-100);
    }

    return NextResponse.json({ success: true, signalId: signalItem.id });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
