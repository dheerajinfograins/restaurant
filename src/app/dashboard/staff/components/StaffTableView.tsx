"use client";

import { format } from "date-fns";
import { Eye, Edit3, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Staff } from "../types";
import { StaffRoleBadge } from "./StaffRoleBadge";

interface StaffTableViewProps {
  staff: Staff[];
  onToggleStatus: (id: string, currentStatus: boolean) => void;
  onViewDetails: (staff: Staff) => void;
  onEditStaff: (staff: Staff) => void;
  onDeleteStaff: (staff: Staff) => void;
}

interface StaffTableRowProps {
  person: Staff;
  onToggleStatus: (id: string, currentStatus: boolean) => void;
  onViewDetails: (staff: Staff) => void;
  onEditStaff: (staff: Staff) => void;
  onDeleteStaff: (staff: Staff) => void;
}

function StaffTableRowItem({
  person,
  onToggleStatus,
  onViewDetails,
  onEditStaff,
  onDeleteStaff,
}: Readonly<StaffTableRowProps>) {
  const initial = person.name ? person.name.charAt(0).toUpperCase() : "S";
  const isSuperAdmin = person.role === "SUPER_ADMIN";

  return (
    <TableRow className="hover:bg-gray-50/70 transition-colors group">
      {/* Staff Member */}
      <TableCell className="align-middle py-3.5 pl-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-culinary-primary font-bold text-sm flex items-center justify-center border border-amber-200/60 shrink-0">
            {initial}
          </div>
          <div>
            <div className="font-bold text-xs text-gray-900">{person.name}</div>
            <div className="text-[10px] text-gray-400 font-mono mt-0.5">ID: {person.id.slice(-6)}</div>
          </div>
        </div>
      </TableCell>

      {/* Role */}
      <TableCell className="align-middle py-3.5">
        <StaffRoleBadge role={person.role} />
      </TableCell>

      {/* Contact */}
      <TableCell className="align-middle py-3.5">
        <div className="text-xs text-gray-800 font-medium truncate max-w-[170px]" title={person.email}>
          {person.email}
        </div>
        <div className="text-[11px] text-gray-400 mt-0.5">{person.phone || "No phone"}</div>
      </TableCell>

      {/* Orders */}
      <TableCell className="align-middle py-3.5 text-center">
        <span className="font-bold text-xs text-culinary-primary bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">
          {person._count?.orders || 0}
        </span>
      </TableCell>

      {/* Status */}
      <TableCell className="align-middle py-3.5 text-center">
        {!isSuperAdmin ? (
          <div className="flex items-center justify-center gap-2">
            <Switch
              checked={person.isActive}
              onCheckedChange={() => onToggleStatus(person.id, person.isActive)}
            />
            <span className={`text-[11px] font-bold ${person.isActive ? "text-emerald-600" : "text-gray-400"}`}>
              {person.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        ) : (
          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            Active
          </span>
        )}
      </TableCell>

      {/* Joined Date */}
      <TableCell className="align-middle py-3.5 text-xs text-gray-600">
        {format(new Date(person.createdAt), "MMM d, yyyy")}
      </TableCell>

      {/* Actions */}
      <TableCell className="text-right align-middle py-3.5 pr-6">
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            title="View Staff Profile"
            onClick={() => onViewDetails(person)}
            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
          >
            <Eye size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Edit Staff"
            onClick={() => onEditStaff(person)}
            className="h-8 w-8 text-amber-700 hover:text-amber-800 hover:bg-amber-50 rounded-lg"
          >
            <Edit3 size={14} />
          </Button>
          {!isSuperAdmin && (
            <Button
              variant="ghost"
              size="icon"
              title="Delete Staff"
              onClick={() => onDeleteStaff(person)}
              className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
            >
              <Trash2 size={14} />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

export function StaffTableView({
  staff,
  onToggleStatus,
  onViewDetails,
  onEditStaff,
  onDeleteStaff,
}: Readonly<StaffTableViewProps>) {
  return (
    <div className="overflow-x-auto">
      <Table className="w-full text-left">
        <TableHeader className="bg-gray-50/70 border-b border-gray-200/80">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[200px] whitespace-nowrap font-bold text-xs uppercase tracking-wider text-gray-600 py-3.5 pl-6">
              Staff Member
            </TableHead>
            <TableHead className="w-[140px] whitespace-nowrap font-bold text-xs uppercase tracking-wider text-gray-600 py-3.5">
              Role
            </TableHead>
            <TableHead className="w-[180px] whitespace-nowrap font-bold text-xs uppercase tracking-wider text-gray-600 py-3.5">
              Contact Info
            </TableHead>
            <TableHead className="w-[110px] font-bold text-xs uppercase tracking-wider text-gray-600 py-3.5 text-center">
              Orders
            </TableHead>
            <TableHead className="w-[130px] font-bold text-xs uppercase tracking-wider text-gray-600 py-3.5 text-center">
              Active Status
            </TableHead>
            <TableHead className="w-[130px] font-bold text-xs uppercase tracking-wider text-gray-600 py-3.5">
              Joined Date
            </TableHead>
            <TableHead className="text-right w-[130px] font-bold text-xs uppercase tracking-wider text-gray-600 py-3.5 pr-6">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-gray-100">
          {staff.map((person) => (
            <StaffTableRowItem
              key={person.id}
              person={person}
              onToggleStatus={onToggleStatus}
              onViewDetails={onViewDetails}
              onEditStaff={onEditStaff}
              onDeleteStaff={onDeleteStaff}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
