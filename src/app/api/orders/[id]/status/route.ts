import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OrderStatus, PaymentMethod, Prisma } from "@prisma/client";
import { getOptionalPayload } from "@/lib/permissions";

import { emitAppSocketEvent } from "@/lib/socket-server";

function emitOrderEvents(
  order: {
    id: string;
    orderNumber?: string;
    restaurantId?: string | null;
    totalAmount?: unknown;
    paymentMethod?: string | null;
    customerName?: string;
    customerPhone?: string;
    table?: { tableNumber?: string | number } | null;
    restaurant?: { name?: string } | null;
  },
  status?: string,
  paymentMethod?: string
) {
  emitAppSocketEvent("order:updated", order, order.restaurantId);

  if (status === "READY") {
    emitAppSocketEvent("order:ready", order, order.restaurantId);
  } else if (status === "SERVED") {
    emitAppSocketEvent("order:served", order, order.restaurantId);
  } else if (status === "CANCELLED") {
    emitAppSocketEvent("order:cancelled", order, order.restaurantId);
  }

  if (status === "PAID" || paymentMethod) {
    emitAppSocketEvent(
      "payment:received",
      {
        orderId: order.id,
        orderNumber: order.orderNumber,
        totalAmount: Number(order.totalAmount || 0),
        paymentMethod: paymentMethod || order.paymentMethod || "CASH",
        status: "PAID",
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        tableNumber: order.table?.tableNumber,
        restaurantId: order.restaurantId,
        restaurantName: order.restaurant?.name,
        timestamp: new Date().toISOString(),
      },
      order.restaurantId
    );
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
        restaurant: {
          select: {
            id: true,
            name: true,
            dietaryCategory: true,
          },
        },
        waiter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    emitOrderEvents(order, status, paymentMethod);

    return NextResponse.json(order);
  } catch (error) {
    console.error("Failed to update order status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


