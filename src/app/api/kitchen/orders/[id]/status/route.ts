import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

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
        waiter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });


    // Emit live socket event once if socket.io is initialized
    // @ts-expect-error - global.io is set in server.ts
    if (global.io) {
      if (updatedOrder.restaurantId) {
        // @ts-expect-error - global.io is set in server.ts
        global.io.to(`restaurant:${updatedOrder.restaurantId}`).emit("order:updated", updatedOrder);
        if (status === "READY") {
          // @ts-expect-error - global.io is set in server.ts
          global.io.to(`restaurant:${updatedOrder.restaurantId}`).emit("order:ready", updatedOrder);
        } else if (status === "SERVED") {
          // @ts-expect-error - global.io is set in server.ts
          global.io.to(`restaurant:${updatedOrder.restaurantId}`).emit("order:served", updatedOrder);
        }
      } else {
        // @ts-expect-error - global.io is set in server.ts
        global.io.emit("order:updated", updatedOrder);
        if (status === "READY") {
          // @ts-expect-error - global.io is set in server.ts
          global.io.emit("order:ready", updatedOrder);
        } else if (status === "SERVED") {
          // @ts-expect-error - global.io is set in server.ts
          global.io.emit("order:served", updatedOrder);
        }
      }
    }

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error("Failed to update kitchen order status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
