"use client";

import { Badge } from "@/components/ui/badge";

interface StaffRoleBadgeProps {
  role: string;
}

export function StaffRoleBadge({ role }: Readonly<StaffRoleBadgeProps>) {
  switch (role) {
    case "SUPER_ADMIN":
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 text-[11px] font-semibold">
          Super Admin
        </Badge>
      );
    case "OWNER":
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[11px] font-semibold">
          Owner
        </Badge>
      );
    case "MANAGER":
      return (
        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[11px] font-semibold">
          Manager
        </Badge>
      );
    case "WAITER":
      return (
        <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200 text-[11px] font-semibold">
          Waiter
        </Badge>
      );
    case "KITCHEN":
      return (
        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-[11px] font-semibold">
          Kitchen Staff
        </Badge>
      );
    case "CASHIER":
      return (
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] font-semibold">
          Cashier
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-[11px]">
          {role}
        </Badge>
      );
  }
}
