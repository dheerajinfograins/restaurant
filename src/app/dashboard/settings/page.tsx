import { Metadata } from "next";
import { Suspense } from "react";
import SettingsClient from "./SettingsClient";

export const metadata: Metadata = {
  title: "Settings & System Configurations | The Culinary Ledger",
  description: "Configure restaurant GST taxation, invoice formats, operating hours, order kitchen rules, and QR menu customization",
};

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 font-cormorant">
          Settings & Configurations
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Manage account security profile, credentials, and restaurant system configurations.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center p-20 space-y-3 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-culinary-primary border-t-transparent"></div>
            <p className="text-sm font-semibold text-gray-500">Loading settings & configurations...</p>
          </div>
        }
      >
        <SettingsClient />
      </Suspense>
    </div>
  );
}
