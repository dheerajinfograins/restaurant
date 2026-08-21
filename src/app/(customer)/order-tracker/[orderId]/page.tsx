import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { OrderTrackerClient } from "@/components/customer/order-tracker-client";

export default async function OrderTrackingRedirectPage({
  params,
}: Readonly<{
  params: Promise<{ orderId: string }>;
}>) {
  const orderId = (await params).orderId;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: { product: true }
      },
      table: true,
      restaurant: true,
    }
  });

  if (!order) {
    redirect("/");
  }

  const formattedOrder = {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentMethod: order.paymentMethod,
    notes: order.notes,
    createdAt: order.createdAt,
    tableId: order.tableId,
    tableNumber: order.table?.tableNumber || "",
    restaurantName: order.restaurant?.name || "The Daily Grind & Gather",
    restaurantLogo: order.restaurant?.logo || null,
    items: order.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice || 0),
      totalPrice: Number(item.totalPrice),
      product: {
        id: item.product.id,
        name: item.product.name,
        image: item.product.image,
        foodType: item.product.foodType,
      }
    })),
    totalAmount: Number(order.totalAmount),
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-28">
      <OrderTrackerClient initialOrder={formattedOrder} />
    </div>
  );
}
