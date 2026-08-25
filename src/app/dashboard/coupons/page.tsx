import { Metadata } from "next";
import { Suspense } from "react";
import { requireRoles } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import CouponsClient from "./CouponsClient";

export const metadata: Metadata = {
  title: "Promotions & Coupons | The Culinary Ledger",
  description: "Manage restaurant promotional coupons, product discounts, and tiered minimum order rules",
};

export default async function CouponsPage() {
  let payload = null;
  try {
    payload = await requireRoles(["SUPER_ADMIN", "OWNER", "MANAGER"]);
  } catch {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: payload.id },
    include: { restaurant: true },
  });

  if (!dbUser?.isActive) {
    redirect("/login");
  }

  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center p-20 space-y-3 bg-white rounded-3xl border border-stone-200 shadow-xs">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-amber-700 border-t-transparent"></div>
          <p className="text-sm font-semibold text-stone-500">Loading coupons and offers...</p>
        </div>
      }
    >
      <CouponsClient
        userRole={dbUser.role}
        restaurantId={dbUser.restaurantId || undefined}
        restaurantName={dbUser.restaurant?.name || "The Culinary Ledger"}
      />
    </Suspense>
  );
}
