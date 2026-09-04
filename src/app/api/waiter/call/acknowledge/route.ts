import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOptionalPayload } from "@/lib/permissions";
import { emitAppSocketEvent } from "@/lib/socket-server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { callId, waiterId, waiterName, message } = body;

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

    const acknowledgedAt = new Date();

    // 1. Update database record(s) to ACKNOWLEDGED
    if (callId) {
      await prisma.waiterCall.updateMany({
        where: { id: callId, waiterId: waiter.id },
        data: {
          status: "ACKNOWLEDGED",
          acknowledgedAt,
        },
      });
    } else {
      // If no specific callId, acknowledge all pending calls for this waiter from the last 5 minutes
      await prisma.waiterCall.updateMany({
        where: {
          waiterId: waiter.id,
          status: "PENDING",
          createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) },
        },
        data: {
          status: "ACKNOWLEDGED",
          acknowledgedAt,
        },
      });
    }

    const ackPayload = {
      id: callId || `ack-${Date.now()}`,
      callId,
      waiterId: waiter.id,
      waiterName: finalWaiterName,
      message: ackMessage,
      timestamp: acknowledgedAt.toISOString(),
      status: "ACKNOWLEDGED",
    };

    // 2. Broadcast real-time socket event (instant update when custom server/socket is active)
    if (restaurantId) {
      emitAppSocketEvent("waiter:call:acknowledged", ackPayload, restaurantId);
    }

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
