import { Metadata } from "next";
import { Suspense } from "react";
import MenuManagementClient from "./MenuManagementClient";

export const metadata: Metadata = {
  title: "Menu Management & Live QR Control | The Culinary Ledger",
  description: "Manage how your menu appears to customers, featured specials, in-stock availability, and kitchen recipes",
};

export default function MenuManagementPage() {
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 font-cormorant">
          Menu Management & Live QR Control
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Manage how your digital menu appears to guests, toggle live in-stock availability, highlight chef specials, and configure kitchen recipe instructions.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center p-20 space-y-3 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-culinary-primary border-t-transparent"></div>
            <p className="text-sm font-semibold text-gray-500">Loading menu management...</p>
          </div>
        }
      >
        <MenuManagementClient />
      </Suspense>
    </div>
  );
}
