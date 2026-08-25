"use server";

import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { OrderStatus, PaymentMethod } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { razorpay, verifyRazorpaySignature } from "@/lib/razorpay";

export async function createOrderAction(data: {
  restaurantId: string;
  tableId: string;
  customerName: string;
  customerPhone: string;
  notes?: string;
  items: { id: string; quantity: number; price: number }[];
  totalAmount: number;
  discountAmount?: number;
  couponCode?: string;
  couponId?: string;
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
        discountAmount: data.discountAmount ?? 0,
        couponCode: data.couponCode || null,
        couponId: data.couponId || null,
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

    // Increment coupon usedCount if applied
    if (data.couponId) {
      await prisma.coupon.update({
        where: { id: data.couponId },
        data: { usedCount: { increment: 1 } },
      }).catch((err) => console.error("Failed to increment coupon count:", err));
    }

    // Broadcast live to Admin, Kitchen, Waiter via Socket.io
    // @ts-expect-error - global.io is set in server.ts
    if (global.io) {
      if (order.restaurantId) {
        // @ts-expect-error - global.io is set in server.ts
        global.io.to(`restaurant:${order.restaurantId}`).emit("order:new", order);
      } else {
        // @ts-expect-error - global.io is set in server.ts
        global.io.emit("order:new", order);
      }
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

/**
 * Creates a Razorpay Order for UPI / Card payment
 */
export async function createRazorpayOrderAction(amount: number) {
  try {
    if (!amount || amount <= 0) {
      return { success: false, error: "Invalid order amount" };
    }

    const amountInPaise = Math.round(amount * 100);
    const receipt = `rcpt_${Date.now().toString().slice(-8)}`;

    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt,
    };

    const razorpayOrder = await razorpay.orders.create(options);

    return {
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || "rzp_test_xU5aUKMAB361y0",
    };
  } catch (error) {
    console.error("Failed to create Razorpay order:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to initialize online payment.",
    };
  }
}

/**
 * Verifies Razorpay payment signature and creates the completed PAID order
 */
export async function verifyAndCreateRazorpayOrderAction(data: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  restaurantId: string;
  tableId: string;
  customerName: string;
  customerPhone: string;
  notes?: string;
  items: { id: string; quantity: number; price: number }[];
  totalAmount: number;
  discountAmount?: number;
  couponCode?: string;
  couponId?: string;
  paymentMethod: PaymentMethod;
}) {
  try {
    // 1. Verify Payment Signature
    const isValid = verifyRazorpaySignature({
      razorpayOrderId: data.razorpayOrderId,
      razorpayPaymentId: data.razorpayPaymentId,
      razorpaySignature: data.razorpaySignature,
    });

    if (!isValid) {
      return {
        success: false,
        error: "Payment verification failed. Please contact restaurant support if money was debited.",
      };
    }

    // 2. Build Notes with Razorpay Payment Trace & Coupon
    let paymentAuditNote = `[Razorpay Paid: ${data.razorpayPaymentId}]`;
    if (data.couponCode) {
      paymentAuditNote += ` [Coupon Applied: ${data.couponCode} (-₹${(data.discountAmount || 0).toFixed(2)})]`;
    }
    const finalNotes = data.notes
      ? `${data.notes} | ${paymentAuditNote}`
      : paymentAuditNote;

    // 3. Generate Unique Order Number & Create database order with initial status PENDING
    const orderNumber = `ORD-${Date.now().toString().slice(-4)}${randomBytes(2).toString("hex").toUpperCase()}`;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        restaurantId: data.restaurantId,
        tableId: data.tableId,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        notes: finalNotes,
        totalAmount: data.totalAmount,
        discountAmount: data.discountAmount ?? 0,
        couponCode: data.couponCode || null,
        couponId: data.couponId || null,
        status: OrderStatus.PENDING,
        paymentMethod: data.paymentMethod,
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

    // Increment coupon usage
    if (data.couponId) {
      await prisma.coupon.update({
        where: { id: data.couponId },
        data: { usedCount: { increment: 1 } },
      }).catch((err) => console.error("Failed to increment coupon count:", err));
    }

    // 4. Broadcast live via Socket.io
    // @ts-expect-error - global.io is set in server.ts
    if (global.io) {
      if (order.restaurantId) {
        // @ts-expect-error - global.io is set in server.ts
        global.io.to(`restaurant:${order.restaurantId}`).emit("order:new", order);
      } else {
        // @ts-expect-error - global.io is set in server.ts
        global.io.emit("order:new", order);
      }
    }

    revalidatePath("/dashboard/orders");
    revalidatePath("/dashboard/payments");
    revalidatePath("/kitchen");

    return {
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
    };
  } catch (error) {
    console.error("Failed to verify and create Razorpay order:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to process completed payment order.",
    };
  }
}
