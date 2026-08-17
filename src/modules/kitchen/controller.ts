"use server";

import { prisma } from "@/lib/prisma";
import { getOptionalPayload } from "@/lib/permissions";
import { OrderStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

function serialize<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

async function resolveRestaurantId() {
  const payload = await getOptionalPayload();
  if (payload?.restaurantId) return payload.restaurantId;
  if (payload?.id) {
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { restaurantId: true },
    });
    if (user?.restaurantId) return user.restaurantId;
  }
  const defaultRestaurant = await prisma.restaurant.findFirst({
    where: { isActive: true },
    select: { id: true },
  });
  return defaultRestaurant?.id || null;
}

export async function getActiveKitchenOrdersAction() {
  try {
    const restaurantId = await resolveRestaurantId();
    if (!restaurantId) return { success: true, data: [] };

    const orders = await prisma.order.findMany({
      where: {
        restaurantId,
        status: {
          in: [OrderStatus.PENDING, OrderStatus.ACCEPTED, OrderStatus.PREPARING, OrderStatus.READY],
        },
      },
      include: {
        items: {
          include: { product: true },
        },
        table: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return { success: true, data: serialize(orders) };
  } catch (error) {
    console.error("Failed to get kitchen orders:", error);
    return { success: false, error: "Failed to fetch orders" };
  }
}

export async function acceptOrderAction(orderId: string) {
  try {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.PREPARING },
      include: {
        items: { include: { product: true } },
        table: true,
      },
    });

    // @ts-expect-error - global.io is set in server.ts
    if (global.io) {
      // @ts-expect-error - global.io is set in server.ts
      global.io.to(`restaurant:${order.restaurantId}`).emit("order:updated", order);
      // @ts-expect-error - global.io is set in server.ts
      global.io.emit("order:updated", order);
    }

    revalidatePath("/dashboard/kitchen");
    revalidatePath("/dashboard/orders");
    return { success: true, data: serialize(order) };
  } catch (error) {
    console.error("Failed to accept order:", error);
    return { success: false, error: "Failed to accept order" };
  }
}

export async function markAsReadyAction(orderId: string) {
  try {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.READY },
      include: {
        items: { include: { product: true } },
        table: true,
      },
    });

    // @ts-expect-error - global.io is set in server.ts
    if (global.io) {
      // @ts-expect-error - global.io is set in server.ts
      global.io.to(`restaurant:${order.restaurantId}`).emit("order:ready", order);
      // @ts-expect-error - global.io is set in server.ts
      global.io.emit("order:updated", order);
    }

    revalidatePath("/dashboard/kitchen");
    revalidatePath("/dashboard/orders");
    return { success: true, data: serialize(order) };
  } catch (error) {
    console.error("Failed to mark as ready:", error);
    return { success: false, error: "Failed to mark as ready" };
  }
}

export async function markAsServedAction(orderId: string) {
  try {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.SERVED },
      include: {
        items: { include: { product: true } },
        table: true,
      },
    });

    // @ts-expect-error - global.io is set in server.ts
    if (global.io) {
      // @ts-expect-error - global.io is set in server.ts
      global.io.to(`restaurant:${order.restaurantId}`).emit("order:served", order);
      // @ts-expect-error - global.io is set in server.ts
      global.io.emit("order:updated", order);
    }

    revalidatePath("/dashboard/kitchen");
    revalidatePath("/dashboard/orders");
    revalidatePath("/dashboard/kitchen/history");
    return { success: true, data: serialize(order) };
  } catch (error) {
    console.error("Failed to mark as served:", error);
    return { success: false, error: "Failed to mark as served" };
  }
}

export async function getAllProductsAction() {
  try {
    const restaurantId = await resolveRestaurantId();
    if (!restaurantId) return { success: true, data: [] };

    const products = await prisma.product.findMany({
      where: { restaurantId },
      include: { category: true },
      orderBy: { categoryId: "asc" },
    });

    return { success: true, data: serialize(products) };
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return { success: false, error: "Failed to fetch products" };
  }
}

export async function toggleProductAvailabilityAction(productId: string, isAvailable: boolean) {
  try {
    const product = await prisma.product.update({
      where: { id: productId },
      data: { isAvailable },
    });
    revalidatePath("/dashboard/kitchen/stock");
    revalidatePath("/dashboard/kitchen/prep");
    revalidatePath("/dashboard/menu");
    return { success: true, data: serialize(product) };
  } catch (error) {
    console.error("Failed to toggle product availability:", error);
    return { success: false, error: "Failed to toggle availability" };
  }
}

export async function getKitchenHistoryAction(timeRange: "today" | "week" | "all" = "all") {
  try {
    const restaurantId = await resolveRestaurantId();
    if (!restaurantId) return { success: true, data: [] };

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

    const history = await prisma.order.findMany({
      where: {
        restaurantId,
        ...(dateFilter ? { createdAt: dateFilter } : {}),
      },
      include: {
        items: {
          include: { product: true },
        },
        table: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, data: serialize(history) };
  } catch (error) {
    console.error("Failed to fetch kitchen history:", error);
    return { success: false, error: "Failed to fetch history" };
  }
}
