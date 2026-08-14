import React from "react";
import RestaurantBrand from "./restaurant-brand";

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="min-h-screen bg-culinary-background selection:bg-culinary-primary/20 selection:text-culinary-text">
      <div className="grid min-h-screen lg:grid-cols-2 relative">
        {/* Abstract background decorative elements for mobile */}
        <div className="absolute inset-0 lg:hidden overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-culinary-primary/5 blur-3xl" />
          <div className="absolute top-1/2 -left-20 w-72 h-72 rounded-full bg-culinary-secondary/5 blur-3xl" />
        </div>

        {/* Left Section - Brand */}
        <RestaurantBrand />

        {/* Right Section - Form */}
        <div className="flex items-center justify-center p-6 sm:p-10 relative z-10">
          {children}
        </div>
      </div>
    </main>
  );
}
