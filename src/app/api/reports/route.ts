import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "last7";

    const allOrders = await prisma.order.findMany({
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

    const now = new Date();
    const startDate = new Date();
    let endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    if (range === "today") {
      startDate.setHours(0, 0, 0, 0);
    } else if (range === "yesterday") {
      startDate.setDate(startDate.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999);
    } else if (range === "last7") {
      startDate.setDate(startDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
    } else if (range === "last30") {
      startDate.setDate(startDate.getDate() - 29);
      startDate.setHours(0, 0, 0, 0);
    } else if (range === "this_month") {
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
    } else if (range === "all") {
      startDate.setFullYear(2020, 0, 1);
    }

    const filteredOrders = allOrders.filter((o) => {
      const d = new Date(o.createdAt);
      return d >= startDate && d <= endDate;
    });

    // Financial KPIs
    let totalSales = 0;
    let completedOrders = 0;
    let pendingOrders = 0;
    let pendingAmount = 0;
    let cash = 0;
    let upi = 0;
    let card = 0;

    filteredOrders.forEach((o) => {
      const amt = Number(o.totalAmount || 0);
      if (o.status === "PAID") {
        totalSales += amt;
        completedOrders += 1;
        if (o.paymentMethod === "CASH") cash += amt;
        else if (o.paymentMethod === "CARD") card += amt;
        else upi += amt;
      } else if (o.status !== "CANCELLED") {
        pendingAmount += amt;
        pendingOrders += 1;
      }
    });

    const totalOrders = filteredOrders.length;
    const avgOrderValue = completedOrders > 0 ? totalSales / completedOrders : 0;

    const kpis = {
      totalSales,
      totalOrders,
      completedOrders,
      pendingOrders,
      pendingAmount,
      avgOrderValue,
    };

    // Sales Trend Chart Data
    let salesChart: Array<{ name: string; sales: number; orders: number }> = [];

    if (range === "today" || range === "yesterday") {
      // Group by 2-hour intervals for single-day views
      const hours = [
        { label: "8-10 AM", start: 8, end: 10 },
        { label: "10-12 PM", start: 10, end: 12 },
        { label: "12-2 PM", start: 12, end: 14 },
        { label: "2-4 PM", start: 14, end: 16 },
        { label: "4-6 PM", start: 16, end: 18 },
        { label: "6-8 PM", start: 18, end: 20 },
        { label: "8-10 PM", start: 20, end: 22 },
        { label: "10-12 AM", start: 22, end: 24 },
      ];

      salesChart = hours.map((h) => {
        let periodSales = 0;
        let periodOrders = 0;
        filteredOrders.forEach((o) => {
          const d = new Date(o.createdAt);
          const hour = d.getHours();
          if (hour >= h.start && hour < h.end) {
            periodSales += Number(o.totalAmount || 0);
            periodOrders += 1;
          }
        });
        return { name: h.label, sales: periodSales, orders: periodOrders };
      });
    } else {
      // Group by day
      const chartDays = range === "last30" || range === "this_month" ? 30 : range === "all" ? 14 : 7;
      const daysArray = Array.from({ length: chartDays }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (chartDays - 1 - i));
        d.setHours(0, 0, 0, 0);
        return d;
      });

      salesChart = daysArray.map((date) => {
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

    // Order Status Analytics
    const statusCounts: Record<string, number> = {};
    filteredOrders.forEach((o) => {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    });

    const orderAnalytics = Object.keys(statusCounts)
      .map((status) => ({
        name: status,
        orders: statusCounts[status],
      }))
      .sort((a, b) => b.orders - a.orders);

    // Payment Analytics
    const paymentAnalytics = [
      { name: "UPI / Online", value: upi },
      { name: "Cash", value: cash },
      { name: "Card", value: card },
    ].filter((p) => p.value > 0);

    const paymentSummary = { paid: totalSales, pending: pendingAmount, cash, upi, card };

    // Top Products & Category Performance
    const productStats: Record<string, { name: string; category: string; orders: number; revenue: number }> = {};
    const categoryStats: Record<string, { name: string; orders: number; revenue: number }> = {};

    filteredOrders.forEach((order) => {
      order.items.forEach((item) => {
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

        if (item.product.category) {
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
      });
    });

    const topProducts = Object.values(productStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);

    const categoryPerformance = Object.values(categoryStats).sort((a, b) => b.revenue - a.revenue);

    // Table Performance
    const tableStats: Record<string, { name: string; orderCount: number; revenue: number }> = {};
    filteredOrders.forEach((order) => {
      const tId = order.tableId;
      if (!tableStats[tId]) {
        tableStats[tId] = {
          name: order.table?.tableNumber ? `Table ${order.table.tableNumber}` : "Quick Counter",
          orderCount: 0,
          revenue: 0,
        };
      }
      tableStats[tId].orderCount += 1;
      tableStats[tId].revenue += Number(order.totalAmount || 0);
    });

    const tablePerformance = Object.values(tableStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);

    return NextResponse.json({
      kpis,
      salesChart,
      orderAnalytics,
      paymentAnalytics: paymentAnalytics.length > 0 ? paymentAnalytics : [{ name: "UPI / Cash", value: 1 }],
      paymentSummary,
      topProducts,
      categoryPerformance,
      tablePerformance,
      totalOrdersCount: allOrders.length,
      currentRange: range,
    });
  } catch (error) {
    console.error("Failed to generate live reports:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
