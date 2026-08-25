import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOptionalPayload } from "@/lib/permissions";
import { emitAppSocketEvent } from "@/lib/socket-server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { waiterId, message, callerName } = body;

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

    const callerDisplayName = callerName || (payload as { name?: string } | null)?.name || "Admin / Manager";
    const alertMessage = message?.trim() || "Admin is calling you! Please report to the counter / service desk immediately.";

    const callPayload = {
      id: `call-${Date.now()}-${randomUUID()}`,
      waiterId: waiter.id,
      waiterName: waiter.name,
      callerName: callerDisplayName,
      message: alertMessage,
      timestamp: new Date().toISOString(),
    };

    // Emit live real-time socket event once (scoped to restaurant room and super admin)
    emitAppSocketEvent("waiter:call", callPayload, restaurantId);

    return NextResponse.json({
      success: true,
      message: `Alert chime and call notification sent to ${waiter.name}!`,
      callData: callPayload,
    });
  } catch (error) {
    console.error("Failed to send waiter call alert:", error);
    return NextResponse.json(
      { error: "Internal server error dispatching waiter call" },
      { status: 500 }
    );
  }
}
