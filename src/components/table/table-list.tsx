"use client";

import { Edit3, QrCode, Trash2, Users, Utensils, CheckCircle2, ChevronDown } from "lucide-react";
import { RestaurantTable } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TableListProps {
  readonly tables: RestaurantTable[];
  readonly viewMode?: "cards" | "table";
  readonly onEdit: (table: RestaurantTable) => void;
  readonly onDelete: (table: RestaurantTable) => void;
  readonly onViewQr: (table: RestaurantTable) => void;
  readonly onStatusChange?: (tableId: string, status: "AVAILABLE" | "OCCUPIED" | "RESERVED") => void;
}

export default function TableList({
  tables,
  viewMode = "cards",
  onEdit,
  onDelete,
  onViewQr,
  onStatusChange,
}: TableListProps) {
  const getStatusBadge = (status: string, tableId?: string) => {
    let badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
    let dotClass = "bg-emerald-500";
    let label = "Available";

    if (status === "OCCUPIED") {
      badgeClass = "bg-rose-50 text-rose-700 border-rose-200";
      dotClass = "bg-rose-500";
      label = "Occupied";
    } else if (status === "RESERVED") {
      badgeClass = "bg-amber-50 text-amber-700 border-amber-200";
      dotClass = "bg-amber-500";
      label = "Reserved";
    }

    if (onStatusChange && tableId) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border cursor-pointer hover:shadow-sm transition-all focus:outline-none bg-white">
            <span className={`w-1.5 h-1.5 rounded-full ${dotClass} animate-pulse`}></span>
            <span className={badgeClass.split(" ")[1]}>{label}</span>
            <ChevronDown size={11} className="text-gray-400 ml-0.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="text-xs rounded-xl min-w-[130px]">
            <DropdownMenuItem
              onClick={() => onStatusChange(tableId, "AVAILABLE")}
              className="text-emerald-700 font-medium cursor-pointer"
            >
              🟢 Set Available
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onStatusChange(tableId, "OCCUPIED")}
              className="text-rose-700 font-medium cursor-pointer"
            >
              🔴 Set Occupied
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onStatusChange(tableId, "RESERVED")}
              className="text-amber-700 font-medium cursor-pointer"
            >
              🟡 Set Reserved
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    return (
      <Badge variant="outline" className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${badgeClass}`}>
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotClass}`}></span>
        {label}
      </Badge>
    );
  };

  if (tables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-gray-200/80 border-dashed text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-3 text-culinary-primary border border-amber-100">
          <Utensils size={28} />
        </div>
        <h3 className="text-lg font-bold text-gray-900 font-cormorant">No Tables Found</h3>
        <p className="text-xs text-gray-500 max-w-sm mt-1">
          No dining tables match your current filter. Create a new table to automatically generate digital QR menus.
        </p>
      </div>
    );
  }

  // ===================== CARDS GRID VIEW =====================
  if (viewMode === "cards") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {tables.map((table) => {
          const monogram = table.tableNumber ? table.tableNumber.slice(0, 3).toUpperCase() : "T";
          return (
            <div
              key={table.id}
              className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Top Card Header */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-gray-100 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 text-culinary-primary font-bold text-lg flex items-center justify-center border border-amber-200/60 shadow-sm shrink-0 font-cormorant">
                      {monogram}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-gray-900 font-cormorant text-lg">
                        {table.tableNumber}
                      </h3>
                      <p className="text-[10px] text-gray-400 font-mono">ID: {table.id.slice(-6)}</p>
                    </div>
                  </div>

                  {/* Status Dropdown */}
                  <div>{getStatusBadge(table.status, table.id)}</div>
                </div>

                {/* Seating Capacity & QR Card */}
                <div className="grid grid-cols-2 gap-2 mb-4 p-3 bg-gray-50/70 rounded-xl border border-gray-100 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-[10px] text-gray-400 uppercase font-bold flex items-center gap-1">
                      <Users size={11} /> Capacity
                    </span>
                    <span className="font-bold text-sm text-gray-900 mt-0.5">
                      {table.capacity} <span className="text-xs font-normal text-gray-500">Seats</span>
                    </span>
                  </div>

                  <div className="flex flex-col items-center justify-center border-l border-gray-200">
                    <span className="text-[10px] text-gray-400 uppercase font-bold flex items-center gap-1">
                      <QrCode size={11} /> Digital QR
                    </span>
                    <span className="font-bold text-xs text-emerald-600 mt-0.5 flex items-center gap-0.5">
                      <CheckCircle2 size={11} /> Active
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewQr(table)}
                  className="h-8 px-3 rounded-xl text-xs font-semibold text-blue-700 bg-blue-50/50 hover:bg-blue-100 border-blue-200 gap-1.5 shadow-none"
                >
                  <QrCode size={13} /> View & Print QR
                </Button>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(table)}
                    className="h-8 px-2.5 text-xs text-amber-700 hover:text-amber-800 hover:bg-amber-50 rounded-lg"
                  >
                    <Edit3 size={13} className="mr-1" /> Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(table)}
                    className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ===================== TABLE LIST VIEW =====================
  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-gray-50/70 border-b border-gray-200 text-gray-600 uppercase font-bold tracking-wider">
            <tr>
              <th scope="col" className="px-6 py-4">Dining Table</th>
              <th scope="col" className="px-6 py-4">Guest Capacity</th>
              <th scope="col" className="px-6 py-4">Live Status</th>
              <th scope="col" className="px-6 py-4">QR Code Menu</th>
              <th scope="col" className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tables.map((table) => {
              const monogram = table.tableNumber ? table.tableNumber.slice(0, 3).toUpperCase() : "T";
              return (
                <tr key={table.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 text-culinary-primary font-bold text-sm flex items-center justify-center border border-amber-200/60 font-cormorant shrink-0">
                        {monogram}
                      </div>
                      <div>
                        <p className="font-bold text-xs text-gray-900 font-cormorant text-base">
                          {table.tableNumber}
                        </p>
                        <p className="text-[10px] text-gray-400 font-mono">
                          ID: {table.id.slice(-6)}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-3.5">
                    <div className="flex items-center text-gray-700 font-medium">
                      <Users size={14} className="text-gray-400 mr-1.5" />
                      <span className="font-bold">{table.capacity}</span>
                      <span className="text-gray-400 ml-1">Seats</span>
                    </div>
                  </td>

                  <td className="px-6 py-3.5">
                    {getStatusBadge(table.status, table.id)}
                  </td>

                  <td className="px-6 py-3.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewQr(table)}
                      className="h-7 px-2.5 rounded-lg text-[11px] font-semibold text-blue-700 bg-blue-50/50 hover:bg-blue-100 border-blue-200 gap-1 shadow-none"
                    >
                      <QrCode size={12} /> View QR
                    </Button>
                  </td>

                  <td className="px-6 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(table)}
                        className="h-8 w-8 text-amber-700 hover:text-amber-800 hover:bg-amber-50 rounded-lg"
                      >
                        <Edit3 size={13} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(table)}
                        className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
