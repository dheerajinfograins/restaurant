import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoles, getAuthenticatedRestaurantId } from "@/lib/permissions";
import { Prisma } from "@prisma/client";

type ReportOrder = Prisma.OrderGetPayload<{
  include: {
    items: {
      include: {
        product: {
          include: {
            category: true;
          };
        };
      };
    };
    table: true;
    waiter: true;
  };
}>;

type ProductStat = { name: string; category: string; orders: number; revenue: number };
type CategoryStat = { name: string; orders: number; revenue: number };
type TableStat = { id: string; name: string; orderCount: number; revenue: number };

const HOURLY_INTERVALS = [
  { label: "8-10 AM", start: 8, end: 10 },
  { label: "10-12 PM", start: 10, end: 12 },
  { label: "12-2 PM", start: 12, end: 14 },
  { label: "2-4 PM", start: 14, end: 16 },
  { label: "4-6 PM", start: 16, end: 18 },
  { label: "6-8 PM", start: 18, end: 20 },
  { label: "8-10 PM", start: 20, end: 22 },
  { label: "10-12 AM", start: 22, end: 24 },
];

async function resolveRestaurantFilter(
  payload: { role: string; restaurantId?: string | null },
  isSuperAdmin: boolean,
  requestedRestId: string | null
) {
  const whereClause: Prisma.OrderWhereInput = {};
  let restaurantsList: Array<{ id: string; name: string; dietaryCategory: string }> = [];

  if (isSuperAdmin) {
    restaurantsList = await prisma.restaurant.findMany({
      select: { id: true, name: true, dietaryCategory: true },
      orderBy: { name: "asc" },
    });

    if (requestedRestId && requestedRestId !== "all") {
      whereClause.restaurantId = requestedRestId;
    }
  } else {
    const restaurantId = payload.restaurantId || (await getAuthenticatedRestaurantId(["OWNER", "MANAGER"]));
    whereClause.restaurantId = restaurantId;
  }

  return { whereClause, restaurantsList };
}

function getDateRange(range: string): { startDate: Date; endDate: Date } {
  const startDate = new Date();
  let endDate = new Date();
  endDate.setHours(23, 59, 59, 999);

  switch (range) {
    case "today":
      startDate.setHours(0, 0, 0, 0);
      break;
    case "yesterday":
      startDate.setDate(startDate.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999);
      break;
    case "last30":
      startDate.setDate(startDate.getDate() - 29);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "this_month":
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "all":
      startDate.setFullYear(2020, 0, 1);
      break;
    case "last7":
    default:
      startDate.setDate(startDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      break;
  }

  return { startDate, endDate };
}

function calculateFinancialKPIs(orders: ReportOrder[]) {
  let totalSales = 0;
  let completedOrders = 0;
  let pendingOrders = 0;
  let pendingAmount = 0;
  let cash = 0;
  let upi = 0;
  let card = 0;

  for (const o of orders) {
    const amt = Number(o.totalAmount || 0);
    if (o.status === "PAID") {
      totalSales += amt;
      completedOrders += 1;
      if (o.paymentMethod === "CASH") {
        cash += amt;
      } else if (o.paymentMethod === "CARD") {
        card += amt;
      } else {
        upi += amt;
      }
    } else if (o.status !== "CANCELLED") {
      pendingAmount += amt;
      pendingOrders += 1;
    }
  }

  const totalOrders = orders.length;
  const avgOrderValue = completedOrders > 0 ? totalSales / completedOrders : 0;

  return {
    kpis: {
      totalSales,
      totalOrders,
      completedOrders,
      pendingOrders,
      pendingAmount,
      avgOrderValue,
    },
    paymentDetails: {
      cash,
      upi,
      card,
      totalSales,
      pendingAmount,
    },
  };
}

function generateHourlySalesChart(orders: ReportOrder[]) {
  return HOURLY_INTERVALS.map((interval) => {
    let sales = 0;
    let orderCount = 0;

    for (const order of orders) {
      const hour = new Date(order.createdAt).getHours();
      if (hour >= interval.start && hour < interval.end) {
        sales += Number(order.totalAmount || 0);
        orderCount += 1;
      }
    }

    return { name: interval.label, sales, orders: orderCount };
  });
}

function getChartDays(range: string): number {
  if (range === "last30" || range === "this_month") return 30;
  if (range === "all") return 14;
  return 7;
}

function generateDailySalesChart(allOrders: ReportOrder[], range: string) {
  const chartDays = getChartDays(range);
  const daysArray = Array.from({ length: chartDays }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (chartDays - 1 - i));
    d.setHours(0, 0, 0, 0);
    return d;
  });

  return daysArray.map((date) => {
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);

    const dayOrders = allOrders.filter((o) => {
      const d = new Date(o.createdAt);
      return d >= date && d < nextDay;
    });

    const daySales = dayOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

    return {
      name: date.toLocaleDateString("en-US", {
        weekday: chartDays <= 7 ? "short" : undefined,
        month: chartDays > 7 ? "short" : undefined,
        day: "numeric",
      }),
      sales: daySales,
      orders: dayOrders.length,
    };
  });
}

