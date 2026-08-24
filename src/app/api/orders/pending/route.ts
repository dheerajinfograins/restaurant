import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { autoProgressOrders } from "@/lib/order-auto-progress";
import { getAuthenticatedRestaurantId } from "@/lib/permissions";

export async function GET() {
  try {
    const restaurantId = await getAuthenticatedRestaurantId([
      "SUPER_ADMIN",
      "OWNER",
      "MANAGER",
      "WAITER",
      "CASHIER",
      "KITCHEN",
    ]);

    let orders = await prisma.order.findMany({
      where: {
        restaurantId,
        status: {
          in: [OrderStatus.PENDING, OrderStatus.ACCEPTED, OrderStatus.PREPARING, OrderStatus.READY],
        },
      },
      include: {
        items: {
          include: { product: true }
        },
        table: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Auto-progress orders if enough time has passed
    orders = await autoProgressOrders(orders);

    // Filter out SERVED orders that might have just been progressed
    const filteredOrders = orders.filter(o => o.status !== OrderStatus.SERVED);

    return NextResponse.json(filteredOrders);
  } catch (error) {
    console.error("Failed to fetch pending orders:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
