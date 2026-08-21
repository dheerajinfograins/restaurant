"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  Menu,
  LogOut,
  User,
  LayoutDashboard,
  Armchair,
  Receipt,
  ChefHat,
  CheckCircle,
  History,
} from "lucide-react";
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
import Image from "next/image";
import ProfileModal from "./profile-modal";
import NotificationBellDropdown from "./notifications/NotificationBellDropdown";

const isConfiguredRemoteDomain = (url?: string | null) => {
  if (!url) return false;
  return (
    url.startsWith("https://images.unsplash.com") ||
    url.startsWith("https://res.cloudinary.com")
  );
};

interface NavbarProps {
  user?: { name: string; email: string; role: string; image?: string | null };
  restaurantName?: string;
  logo?: string | null;
}

export default function Navbar({
  user = { name: "Admin", email: "admin@example.com", role: "SUPER_ADMIN", image: null },
  restaurantName = "Culinary Ledger",
  logo = null,
}: Readonly<NavbarProps>) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [userOverride, setUserOverride] = useState<NavbarProps["user"] | null>(null);
  const [prevUser, setPrevUser] = useState(user);

  if (user !== prevUser) {
    setPrevUser(user);
    setUserOverride(null);
  }

  const currentUser = userOverride ?? user;

  const isWaiter = currentUser.role === "WAITER" || pathname.startsWith("/waiter");

  const lastSegment = pathname.split("/").pop() || "";
  let title: string;
  if (pathname === "/waiter") {
    title = "Floor Dashboard";
  } else if (pathname === "/dashboard" || !lastSegment) {
    title = "Dashboard Overview";
  } else {
    title = lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
  }

  const words = restaurantName.trim().split(/\s+/).filter(Boolean);
  const initials = words.length > 1
    ? (words[0][0] + words[1][0]).toUpperCase()
    : restaurantName.slice(0, 2).toUpperCase() || "CL";

  const handleSearch = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (isWaiter) {
        router.push(`/waiter/orders?search=${encodeURIComponent(searchQuery)}`);
      } else {
        router.push(`/dashboard/orders?search=${encodeURIComponent(searchQuery)}`);
      }
    }
  };

  const waiterLinks = [
    { name: "Floor Dashboard", href: "/waiter", icon: LayoutDashboard },
    { name: "Dining Tables", href: "/waiter/tables", icon: Armchair },
    { name: "Live Orders", href: "/waiter/orders", icon: Receipt },
    { name: "Ready to Serve", href: "/waiter/ready", icon: ChefHat },
    { name: "Served Orders", href: "/waiter/served", icon: CheckCircle },
    { name: "Order History", href: "/waiter/history", icon: History },
  ];

  const linksToDisplay = isWaiter
    ? waiterLinks
    : sidebarLinks.filter(link => link.roles.includes(currentUser.role));

  return (
    <>
      <header className="h-20 bg-white/60 backdrop-blur-md border-b border-culinary-border/50 flex items-center justify-between px-4 sm:px-8 z-10 sticky top-0 transition-all">
        <div className="flex items-center gap-4">
          {!isWaiter && (
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger
                className="md:hidden p-2 rounded-lg text-culinary-muted hover:bg-culinary-primary/10 transition-colors"
              >
                <Menu size={20} />
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0 bg-culinary-background border-r border-culinary-border/50 flex flex-col">
                <div className="h-20 flex items-center px-4 border-b border-culinary-border/50">
                  <Link href="/dashboard" className="flex items-center gap-3 w-full min-w-0 group" onClick={() => setIsMobileMenuOpen(false)}>
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
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-culinary-primary to-culinary-secondary flex items-center justify-center text-white font-cormorant font-bold text-sm shadow-sm shrink-0">
                        {initials}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="font-cormorant font-bold text-base leading-tight text-culinary-text block line-clamp-2 break-words">
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
                    {linksToDisplay.map((link) => {
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
                              ? "bg-culinary-primary text-white shadow-md shadow-culinary-primary/20 font-bold"
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
          )}

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

          <NotificationBellDropdown />

          <div className="h-8 w-px bg-culinary-border/60 mx-1 hidden sm:block"></div>

          <DropdownMenu>
            <DropdownMenuTrigger className="outline-none">
              <div className="flex items-center gap-3 cursor-pointer group">
                {currentUser.image ? (
                  <Image
                    src={currentUser.image}
                    alt={currentUser.name}
                    width={40}
                    height={40}
                    unoptimized={!isConfiguredRemoteDomain(currentUser.image)}
                    className="w-10 h-10 rounded-xl object-cover border border-culinary-border/80 shadow-md shadow-culinary-primary/10 group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-culinary-primary to-culinary-secondary flex items-center justify-center text-white shadow-md shadow-culinary-primary/20 group-hover:shadow-lg transition-all duration-300 transform group-hover:-translate-y-0.5">
                    <span className="font-semibold font-cormorant text-lg">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-medium text-culinary-text truncate max-w-[130px]">{currentUser.name}</p>
                  <p className="text-xs text-culinary-muted capitalize">{currentUser.role.replaceAll('_', ' ').toLowerCase()}</p>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 mt-2 rounded-2xl p-2 border-culinary-border/50 shadow-xl bg-white">
              <div className="flex items-center gap-3 px-2 py-2">
                {currentUser.image ? (
                  <Image
                    src={currentUser.image}
                    alt={currentUser.name}
                    width={36}
                    height={36}
                    unoptimized={!isConfiguredRemoteDomain(currentUser.image)}
                    className="w-9 h-9 rounded-xl object-cover border border-culinary-border/80 shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-culinary-primary to-culinary-secondary flex items-center justify-center text-white font-bold text-sm font-cormorant shrink-0">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex flex-col space-y-0.5 min-w-0">
                  <p className="text-xs font-bold leading-none text-culinary-text truncate">{currentUser.name}</p>
                  <p className="text-[11px] leading-none text-culinary-muted truncate">{currentUser.email}</p>
                </div>
              </div>

              <DropdownMenuSeparator className="bg-culinary-border/30 my-1" />

              <DropdownMenuItem
                onClick={() => setIsProfileModalOpen(true)}
                className="cursor-pointer py-2.5 hover:bg-culinary-primary/5 rounded-xl text-culinary-text focus:bg-culinary-primary/10 text-xs font-medium gap-2.5"
              >
                <User className="h-4 w-4 text-culinary-primary" />
                <span>Profile Settings</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-culinary-border/30 my-1" />

              <DropdownMenuItem
                className="cursor-pointer py-2.5 hover:bg-red-50 rounded-xl text-red-600 focus:bg-red-100 focus:text-red-700 text-xs font-medium gap-2.5"
                onClick={() => logoutAction()}
              >
                <LogOut className="h-4 w-4 text-red-500" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Interactive Profile Management Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        onProfileUpdated={(updated) => setUserOverride(updated)}
      />
    </>
  );
}
