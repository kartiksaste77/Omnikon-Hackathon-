import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req) {
  try {
    const currentUser = getCurrentUser(req);
    const connections = db.getConnections(currentUser.id);
    const incomingRequests = db.getConnectionRequests(currentUser.id);
    const sentRequests = db.getSentConnectionRequests(currentUser.id);

    // Filter campus peers who are not yet connected and have no pending requests
    const connectedIds = (currentUser.connectedUserIds || []);
    const sentTargetIds = sentRequests.map((r) => r.toUserId);
    const incomingSenderIds = incomingRequests.map((r) => r.fromUserId);

    const discoverPeers = db.getUsers().filter(
      (u) =>
        u.id !== currentUser.id &&
        !connectedIds.includes(u.id) &&
        !sentTargetIds.includes(u.id) &&
        !incomingSenderIds.includes(u.id)
    );

    return NextResponse.json({
      connections,
      incomingRequests,
      sentRequests,
      discoverPeers,
      currentUserId: currentUser.id
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const currentUser = getCurrentUser(req);
    const body = await req.json();
    const { toUserId, note } = body;

    if (!toUserId) {
      return NextResponse.json({ error: "toUserId is required" }, { status: 400 });
    }

    const result = db.sendConnectionRequest(currentUser.id, toUserId, note);
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    const { requestId, action } = body; // action: 'ACCEPT' | 'REJECT'

    if (!requestId || !action) {
      return NextResponse.json({ error: "requestId and action are required" }, { status: 400 });
    }

    if (action === "ACCEPT") {
      const result = db.acceptConnectionRequest(requestId);
      return NextResponse.json(result);
    } else {
      const result = db.rejectConnectionRequest(requestId);
      return NextResponse.json(result);
    }
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const currentUser = getCurrentUser(req);
    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("targetUserId");

    if (!targetUserId) {
      return NextResponse.json({ error: "targetUserId is required" }, { status: 400 });
    }

    const result = db.removeConnection(currentUser.id, targetUserId);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
