import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OrderStatus, PaymentMethod, Prisma } from "@prisma/client";
import { getOptionalPayload } from "@/lib/permissions";

function emitOrderEvents(order: { restaurantId?: string | null }, status?: string) {
  // @ts-expect-error - global.io is set in server.ts
  const io = global.io;
  if (!io) return;

  const target = order.restaurantId ? io.to(`restaurant:${order.restaurantId}`) : io;
  target.emit("order:updated", order);

  if (status === "READY") {
    target.emit("order:ready", order);
  } else if (status === "SERVED") {
    target.emit("order:served", order);
  }
}

function getAssignedWaiterId(
  waiterId?: string,
  status?: string,
  payloadId?: string
): string | undefined {
  if (waiterId) return waiterId;
  if (status === "SERVED" && payloadId) return payloadId;
  return undefined;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, paymentMethod, waiterId } = body;

    if (status && !Object.values(OrderStatus).includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    if (paymentMethod && !Object.values(PaymentMethod).includes(paymentMethod)) {
      return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
    }

    const payload = await getOptionalPayload();
    const updateData: Prisma.OrderUpdateInput = {};

    if (status) {
      updateData.status = status;
    }
    if (paymentMethod) {
      updateData.paymentMethod = paymentMethod;
    }

    const assignedWaiterId = getAssignedWaiterId(waiterId, status, payload?.id);
    if (assignedWaiterId) {
      updateData.waiter = {
        connect: { id: assignedWaiterId },
      };
    }

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        items: {
          include: {
            product: true,
          },
        },
        table: true,
        waiter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    emitOrderEvents(order, status);

    return NextResponse.json(order);
  } catch (error) {
    console.error("Failed to update order status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


