import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOptionalPayload } from "@/lib/permissions";
import { Prisma, OrderStatus } from "@prisma/client";

type OrderWithRelations = Prisma.OrderGetPayload<{
  include: {
    items: {
      include: {
        product: {
          select: {
            id: true;
            name: true;
            price: true;
            foodType: true;
            image: true;
          };
        };
      };
    };
    table: {
      select: {
        id: true;
        tableNumber: true;
        capacity: true;
        status: true;
      };
    };
    waiter: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
  };
}>;

function touchWaiterPresence(payload: Awaited<ReturnType<typeof getOptionalPayload>>) {
  if (payload?.id && payload?.role === "WAITER") {
    void prisma.user.update({
      where: { id: payload.id },
      data: { lastLoginAt: new Date() },
    }).catch(() => {});
  }
}

function getOrderStatusFilter(statusParam: string | null): Prisma.OrderWhereInput["status"] {
  if (!statusParam) {
    return {
      in: [OrderStatus.PENDING, OrderStatus.ACCEPTED, OrderStatus.PREPARING, OrderStatus.READY],
    };
  }

  const upper = statusParam.toUpperCase();
  if (upper === "ALL") {
    return undefined;
  }
  if (upper === "HISTORY") {
    return {
      in: [OrderStatus.SERVED, OrderStatus.PAID, OrderStatus.CANCELLED],
    };
  }
  if (upper === "NEW") {
    return {
      in: [OrderStatus.PENDING, OrderStatus.ACCEPTED],
    };
  }
  if (Object.values(OrderStatus).includes(upper as OrderStatus)) {
    return upper as OrderStatus;
  }

  return undefined;
}

function buildWhereClause(
  restaurantId: string,
  searchParams: URLSearchParams,
  payload: Awaited<ReturnType<typeof getOptionalPayload>>
): Prisma.OrderWhereInput {
  const whereClause: Prisma.OrderWhereInput = {
    restaurantId,
  };

  const mineParam = searchParams.get("mine");
  const waiterIdParam = searchParams.get("waiterId");
  const statusParam = searchParams.get("status");

  if (mineParam === "true" && payload?.id) {
    whereClause.waiterId = payload.id;
  } else if (waiterIdParam) {
    whereClause.waiterId = waiterIdParam;
    if (payload?.role === "SUPER_ADMIN" && !searchParams.get("restaurantId")) {
      delete whereClause.restaurantId;
    }
  }

  const statusFilter = getOrderStatusFilter(statusParam);
  if (statusFilter) {
    whereClause.status = statusFilter;
  }

  return whereClause;
}

function formatOrder(order: OrderWithRelations) {
  return {
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
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const payload = await getOptionalPayload();
    let restaurantId = payload?.restaurantId || searchParams.get("restaurantId");

    touchWaiterPresence(payload);

    if (!restaurantId) {
      const defaultRestaurant = await prisma.restaurant.findFirst();
      restaurantId = defaultRestaurant?.id ?? null;
    }

    if (!restaurantId) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    const whereClause = buildWhereClause(restaurantId, searchParams, payload);

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

    return NextResponse.json(orders.map(formatOrder));
  } catch (error) {
    console.error("Failed to fetch waiter orders:", error);
    return NextResponse.json([], { status: 200 });
  }
}

