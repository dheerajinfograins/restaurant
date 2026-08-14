"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  MenuSquare,
  Folder,
  Package,
  Armchair,
  Receipt,
  MonitorPlay,
  CreditCard,
  BarChart3,
  Users,
  Store,
  Settings,
  History,
} from "lucide-react";

export const sidebarLinks = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["SUPER_ADMIN", "OWNER", "MANAGER", "CASHIER"] },
  { name: "Menu Management", href: "/dashboard/menu", icon: MenuSquare, roles: ["SUPER_ADMIN", "OWNER", "MANAGER"] },
  { name: "Categories", href: "/dashboard/categories", icon: Folder, roles: ["SUPER_ADMIN", "OWNER", "MANAGER"] },
  { name: "Products", href: "/dashboard/products", icon: Package, roles: ["SUPER_ADMIN", "OWNER", "MANAGER"] },
  { name: "Tables", href: "/dashboard/tables", icon: Armchair, roles: ["SUPER_ADMIN", "OWNER", "MANAGER", "WAITER"] },
  { name: "Orders", href: "/dashboard/orders", icon: Receipt, roles: ["SUPER_ADMIN", "OWNER", "MANAGER", "WAITER", "CASHIER"] },
  { name: "Kitchen Display", href: "/dashboard/kitchen", icon: MonitorPlay, roles: ["KITCHEN"] },
  { name: "Menu Stock", href: "/dashboard/kitchen/stock", icon: Package, roles: ["KITCHEN"] },
  { name: "Prep Guide", href: "/dashboard/kitchen/prep", icon: MenuSquare, roles: ["KITCHEN"] },
  { name: "Kitchen History", href: "/dashboard/kitchen/history", icon: History, roles: ["KITCHEN"] },
  { name: "Payments", href: "/dashboard/payments", icon: CreditCard, roles: ["SUPER_ADMIN", "OWNER", "MANAGER", "CASHIER"] },
  { name: "Reports", href: "/dashboard/reports", icon: BarChart3, roles: ["SUPER_ADMIN", "OWNER", "MANAGER"] },
  { name: "Staff Management", href: "/dashboard/staff", icon: Users, roles: ["SUPER_ADMIN", "OWNER", "MANAGER"] },
  { name: "Restaurant", href: "/dashboard/restaurant", icon: Store, roles: ["SUPER_ADMIN", "OWNER", "MANAGER"] },
  { name: "Settings", href: "/dashboard/settings", icon: Settings, roles: ["SUPER_ADMIN", "OWNER", "MANAGER"] },
];

export default function Sidebar({ role, restaurantName = "Culinary Ledger" }: Readonly<{ role: string, restaurantName?: string }>) {
  const pathname = usePathname();
  
  const filteredLinks = sidebarLinks.filter(link => link.roles.includes(role));

  return (
    <aside className="w-64 flex-shrink-0 border-r border-culinary-border/50 bg-culinary-card/50 backdrop-blur-md hidden md:flex flex-col h-full transition-all duration-300">
      <div className="h-20 flex items-center px-6 border-b border-culinary-border/50">
        <Link href="/dashboard" className="flex items-center gap-2">
          {/* We'll use a text version of the brand for the sidebar to fit nicely */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-culinary-primary to-culinary-secondary flex items-center justify-center text-white font-cormorant font-bold text-lg shadow-sm">
            C
          </div>
          <span className="font-cormorant font-semibold text-xl tracking-tight text-culinary-text truncate max-w-[150px]">
            {restaurantName}
          </span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 scrollbar-hide">
        <p className="px-2 text-xs font-semibold text-culinary-muted uppercase tracking-wider mb-4">
          Overview
        </p>
        
        <div className="space-y-1">
          {filteredLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            
            return (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-culinary-primary text-white shadow-md shadow-culinary-primary/20" 
                    : "text-culinary-muted hover:bg-culinary-primary/10 hover:text-culinary-text"
                )}
              >
                <Icon size={18} className={cn("flex-shrink-0", isActive ? "text-white" : "text-culinary-muted/80")} />
                {link.name}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="p-4 border-t border-culinary-border/50">
        <div className="bg-gradient-to-br from-culinary-primary/10 to-culinary-secondary/5 rounded-2xl p-4 border border-culinary-primary/20 text-center">
          <p className="text-xs font-medium text-culinary-text">Need Help?</p>
          <p className="text-[10px] text-culinary-muted mt-1 mb-3">Check our documentation</p>
          <Link href="/dashboard/docs" className="block w-full text-xs font-semibold bg-white border border-culinary-border text-culinary-primary py-2 rounded-lg hover:bg-culinary-background transition-colors shadow-sm text-center">
            Documentation
          </Link>
        </div>
      </div>
    </aside>
  );
}
