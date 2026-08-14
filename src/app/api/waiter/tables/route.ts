import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOptionalPayload } from "@/lib/permissions";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Try to get restaurantId from JWT token or fallback
    const payload = await getOptionalPayload();
    let restaurantId = payload?.restaurantId || searchParams.get("restaurantId");
    
    if (!restaurantId) {
      const defaultRestaurant = await prisma.restaurant.findFirst();
      restaurantId = defaultRestaurant?.id ?? null;
    }

    if (!restaurantId) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    const tables = await prisma.restaurantTable.findMany({
      where: {
        restaurantId,
      },
      include: {
        orders: {
          where: {
            status: {
              in: ["PENDING", "ACCEPTED", "PREPARING", "READY", "SERVED"],
            },
          },
          include: {
            items: {
              include: {
                product: {
                  select: {
                    name: true,
                    foodType: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        tableNumber: "asc",
      },
    });

    // Compute dynamic status based on active orders
    const tablesWithDynamicStatus = tables.map((table) => {
      let dynamicStatus = table.status.toString();
      let activeOrder = null;

      if (table.orders.length > 0) {
        activeOrder = table.orders[0];
        if (activeOrder.status === "READY") {
          dynamicStatus = "READY_TO_SERVE";
        } else if (activeOrder.status === "PREPARING") {
          dynamicStatus = "PREPARING";
        } else if (activeOrder.status === "PENDING" || activeOrder.status === "ACCEPTED") {
          dynamicStatus = "ORDERING";
        } else if (activeOrder.status === "SERVED") {
          dynamicStatus = "SERVED";
        }
      }

      return {
        id: table.id,
        tableNumber: table.tableNumber,
        capacity: table.capacity,
        status: table.status,
        dynamicStatus,
        activeOrder: activeOrder
          ? {
              id: activeOrder.id,
              orderNumber: activeOrder.orderNumber,
              status: activeOrder.status,
              totalAmount: Number(activeOrder.totalAmount),
              itemsCount: activeOrder.items.reduce((acc, curr) => acc + curr.quantity, 0),
              itemsSummary: activeOrder.items.map((i) => `${i.quantity}x ${i.product.name}`).join(", "),
              createdAt: activeOrder.createdAt.toISOString(),
            }
          : null,
      };
    });

    return NextResponse.json(tablesWithDynamicStatus);
  } catch (error) {
    console.error("Failed to fetch waiter tables:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
