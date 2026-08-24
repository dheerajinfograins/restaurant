"use client";

import { format } from "date-fns";
import { Mail, Phone, Eye, Edit3, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Staff } from "../types";
import { StaffRoleBadge } from "./StaffRoleBadge";

interface StaffCardViewProps {
  staff: Staff[];
  onToggleStatus: (id: string, currentStatus: boolean) => void;
  onViewDetails: (staff: Staff) => void;
  onEditStaff: (staff: Staff) => void;
  onDeleteStaff: (staff: Staff) => void;
}

interface StaffCardItemProps {
  person: Staff;
  onToggleStatus: (id: string, currentStatus: boolean) => void;
  onViewDetails: (staff: Staff) => void;
  onEditStaff: (staff: Staff) => void;
  onDeleteStaff: (staff: Staff) => void;
}

function getDietaryBadgeText(dietaryCategory?: string) {
  if (dietaryCategory === "PURE_VEG") return "🌱 Veg";
  if (dietaryCategory === "PURE_NON_VEG") return "🍗 Non-Veg";
  return "🥗 Multi";
}

function StaffCardItem({
  person,
  onToggleStatus,
  onViewDetails,
  onEditStaff,
  onDeleteStaff,
}: Readonly<StaffCardItemProps>) {
  const initial = person.name ? person.name.charAt(0).toUpperCase() : "S";
  const isSuperAdmin = person.role === "SUPER_ADMIN";

  return (
    <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        {/* Top Header: Avatar, Name & Role Badge */}
        <div className="flex items-start justify-between gap-3 mb-4 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 text-culinary-primary font-bold text-lg flex items-center justify-center border border-amber-200/60 shadow-sm shrink-0">
              {initial}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-base text-gray-900 truncate" title={person.name}>
                {person.name}
              </h3>
              <div className="mt-1">
                <StaffRoleBadge role={person.role} />
              </div>
            </div>
          </div>

          {/* Status Switch */}
          {!isSuperAdmin ? (
            <div className="flex flex-col items-end gap-1">
              <Switch
                checked={person.isActive}
                onCheckedChange={() => onToggleStatus(person.id, person.isActive)}
              />
              <span className={`text-[10px] font-bold ${person.isActive ? "text-emerald-600" : "text-gray-400"}`}>
                {person.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          ) : (
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Active
            </span>
          )}
        </div>

        {/* Restaurant Badge if assigned */}
        {person.restaurant?.name && (
          <div className="mb-3 px-2.5 py-1.5 bg-stone-50 rounded-xl border border-stone-200/80 text-[11px] font-semibold text-stone-800 flex items-center justify-between shadow-2xs">
            <span className="truncate flex items-center gap-1">
              <span>🏢</span>
              <span className="truncate">{person.restaurant.name}</span>
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-white border border-stone-200 text-stone-600 font-normal shrink-0">
              {getDietaryBadgeText(person.restaurant.dietaryCategory)}
            </span>
          </div>
        )}

        {/* Contact Info Pills */}
        <div className="space-y-2 mb-4 text-xs text-gray-600">
          <div className="flex items-center gap-2 bg-gray-50/70 p-2 rounded-lg border border-gray-100 truncate">
            <Mail size={13} className="text-gray-400 shrink-0" />
            <span className="truncate" title={person.email}>
              {person.email}
            </span>
          </div>
          {person.phone && (
            <div className="flex items-center gap-2 bg-gray-50/70 p-2 rounded-lg border border-gray-100">
              <Phone size={13} className="text-gray-400 shrink-0" />
              <span>{person.phone}</span>
            </div>
          )}
        </div>

        {/* Stats & Meta */}
        <div className="grid grid-cols-2 gap-2 mb-4 p-2.5 bg-amber-50/50 rounded-xl border border-amber-100/60 text-center">
          <div>
            <span className="text-[10px] text-gray-400 uppercase font-bold block">Orders Handled</span>
            <span className="font-bold text-sm text-culinary-primary">{person._count?.orders || 0}</span>
          </div>
          <div>
            <span className="text-[10px] text-gray-400 uppercase font-bold block">Joined On</span>
            <span className="font-semibold text-xs text-gray-700">
              {format(new Date(person.createdAt), "MMM d, yyyy")}
            </span>
          </div>
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewDetails(person)}
          className="h-8 px-2.5 text-xs text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
        >
          <Eye size={13} className="mr-1 text-blue-600" /> Details
        </Button>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEditStaff(person)}
            className="h-8 px-2.5 text-xs text-amber-700 hover:text-amber-800 hover:bg-amber-50 rounded-lg"
          >
            <Edit3 size={13} className="mr-1" /> Edit
          </Button>

          {!isSuperAdmin && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDeleteStaff(person)}
              className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
            >
              <Trash2 size={13} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function StaffCardView({
  staff,
  onToggleStatus,
  onViewDetails,
  onEditStaff,
  onDeleteStaff,
}: Readonly<StaffCardViewProps>) {
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {staff.map((person) => (
          <StaffCardItem
            key={person.id}
            person={person}
            onToggleStatus={onToggleStatus}
            onViewDetails={onViewDetails}
            onEditStaff={onEditStaff}
            onDeleteStaff={onDeleteStaff}
          />
        ))}
      </div>
    </div>
  );
}
