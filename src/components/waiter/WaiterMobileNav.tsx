"use client";

import { ChefHat, Receipt, Armchair, UserCheck } from "lucide-react";

export type WaiterTab = "PASS" | "ORDERS" | "TABLES" | "SHIFT";

interface WaiterMobileNavProps {
  readonly activeTab: WaiterTab;
  readonly onTabChange: (tab: WaiterTab) => void;
  readonly readyOrdersCount: number;
  readonly newOrdersCount: number;
}

export function WaiterMobileNav({
  activeTab,
  onTabChange,
  readyOrdersCount,
  newOrdersCount,
}: Readonly<WaiterMobileNavProps>) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200/90 shadow-2xl px-2 py-2 md:hidden">
      <div className="grid grid-cols-4 items-center max-w-md mx-auto">
        {/* Hot Food Pass Button */}
        <button
          type="button"
          onClick={() => onTabChange("PASS")}
          className={`flex flex-col items-center justify-center py-1 rounded-2xl transition-all relative ${
            activeTab === "PASS"
              ? "text-emerald-700 font-bold scale-105"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          <div
            className={`p-1.5 rounded-xl transition-all ${
              activeTab === "PASS"
                ? "bg-emerald-100/90 text-emerald-800 shadow-xs"
                : "bg-transparent"
            }`}
          >
            <ChefHat size={20} />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5 font-sans">Food Pass</span>

          {readyOrdersCount > 0 && (
            <span className="absolute top-0 right-2 px-1.5 py-0.5 text-[9px] font-extrabold bg-red-500 text-white rounded-full animate-bounce shadow-xs">
              {readyOrdersCount}
            </span>
          )}
        </button>

        {/* Live Orders Button */}
        <button
          type="button"
          onClick={() => onTabChange("ORDERS")}
          className={`flex flex-col items-center justify-center py-1 rounded-2xl transition-all relative ${
            activeTab === "ORDERS"
              ? "text-amber-700 font-bold scale-105"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          <div
            className={`p-1.5 rounded-xl transition-all ${
              activeTab === "ORDERS"
                ? "bg-amber-100/90 text-amber-800 shadow-xs"
                : "bg-transparent"
            }`}
          >
            <Receipt size={20} />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5 font-sans">Orders</span>

          {newOrdersCount > 0 && (
            <span className="absolute top-0 right-2 px-1.5 py-0.5 text-[9px] font-bold bg-amber-500 text-white rounded-full">
              {newOrdersCount}
            </span>
          )}
        </button>

        {/* Tables Button */}
        <button
          type="button"
          onClick={() => onTabChange("TABLES")}
          className={`flex flex-col items-center justify-center py-1 rounded-2xl transition-all relative ${
            activeTab === "TABLES"
              ? "text-blue-700 font-bold scale-105"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          <div
            className={`p-1.5 rounded-xl transition-all ${
              activeTab === "TABLES"
                ? "bg-blue-100/90 text-blue-800 shadow-xs"
                : "bg-transparent"
            }`}
          >
            <Armchair size={20} />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5 font-sans">Tables</span>
        </button>

        {/* My Shift Button */}
        <button
          type="button"
          onClick={() => onTabChange("SHIFT")}
          className={`flex flex-col items-center justify-center py-1 rounded-2xl transition-all relative ${
            activeTab === "SHIFT"
              ? "text-purple-700 font-bold scale-105"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          <div
            className={`p-1.5 rounded-xl transition-all ${
              activeTab === "SHIFT"
                ? "bg-purple-100/90 text-purple-800 shadow-xs"
                : "bg-transparent"
            }`}
          >
            <UserCheck size={20} />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5 font-sans">My Shift</span>
        </button>
      </div>
    </nav>
  );
}
