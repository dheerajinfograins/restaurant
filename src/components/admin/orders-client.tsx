"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { format } from "date-fns";
import { OrderStatus } from "@prisma/client";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Eye,
  Trash2,
  Edit3,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  RotateCw,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Filter,
  LayoutGrid,
  List,
  User,
  ChefHat,
  BellRing,
  CheckCircle,
  DollarSign,
  Building2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { io, Socket } from "socket.io-client";
import { isOrderPaid } from "@/lib/order-payment";

interface RestaurantOption {
  id: string;
  name: string;
  dietaryCategory: string;
}

interface OrderData {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  status: OrderStatus;
  createdAt: Date;
  notes: string | null;
  table: { tableNumber: string };
  restaurant?: RestaurantOption;
  items: Array<{
    id: string;
    quantity: number;
    unitPrice?: number | string;
    totalPrice?: number | string;
    product: { name: string; price?: number };
  }>;
  totalAmount: number | string;
  paymentMethod?: string | null;
}

const STATUS_FILTERS = [
  { label: "All Orders", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Accepted", value: "ACCEPTED" },
  { label: "Preparing", value: "PREPARING" },
  { label: "Ready", value: "READY" },
  { label: "Served", value: "SERVED" },
  { label: "Paid", value: "PAID" },
  { label: "Cancelled", value: "CANCELLED" },
] as const;

function getStatusBadge(status: OrderStatus) {
  switch (status) {
    case "PENDING":
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 font-semibold shadow-none text-xs gap-1 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          <span>Pending</span>
        </Badge>
      );
    case "ACCEPTED":
      return (
        <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-300 font-semibold shadow-none text-xs gap-1 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
          <span>Accepted</span>
        </Badge>
      );
    case "PREPARING":
      return (
        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300 font-semibold shadow-none text-xs gap-1 py-1">
          <ChefHat size={12} className="animate-spin text-orange-600" />
          <span>Preparing</span>
        </Badge>
      );
    case "READY":
      return (
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold shadow-none text-xs gap-1 py-1">
          <BellRing size={12} className="text-emerald-600 animate-bounce" />
          <span>Food Ready</span>
        </Badge>
      );
    case "SERVED":
      return (
        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300 font-semibold shadow-none text-xs gap-1 py-1">
          <CheckCircle size={12} className="text-purple-600" />
          <span>Served</span>
        </Badge>
      );
    case "PAID":
      return (
        <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold shadow-none text-xs gap-1 py-1">
          <CheckCircle2 size={12} className="text-emerald-600" />
          <span>Completed</span>
        </Badge>
      );
    case "CANCELLED":
      return (
        <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-300 font-semibold shadow-none text-xs py-1">
          <span>Cancelled</span>
        </Badge>
      );
    default:
      return <Badge variant="outline" className="text-xs py-1">{status}</Badge>;
  }
}

function QuickStatusButton({
  order,
  onUpdateStatus,
}: Readonly<{
  order: OrderData;
  onUpdateStatus: (id: string, newStatus: OrderStatus) => void;
}>) {
  switch (order.status) {
    case "PENDING":
    case "ACCEPTED":
      return (
        <Button
          size="sm"
          variant="outline"
          onClick={() => onUpdateStatus(order.id, "PREPARING")}
          className="h-7 px-2 text-[11px] font-semibold border-orange-200 text-orange-700 hover:bg-orange-50 rounded-lg"
          title="Send to kitchen to prepare"
        >
          <ChefHat size={12} className="mr-1" /> Start Prep
        </Button>
      );
    case "PREPARING":
      return (
        <Button
          size="sm"
          variant="outline"
          onClick={() => onUpdateStatus(order.id, "READY")}
          className="h-7 px-2 text-[11px] font-semibold border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-lg"
          title="Mark food ready for serving"
        >
          <BellRing size={12} className="mr-1" /> Mark Ready
        </Button>
      );
    case "READY":
      return (
        <Button
          size="sm"
          variant="outline"
          onClick={() => onUpdateStatus(order.id, "SERVED")}
          className="h-7 px-2 text-[11px] font-semibold border-purple-200 text-purple-700 hover:bg-purple-50 rounded-lg"
          title="Mark order delivered to table"
        >
          <CheckCircle size={12} className="mr-1" /> Mark Served
        </Button>
      );
    case "SERVED":
      return (
        <Button
          size="sm"
          variant="outline"
          onClick={() => onUpdateStatus(order.id, "PAID")}
          className="h-7 px-2 text-[11px] font-semibold border-emerald-300 text-emerald-800 hover:bg-emerald-50 rounded-lg"
          title="Collect bill and close order"
        >
          <DollarSign size={12} className="mr-1" /> Mark Paid
        </Button>
      );
    default:
      return null;
  }
}

