import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

export class KitchenRepository {
  async getActiveKitchenOrders() {
    return prisma.order.findMany({
      where: {
        status: {
          in: [OrderStatus.PENDING, OrderStatus.ACCEPTED, OrderStatus.PREPARING, OrderStatus.READY],
        },
      },
      include: {
        items: {
          include: { product: true }
        },
        table: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
  }

  async updateOrderStatus(orderId: string, status: OrderStatus) {
    return prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        items: {
          include: { product: true }
        },
        table: true
      }
    });
  }

  async getAllProducts() {
    return prisma.product.findMany({
      include: { category: true },
      orderBy: { categoryId: 'asc' },
    });
  }

  async toggleProductAvailability(productId: string, isAvailable: boolean) {
    return prisma.product.update({
      where: { id: productId },
      data: { isAvailable },
    });
  }

  async getKitchenHistory(timeRange: "today" | "week" | "all" = "today") {
    let dateFilter: { gte: Date } | undefined = undefined;
    if (timeRange === "today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dateFilter = { gte: today };
    } else if (timeRange === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      weekAgo.setHours(0, 0, 0, 0);
      dateFilter = { gte: weekAgo };
    }

    return prisma.order.findMany({
      where: {
        status: {
          in: [OrderStatus.READY, OrderStatus.SERVED, OrderStatus.PAID],
        },
        ...(dateFilter ? { updatedAt: dateFilter } : {}),
      },
      include: {
        items: {
          include: { product: true }
        },
        table: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
  }
}
