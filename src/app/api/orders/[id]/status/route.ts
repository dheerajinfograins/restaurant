import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OrderStatus, PaymentMethod, Prisma } from "@prisma/client";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, paymentMethod } = body;

    const updateData: Prisma.OrderUpdateInput = {};
    if (status) {
      if (!Object.values(OrderStatus).includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      updateData.status = status;
    }
    if (paymentMethod) {
      if (!Object.values(PaymentMethod).includes(paymentMethod)) {
        return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
      }
      updateData.paymentMethod = paymentMethod;
    }

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        items: {
          include: {
            product: true
          }
        },
        table: true
      }
    });

    // @ts-expect-error - global.io is set in server.ts
    if (global.io) {
      // @ts-expect-error - global.io is set in server.ts
      global.io.emit("order:updated", order);
      if (status === "READY") {
        // @ts-expect-error - global.io is set in server.ts
        global.io.to(`restaurant:${order.restaurantId}`).emit("order:ready", order);
      }
      if (status === "SERVED") {
        // @ts-expect-error - global.io is set in server.ts
        global.io.to(`restaurant:${order.restaurantId}`).emit("order:served", order);
      }
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Failed to update order status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
