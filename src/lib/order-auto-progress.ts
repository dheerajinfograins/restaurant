import { OrderStatus } from "@prisma/client";

// Automatic progression is disabled because Kitchen Display System (KDS) handles it manually
export async function autoProgressOrder(order: any) {
  return order;
}

export async function autoProgressOrders(orders: any[]) {
  return orders;
}
