import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { callId, waiterId } = body;

    if (!waiterId) {
      return NextResponse.json({ error: "waiterId is required" }, { status: 400 });
    }

    if (callId) {
      await prisma.waiterCall.updateMany({
        where: { id: callId, waiterId },
        data: { status: "DISMISSED" },
      });
    } else {
      await prisma.waiterCall.updateMany({
        where: {
          waiterId,
          status: "PENDING",
          createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) },
        },
        data: { status: "DISMISSED" },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to dismiss waiter call:", error);
    return NextResponse.json(
      { error: "Internal server error dismissing waiter call" },
      { status: 500 }
    );
  }
}
