import { Suspense } from "react";
import { PaymentsClient } from "@/components/admin/payments-client";

export const metadata = {
  title: "Payments & Billing | The Culinary Ledger",
  description: "Track restaurant payments, bills, POS transactions and revenues",
};

export default function PaymentsPage() {
  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 font-cormorant">
            Payments & Billing
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Real-time cashier register, payment settlements, receipts & billing records.
          </p>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center p-16 space-y-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-culinary-primary border-t-transparent"></div>
            <p className="text-sm text-gray-500 font-medium">Loading billing & payments...</p>
          </div>
        }
      >
        <PaymentsClient />
      </Suspense>
    </div>
  );
}
