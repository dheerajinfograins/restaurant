import { Metadata } from "next";
import { OrdersClient } from "@/components/admin/orders-client";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Orders | Culinary Ledger",
  description: "Manage incoming restaurant orders",
};

export default function OrdersPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-culinary-text font-cormorant">Orders</h2>
      </div>
      <Suspense fallback={<div className="p-8 text-center">Loading orders...</div>}>
        <OrdersClient />
      </Suspense>
    </div>
  );
}
