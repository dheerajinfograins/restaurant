import { Metadata } from "next";
import { Suspense } from "react";
import RestaurantsManagementClient from "./RestaurantsManagementClient";
import { requireRoles } from "@/lib/permissions";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Restaurant Tenants & Branches | The Culinary Ledger",
  description: "Super Admin portal to manage multi-tenant restaurants, dietary classifications, and owner credentials",
};

export default async function RestaurantsPage() {
  try {
    await requireRoles(["SUPER_ADMIN"]);
  } catch {
    redirect("/dashboard");
  }

  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center p-20 space-y-3 bg-white rounded-3xl border border-culinary-border shadow-xs">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-culinary-primary border-t-transparent"></div>
          <p className="text-sm font-semibold text-culinary-muted">Loading restaurant management...</p>
        </div>
      }
    >
      <RestaurantsManagementClient />
    </Suspense>
  );
}
