"use server";

import { prisma } from "@/lib/prisma";
import { getOptionalPayload } from "@/lib/permissions";
import { OrderStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { emitAppSocketEvent } from "@/lib/socket-server";

function serialize<T>(data: T): T {
  return structuredClone(data);
}

function handleActionError(actionName: string, error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "digest" in error &&
    (error as { digest?: string }).digest === "DYNAMIC_SERVER_USAGE"
  ) {
    throw error;
  }
  console.error(`Failed to ${actionName}:`, error);
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
    handleActionError("get kitchen orders", error);
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
        restaurant: {
          select: {
            id: true,
            name: true,
            dietaryCategory: true,
          },
        },
      },
    });

    emitAppSocketEvent("order:updated", order, order.restaurantId);

    revalidatePath("/dashboard/kitchen");
    revalidatePath("/dashboard/orders");
    return { success: true, data: serialize(order) };
  } catch (error) {
    handleActionError("accept order", error);
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
        restaurant: {
          select: {
            id: true,
            name: true,
            dietaryCategory: true,
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
    });

    emitAppSocketEvent("order:ready", order, order.restaurantId);
    emitAppSocketEvent("order:updated", order, order.restaurantId);

    revalidatePath("/dashboard/kitchen");
    revalidatePath("/dashboard/orders");
    return { success: true, data: serialize(order) };
  } catch (error) {
    handleActionError("mark as ready", error);
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
        restaurant: {
          select: {
            id: true,
            name: true,
            dietaryCategory: true,
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
    });

    emitAppSocketEvent("order:served", order, order.restaurantId);
    emitAppSocketEvent("order:updated", order, order.restaurantId);

    revalidatePath("/dashboard/kitchen");
    revalidatePath("/dashboard/orders");
    revalidatePath("/dashboard/kitchen/history");
    return { success: true, data: serialize(order) };
  } catch (error) {
    handleActionError("mark as served", error);
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
    handleActionError("fetch products", error);
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
    handleActionError("toggle product availability", error);
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
    handleActionError("fetch kitchen history", error);
    return { success: false, error: "Failed to fetch history" };
  }
}
