"use server";

import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { OrderStatus, PaymentMethod } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function createOrderAction(data: {
  restaurantId: string;
  tableId: string;
  customerName: string;
  customerPhone: string;
  notes?: string;
  items: { id: string; quantity: number; price: number }[];
  totalAmount: number;
  status?: OrderStatus;
  paymentMethod?: PaymentMethod;
}) {
  try {
    const orderNumber = `ORD-${Date.now().toString().slice(-4)}${randomBytes(2).toString("hex").toUpperCase()}`;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        restaurantId: data.restaurantId,
        tableId: data.tableId,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        notes: data.notes,
        totalAmount: data.totalAmount,
        status: data.status || OrderStatus.PENDING,
        paymentMethod: data.paymentMethod || null,
        items: {
          create: data.items.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.price * item.quantity,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        table: true,
      },
    });

    // Broadcast live to Admin, Kitchen, Waiter via Socket.io
    // @ts-expect-error - global.io is set in server.ts
    if (global.io) {
      // @ts-expect-error - global.io is set in server.ts
      global.io.to(`restaurant:${order.restaurantId}`).emit("order:new", order);
      // @ts-expect-error - global.io is set in server.ts
      global.io.emit("order:new", order);
      // @ts-expect-error - global.io is set in server.ts
      global.io.emit("order:updated", order);
    }

    revalidatePath("/dashboard/orders");
    revalidatePath("/dashboard/payments");
    revalidatePath("/kitchen");

    return { success: true, orderId: order.id };
  } catch (error) {
    console.error("Failed to create order:", error);
    return { success: false, error: "Failed to place order. Please try again." };
  }
}
