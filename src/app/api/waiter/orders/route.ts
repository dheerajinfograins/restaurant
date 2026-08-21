import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOptionalPayload } from "@/lib/permissions";
import { Prisma, OrderStatus } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const waiterIdParam = searchParams.get("waiterId");
    const mineParam = searchParams.get("mine");

    // Try to get restaurantId from JWT token or fallback
    const payload = await getOptionalPayload();
    let restaurantId = payload?.restaurantId || searchParams.get("restaurantId");

    // Touch lastLoginAt timestamp as active presence heartbeat
    if (payload?.id && payload?.role === "WAITER") {
      void prisma.user.update({
        where: { id: payload.id },
        data: { lastLoginAt: new Date() },
      }).catch(() => {});
    }

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

    // Filter by specific waiter or 'mine'
    if (mineParam === "true" && payload?.id) {
      whereClause.waiterId = payload.id;
    } else if (waiterIdParam) {
      whereClause.waiterId = waiterIdParam;
    }

    if (statusParam) {
      const upper = statusParam.toUpperCase();
      if (upper === "ALL") {
        // No status filter
      } else if (upper === "HISTORY") {
        whereClause.status = {
          in: [OrderStatus.SERVED, OrderStatus.PAID, OrderStatus.CANCELLED],
        };
      } else if (upper === "NEW") {
        whereClause.status = {
          in: [OrderStatus.PENDING, OrderStatus.ACCEPTED],
        };
      } else if (Object.values(OrderStatus).includes(upper as OrderStatus)) {
        whereClause.status = upper as OrderStatus;
      }
    } else {
      // By default, active ongoing floor orders
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
                price: true,
                foodType: true,
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
            status: true,
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
      waiterId: order.waiterId,
      waiter: order.waiter
        ? {
            id: order.waiter.id,
            name: order.waiter.name,
            email: order.waiter.email,
          }
        : null,
      table: {
        id: order.table?.id || "",
        tableNumber: order.table?.tableNumber || "Takeaway",
        capacity: order.table?.capacity || 4,
      },
      items: (order.items || []).map((item) => ({
        id: item.id,
        quantity: item.quantity || 1,
        unitPrice: Number(item.unitPrice || 0),
        totalPrice: Number(item.totalPrice || 0),
        product: {
          id: item.product?.id || "",
          name: item.product?.name || "Dish Item",
          foodType: item.product?.foodType || "VEG",
          image: item.product?.image || null,
        },
      })),
      createdAt: order.createdAt ? order.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: order.updatedAt ? order.updatedAt.toISOString() : new Date().toISOString(),
    }));

    return NextResponse.json(formattedOrders);
  } catch (error) {
    console.error("Failed to fetch waiter orders:", error);
    return NextResponse.json([], { status: 200 });
  }
}

