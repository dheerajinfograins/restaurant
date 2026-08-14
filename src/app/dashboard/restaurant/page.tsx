import { Metadata } from "next";
import { Suspense } from "react";
import RestaurantProfileClient from "./RestaurantProfileClient";

export const metadata: Metadata = {
  title: "Restaurant Profile & Brand Hub | The Culinary Ledger",
  description: "Manage restaurant brand identity, cover image, location, contact channels, and open dining service status",
};

export default function RestaurantPage() {
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 font-cormorant">
          Restaurant Profile & Branding
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Customize your dining establishment&apos;s brand story, cover banner, location, and operational service hours.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center p-20 space-y-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-culinary-primary border-t-transparent"></div>
            <p className="text-sm font-semibold text-gray-500">Loading restaurant branding...</p>
          </div>
        }
      >
        <RestaurantProfileClient />
      </Suspense>
    </div>
  );
}
