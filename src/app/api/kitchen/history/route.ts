import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOptionalPayload } from "@/lib/permissions";
import { Prisma, OrderStatus } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get("timeRange") || "all";
    const statusParam = searchParams.get("status");

    // Resolve restaurantId
    const payload = await getOptionalPayload();
    let restaurantId = payload?.restaurantId || searchParams.get("restaurantId");

    if (!restaurantId && payload?.id) {
      const user = await prisma.user.findUnique({
        where: { id: payload.id },
        select: { restaurantId: true },
      });
      restaurantId = user?.restaurantId ?? null;
    }

    if (!restaurantId) {
      const defaultRestaurant = await prisma.restaurant.findFirst({
        where: { isActive: true },
        select: { id: true },
      });
      restaurantId = defaultRestaurant?.id ?? null;
    }

    if (!restaurantId) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    const whereClause: Prisma.OrderWhereInput = {
      restaurantId,
    };

    // Date range filter
    if (timeRange === "today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      whereClause.createdAt = { gte: today };
    } else if (timeRange === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      weekAgo.setHours(0, 0, 0, 0);
      whereClause.createdAt = { gte: weekAgo };
    }

    // Status filter
    if (statusParam && statusParam !== "ALL") {
      const upper = statusParam.toUpperCase();
      if (Object.values(OrderStatus).includes(upper as OrderStatus)) {
        whereClause.status = upper as OrderStatus;
      }
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
                price: true,
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
        createdAt: "desc",
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
      paymentMethod: order.paymentMethod,
      table: {
        id: order.table?.id || "",
        tableNumber: order.table?.tableNumber || "Takeaway",
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
          price: Number(item.product?.price || 0),
          image: item.product?.image || null,
        },
      })),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    }));

    return NextResponse.json(formattedOrders);
  } catch (error) {
    console.error("Failed to fetch kitchen history:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