function generateSalesChart(orders: ReportOrder[], allOrders: ReportOrder[], range: string) {
  if (range === "today" || range === "yesterday") {
    return generateHourlySalesChart(orders);
  }
  return generateDailySalesChart(allOrders, range);
}

function generateOrderStatusAnalytics(orders: ReportOrder[]) {
  const statusCounts: Record<string, number> = {};
  for (const o of orders) {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
  }

  return Object.keys(statusCounts)
    .map((status) => ({
      name: status,
      orders: statusCounts[status],
    }))
    .sort((a, b) => b.orders - a.orders);
}

function generatePaymentAnalytics(paymentDetails: {
  cash: number;
  upi: number;
  card: number;
  totalSales: number;
  pendingAmount: number;
}) {
  const paymentAnalytics = [
    { name: "UPI / Online", value: paymentDetails.upi },
    { name: "Cash", value: paymentDetails.cash },
    { name: "Card", value: paymentDetails.card },
  ].filter((p) => p.value > 0);

  return {
    paymentAnalytics: paymentAnalytics.length > 0 ? paymentAnalytics : [{ name: "UPI / Cash", value: 1 }],
    paymentSummary: {
      paid: paymentDetails.totalSales,
      pending: paymentDetails.pendingAmount,
      cash: paymentDetails.cash,
      upi: paymentDetails.upi,
      card: paymentDetails.card,
    },
  };
}

function recordProductStat(productStats: Record<string, ProductStat>, item: ReportOrder["items"][number]) {
  if (!productStats[item.productId]) {
    productStats[item.productId] = {
      name: item.product.name,
      category: item.product.category?.name || "General",
      orders: 0,
      revenue: 0,
    };
  }
  productStats[item.productId].orders += item.quantity;
  productStats[item.productId].revenue += Number(item.totalPrice || 0);
}

function recordCategoryStat(categoryStats: Record<string, CategoryStat>, item: ReportOrder["items"][number]) {
  if (!item.product.category) return;
  const catId = item.product.categoryId;
  if (!categoryStats[catId]) {
    categoryStats[catId] = {
      name: item.product.category.name,
      orders: 0,
      revenue: 0,
    };
  }
  categoryStats[catId].orders += item.quantity;
  categoryStats[catId].revenue += Number(item.totalPrice || 0);
}

function generateProductAndCategoryStats(orders: ReportOrder[]) {
  const productStats: Record<string, ProductStat> = {};
  const categoryStats: Record<string, CategoryStat> = {};

  for (const order of orders) {
    for (const item of order.items) {
      recordProductStat(productStats, item);
      recordCategoryStat(categoryStats, item);
    }
  }

  const topProducts = Object.values(productStats)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  const categoryPerformance = Object.values(categoryStats).sort((a, b) => b.revenue - a.revenue);

  return { topProducts, categoryPerformance };
}

function generateTablePerformance(orders: ReportOrder[], hasRestaurantFilter: boolean) {
  const tableStats: Record<string, TableStat> = {};

  for (const order of orders) {
    const tableName = order.table?.tableNumber ? `Table ${order.table.tableNumber}` : "Quick Counter";
    const statKey = !hasRestaurantFilter ? tableName : (order.tableId || "quick-counter");

    if (!tableStats[statKey]) {
      tableStats[statKey] = {
        id: statKey,
        name: tableName,
        orderCount: 0,
        revenue: 0,
      };
    }
    tableStats[statKey].orderCount += 1;
    tableStats[statKey].revenue += Number(order.totalAmount || 0);
  }

  return Object.values(tableStats)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 100);
}

export async function GET(request: Request) {
  try {
    const payload = await requireRoles(["SUPER_ADMIN", "OWNER", "MANAGER"]);
    const isSuperAdmin = payload.role === "SUPER_ADMIN";

    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "last7";
    const requestedRestId = searchParams.get("restaurantId");

    const { whereClause, restaurantsList } = await resolveRestaurantFilter(payload, isSuperAdmin, requestedRestId);

    const allOrders = await prisma.order.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
        table: true,
        waiter: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const { startDate, endDate } = getDateRange(range);
    const filteredOrders = allOrders.filter((o) => {
      const d = new Date(o.createdAt);
      return d >= startDate && d <= endDate;
    });

    const { kpis, paymentDetails } = calculateFinancialKPIs(filteredOrders);
    const salesChart = generateSalesChart(filteredOrders, allOrders, range);
    const orderAnalytics = generateOrderStatusAnalytics(filteredOrders);
    const { paymentAnalytics, paymentSummary } = generatePaymentAnalytics(paymentDetails);
    const { topProducts, categoryPerformance } = generateProductAndCategoryStats(filteredOrders);
    const tablePerformance = generateTablePerformance(filteredOrders, Boolean(whereClause.restaurantId));

    return NextResponse.json({
      kpis,
      salesChart,
      orderAnalytics,
      paymentAnalytics,
      paymentSummary,
      topProducts,
      categoryPerformance,
      tablePerformance,
      totalOrdersCount: allOrders.length,
      currentRange: range,
      restaurants: restaurantsList,
      isSuperAdmin,
    });
  } catch (error) {
    console.error("Failed to generate live reports:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}