function getPageNumbers(currentPage: number, totalPages: number): (number | string)[] {
  const pages: (number | string)[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("ellipsis-start");
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push("ellipsis-end");
    pages.push(totalPages);
  }
  return pages;
}

const DIETARY_BADGE_CONFIG: Record<string, { label: string; className: string }> = {
  PURE_VEG: {
    label: "Veg",
    className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  },
  PURE_NON_VEG: {
    label: "Non-Veg",
    className: "bg-rose-50 text-rose-700 border border-rose-200",
  },
};

const DEFAULT_DIETARY_BADGE = {
  label: "Multi-Cuisine",
  className: "bg-amber-50 text-amber-700 border border-amber-200",
};

function getDietaryBadge(category?: string) {
  if (category && category in DIETARY_BADGE_CONFIG) {
    return DIETARY_BADGE_CONFIG[category];
  }
  return DEFAULT_DIETARY_BADGE;
}

function matchesOrderFilter(order: OrderData, statusFilter: string, q: string): boolean {
  if (statusFilter !== "ALL" && order.status !== statusFilter) {
    return false;
  }
  if (!q) return true;

  return Boolean(
    order.orderNumber?.toLowerCase().includes(q) ||
    order.customerName?.toLowerCase().includes(q) ||
    order.customerPhone?.toLowerCase().includes(q) ||
    order.table?.tableNumber?.toString().toLowerCase().includes(q) ||
    order.notes?.toLowerCase().includes(q) ||
    order.items?.some((item) => item.product?.name?.toLowerCase().includes(q))
  );
}

function syncViewOrder(prev: OrderData | null, formattedData: OrderData[]): OrderData | null {
  if (!prev) return null;
  const updated = formattedData.find((o) => o.id === prev.id);
  if (updated && (updated.status !== prev.status || updated.totalAmount !== prev.totalAmount)) {
    return updated;
  }
  return prev;
}

function OrdersLoadingState() {
  return (
    <div className="flex flex-col items-center justify-center p-16 space-y-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-culinary-primary border-t-transparent" />
      <p className="text-sm text-gray-500 font-medium">Loading orders list...</p>
    </div>
  );
}

function OrdersEmptyState({
  hasFilter,
  onResetFilters,
}: Readonly<{
  hasFilter: boolean;
  onResetFilters: () => void;
}>) {
  return (
    <div className="flex flex-col items-center justify-center p-16 text-center">
      <div className="p-4 bg-gray-50 rounded-2xl mb-3 border border-gray-100">
        <ShoppingBag className="h-10 w-10 text-gray-300" />
      </div>
      <h3 className="text-base font-bold text-gray-800">
        {hasFilter ? "No orders match your filter criteria" : "No orders available"}
      </h3>
      <p className="text-xs text-gray-500 mt-1 max-w-sm">
        {hasFilter
          ? "Try clearing your search term or selecting a different status filter."
          : "Incoming customer orders will appear here automatically in real-time."}
      </p>
      {hasFilter && (
        <Button
          variant="outline"
          size="sm"
          className="mt-4 text-xs rounded-xl"
          onClick={onResetFilters}
        >
          Reset All Filters
        </Button>
      )}
    </div>
  );
}

