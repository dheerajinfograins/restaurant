import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOptionalPayload } from "@/lib/permissions";
import { OrderStatus } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const specificWaiterId = searchParams.get("waiterId");

    const payload = await getOptionalPayload();
    let restaurantId = payload?.restaurantId || searchParams.get("restaurantId");

    if (!restaurantId) {
      const defaultRestaurant = await prisma.restaurant.findFirst();
      restaurantId = defaultRestaurant?.id ?? null;
    }

    if (!restaurantId) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    // Today's start of day
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // 30 minutes threshold for active shift presence
    const onlineThreshold = new Date(Date.now() - 30 * 60 * 1000);

    const whereUserClause = {
      restaurantId,
      role: "WAITER" as const,
      ...(specificWaiterId ? { id: specificWaiterId } : {}),
    };

    const waiters = await prisma.user.findMany({
      where: whereUserClause,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
        orders: {
          select: {
            id: true,
            orderNumber: true,
            customerName: true,
            totalAmount: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            table: {
              select: {
                id: true,
                tableNumber: true,
                capacity: true,
              },
            },
            items: {
              select: {
                id: true,
                quantity: true,
                unitPrice: true,
                totalPrice: true,
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
            updatedAt: "desc",
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Also fetch all restaurant-wide served and paid orders today (both assigned & unassigned)
    const restaurantServedTodayOrders = await prisma.order.findMany({
      where: {
        restaurantId,
        status: { in: [OrderStatus.SERVED, OrderStatus.PAID] },
        OR: [
          { updatedAt: { gte: startOfToday } },
          { createdAt: { gte: startOfToday } },
        ],
      },
      select: {
        id: true,
        totalAmount: true,
        waiterId: true,
      },
    });

    const totalRestaurantServedToday = restaurantServedTodayOrders.length;
    const totalRestaurantRevenueToday = restaurantServedTodayOrders.reduce(
      (sum, o) => sum + Number(o.totalAmount || 0),
      0
    );

    const waiterPerformanceData = waiters.map((waiter) => {
      const allOrders = waiter.orders || [];

      // Served orders today (status SERVED or PAID, created or updated today)
      const servedToday = allOrders.filter(
        (o) =>
          (o.status === OrderStatus.SERVED || o.status === OrderStatus.PAID) &&
          (new Date(o.updatedAt) >= startOfToday || new Date(o.createdAt) >= startOfToday)
      );

      // All-time served orders
      const servedAllTime = allOrders.filter(
        (o) => o.status === OrderStatus.SERVED || o.status === OrderStatus.PAID
      );

      // Active orders currently in-flight
      const activeOrders = allOrders.filter(
        (o) =>
          o.status === OrderStatus.PENDING ||
          o.status === OrderStatus.ACCEPTED ||
          o.status === OrderStatus.PREPARING ||
          o.status === OrderStatus.READY
      );

      // Distinct active tables
      const activeTableNumbers = Array.from(
        new Set(activeOrders.map((o) => o.table?.tableNumber || "Takeaway"))
      );

      // Revenue calculated
      const revenueToday = servedToday.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
      const revenueAllTime = servedAllTime.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

      // Check online status: actively present within the last 30 minutes or having active orders
      const isOnline =
        waiter.isActive &&
        (Boolean(waiter.lastLoginAt && new Date(waiter.lastLoginAt) >= onlineThreshold) ||
          activeOrders.length > 0);

      // Format recent 20 served orders for timeline
      const recentServedLog = (servedAllTime || []).slice(0, 20).map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber || "ORD",
        customerName: o.customerName || "Guest",
        tableNumber: o.table?.tableNumber || "Takeaway",
        totalAmount: Number(o.totalAmount || 0),
        status: o.status,
        servedAt: o.updatedAt ? new Date(o.updatedAt).toISOString() : new Date().toISOString(),
        itemsCount: Array.isArray(o.items) ? o.items.reduce((s, i) => s + (i.quantity || 1), 0) : 0,
        items: Array.isArray(o.items)
          ? o.items.map((i) => ({
              name: i.product?.name || "Dish",
              quantity: i.quantity || 1,
              totalPrice: Number(i.totalPrice || 0),
            }))
          : [],
      }));

      const activeDate = waiter.lastLoginAt || allOrders?.[0]?.updatedAt || waiter.createdAt;
      const lastActiveTimestamp = activeDate
        ? new Date(activeDate).toISOString()
        : new Date().toISOString();

      return {
        id: waiter.id,
        name: waiter.name || "Staff Member",
        email: waiter.email || "",
        phone: waiter.phone || null,
        image: waiter.image || null,
        isActive: Boolean(waiter.isActive),
        isOnline,
        lastActiveAt: lastActiveTimestamp,
        tablesServedToday: servedToday.length,
        tablesServedTotal: servedAllTime.length,
        activeOrdersCount: activeOrders.length,
        activeTableNumbers,
        revenueToday,
        revenueAllTime,
        recentServedOrders: recentServedLog,
      };
    });

    const totalWaitersServedToday = waiterPerformanceData.reduce(
      (s, w) => s + (w.tablesServedToday || 0),
      0
    );
    const totalWaitersRevenueToday = waiterPerformanceData.reduce(
      (s, w) => s + (w.revenueToday || 0),
      0
    );

    // Summary totals for admin overview cards
    const summary = {
      totalWaiters: waiters.length,
      onlineWaiters: waiterPerformanceData.filter((w) => w.isOnline).length,
      totalServedToday: Math.max(totalRestaurantServedToday, totalWaitersServedToday),
      totalRevenueToday: Math.max(totalRestaurantRevenueToday, totalWaitersRevenueToday),
    };

    return NextResponse.json({
      summary,
      waiters: waiterPerformanceData,
    });
  } catch (error) {
    console.error("Failed to fetch waiter performance:", error);
    return NextResponse.json(
      {
        summary: {
          totalWaiters: 0,
          onlineWaiters: 0,
          totalServedToday: 0,
          totalRevenueToday: 0,
        },
        waiters: [],
      },
      { status: 200 }
    );
  }
}
