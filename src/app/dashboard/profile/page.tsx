import { Metadata } from "next";
import { Suspense } from "react";
import ProfileClient from "./ProfileClient";

export const metadata: Metadata = {
  title: "Admin Profile & Account Settings | The Culinary Ledger",
  description: "Manage your administrator account details, profile picture, and login credentials",
};

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 font-cormorant">
          Account Profile & Credentials
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Update your administrator avatar photo, personal details, contact information, and security password.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center p-20 space-y-3 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-culinary-primary border-t-transparent"></div>
            <p className="text-sm font-semibold text-gray-500">Loading profile...</p>
          </div>
        }
      >
        <ProfileClient />
      </Suspense>
    </div>
  );
}
