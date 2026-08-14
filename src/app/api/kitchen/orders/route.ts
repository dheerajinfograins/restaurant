import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOptionalPayload } from "@/lib/permissions";
import { Prisma, OrderStatus } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");

    // Resolve restaurantId
    const payload = await getOptionalPayload();
    let restaurantId = payload?.restaurantId || searchParams.get("restaurantId");

    if (!restaurantId) {
      const defaultRestaurant = await prisma.restaurant.findFirst();
      restaurantId = defaultRestaurant?.id ?? null;
    }

    if (!restaurantId) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    const whereClause: Prisma.OrderWhereInput = {
      restaurantId,
    };

    if (statusParam) {
      const upper = statusParam.toUpperCase();
      if (upper === "NEW") {
        whereClause.status = {
          in: [OrderStatus.PENDING, OrderStatus.ACCEPTED],
        };
      } else if (upper === "PREPARING") {
        whereClause.status = OrderStatus.PREPARING;
      } else if (upper === "READY") {
        whereClause.status = OrderStatus.READY;
      } else if (upper === "ACTIVE") {
        whereClause.status = {
          in: [OrderStatus.PENDING, OrderStatus.ACCEPTED, OrderStatus.PREPARING, OrderStatus.READY],
        };
      } else if (Object.values(OrderStatus).includes(upper as OrderStatus)) {
        whereClause.status = upper as OrderStatus;
      }
    } else {
      // Default: All active kitchen orders
      whereClause.status = {
        in: [OrderStatus.PENDING, OrderStatus.ACCEPTED, OrderStatus.PREPARING, OrderStatus.READY],
      };
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                foodType: true,
                preparationTime: true,
                image: true,
              },
            },
          },
        },
        table: {
          select: {
            id: true,
            tableNumber: true,
            capacity: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const formattedOrders = orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      notes: order.notes,
      totalAmount: Number(order.totalAmount),
      status: order.status,
      table: {
        id: order.table?.id || "",
        tableNumber: order.table?.tableNumber || "Takeaway",
        capacity: order.table?.capacity || 4,
      },
      items: order.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
        product: {
          id: item.product?.id || "",
          name: item.product?.name || "Dish Item",
          foodType: item.product?.foodType || "VEG",
          preparationTime: item.product?.preparationTime || 10,
          image: item.product?.image || null,
        },
      })),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    }));

    return NextResponse.json(formattedOrders);
  } catch (error) {
    console.error("Failed to fetch kitchen orders:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
