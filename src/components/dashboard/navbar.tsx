"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Search, Menu, LogOut, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { logoutAction } from "@/app/actions/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { sidebarLinks } from "./sidebar";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function Navbar({
  user = { name: "Admin", email: "admin@example.com", role: "SUPER_ADMIN" },
  restaurantName = "Culinary Ledger",
}: {
  user?: { name: string; email: string; role: string };
  restaurantName?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const lastSegment = pathname.split("/").pop() || "";
  const title = pathname === "/dashboard"
    ? "Dashboard Overview"
    : lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);

  const handleSearch = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/dashboard/orders?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const filteredLinks = sidebarLinks.filter(link => link.roles.includes(user.role));

  return (
    <header className="h-20 bg-white/60 backdrop-blur-md border-b border-culinary-border/50 flex items-center justify-between px-4 sm:px-8 z-10 sticky top-0 transition-all">
      <div className="flex items-center gap-4">
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger 
            className="md:hidden p-2 rounded-lg text-culinary-muted hover:bg-culinary-primary/10 transition-colors"
          >
            <Menu size={20} />
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 bg-culinary-background border-r border-culinary-border/50 flex flex-col">
            <div className="h-20 flex items-center px-6 border-b border-culinary-border/50">
              <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-culinary-primary to-culinary-secondary flex items-center justify-center text-white font-cormorant font-bold text-lg shadow-sm">
                  {restaurantName.charAt(0).toUpperCase()}
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
                      onClick={() => setIsMobileMenuOpen(false)}
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
          </SheetContent>
        </Sheet>

        <h1 className="text-xl lg:text-2xl font-cormorant font-semibold text-culinary-text hidden sm:block truncate max-w-[150px] lg:max-w-none">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-4 sm:gap-6">
        <form onSubmit={handleSearch} className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-culinary-muted/60" size={16} />
          <Input
            type="text"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 py-5 w-40 lg:w-64 bg-white/80 border-culinary-border/60 focus-visible:ring-culinary-primary/30 rounded-xl shadow-sm text-sm transition-all"
          />
        </form>

        <button type="button" className="relative p-2 rounded-full text-culinary-muted hover:bg-culinary-primary/10 hover:text-culinary-text transition-all duration-300">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="h-8 w-px bg-culinary-border/60 mx-1 hidden sm:block"></div>

        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none">
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-culinary-primary to-culinary-secondary flex items-center justify-center text-white shadow-md shadow-culinary-primary/20 group-hover:shadow-lg transition-all duration-300 transform group-hover:-translate-y-0.5">
                <span className="font-semibold font-cormorant text-lg">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="hidden lg:block">
                <p className="text-sm font-medium text-culinary-text">{user.name}</p>
                <p className="text-xs text-culinary-muted capitalize">{user.role.replaceAll('_', ' ').toLowerCase()}</p>
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mt-2 rounded-xl p-2 border-culinary-border/50">
            <div className="px-2 py-1.5 text-sm font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none text-culinary-text">{user.name}</p>
                <p className="text-xs leading-none text-culinary-muted">{user.email}</p>
              </div>
            </div>
            <DropdownMenuSeparator className="bg-culinary-border/30" />
            <DropdownMenuItem className="cursor-pointer py-2 hover:bg-culinary-primary/5 rounded-lg text-culinary-text focus:bg-culinary-primary/10">
              <User className="mr-2 h-4 w-4" />
              <span>Profile Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-culinary-border/30" />
            <DropdownMenuItem
              className="cursor-pointer py-2 hover:bg-red-50 rounded-lg text-red-600 focus:bg-red-100 focus:text-red-700"
              onClick={() => logoutAction()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
