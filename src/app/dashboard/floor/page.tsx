import { Metadata } from "next";
import { Suspense } from "react";
import { FloorOperationsClient } from "./FloorOperationsClient";

export const metadata: Metadata = {
  title: "Floor & Waitstaff Operations | The Culinary Ledger",
  description: "Live restaurant dining floor operations, table assignments, kitchen food pass, and waitstaff tracker.",
};

export default function FloorOperationsPage() {
  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 font-cormorant">
          Floor Operations
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Live dining tables overview, kitchen food pickup pass, active waiter assignments, and floor analytics.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center p-16 space-y-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-culinary-primary border-t-transparent"></div>
            <p className="text-sm text-gray-500 font-medium">Loading live floor operations...</p>
          </div>
        }
      >
        <FloorOperationsClient />
      </Suspense>
    </div>
  );
}