function OrderTableView({
  orders,
  onViewOrder,
  onEditOrder,
  onDeleteOrder,
  onUpdateStatus,
}: Readonly<{
  orders: OrderData[];
  onViewOrder: (order: OrderData) => void;
  onEditOrder: (order: OrderData) => void;
  onDeleteOrder: (id: string) => void;
  onUpdateStatus: (id: string, newStatus: OrderStatus) => void;
}>) {
  return (
    <div className="overflow-x-auto">
      <Table className="w-full text-left">
        <TableHeader className="bg-gray-50/70 border-b border-gray-200/80">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[130px] whitespace-nowrap font-bold text-xs uppercase tracking-wider text-gray-600 py-3.5 pl-6">
              Order #
            </TableHead>
            <TableHead className="w-[140px] whitespace-nowrap font-bold text-xs uppercase tracking-wider text-gray-600 py-3.5">
              Date & Time
            </TableHead>
            <TableHead className="w-[85px] font-bold text-xs uppercase tracking-wider text-gray-600 py-3.5 text-center">
              Table
            </TableHead>
            <TableHead className="w-[150px] font-bold text-xs uppercase tracking-wider text-gray-600 py-3.5">
              Customer
            </TableHead>
            <TableHead className="min-w-[220px] font-bold text-xs uppercase tracking-wider text-gray-600 py-3.5">
              Ordered Items
            </TableHead>
            <TableHead className="w-[110px] font-bold text-xs uppercase tracking-wider text-gray-600 py-3.5">
              Amount
            </TableHead>
            <TableHead className="w-[95px] font-bold text-xs uppercase tracking-wider text-gray-600 py-3.5 text-center">
              Payment
            </TableHead>
            <TableHead className="w-[135px] font-bold text-xs uppercase tracking-wider text-gray-600 py-3.5 text-center">
              Order Status
            </TableHead>
            <TableHead className="text-right w-[150px] font-bold text-xs uppercase tracking-wider text-gray-600 py-3.5 pr-6">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-gray-100">
          {orders.map((order) => (
            <TableRow key={order.id} className="hover:bg-gray-50/70 transition-colors group">
              {/* Order Number */}
              <TableCell className="font-bold text-gray-900 align-top py-4 pl-6 whitespace-nowrap">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-900 tracking-tight">{order.orderNumber}</span>
                  {order.restaurant?.name && (
                    <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full inline-block mt-1 truncate max-w-[120px]">
                      🏢 {order.restaurant.name}
                    </span>
                  )}
                  <span className="text-[10px] text-gray-400 font-mono mt-0.5">ID: {order.id.slice(-6)}</span>
                </div>
              </TableCell>

              {/* Date & Time */}
              <TableCell className="align-top py-4 whitespace-nowrap">
                <div className="text-xs font-semibold text-gray-800">{format(order.createdAt, "MMM d, yyyy")}</div>
                <div className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                  <Clock size={11} className="text-gray-400" />
                  {format(order.createdAt, "h:mm a")}
                </div>
              </TableCell>

              {/* Table */}
              <TableCell className="align-top py-4 text-center">
                <span className="inline-flex items-center justify-center font-bold text-culinary-primary bg-amber-50 border border-amber-200/60 px-2.5 py-1 rounded-lg text-xs whitespace-nowrap shadow-none">
                  T-{order.table?.tableNumber || "N/A"}
                </span>
              </TableCell>

              {/* Customer */}
              <TableCell className="align-top py-4">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    {order.customerName ? order.customerName.charAt(0).toUpperCase() : "G"}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 text-xs truncate max-w-[120px]" title={order.customerName}>
                      {order.customerName || "Walk-in Guest"}
                    </div>
                    {order.customerPhone ? (
                      <div className="text-[11px] text-gray-400 truncate">{order.customerPhone}</div>
                    ) : (
                      <div className="text-[11px] text-gray-300 italic">No phone</div>
                    )}
                  </div>
                </div>
              </TableCell>

              {/* Ordered Items */}
              <TableCell className="align-top py-4">
                <div className="space-y-1.5 max-w-[260px]">
                  {order.items?.map((item) => (
                    <div key={item.id} className="text-xs flex items-center gap-2 text-gray-700 bg-gray-50/80 px-2 py-1 rounded-lg border border-gray-100">
                      <span className="font-bold text-white bg-culinary-primary px-1.5 py-0.2 rounded text-[10px] shrink-0">
                        {item.quantity}x
                      </span>
                      <span className="truncate font-medium text-gray-800" title={item.product?.name}>
                        {item.product?.name}
                      </span>
                    </div>
                  ))}

                  {/* Customer Note Pill */}
                  {order.notes && (
                    <div className="inline-flex items-center gap-1 text-[11px] text-amber-900 bg-amber-50/90 border border-amber-200/70 rounded-md px-2 py-0.5 mt-1" title={order.notes}>
                      <span className="font-bold">📝 Note:</span>
                      <span className="truncate max-w-[200px]">{order.notes}</span>
                    </div>
                  )}
                </div>
              </TableCell>

              {/* Total Amount */}
              <TableCell className="align-top py-4 whitespace-nowrap">
                <div className="font-bold text-gray-900 text-sm">
                  ₹{Number(order.totalAmount || 0).toFixed(2)}
                </div>
                <div className="text-[10px] text-gray-400 font-medium">
                  {order.items?.length || 0} items
                </div>
              </TableCell>

              {/* Payment Status */}
              <TableCell className="align-top py-4 text-center">
                {(() => {
                  const paid = isOrderPaid(order);
                  return (
                    <Badge
                      variant={paid ? "default" : "secondary"}
                      className={
                        paid
                          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50 shadow-none border border-emerald-200 text-[11px] font-semibold"
                          : "bg-amber-50 text-amber-700 hover:bg-amber-50 shadow-none border border-amber-200 text-[11px] font-semibold"
                      }
                    >
                      {paid ? "Paid" : "Unpaid"}
                    </Badge>
                  );
                })()}
              </TableCell>

              {/* Order Status */}
              <TableCell className="align-top py-4 text-center">
                {getStatusBadge(order.status)}
              </TableCell>

              {/* Actions with Quick Progression */}
              <TableCell className="text-right align-top py-3.5 pr-6">
                <div className="flex flex-col items-end gap-1.5">
                  <QuickStatusButton order={order} onUpdateStatus={onUpdateStatus} />
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="View Order Details"
                      onClick={() => onViewOrder(order)}
                      className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Change Order Status"
                      onClick={() => onEditOrder(order)}
                      className="h-7 w-7 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Delete Order"
                      onClick={() => onDeleteOrder(order.id)}
                      className="h-7 w-7 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function OrderCardsView({
  orders,
  onViewOrder,
  onEditOrder,
  onDeleteOrder,
  onUpdateStatus,
}: Readonly<{
  orders: OrderData[];
  onViewOrder: (order: OrderData) => void;
  onEditOrder: (order: OrderData) => void;
  onDeleteOrder: (id: string) => void;
  onUpdateStatus: (id: string, newStatus: OrderStatus) => void;
}>) {
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              {/* Card Header: Table Number & Time */}
              <div className="flex justify-between items-start mb-4 pb-3 border-b border-gray-100">
                <div>
                  <h3 className="font-bold text-2xl font-cormorant text-culinary-text">
                    Table {order.table?.tableNumber || "N/A"}
                  </h3>
                  <p className="text-xs text-gray-400 font-mono uppercase tracking-wider mt-0.5">
                    {order.orderNumber}
                  </p>
                  {order.restaurant?.name && (
                    <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full inline-block mt-1">
                      🏢 {order.restaurant.name}
                    </span>
                  )}
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <span className="inline-flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600">
                    <Clock size={12} className="text-gray-400" />
                    {format(order.createdAt, "hh:mm a")}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {format(order.createdAt, "MMM d, yyyy")}
                  </span>
                </div>
              </div>

              {/* Customer Info */}
              {order.customerName && (
                <div className="mb-3 flex items-center gap-2 text-xs text-gray-700 bg-gray-50/60 p-2 rounded-lg border border-gray-100">
                  <User size={13} className="text-gray-400 shrink-0" />
                  <span className="font-semibold text-gray-800">{order.customerName}</span>
                  {order.customerPhone && (
                    <span className="text-gray-400 text-[11px]">({order.customerPhone})</span>
                  )}
                </div>
              )}

              {/* Ordered Items */}
              <div className="space-y-2 mb-4">
                {order.items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center bg-gray-50/70 p-2 rounded-lg border border-gray-100"
                  >
                    <div className="flex items-center gap-2 text-xs text-gray-800">
                      <span className="font-bold text-white bg-culinary-primary w-5 h-5 rounded flex items-center justify-center text-[10px] shrink-0">
                        {item.quantity}
                      </span>
                      <span className="font-medium text-gray-800">{item.product?.name}</span>
                    </div>
                    {item.totalPrice && (
                      <span className="text-[11px] font-semibold text-gray-500">
                        ₹{Number(item.totalPrice).toFixed(2)}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Customer Notes */}
              {order.notes && (
                <div className="mb-4 p-2.5 bg-amber-50/90 border border-amber-200/70 rounded-lg text-xs text-amber-800 italic">
                  <span className="font-bold not-italic mr-1">📝 Note:</span>
                  {order.notes}
                </div>
              )}
            </div>

            {/* Card Footer: Total Amount, Statuses & Actions */}
            <div className="pt-3 border-t border-gray-100 space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold block">Total Amount</span>
                  <span className="font-bold text-base text-gray-900">
                    ₹{Number(order.totalAmount || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {(() => {
                    const paid = isOrderPaid(order);
                    return (
                      <Badge
                        variant={paid ? "default" : "secondary"}
                        className={
                          paid
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200 shadow-none text-[11px] font-semibold"
                            : "bg-amber-50 text-amber-700 border-amber-200 shadow-none text-[11px] font-semibold"
                        }
                      >
                        {paid ? "PAID" : "UNPAID"}
                      </Badge>
                    );
                  })()}
                  {getStatusBadge(order.status)}
                </div>
              </div>

              {/* Quick Step Button in Card */}
              <div className="pt-1">
                <QuickStatusButton order={order} onUpdateStatus={onUpdateStatus} />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                <span className="text-gray-400 text-[11px]">
                  Received: {format(order.createdAt, "hh:mm a")}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewOrder(order)}
                    className="h-7 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" /> View
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditOrder(order)}
                    className="h-7 px-2 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg"
                  >
                    <Edit3 className="h-3.5 w-3.5 mr-1" /> Status
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteOrder(order.id)}
                    className="h-7 w-7 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrdersPagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  startItemNumber,
  endItemNumber,
  onPageChange,
  onPageSizeChange,
}: Readonly<{
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  startItemNumber: number;
  endItemNumber: number;
  onPageChange: (page: number | ((p: number) => number)) => void;
  onPageSizeChange: (size: number) => void;
}>) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-gray-100 bg-gray-50/50">
      {/* Rows/Cards selector & Count display */}
      <div className="flex items-center gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <span className="font-medium">Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-culinary-primary/30"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        <div>
          Showing <span className="font-semibold text-gray-800">{startItemNumber}</span> to{" "}
          <span className="font-semibold text-gray-800">{endItemNumber}</span> of{" "}
          <span className="font-semibold text-gray-800">{totalItems}</span> orders
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 p-0 rounded-lg border-gray-200 bg-white"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          title="First Page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 p-0 rounded-lg border-gray-200 bg-white"
          onClick={() => onPageChange((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          title="Previous Page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-1 mx-1">
          {getPageNumbers(currentPage, totalPages).map((p) => {
            if (typeof p === "string") {
              return (
                <span key={p} className="px-2 text-xs text-gray-400">
                  ...
                </span>
              );
            }
            const isCurrent = p === currentPage;
            return (
              <button
                type="button"
                key={`p-${p}`}
                onClick={() => onPageChange(p)}
                className={`h-8 min-w-[32px] px-2 text-xs font-semibold rounded-lg transition-all ${isCurrent
                  ? "bg-culinary-primary text-white shadow-sm"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                  }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 p-0 rounded-lg border-gray-200 bg-white"
          onClick={() => onPageChange((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          title="Next Page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 p-0 rounded-lg border-gray-200 bg-white"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          title="Last Page"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function OrderDetailsSheet({
  order,
  onClose,
  onUpdateStatus,
}: Readonly<{
  order: OrderData | null;
  onClose: () => void;
  onUpdateStatus: (id: string, newStatus: OrderStatus) => Promise<void>;
}>) {
  return (
    <Sheet open={!!order} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-[400px] sm:w-[520px] overflow-y-auto bg-white border-l border-gray-200 shadow-2xl p-0">
        <div className="p-6">
          <SheetHeader className="border-b border-gray-100 pb-5 mb-6">
            <div className="flex justify-between items-center pr-6">
              <div>
                <SheetTitle className="text-xl font-bold text-gray-900 font-cormorant">
                  Order #{order?.orderNumber}
                </SheetTitle>
                <p className="text-xs text-gray-400 mt-0.5">
                  {order?.createdAt ? format(order.createdAt, "MMMM d, yyyy - h:mm a") : ""}
                </p>
              </div>
              {order && getStatusBadge(order.status)}
            </div>
          </SheetHeader>

          {order && (
            <div className="space-y-6">
              {/* Customer & Order Metadata */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="space-y-1">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Customer</p>
                  <p className="font-semibold text-gray-900 text-sm">{order.customerName || "Walk-in Guest"}</p>
                  <p className="text-xs text-gray-500">{order.customerPhone || "No phone provided"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Table</p>
                  <p className="font-bold text-lg text-culinary-primary">Table {order.table?.tableNumber || "N/A"}</p>
                </div>
              </div>

              {/* Payment & Status Summary */}
              <div className="flex gap-4">
                <div className="flex-1 bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center shadow-sm">
                  <p className="text-[10px] text-gray-500 font-bold mb-1 uppercase tracking-widest">Total Bill</p>
                  <p className="font-bold text-2xl text-gray-900">₹{Number(order.totalAmount || 0).toFixed(2)}</p>
                </div>
                <div className="flex-1 bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center shadow-sm">
                  <p className="text-[10px] text-gray-500 font-bold mb-1 uppercase tracking-widest">Payment Status</p>
                  {(() => {
                    const paid = isOrderPaid(order);
                    return (
                      <>
                        <Badge
                          variant={paid ? "default" : "secondary"}
                          className={
                            paid
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200 shadow-none px-3 py-1 text-xs font-semibold"
                              : "bg-amber-50 text-amber-700 border-amber-200 shadow-none px-3 py-1 text-xs font-semibold"
                          }
                        >
                          {paid ? "Paid" : "Unpaid"}
                        </Badge>

                        {!paid && order.status !== "CANCELLED" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2.5 w-full border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 h-7 text-xs font-semibold rounded-lg"
                            onClick={async () => {
                              if (confirm("Confirm payment received for this order?")) {
                                await onUpdateStatus(order.id, "PAID");
                              }
                            }}
                          >
                            Mark as Paid
                          </Button>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Items List */}
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-3">Order Items</p>
                <div className="space-y-2">
                  {order.items?.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between bg-white border border-gray-100 rounded-lg p-3 shadow-sm hover:border-gray-200 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center min-w-[28px] h-[28px] rounded bg-culinary-primary/10 text-culinary-primary font-bold text-xs">
                          {item.quantity}x
                        </span>
                        <span className="text-sm font-medium text-gray-900">{item.product?.name}</span>
                      </div>
                      {item.totalPrice && (
                        <span className="text-xs font-semibold text-gray-600">
                          ₹{Number(item.totalPrice).toFixed(2)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {order.notes && (
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">Customer Notes</p>
                  <div className="bg-amber-50 text-amber-900 p-3.5 rounded-lg border border-amber-200 text-xs">
                    {order.notes}
                  </div>
                </div>
              )}
            </div>
          )}

          <SheetFooter className="mt-8 border-t border-gray-100 pt-5 flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="w-full font-medium text-xs rounded-xl"
              onClick={onClose}
            >
              Close Details
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function EditOrderStatusDialog({
  order,
  status,
  onStatusChange,
  onClose,
  onSave,
}: Readonly<{
  order: OrderData | null;
  status: OrderStatus;
  onStatusChange: (status: OrderStatus) => void;
  onClose: () => void;
  onSave: () => void;
}>) {
  return (
    <Dialog open={!!order} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg">Edit Order Status - {order?.orderNumber}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <label htmlFor="edit-order-status" className="text-xs font-semibold text-gray-700 mb-2 block">
            Select New Status
          </label>
          <select
            id="edit-order-status"
            className="flex h-10 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-culinary-primary"
            value={status}
            onChange={(e) => onStatusChange(e.target.value as OrderStatus)}
          >
            <option value="PENDING">PENDING (New)</option>
            <option value="ACCEPTED">ACCEPTED</option>
            <option value="PREPARING">PREPARING (In Kitchen)</option>
            <option value="READY">READY (Ready to Serve)</option>
            <option value="SERVED">SERVED (Delivered to Table)</option>
            <option value="PAID">PAID (Completed & Paid)</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="bg-culinary-primary hover:bg-culinary-primary/90 text-white rounded-xl"
            onClick={onSave}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function OrdersClient() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [restaurants, setRestaurants] = useState<RestaurantOption[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>("all");

  // View Mode: Cards grid vs Table list (default cards or toggleable)
  const [viewMode, setViewMode] = useState<"cards" | "table">("table");

  const searchParams = useSearchParams();
  const urlSearchQuery = searchParams.get("search") || "";

  // Filter & Pagination States
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [localSearch, setLocalSearch] = useState<string>(urlSearchQuery);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Modal states
  const [viewOrder, setViewOrder] = useState<OrderData | null>(null);
  const [editOrder, setEditOrder] = useState<OrderData | null>(null);
  const [editStatus, setEditStatus] = useState<OrderStatus>("PENDING");

  const fetchOrders = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);
    try {
      const query = selectedRestaurant && selectedRestaurant !== "all" ? `?restaurantId=${selectedRestaurant}` : "";
      const res = await fetch(`/api/orders${query}`);
      if (res.ok) {
        const rawData = (await res.json()) as Array<Omit<OrderData, "createdAt"> & { createdAt: string }>;
        const formattedData: OrderData[] = rawData.map((o) => ({
          ...o,
          createdAt: new Date(o.createdAt),
        }));

        // Always sort latest orders on top
        formattedData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        setOrders(formattedData);
        setViewOrder((prev) => syncViewOrder(prev, formattedData));
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
      if (showRefreshIndicator) setIsRefreshing(false);
    }
  }, [selectedRestaurant]);

  useEffect(() => {
    const fetchSuperAdminData = async () => {
      try {
        const res = await fetch("/api/super-admin/restaurants");
        if (res.ok) {
          const json = await res.json();
          if (json?.data && Array.isArray(json.data)) {
            setIsSuperAdmin(true);
            setRestaurants(json.data.map((r: RestaurantOption) => ({
              id: r.id,
              name: r.name,
              dietaryCategory: r.dietaryCategory,
            })));
          }
        }
      } catch (err) {
        console.error("Failed to fetch super admin restaurants:", err);
      }
    };
    void fetchSuperAdminData();
  }, []);

  useEffect(() => {
    void (async () => {
      await fetchOrders();
    })();

    // Socket.io real-time listener for instantaneous status updates across Kitchen, Waiter & Admin
    let socket: Socket | undefined;
    try {
      socket = io();
      socket.on("order:updated", () => fetchOrders());
      socket.on("order:ready", () => fetchOrders());
      socket.on("order:served", () => fetchOrders());
      socket.on("order:new", () => fetchOrders());
    } catch (err) {
      console.warn("Socket connection failed:", err);
    }

    // Live polling every 3 seconds for rock-solid sync
    const interval = setInterval(() => fetchOrders(false), 3000);
    return () => {
      clearInterval(interval);
      if (socket) socket.disconnect();
    };
  }, [fetchOrders]);

  const updateOrderStatus = async (id: string, newStatus: OrderStatus) => {
    try {
      const res = await fetch(`/api/orders/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        await fetchOrders();
        setEditOrder(null);
        if (viewOrder?.id === id) {
          setViewOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
      } else {
        alert("Failed to update status");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred while updating status");
    }
  };

  const deleteOrder = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this order?")) return;
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        if (viewOrder?.id === id) setViewOrder(null);
        await fetchOrders();
      } else {
        alert("Failed to delete order");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred while deleting order");
    }
  };

  // Status Counts calculation
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: orders.length };
    STATUS_FILTERS.forEach((f) => {
      if (f.value !== "ALL") {
        counts[f.value] = orders.filter((o) => o.status === f.value).length;
      }
    });
    return counts;
  }, [orders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    const q = localSearch.toLowerCase().trim();
    return orders.filter((o) => matchesOrderFilter(o, statusFilter, q));
  }, [orders, statusFilter, localSearch]);

  // Pagination calculation
  const totalItems = filteredOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedOrders = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, safeCurrentPage, pageSize]);

  const startItemNumber = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endItemNumber = Math.min(safeCurrentPage * pageSize, totalItems);

  if (loading) {
    return <OrdersLoadingState />;
  }

  const hasFilter = Boolean(localSearch || statusFilter !== "ALL");

  const renderOrdersContent = () => {
    if (paginatedOrders.length === 0) {
      return (
        <OrdersEmptyState
          hasFilter={hasFilter}
          onResetFilters={() => {
            setLocalSearch("");
            setStatusFilter("ALL");
            setCurrentPage(1);
          }}
        />
      );
    }

    if (viewMode === "table") {
      return (
        <OrderTableView
          orders={paginatedOrders}
          onViewOrder={(order) => setViewOrder(order)}
          onEditOrder={(order) => {
            setEditOrder(order);
            setEditStatus(order.status);
          }}
          onDeleteOrder={deleteOrder}
          onUpdateStatus={updateOrderStatus}
        />
      );
    }

    return (
      <OrderCardsView
        orders={paginatedOrders}
        onViewOrder={(order) => setViewOrder(order)}
        onEditOrder={(order) => {
          setEditOrder(order);
          setEditStatus(order.status);
        }}
        onDeleteOrder={deleteOrder}
        onUpdateStatus={updateOrderStatus}
      />
    );
  };

  return (
    <div className="space-y-5 font-sans">
      {/* Super Admin Scope Selector */}
      {isSuperAdmin && restaurants.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent rounded-2xl border border-amber-200/60 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-300 flex items-center justify-center text-amber-700 shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold tracking-wider text-amber-800 uppercase">Super Admin View Scope</p>
              <h3 className="text-sm font-bold text-gray-900">Multi-Restaurant Orders Management</h3>
            </div>
          </div>
          <div className="w-full sm:w-[360px] min-w-[360px]">
            <Select
              value={selectedRestaurant}
              onValueChange={(val) => {
                setSelectedRestaurant(val || "all");
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full h-11 bg-white border-amber-300 rounded-xl text-xs font-bold text-gray-900 shadow-xs focus:ring-amber-500">
                <span className="truncate">
                  {selectedRestaurant === "all"
                    ? `🏢 All Restaurants (${restaurants.length} Outlets)`
                    : `🏪 ${restaurants.find((r) => r.id === selectedRestaurant)?.name || "Selected Restaurant"}`}
                </span>
              </SelectTrigger>
              <SelectContent className="w-[360px] min-w-[360px] max-h-72 overflow-y-auto">
                <SelectItem value="all" className="cursor-pointer font-bold text-xs py-2.5">
                  <div className="flex items-center justify-between w-full gap-2">
                    <span className="truncate">🏢 All Restaurants (Platform Total)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 shrink-0">
                      All Outlets
                    </span>
                  </div>
                </SelectItem>
                {restaurants.map((rest) => {
                  const badge = getDietaryBadge(rest.dietaryCategory);
                  return (
                    <SelectItem key={rest.id} value={rest.id} className="cursor-pointer text-xs py-2.5">
                      <div className="flex items-center justify-between w-full gap-2">
                        <span className="truncate">{rest.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold shrink-0 ${badge.className}`}>
                          {badge.label}
                        </span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Unified Main Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-culinary-border/40 overflow-hidden">
        {/* Top Control Bar: Search, View Mode, Refresh & Total Stats */}
        <div className="p-5 border-b border-gray-100 space-y-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            {/* Search Input */}
            <div className="relative w-full lg:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
              <input
                type="text"
                placeholder="Search by order #, table, customer, dish..."
                value={localSearch}
                onChange={(e) => {
                  setLocalSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-9 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-culinary-primary/20 focus:border-culinary-primary transition-all placeholder:text-gray-400 text-gray-800"
              />
              {localSearch && (
                <button type="button"
                  onClick={() => {
                    setLocalSearch("");
                    setCurrentPage(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 bg-gray-200/80 rounded-full w-4 h-4 flex items-center justify-center"
                >
                  ✕
                </button>
              )}
            </div>

            {/* View Mode Switcher, Refresh & Counter */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
              {/* Cards / Table Segmented Button */}
              <div className="flex items-center bg-gray-100/90 p-1 rounded-xl border border-gray-200/80">
                <button
                  type="button"
                  onClick={() => setViewMode("cards")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${viewMode === "cards"
                    ? "bg-white text-culinary-primary shadow-sm font-bold"
                    : "text-gray-600 hover:text-gray-900"
                    }`}
                >
                  <LayoutGrid size={14} />
                  <span>Cards</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${viewMode === "table"
                    ? "bg-white text-culinary-primary shadow-sm font-bold"
                    : "text-gray-600 hover:text-gray-900"
                    }`}
                >
                  <List size={14} />
                  <span>Table</span>
                </button>
              </div>

              {/* Refresh Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchOrders(true)}
                disabled={isRefreshing}
                className="text-xs h-9 gap-1.5 border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-xl shadow-none"
              >
                <RotateCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-culinary-primary" : ""}`} />
                Refresh
              </Button>

              {/* Orders Counter Badge */}
              <div className="bg-emerald-50 text-emerald-700 px-3.5 py-2 rounded-xl flex items-center gap-2 border border-emerald-200/60 text-xs font-bold shadow-none">
                <CheckCircle2 size={15} />
                <span>{orders.length} Total Orders</span>
              </div>
            </div>
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin pt-2">
            <span className="text-xs font-semibold text-gray-400 flex items-center gap-1 mr-1 shrink-0 uppercase tracking-wider text-[11px]">
              <Filter className="h-3 w-3" /> Status:
            </span>
            {STATUS_FILTERS.map((filter) => {
              const count = statusCounts[filter.value] || 0;
              const isSelected = statusFilter === filter.value;
              return (
                <button type="button"
                  key={filter.value}
                  onClick={() => {
                    setStatusFilter(filter.value);
                    setCurrentPage(1);
                  }}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${isSelected
                    ? "bg-culinary-primary text-white shadow-sm font-semibold"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200/70"
                    }`}
                >
                  {filter.label}
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isSelected ? "bg-white/20 text-white" : "bg-white text-gray-600 border border-gray-200"
                      }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Section: Table View OR Cards View */}
        {renderOrdersContent()}

        {/* Integrated Pagination Footer */}
        {filteredOrders.length > 0 && (
          <OrdersPagination
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalItems}
            startItemNumber={startItemNumber}
            endItemNumber={endItemNumber}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
          />
        )}
      </div>

      {/* View Details Sheet */}
      <OrderDetailsSheet
        order={viewOrder}
        onClose={() => setViewOrder(null)}
        onUpdateStatus={updateOrderStatus}
      />

      {/* Edit Status Modal */}
      <EditOrderStatusDialog
        order={editOrder}
        status={editStatus}
        onStatusChange={setEditStatus}
        onClose={() => setEditOrder(null)}
        onSave={() => editOrder && updateOrderStatus(editOrder.id, editStatus)}
      />
    </div>
  );
}
