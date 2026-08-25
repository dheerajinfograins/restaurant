import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOptionalPayload } from "@/lib/permissions";

import { emitAppSocketEvent } from "@/lib/socket-server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { waiterId, waiterName, message } = body;

    if (!waiterId) {
      return NextResponse.json({ error: "waiterId is required" }, { status: 400 });
    }

    const payload = await getOptionalPayload();

    const waiter = await prisma.user.findUnique({
      where: { id: waiterId },
      select: {
        id: true,
        name: true,
        restaurantId: true,
        role: true,
      },
    });

    if (!waiter) {
      return NextResponse.json({ error: "Waiter not found" }, { status: 404 });
    }

    const restaurantId = waiter.restaurantId || payload?.restaurantId;
    const finalWaiterName = waiterName || waiter.name || "Waiter";
    const ackMessage =
      message?.trim() || `${finalWaiterName} has acknowledged your call and is on the way to the counter!`;

    const ackPayload = {
      id: `ack-${Date.now()}-${randomUUID()}`,
      waiterId: waiter.id,
      waiterName: finalWaiterName,
      message: ackMessage,
      timestamp: new Date().toISOString(),
    };

    // Broadcast real-time socket event once (scoped to restaurant room and super admin)
    emitAppSocketEvent("waiter:call:acknowledged", ackPayload, restaurantId);

    return NextResponse.json({
      success: true,
      message: "Admin notified that waiter is on the way!",
      ackData: ackPayload,
    });
  } catch (error) {
    console.error("Failed to process waiter call acknowledgment:", error);
    return NextResponse.json(
      { error: "Internal server error acknowledging waiter call" },
      { status: 500 }
    );
  }
}
