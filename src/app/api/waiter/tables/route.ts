import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOptionalPayload } from "@/lib/permissions";

interface OrderItem {
  quantity: number;
  product?: {
    name: string | null;
    foodType?: string | null;
  } | null;
}

interface OrderWaiter {
  id: string;
  name: string;
}

interface ActiveOrder {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount?: number | string | null | { toString(): string };
  waiterId?: string | null;
  waiter?: OrderWaiter | null;
  items?: OrderItem[];
  createdAt?: Date | string | null;
}

interface TableRecord {
  id: string;
  tableNumber: string | number;
  capacity: number;
  status: { toString(): string } | string;
  orders?: ActiveOrder[];
}

const ORDER_STATUS_TO_DYNAMIC_STATUS: Record<string, string> = {
  READY: "READY_TO_SERVE",
  PREPARING: "PREPARING",
  PENDING: "ORDERING",
  ACCEPTED: "ORDERING",
  SERVED: "SERVED",
};

function getDynamicStatus(tableStatus: string, orderStatus?: string): string {
  if (!orderStatus) return tableStatus;
  return ORDER_STATUS_TO_DYNAMIC_STATUS[orderStatus] || tableStatus;
}

function formatActiveOrder(order: ActiveOrder | null | undefined) {
  if (!order) return null;

  const items = Array.isArray(order.items) ? order.items : [];
  const itemsCount = items.reduce((acc: number, curr: OrderItem) => acc + (curr.quantity || 1), 0);
  const itemsSummary = items
    .map((item: OrderItem) => `${item.quantity}x ${item.product?.name || "Dish"}`)
    .join(", ");

  const createdAt = order.createdAt ? new Date(order.createdAt).toISOString() : new Date().toISOString();

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    totalAmount: Number(order.totalAmount || 0),
    waiterId: order.waiterId,
    waiter: order.waiter
      ? {
          id: order.waiter.id,
          name: order.waiter.name,
        }
      : null,
    itemsCount,
    itemsSummary,
    createdAt,
  };
}

function formatTable(table: TableRecord) {
  const activeOrder = table.orders?.[0] || null;
  const dynamicStatus = getDynamicStatus(table.status.toString(), activeOrder?.status);

  return {
    id: table.id,
    tableNumber: table.tableNumber,
    capacity: table.capacity,
    status: table.status,
    dynamicStatus,
    activeOrder: formatActiveOrder(activeOrder),
  };
}

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
            waiter: {
              select: {
                id: true,
                name: true,
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

    const tablesWithDynamicStatus = tables.map(formatTable);

    return NextResponse.json(tablesWithDynamicStatus);
  } catch (error) {
    console.error("Failed to fetch waiter tables:", error);
    return NextResponse.json([], { status: 200 });
  }
}

