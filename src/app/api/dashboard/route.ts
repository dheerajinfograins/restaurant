import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { handleError } from "@/helpers/error-handler";
import { successResponse } from "@/lib/api-response";
import { requireRoles } from "@/lib/permissions";

const DEFAULT_RESTAURANT_PROFILE = {
  name: "The Culinary Ledger",
  city: "Main Dining",
  phone: "+91 98765 43210",
  isActive: true,
  logo: null,
  coverImage: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&q=80",
};

type RecentOrderWithRelations = Prisma.OrderGetPayload<{
  include: {
    table: { select: { tableNumber: true } };
    restaurant: { select: { name: true; dietaryCategory: true } };
    items: {
      select: {
        id: true;
        quantity: true;
        totalPrice: true;
        product: { select: { name: true } };
      };
    };
  };
}>;

async function resolveRestaurantId(
  payload: { id?: string; restaurantId?: string | null },
  isSuperAdmin: boolean,
  requestedRestId: string | null
): Promise<string | undefined> {
  if (isSuperAdmin) {
    return requestedRestId && requestedRestId !== "all" ? requestedRestId : undefined;
  }

  if (payload.restaurantId) {
    return payload.restaurantId;
  }

  if (payload.id) {
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { restaurantId: true },
    });
    if (user?.restaurantId) {
      return user.restaurantId;
    }
  }

  const firstRest = await prisma.restaurant.findFirst({
    where: { isActive: true },
    select: { id: true },
  });
  return firstRest?.id || undefined;
}

async function getRestaurantProfile(
  restaurantId: string | undefined,
  isSuperAdmin: boolean,
  tenantCount: number
) {
  if (restaurantId) {
    return prisma.restaurant.findUnique({
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

  if (isSuperAdmin) {
    return {
      name: "All Restaurants (Platform Total)",
      city: `${tenantCount} Tenant Outlets`,
      phone: "+91 98765 43210",
      isActive: true,
      logo: null,
      coverImage: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&q=80",
    };
  }

  return null;
}

function calculateWeeklyRevenue(weeklyOrders: Array<{ createdAt: Date; totalAmount: unknown }>) {
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayLabels: string[] = [];
  const weeklyRevenue = [0, 0, 0, 0, 0, 0, 0];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dayLabels.push(dayNames[d.getDay()]);
  }

  for (const order of weeklyOrders) {
    const diffTime = Math.abs(today.getTime() - order.createdAt.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays >= 0 && diffDays < 7) {
      const index = 6 - diffDays;
      weeklyRevenue[index] += Number(order.totalAmount);
    }
  }

  const maxRevenue = Math.max(...weeklyRevenue, 1);
  const weeklyChartData = weeklyRevenue.map((amount) =>
    Math.round((amount / maxRevenue) * 100)
  );

  return { dayLabels, weeklyRevenue, weeklyChartData };
}

async function getTopDishes(orderWhere: Prisma.OrderWhereInput) {
  const topItems = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: {
      order: { ...orderWhere, status: { not: "CANCELLED" } },
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

  const productMap = new Map(productRecords.map((p) => [p.id, p]));

  return topItems.map((item) => {
    const prod = productMap.get(item.productId);
    return {
      id: item.productId,
      name: prod?.name || "Popular Dish",
      image: prod?.image || null,
      totalSold: item._sum?.quantity || 0,
      revenue: Number(item._sum?.totalPrice || 0),
    };
  });
}

function formatRecentOrders(orders: RecentOrderWithRelations[]) {
  return orders.map((o) => ({
    id: o.id,
    tableNumber: o.table?.tableNumber || "Takeaway",
    restaurantName: o.restaurant?.name,
    totalAmount: Number(o.totalAmount),
    status: o.status,
    paymentMethod: o.paymentMethod,
    itemsCount: o.items.reduce((acc, curr) => acc + curr.quantity, 0),
    itemsSummary: o.items.map((i) => `${i.quantity}x ${i.product.name}`).join(", "),
    createdAt: o.createdAt,
  }));
}

export async function GET(request: NextRequest) {
  try {
    const payload = await requireRoles(["SUPER_ADMIN", "OWNER", "MANAGER", "KITCHEN", "WAITER", "CASHIER"]);
    const isSuperAdmin = payload.role === "SUPER_ADMIN";
    const { searchParams } = new URL(request.url);
    const requestedRestId = searchParams.get("restaurantId");

    let restaurantsList: Array<{ id: string; name: string; dietaryCategory: string }> = [];
    if (isSuperAdmin) {
      restaurantsList = await prisma.restaurant.findMany({
        select: { id: true, name: true, dietaryCategory: true },
        orderBy: { name: "asc" },
      });
    }

    const restaurantId = await resolveRestaurantId(payload, isSuperAdmin, requestedRestId);
    const restaurant = await getRestaurantProfile(restaurantId, isSuperAdmin, restaurantsList.length);

    // 2. Today Range
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const orderWhere: Prisma.OrderWhereInput = restaurantId ? { restaurantId } : {};
    const tableWhere: Prisma.RestaurantTableWhereInput = restaurantId ? { restaurantId } : {};

    // 3. Lifetime Revenue & Today Revenue
    const [lifetimeRevResult, todayRevResult] = await Promise.all([
      prisma.order.aggregate({
        where: { ...orderWhere, status: "PAID" },
        _sum: { totalAmount: true },
      }),
      prisma.order.aggregate({
        where: {
          ...orderWhere,
          status: "PAID",
          createdAt: { gte: startOfToday },
        },
        _sum: { totalAmount: true },
      }),
    ]);

    const revenue = Number(lifetimeRevResult?._sum?.totalAmount || 0);
    const todayRevenue = Number(todayRevResult?._sum?.totalAmount || 0);

    // 4. Total Orders & Today Orders
    const [totalOrders, todayOrders] = await Promise.all([
      prisma.order.count({ where: orderWhere }),
      prisma.order.count({
        where: {
          ...orderWhere,
          createdAt: { gte: startOfToday },
        },
      }),
    ]);

    // 5. Tables & Occupancy
    const [totalTables, occupiedTables, availableTables] = await Promise.all([
      prisma.restaurantTable.count({ where: tableWhere }),
      prisma.restaurantTable.count({ where: { ...tableWhere, status: "OCCUPIED" } }),
      prisma.restaurantTable.count({ where: { ...tableWhere, status: "AVAILABLE" } }),
    ]);

    // 6. Customers count (distinct phones)
    const customersGroup = await prisma.order.groupBy({
      by: ["customerPhone"],
      where: { ...orderWhere, customerPhone: { not: "" } },
    });
    const totalCustomers = customersGroup.length;

    // 7. Recent Orders (last 6 with items)
    const recentOrders = await prisma.order.findMany({
      where: orderWhere,
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        table: { select: { tableNumber: true } },
        restaurant: { select: { name: true, dietaryCategory: true } },
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
        ...orderWhere,
        status: "PAID",
        createdAt: { gte: sevenDaysAgo },
      },
      select: { createdAt: true, totalAmount: true },
    });

    const { dayLabels, weeklyRevenue, weeklyChartData } = calculateWeeklyRevenue(weeklyOrders);
    const topDishes = await getTopDishes(orderWhere);

    return successResponse("Dashboard data fetched", {
      isSuperAdmin,
      restaurants: restaurantsList,
      restaurant: restaurant || DEFAULT_RESTAURANT_PROFILE,
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
      recentOrders: formatRecentOrders(recentOrders),
      weeklyChartData,
      weeklyRevenue,
      dayLabels,
      topDishes,
    });
  } catch (error) {
    return handleError(error);
  }
}

