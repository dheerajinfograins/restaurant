import { prisma } from "@/lib/prisma";
import { handleError } from "@/helpers/error-handler";
import { successResponse } from "@/lib/api-response";
import { requireRoles } from "@/lib/permissions";

export async function GET() {
  try {
    const payload = await requireRoles(["SUPER_ADMIN", "OWNER", "MANAGER", "KITCHEN", "WAITER", "CASHIER"]);
    let restaurantId: string | undefined = payload.restaurantId || undefined;

    if (!restaurantId && payload.id) {
      const user = await prisma.user.findUnique({
        where: { id: payload.id },
        select: { restaurantId: true }
      });
      restaurantId = user?.restaurantId || undefined;
    }

    if (!restaurantId) {
      const firstRest = await prisma.restaurant.findFirst({
        where: { isActive: true },
        select: { id: true }
      });
      restaurantId = firstRest?.id || undefined;
    }

    // 1. Restaurant Profile
    let restaurant = null;
    if (restaurantId) {
      restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          city: true,
          logo: true,
          coverImage: true,
          isActive: true,
        },
      });
    }

    // 2. Today Range
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // 3. Lifetime Revenue & Today Revenue
    const [lifetimeRevResult, todayRevResult] = await Promise.all([
      prisma.order.aggregate({
        where: { restaurantId, status: "PAID" },
        _sum: { totalAmount: true },
      }),
      prisma.order.aggregate({
        where: {
          restaurantId,
          status: "PAID",
          createdAt: { gte: startOfToday },
        },
        _sum: { totalAmount: true },
      }),
    ]);

    const revenue = lifetimeRevResult?._sum?.totalAmount
      ? Number(lifetimeRevResult._sum.totalAmount)
      : 0;
    const todayRevenue = todayRevResult?._sum?.totalAmount
      ? Number(todayRevResult._sum.totalAmount)
      : 0;

    // 4. Total Orders & Today Orders
    const [totalOrders, todayOrders] = await Promise.all([
      prisma.order.count({ where: { restaurantId } }),
      prisma.order.count({
        where: {
          restaurantId,
          createdAt: { gte: startOfToday },
        },
      }),
    ]);

    // 5. Tables & Occupancy
    const [totalTables, occupiedTables, availableTables] = await Promise.all([
      prisma.restaurantTable.count({ where: { restaurantId } }),
      prisma.restaurantTable.count({ where: { restaurantId, status: "OCCUPIED" } }),
      prisma.restaurantTable.count({ where: { restaurantId, status: "AVAILABLE" } }),
    ]);

    // 6. Customers count (distinct phones)
    const customersGroup = await prisma.order.groupBy({
      by: ["customerPhone"],
      where: { restaurantId, customerPhone: { not: "" } },
    });
    const totalCustomers = customersGroup.length;

    // 7. Recent Orders (last 6 with items)
    const recentOrders = await prisma.order.findMany({
      where: { restaurantId },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        table: { select: { tableNumber: true } },
        items: {
          select: {
            id: true,
            quantity: true,
            totalPrice: true,
            product: { select: { name: true } },
          },
        },
      },
    });

    // 8. Weekly Revenue Pattern (Last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const weeklyOrders = await prisma.order.findMany({
      where: {
        restaurantId,
        status: "PAID",
        createdAt: { gte: sevenDaysAgo },
      },
      select: { createdAt: true, totalAmount: true },
    });

    const dayLabels: string[] = [];
    const weeklyRevenue = [0, 0, 0, 0, 0, 0, 0];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dayLabels.push(dayNames[d.getDay()]);
    }

    const today = new Date();
    weeklyOrders.forEach((order) => {
      const diffTime = Math.abs(today.getTime() - order.createdAt.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < 7) {
        const index = 6 - diffDays;
        weeklyRevenue[index] += Number(order.totalAmount);
      }
    });

    const maxRevenue = Math.max(...weeklyRevenue, 1);
    const weeklyChartData = weeklyRevenue.map((amount) =>
      Math.round((amount / maxRevenue) * 100)
    );

    // 9. Top 4 Popular Dishes
    const topItems = await prisma.orderItem.groupBy({
      by: ["productId"],
      where: {
        order: { restaurantId, status: { not: "CANCELLED" } },
      },
      _sum: { quantity: true, totalPrice: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 4,
    });

    const productIds = topItems.map((t) => t.productId);
    const productRecords = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, image: true, price: true },
    });

    const topDishes = topItems.map((item) => {
      const prod = productRecords.find((p) => p.id === item.productId);
      return {
        id: item.productId,
        name: prod?.name || "Popular Dish",
        image: prod?.image || null,
        totalSold: item._sum?.quantity || 0,
        revenue: Number(item._sum?.totalPrice || 0),
      };
    });

    return successResponse("Dashboard data fetched", {
      restaurant: restaurant || {
        name: "The Culinary Ledger",
        city: "Main Dining",
        phone: "+91 98765 43210",
        isActive: true,
        logo: null,
        coverImage: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&q=80",
      },
      metrics: {
        revenue,
        todayRevenue,
        totalOrders,
        todayOrders,
        totalTables,
        occupiedTables,
        availableTables,
        totalCustomers,
      },
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        tableNumber: o.table?.tableNumber || "Takeaway",
        totalAmount: Number(o.totalAmount),
        status: o.status,
        paymentMethod: o.paymentMethod,
        itemsCount: o.items.reduce((acc: number, curr: { quantity: number }) => acc + curr.quantity, 0),
        itemsSummary: o.items.map((i: { quantity: number; product: { name: string } }) => `${i.quantity}x ${i.product.name}`).join(", "),
        createdAt: o.createdAt,
      })),
      weeklyChartData,
      weeklyRevenue,
      dayLabels,
      topDishes,
    });
  } catch (error) {
    return handleError(error);
  }
}
