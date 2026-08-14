import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { autoProgressOrder } from "@/lib/order-auto-progress";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    let order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: { product: true }
        },
        table: true
      }
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Auto-progress order if enough time has passed
    order = await autoProgressOrder(order);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Failed to fetch order:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await prisma.order.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete order:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
