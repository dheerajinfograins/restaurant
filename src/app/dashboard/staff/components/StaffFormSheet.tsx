"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ROLES, Staff, StaffFormData } from "../types";

interface StaffFormSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedStaff: Staff | null;
  formData: StaffFormData;
  setFormData: React.Dispatch<React.SetStateAction<StaffFormData>>;
  onSubmit: () => Promise<void>;
  isSubmitting: boolean;
}

interface PasswordCriteriaProps {
  password: string;
}

function PasswordCriteria({ password }: Readonly<PasswordCriteriaProps>) {
  if (!password) return null;

  const hasCapital = /^[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumberOrSymbol = /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  const hasMinLength = password.length >= 6;

  const criteria = [
    { label: "1st Capital (A-Z)", valid: hasCapital },
    { label: "Lowercase (a-z)", valid: hasLower },
    { label: "Number / Symbol", valid: hasNumberOrSymbol },
    { label: "Min 6 Letters", valid: hasMinLength },
  ];

  return (
    <div className="mt-2 p-2 bg-gray-50 rounded-xl border border-gray-200/70 space-y-1">
      <p className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">
        Required Format (Capital + Mixed):
      </p>
      <div className="grid grid-cols-2 gap-1 text-[10px] font-semibold">
        {criteria.map((item) => (
          <span
            key={item.label}
            className={`px-1.5 py-0.5 rounded flex items-center gap-1 ${
              item.valid
                ? "bg-emerald-100 text-emerald-800"
                : "bg-white text-gray-400 border border-gray-200"
            }`}
          >
            {item.valid ? "✓" : "○"} {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function StaffFormSheet({
  isOpen,
  onOpenChange,
  selectedStaff,
  formData,
  setFormData,
  onSubmit,
  isSubmitting,
}: Readonly<StaffFormSheetProps>) {
  const [showPassword, setShowPassword] = useState(false);

  const initial = formData.name ? formData.name.charAt(0).toUpperCase() : "S";

  let submitButtonText = "Create Staff Member";
  if (isSubmitting) {
    submitButtonText = "Saving...";
  } else if (selectedStaff) {
    submitButtonText = "Update Staff";
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[420px] sm:w-[500px] overflow-y-auto bg-white border-l border-gray-200 shadow-2xl p-0">
        <div className="p-6">
          <SheetHeader className="border-b border-gray-100 pb-5 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-culinary-primary font-bold text-lg flex items-center justify-center border border-amber-200/60 shadow-sm shrink-0">
                {initial}
              </div>
              <div>
                <SheetTitle className="text-2xl font-bold font-cormorant text-gray-900">
                  {selectedStaff ? "Edit Staff Member" : "Register New Staff"}
                </SheetTitle>
                <p className="text-xs text-gray-400 mt-0.5">
                  {selectedStaff
                    ? `Update account details & role permissions for ${selectedStaff.name}`
                    : "Create login credentials and assign duties for a new employee"}
                </p>
              </div>
            </div>
          </SheetHeader>

          <div className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700">Full Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Rahul Sharma"
                className="rounded-xl border-gray-200 text-xs py-3"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700">Mobile Phone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="+91 98765 43210"
                className="rounded-xl border-gray-200 text-xs py-3"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700">Email Address (Login ID) *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="staff@restaurant.com"
                className="rounded-xl border-gray-200 text-xs py-3"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700">Assigned Role *</Label>
              <Select
                value={formData.role}
                onValueChange={(v) => setFormData((prev) => ({ ...prev, role: v || "WAITER" }))}
              >
                <SelectTrigger className="rounded-xl border-gray-200 text-xs bg-white py-3">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="rounded-xl text-xs">
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r} className="text-xs font-medium">
                      {r.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 relative">
              <Label className="text-xs font-bold text-gray-700">
                Password{" "}
                {selectedStaff && (
                  <span className="text-[10px] text-gray-400 font-normal">(Leave blank to keep existing)</span>
                )}
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder="••••••••"
                  className="rounded-xl border-gray-200 text-xs pr-10 py-3"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              <PasswordCriteria password={formData.password} />
            </div>

            <div className="flex items-center justify-between bg-gray-50 p-3.5 rounded-xl border border-gray-100 mt-2">
              <div>
                <p className="font-bold text-xs text-gray-800">Account Active Status</p>
                <p className="text-[10px] text-gray-500">Allow employee to log in and access system</p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(val) => setFormData((prev) => ({ ...prev, isActive: val }))}
              />
            </div>
          </div>

          <SheetFooter className="mt-8 border-t border-gray-100 pt-5 flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="w-full text-xs rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={onSubmit}
              disabled={isSubmitting}
              className="w-full bg-culinary-primary hover:bg-culinary-primary/90 text-white font-bold rounded-xl text-xs py-2.5"
            >
              {submitButtonText}
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}
