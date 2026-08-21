"use client";

import Link from "next/link";
import Image from "next/image";
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
  UtensilsCrossed,
} from "lucide-react";

export const sidebarLinks = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["SUPER_ADMIN", "OWNER", "MANAGER", "CASHIER"] },
  { name: "Floor Operations", href: "/dashboard/floor", icon: UtensilsCrossed, roles: ["SUPER_ADMIN", "OWNER", "MANAGER"] },
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

const isConfiguredRemoteDomain = (url?: string | null) => {
  if (!url) return false;
  return (
    url.startsWith("https://images.unsplash.com") ||
    url.startsWith("https://res.cloudinary.com")
  );
};

export default function Sidebar({
  role,
  restaurantName = "Culinary Ledger",
  logo = null,
}: Readonly<{ role: string; restaurantName?: string; logo?: string | null }>) {
  const pathname = usePathname();
  
  const filteredLinks = sidebarLinks.filter(link => link.roles.includes(role));

  // Compute initials from restaurant name (e.g. "The Daily Grind" -> "TG" or "TH")
  const words = restaurantName.trim().split(/\s+/).filter(Boolean);
  const initials = words.length > 1 
    ? (words[0][0] + words[1][0]).toUpperCase()
    : restaurantName.slice(0, 2).toUpperCase() || "CL";

  return (
    <aside className="w-64 flex-shrink-0 border-r border-culinary-border/50 bg-culinary-card/50 backdrop-blur-md hidden md:flex flex-col h-full transition-all duration-300">
      <div className="h-20 flex items-center px-4 border-b border-culinary-border/50">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 w-full min-w-0 group"
          title={restaurantName}
        >
          {logo ? (
            <Image
              src={logo}
              alt={restaurantName}
              width={36}
              height={36}
              unoptimized={!isConfiguredRemoteDomain(logo)}
              className="w-9 h-9 rounded-xl object-cover border border-culinary-border/80 shadow-xs shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-culinary-primary to-culinary-secondary flex items-center justify-center text-white font-cormorant font-bold text-sm shadow-sm shrink-0 group-hover:scale-105 transition-transform">
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <span className="font-cormorant font-bold text-base leading-tight text-culinary-text block line-clamp-2 break-words group-hover:text-culinary-primary transition-colors">
              {restaurantName}
            </span>
          </div>
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
