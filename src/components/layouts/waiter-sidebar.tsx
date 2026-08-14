"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ChefHat,
  CheckCircle,
  History,
  Armchair,
  Receipt,
  LogOut,
  Sparkles,
  UtensilsCrossed,
  Bell
} from "lucide-react";
import { logoutAction } from "@/app/actions/auth";

const sidebarLinks = [
  { title: "Floor Dashboard", href: "/waiter", icon: LayoutDashboard },
  { title: "Dining Tables", href: "/waiter/tables", icon: Armchair },
  { title: "Live Orders", href: "/waiter/orders", icon: Receipt },
  { title: "Ready to Serve", href: "/waiter/ready", icon: ChefHat, badge: "Pass" },
  { title: "Served Orders", href: "/waiter/served", icon: CheckCircle },
  { title: "Order History", href: "/waiter/history", icon: History },
];

export default function WaiterSidebar({ restaurantName = "The Culinary Ledger" }: Readonly<{ restaurantName?: string }>) {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0 border-r border-gray-200/80 bg-white hidden md:flex flex-col h-full transition-all duration-300 shadow-sm">
      {/* Brand Header */}
      <div className="h-20 flex items-center px-6 border-b border-gray-100">
        <Link href="/waiter" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white font-cormorant font-bold text-xl shadow-sm border border-amber-400/40">
            W
          </div>
          <div className="min-w-0">
            <span className="font-cormorant font-bold text-lg tracking-tight text-gray-900 truncate block">
              {restaurantName}
            </span>
            <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.2 rounded-full border border-amber-200/60 inline-block">
              Waitstaff Portal
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5 scrollbar-thin">
        <p className="px-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
          Floor Operations
        </p>
        
        <div className="space-y-1">
          {sidebarLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            
            return (
              <Link
                key={link.title}
                href={link.href}
                className={cn(
                  "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200",
                  isActive 
                    ? "bg-culinary-primary text-white shadow-sm font-bold" 
                    : "text-gray-600 hover:bg-gray-100/80 hover:text-gray-900"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon size={16} className={cn("flex-shrink-0", isActive ? "text-white" : "text-gray-400")} />
                  <span>{link.title}</span>
                </div>
                {link.badge && (
                  <span
                    className={cn(
                      "text-[9px] font-bold px-1.5 py-0.2 rounded-full",
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    )}
                  >
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Waiter Profile & Logout */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/60">
        <button
          type="button"
          onClick={() => logoutAction()}
          className="w-full flex items-center justify-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all text-rose-600 hover:bg-rose-50 hover:text-rose-700 border border-rose-100"
        >
          <LogOut size={15} className="flex-shrink-0" />
          End Shift / Logout
        </button>
      </div>
    </aside>
  );
}
