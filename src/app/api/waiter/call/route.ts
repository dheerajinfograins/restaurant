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
    if (!restaurantId) {
      return NextResponse.json({ error: "Restaurant ID not found for waiter" }, { status: 400 });
    }

    const callerDisplayName = callerName || (payload as { name?: string } | null)?.name || "Admin / Manager";
    const alertMessage = message?.trim() || "Admin is calling you! Please report to the counter / service desk immediately.";

    // 1. Save Waiter Call to PostgreSQL database with status PENDING
    const dbCall = await prisma.waiterCall.create({
      data: {
        restaurantId,
        waiterId: waiter.id,
        callerName: callerDisplayName,
        message: alertMessage,
        status: "PENDING",
      },
    });

    const callPayload = {
      id: dbCall.id,
      waiterId: waiter.id,
      waiterName: waiter.name,
      callerName: callerDisplayName,
      message: alertMessage,
      timestamp: dbCall.createdAt.toISOString(),
      status: "PENDING",
    };

    // 2. Emit live real-time socket event (instant update when custom server/socket is active)
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const waiterId = searchParams.get("waiterId");
    const restaurantId = searchParams.get("restaurantId");
    const activeOnly = searchParams.get("activeOnly") !== "false";

    // Calls within the last 3 minutes
    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);

    if (waiterId) {
      // Find latest pending call for this waiter
      const pendingCalls = await prisma.waiterCall.findMany({
        where: {
          waiterId,
          ...(activeOnly ? { status: "PENDING" } : {}),
          createdAt: { gte: threeMinutesAgo },
        },
        include: {
          waiter: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      });

      const formatted = pendingCalls.map((c) => ({
        id: c.id,
        waiterId: c.waiterId,
        waiterName: c.waiter?.name || "Waiter",
        callerName: c.callerName || "Admin / Manager",
        message: c.message || "Admin is calling you!",
        status: c.status,
        timestamp: c.createdAt.toISOString(),
        acknowledgedAt: c.acknowledgedAt?.toISOString() || null,
      }));

      return NextResponse.json({
        success: true,
        calls: formatted,
        activeCall: formatted.length > 0 && formatted[0].status === "PENDING" ? formatted[0] : null,
      });
    }

    if (restaurantId) {
      const recentCalls = await prisma.waiterCall.findMany({
        where: {
          restaurantId,
          createdAt: { gte: threeMinutesAgo },
        },
        include: {
          waiter: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      });

      const formatted = recentCalls.map((c) => ({
        id: c.id,
        waiterId: c.waiterId,
        waiterName: c.waiter?.name || "Waiter",
        callerName: c.callerName || "Admin / Manager",
        message: c.message || "Admin is calling you!",
        status: c.status,
        timestamp: c.createdAt.toISOString(),
        acknowledgedAt: c.acknowledgedAt?.toISOString() || null,
      }));

      return NextResponse.json({
        success: true,
        calls: formatted,
      });
    }

    return NextResponse.json({ success: true, calls: [] });
  } catch (error) {
    console.error("Failed to fetch waiter calls:", error);
    return NextResponse.json(
      { error: "Internal server error fetching waiter calls" },
      { status: 500 }
    );
  }
}
