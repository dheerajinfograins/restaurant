import { Suspense } from "react";
import { ReportsDashboard } from "./ReportsDashboard";

export const metadata = {
  title: "Reports & Analytics | The Culinary Ledger",
  description: "Executive restaurant performance reports, sales trends, category performance, and audit summaries",
};

export default function ReportsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center p-20 space-y-4 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <div className="animate-spin rounded-full h-9 w-9 border-2 border-culinary-primary border-t-transparent"></div>
          <p className="text-sm font-semibold text-gray-500">Loading live restaurant analytics...</p>
        </div>
      }
    >
      <ReportsDashboard />
    </Suspense>
  );
}
