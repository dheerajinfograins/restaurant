import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { OrderTrackerClient } from "@/components/customer/order-tracker-client";

export default async function OrderTrackingPage({
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
      table: true
    }
  });

  if (!order) {
    notFound();
  }

  const formattedOrder = {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    createdAt: order.createdAt,
    table: {
      tableNumber: order.table.tableNumber,
    },
    items: order.items.map(item => ({
      id: item.id,
      quantity: item.quantity,
      totalPrice: Number(item.totalPrice),
      product: {
        name: item.product.name,
      }
    })),
    totalAmount: Number(order.totalAmount),
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-6 pb-32">
      <OrderTrackerClient initialOrder={formattedOrder} />

      {/* New Order Button */}
      <div className="mt-10 text-center">
        <Link 
          href={`/menu/${order.tableId}`}
          className="inline-block px-8 py-3 bg-white border border-culinary-border/40 text-culinary-text rounded-2xl font-bold shadow-sm"
        >
          Order Something Else
        </Link>
      </div>
    </div>
  );
}
