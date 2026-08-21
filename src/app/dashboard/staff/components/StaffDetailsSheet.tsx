"use client";

import { format } from "date-fns";
import { CheckCircle, XCircle } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Staff } from "../types";
import { StaffRoleBadge } from "./StaffRoleBadge";

interface StaffDetailsSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  staff: Staff | null;
  onEditStaff: (staff: Staff) => void;
}

export function StaffDetailsSheet({
  isOpen,
  onOpenChange,
  staff,
  onEditStaff,
}: Readonly<StaffDetailsSheetProps>) {
  if (!staff) return null;

  const initial = staff.name ? staff.name.charAt(0).toUpperCase() : "S";

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[380px] sm:w-[460px] overflow-y-auto bg-white border-l border-gray-200 shadow-2xl p-0">
        <div className="p-6">
          <SheetHeader className="border-b border-gray-100 pb-5 mb-6">
            <SheetTitle className="text-2xl font-bold text-gray-900 font-cormorant">
              Staff Profile
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-6">
            {/* Hero Header */}
            <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-b from-amber-50/60 to-gray-50/40 rounded-2xl border border-amber-100/80 text-center">
              <div className="w-20 h-20 rounded-2xl bg-culinary-primary text-white font-bold text-3xl flex items-center justify-center shadow-md mb-3">
                {initial}
              </div>
              <h2 className="text-xl font-bold text-gray-900">{staff.name}</h2>
              <div className="mt-1.5">
                <StaffRoleBadge role={staff.role} />
              </div>
            </div>

            {/* Contact & Status Details */}
            <div className="space-y-3 bg-gray-50/70 p-4 rounded-xl border border-gray-100 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-200/60">
                <span className="text-gray-500 font-medium">Email</span>
                <span className="font-semibold text-gray-900">{staff.email}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-gray-200/60">
                <span className="text-gray-500 font-medium">Mobile Phone</span>
                <span className="font-semibold text-gray-900">{staff.phone || "Not provided"}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-gray-200/60">
                <span className="text-gray-500 font-medium">Account Status</span>
                <span
                  className={`font-bold flex items-center gap-1 ${
                    staff.isActive ? "text-emerald-600" : "text-gray-400"
                  }`}
                >
                  {staff.isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
                  {staff.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-gray-200/60">
                <span className="text-gray-500 font-medium">Joined Date</span>
                <span className="font-semibold text-gray-900">
                  {format(new Date(staff.createdAt), "MMMM d, yyyy")}
                </span>
              </div>

              <div className="flex justify-between py-1">
                <span className="text-gray-500 font-medium">Total Orders Handled</span>
                <span className="font-bold text-sm text-culinary-primary">
                  {staff._count?.orders || 0} orders
                </span>
              </div>
            </div>
          </div>

          <SheetFooter className="mt-8 border-t border-gray-100 pt-5 flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="w-full text-xs rounded-xl"
              onClick={() => onOpenChange(false)}
            >
              Close Profile
            </Button>
            <Button
              type="button"
              className="w-full bg-culinary-primary hover:bg-culinary-primary/90 text-white text-xs font-bold rounded-xl"
              onClick={() => {
                onOpenChange(false);
                onEditStaff(staff);
              }}
            >
              Edit Staff Details
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}
