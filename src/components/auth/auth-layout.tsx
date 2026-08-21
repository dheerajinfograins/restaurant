import React from "react";
import RestaurantBrand from "./restaurant-brand";

interface AuthLayoutProps {
  readonly children: React.ReactNode;
  readonly restaurantName?: string;
  readonly restaurantLogo?: string | null;
  readonly restaurantDescription?: string | null;
  readonly restaurantCover?: string | null;
}

export default function AuthLayout({
  children,
  restaurantName,
  restaurantLogo,
  restaurantDescription,
  restaurantCover,
}: Readonly<AuthLayoutProps>) {
  return (
    <main className="min-h-screen bg-stone-950 selection:bg-amber-700 selection:text-white relative overflow-hidden font-sans">
      {/* Ambient background lighting and gradients */}
      <div className="absolute inset-0 bg-gradient-to-tr from-stone-950 via-neutral-900 to-amber-950/70 pointer-events-none" />
      <div className="absolute top-1/4 -right-32 w-96 h-96 rounded-full bg-amber-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 rounded-full bg-orange-600/10 blur-[120px] pointer-events-none" />

      <div className="grid min-h-screen lg:grid-cols-2 relative z-10">
        {/* Left Section - Dynamic Luxury Brand Showcase */}
        <RestaurantBrand
          restaurantName={restaurantName}
          restaurantLogo={restaurantLogo}
          restaurantDescription={restaurantDescription}
          restaurantCover={restaurantCover}
        />

        {/* Right Section - Authentication Form */}
        <div className="flex items-center justify-center p-4 sm:p-8 lg:p-12 relative z-10">
          {children}
        </div>
      </div>
    </main>
  );
}
