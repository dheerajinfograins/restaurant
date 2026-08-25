import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { emitAppSocketEvent } from "@/lib/socket-server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !Object.values(OrderStatus).includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
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

    emitAppSocketEvent("order:updated", updatedOrder, updatedOrder.restaurantId);
    if (status === "READY") {
      emitAppSocketEvent("order:ready", updatedOrder, updatedOrder.restaurantId);
    } else if (status === "SERVED") {
      emitAppSocketEvent("order:served", updatedOrder, updatedOrder.restaurantId);
    }

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error("Failed to update kitchen order status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
