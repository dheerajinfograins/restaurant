import { Metadata } from "next";
import { Suspense } from "react";
import { ProductList } from "@/components/product/product-list";

export const metadata: Metadata = {
  title: "Menu Products & Catalog | The Culinary Ledger",
  description: "Manage restaurant menu dishes, prices, dietary classifications, and in-stock availability",
};

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 font-cormorant">
          Menu Products & Catalog
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Manage restaurant menu dishes, pricing, dietary classifications, chef specials, and live stock availability.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center p-20 space-y-3 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-culinary-primary border-t-transparent"></div>
            <p className="text-sm font-semibold text-gray-500">Loading menu products...</p>
          </div>
        }
      >
        <ProductList />
      </Suspense>
    </div>
  );
}
