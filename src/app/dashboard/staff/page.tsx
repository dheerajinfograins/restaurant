import { Metadata } from "next";
import { Suspense } from "react";
import { StaffManagement } from "./StaffManagement";

export const metadata: Metadata = {
  title: "Staff Management | The Culinary Ledger",
  description: "Manage restaurant staff members, roles, active duties, and permissions",
};

export default function StaffPage() {
  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 font-cormorant">
          Staff Management
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Manage restaurant team roster, waitstaff, kitchen chefs, managers, and employee access.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center p-16 space-y-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-culinary-primary border-t-transparent"></div>
            <p className="text-sm text-gray-500 font-medium">Loading staff roster...</p>
          </div>
        }
      >
        <StaffManagement />
      </Suspense>
    </div>
  );
}
