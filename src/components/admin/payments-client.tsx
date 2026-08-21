"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { format } from "date-fns";
import { OrderStatus, PaymentMethod } from "@prisma/client";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Eye,
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
  Printer,
  CreditCard,
  Banknote,
  QrCode,
  DollarSign,
  TrendingUp,
  FileText,
  ChevronDown
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { io, Socket } from "socket.io-client";
import Link from "next/link";
import { isOrderPaid } from "@/lib/order-payment";

interface PaymentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod | null;
  createdAt: Date;
  updatedAt: Date;
  notes: string | null;
  table: { tableNumber: string };
  items: Array<{
    id: string;
    quantity: number;
    unitPrice?: number | string;
    totalPrice?: number | string;
    product: { name: string; price?: number };
  }>;
  totalAmount: number | string;
}

interface KpiStats {
  totalCollected: number;
  pendingAmount: number;
  paidCount: number;
  pendingCount: number;
  cashCollected: number;
  upiCollected: number;
  cardCollected: number;
}

const PAYMENT_FILTERS = [
  { label: "All Payments", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Paid", value: "PAID" },
  { label: "Cash", value: "CASH" },
  { label: "UPI", value: "UPI" },
  { label: "Card", value: "CARD" },
] as const;

/* =========================================================================
   PURE HELPER FUNCTIONS
   ========================================================================= */

function calculateKpiStats(orders: PaymentOrder[]): KpiStats {
  let totalCollected = 0;
  let pendingAmount = 0;
  let paidCount = 0;
  let pendingCount = 0;
  let cashCollected = 0;
  let upiCollected = 0;
  let cardCollected = 0;

  for (const o of orders) {
    const amt = Number(o.totalAmount || 0);
    const paid = isOrderPaid(o);
    if (paid) {
      totalCollected += amt;
      paidCount++;
      if (o.paymentMethod === "CASH") {
        cashCollected += amt;
      } else if (o.paymentMethod === "CARD") {
        cardCollected += amt;
      } else {
        upiCollected += amt;
      }
    } else if (o.status !== "CANCELLED") {
      pendingAmount += amt;
      pendingCount++;
    }
  }

  return {
    totalCollected,
    pendingAmount,
    paidCount,
    pendingCount,
    cashCollected,
    upiCollected,
    cardCollected,
  };
}

function calculateFilterCounts(orders: PaymentOrder[]): Record<string, number> {
  const counts: Record<string, number> = { ALL: orders.length };
  for (const o of orders) {
    const paid = isOrderPaid(o);
    if (paid) {
      counts["PAID"] = (counts["PAID"] || 0) + 1;
      const method = o.paymentMethod || "UPI";
      counts[method] = (counts[method] || 0) + 1;
    } else if (o.status !== "CANCELLED") {
      counts["PENDING"] = (counts["PENDING"] || 0) + 1;
    }
  }
  return counts;
}

function isOrderFilterMatch(order: PaymentOrder, filterType: string): boolean {
  const paid = isOrderPaid(order);
  if (filterType === "PENDING") {
    return !paid && order.status !== "CANCELLED";
  }
  if (filterType === "PAID") {
    return paid;
  }
  if (filterType === "CASH") {
    return paid && order.paymentMethod === "CASH";
  }
  if (filterType === "UPI") {
    return paid && (order.paymentMethod === "UPI" || !order.paymentMethod);
  }
  if (filterType === "CARD") {
    return paid && order.paymentMethod === "CARD";
  }
  return true;
}

function isOrderSearchMatch(order: PaymentOrder, query: string): boolean {
  if (!query) return true;
  return (
    Boolean(order.orderNumber?.toLowerCase().includes(query)) ||
    Boolean(order.customerName?.toLowerCase().includes(query)) ||
    Boolean(order.customerPhone?.toLowerCase().includes(query)) ||
    Boolean(order.table?.tableNumber?.toString().toLowerCase().includes(query)) ||
    Boolean(order.items?.some((item) => item.product?.name?.toLowerCase().includes(query)))
  );
}

function filterPaymentOrders(orders: PaymentOrder[], filterType: string, search: string): PaymentOrder[] {
  const q = search.toLowerCase().trim();
  return orders.filter((o) => isOrderFilterMatch(o, filterType) && isOrderSearchMatch(o, q));
}

function getPageNumbers(currentPage: number, totalPages: number): (number | string)[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages: (number | string)[] = [1];
  if (currentPage > 3) pages.push("ellipsis-start");
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  if (currentPage < totalPages - 2) pages.push("ellipsis-end");
  pages.push(totalPages);
  return pages;
}

/* =========================================================================
   SUB-COMPONENTS
   ========================================================================= */

interface PaymentMethodDropdownProps {
  order: PaymentOrder;
  onUpdateMethod: (orderId: string, method: PaymentMethod) => void;
}

function PaymentMethodDropdown({ order, onUpdateMethod }: Readonly<PaymentMethodDropdownProps>) {
  if (order.status !== "PAID") {
    return (
      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[11px] font-semibold">
        Pending
      </Badge>
    );
  }

  const currentMethod = order.paymentMethod || "UPI";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border transition-colors hover:opacity-80 cursor-pointer bg-white"
      >
        {currentMethod === "CASH" && (
          <span className="flex items-center gap-1 text-emerald-800 bg-emerald-50 border-emerald-300">
            <Banknote size={12} className="text-emerald-600" /> Cash <ChevronDown size={10} className="opacity-60" />
          </span>
        )}
        {currentMethod === "CARD" && (
          <span className="flex items-center gap-1 text-blue-800 bg-blue-50 border-blue-300">
            <CreditCard size={12} className="text-blue-600" /> Card <ChevronDown size={10} className="opacity-60" />
          </span>
        )}
        {currentMethod !== "CASH" && currentMethod !== "CARD" && (
          <span className="flex items-center gap-1 text-purple-800 bg-purple-50 border-purple-300">
            <QrCode size={12} className="text-purple-600" /> UPI <ChevronDown size={10} className="opacity-60" />
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36 rounded-xl p-1 text-xs">
        <DropdownMenuItem
          onClick={() => onUpdateMethod(order.id, "CASH")}
          className="flex items-center gap-2 cursor-pointer font-medium"
        >
          <Banknote size={14} className="text-emerald-600" /> Switch to Cash
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onUpdateMethod(order.id, "UPI")}
          className="flex items-center gap-2 cursor-pointer font-medium"
        >
          <QrCode size={14} className="text-purple-600" /> Switch to UPI
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onUpdateMethod(order.id, "CARD")}
          className="flex items-center gap-2 cursor-pointer font-medium"
        >
          <CreditCard size={14} className="text-blue-600" /> Switch to Card
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface PaymentKpiCardsProps {
  stats: KpiStats;
}

function PaymentKpiCards({ stats }: Readonly<PaymentKpiCardsProps>) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Collected */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Revenue</p>
          <p className="text-2xl font-bold text-gray-900">₹{stats.totalCollected.toFixed(2)}</p>
          <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
            <CheckCircle2 size={12} /> {stats.paidCount} Paid Orders
          </p>
        </div>
        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
          <TrendingUp size={24} />
        </div>
      </div>

      {/* Pending Collections */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending Amount</p>
          <p className="text-2xl font-bold text-amber-700">₹{stats.pendingAmount.toFixed(2)}</p>
          <p className="text-[11px] text-amber-600 font-medium flex items-center gap-1">
            <Clock size={12} /> {stats.pendingCount} Unpaid Tables
          </p>
        </div>
        <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
          <Clock size={24} />
        </div>
      </div>

      {/* Cash Collected */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cash Collected</p>
          <p className="text-2xl font-bold text-gray-900">₹{stats.cashCollected.toFixed(2)}</p>
          <p className="text-[11px] text-gray-400 font-medium">Physical cash in register</p>
        </div>
        <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100">
          <Banknote size={24} />
        </div>
      </div>

      {/* Digital Collected */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Digital (UPI/Card)</p>
          <p className="text-2xl font-bold text-gray-900">₹{(stats.upiCollected + stats.cardCollected).toFixed(2)}</p>
          <p className="text-[11px] text-purple-600 font-medium">UPI & POS settlements</p>
        </div>
        <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl border border-purple-100">
          <QrCode size={24} />
        </div>
      </div>
    </div>
  );
}

interface PaymentCardsViewProps {
  orders: PaymentOrder[];
  onViewOrder: (order: PaymentOrder) => void;
  onOpenCollectModal: (order: PaymentOrder) => void;
  onUpdateMethod: (orderId: string, method: PaymentMethod) => void;
}

function PaymentCardsView({
  orders,
  onViewOrder,
  onOpenCollectModal,
  onUpdateMethod
}: Readonly<PaymentCardsViewProps>) {
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {orders.map((order) => {
          const isPaid = isOrderPaid(order);
          return (
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
                <div className="mb-3 flex items-center gap-2 text-xs text-gray-700 bg-gray-50/60 p-2 rounded-lg border border-gray-100">
                  <User size={13} className="text-gray-400 shrink-0" />
                  <span className="font-semibold text-gray-800">{order.customerName || "Walk-in Guest"}</span>
                  {order.customerPhone && (
                    <span className="text-gray-400 text-[11px]">({order.customerPhone})</span>
                  )}
                </div>

                {/* Ordered Items Summary */}
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

                {/* Customer Notes if any */}
                {order.notes && (
                  <div className="mb-4 p-2.5 bg-amber-50/90 border border-amber-200/70 rounded-lg text-xs text-amber-800 italic">
                    <span className="font-bold not-italic mr-1">📝 Note:</span>
                    {order.notes}
                  </div>
                )}
              </div>

              {/* Card Footer: Amount, Status & Quick Collect/Receipt Actions */}
              <div className="pt-3 border-t border-gray-100 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold block">Total Bill</span>
                    <span className="font-bold text-xl text-gray-900">
                      ₹{Number(order.totalAmount || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge
                      variant={isPaid ? "default" : "secondary"}
                      className={
                        isPaid
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200 shadow-none text-[11px] font-semibold"
                          : "bg-amber-50 text-amber-700 border-amber-200 shadow-none text-[11px] font-semibold"
                      }
                    >
                      {isPaid ? "PAID" : "UNPAID"}
                    </Badge>
                    <PaymentMethodDropdown order={order} onUpdateMethod={onUpdateMethod} />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                  {isPaid ? (
                    <div className="flex items-center gap-1.5 w-full justify-between">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewOrder(order)}
                        className="h-8 px-2.5 text-xs text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                      >
                        <Eye size={13} className="mr-1 text-blue-600" /> Details
                      </Button>

                      <div className="flex items-center gap-1">
                        <Link href={`/dashboard/payments/receipt/${order.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2.5 text-xs border-gray-200 hover:bg-gray-50 rounded-lg"
                          >
                            <Printer size={12} className="mr-1 text-gray-500" /> Receipt
                          </Button>
                        </Link>
                        <Link href={`/dashboard/payments/invoice/${order.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2.5 text-xs border-gray-200 hover:bg-gray-50 rounded-lg"
                          >
                            <FileText size={12} className="mr-1 text-gray-500" /> Invoice
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 w-full justify-between">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewOrder(order)}
                        className="h-8 px-2.5 text-xs text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                      >
                        <Eye size={13} className="mr-1 text-blue-600" /> View
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => onOpenCollectModal(order)}
                        className="h-8 px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm"
                      >
                        <DollarSign size={13} className="mr-1" /> Collect Payment
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface PaymentTableViewProps {
  orders: PaymentOrder[];
  onViewOrder: (order: PaymentOrder) => void;
  onOpenCollectModal: (order: PaymentOrder) => void;
  onUpdateMethod: (orderId: string, method: PaymentMethod) => void;
}

function PaymentTableView({
  orders,
  onViewOrder,
  onOpenCollectModal,
  onUpdateMethod
}: Readonly<PaymentTableViewProps>) {
  return (
    <div className="overflow-x-auto">
      <Table className="w-full text-left">
        <TableHeader className="bg-gray-50/70 border-b border-gray-200/80">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[140px] whitespace-nowrap font-bold text-xs uppercase tracking-wider text-gray-600 py-3.5 pl-6">
              Order #
            </TableHead>
            <TableHead className="w-[140px] whitespace-nowrap font-bold text-xs uppercase tracking-wider text-gray-600 py-3.5">
              Date & Time
            </TableHead>
            <TableHead className="w-[90px] font-bold text-xs uppercase tracking-wider text-gray-600 py-3.5 text-center">
              Table
            </TableHead>
            <TableHead className="w-[160px] font-bold text-xs uppercase tracking-wider text-gray-600 py-3.5">
              Customer
            </TableHead>
            <TableHead className="min-w-[220px] font-bold text-xs uppercase tracking-wider text-gray-600 py-3.5">
              Ordered Items
            </TableHead>
            <TableHead className="w-[120px] font-bold text-xs uppercase tracking-wider text-gray-600 py-3.5">
              Bill Amount
            </TableHead>
            <TableHead className="w-[120px] font-bold text-xs uppercase tracking-wider text-gray-600 py-3.5 text-center">
              Method
            </TableHead>
            <TableHead className="w-[100px] font-bold text-xs uppercase tracking-wider text-gray-600 py-3.5 text-center">
              Status
            </TableHead>
            <TableHead className="text-right w-[170px] font-bold text-xs uppercase tracking-wider text-gray-600 py-3.5 pr-6">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-gray-100">
          {orders.map((order) => {
            const isPaid = isOrderPaid(order);
            return (
              <TableRow key={order.id} className="hover:bg-gray-50/70 transition-colors group">
                {/* Order Number */}
                <TableCell className="font-bold text-gray-900 align-top py-4 pl-6 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-900">{order.orderNumber}</span>
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
                      <div className="font-semibold text-gray-900 text-xs truncate max-w-[130px]" title={order.customerName}>
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
                  <div className="space-y-1 max-w-[260px]">
                    {order.items?.map((item) => (
                      <div key={item.id} className="text-xs flex items-center gap-1.5 text-gray-700 bg-gray-50/80 px-2 py-0.5 rounded border border-gray-100">
                        <span className="font-bold text-culinary-primary text-[10px]">
                          {item.quantity}x
                        </span>
                        <span className="truncate font-medium text-gray-800" title={item.product?.name}>
                          {item.product?.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </TableCell>

                {/* Total Amount */}
                <TableCell className="align-top py-4 whitespace-nowrap">
                  <div className="font-bold text-gray-900 text-sm">
                    ₹{Number(order.totalAmount || 0).toFixed(2)}
                  </div>
                </TableCell>

                {/* Payment Method Dropdown */}
                <TableCell className="align-top py-4 text-center">
                  <PaymentMethodDropdown order={order} onUpdateMethod={onUpdateMethod} />
                </TableCell>

                {/* Payment Status */}
                <TableCell className="align-top py-4 text-center">
                  <Badge
                    variant={isPaid ? "default" : "secondary"}
                    className={
                      isPaid
                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50 shadow-none border border-emerald-200 text-[11px] font-semibold"
                        : "bg-amber-50 text-amber-700 hover:bg-amber-50 shadow-none border border-amber-200 text-[11px] font-semibold"
                    }
                  >
                    {isPaid ? "Paid" : "Unpaid"}
                  </Badge>
                </TableCell>

                {/* Actions */}
                <TableCell className="text-right align-top py-3.5 pr-6">
                  <div className="flex items-center justify-end gap-1">
                    {isPaid ? (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="View Bill Details"
                          onClick={() => onViewOrder(order)}
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                        >
                          <Eye size={14} />
                        </Button>
                        <Link href={`/dashboard/payments/receipt/${order.id}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Print Receipt"
                            className="h-8 w-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                          >
                            <Printer size={14} />
                          </Button>
                        </Link>
                        <Link href={`/dashboard/payments/invoice/${order.id}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Print Invoice"
                            className="h-8 w-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                          >
                            <FileText size={14} />
                          </Button>
                        </Link>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="View Order"
                          onClick={() => onViewOrder(order)}
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                        >
                          <Eye size={14} />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => onOpenCollectModal(order)}
                          className="h-8 px-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm"
                        >
                          Collect
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

interface PaymentEmptyStateProps {
  isFiltered: boolean;
  onResetFilters: () => void;
}

function PaymentEmptyState({ isFiltered, onResetFilters }: Readonly<PaymentEmptyStateProps>) {
  return (
    <div className="flex flex-col items-center justify-center p-16 text-center">
      <div className="p-4 bg-gray-50 rounded-2xl mb-3 border border-gray-100">
        <ShoppingBag className="h-10 w-10 text-gray-300" />
      </div>
      <h3 className="text-base font-bold text-gray-800">
        {isFiltered
          ? "No billing records match your filter criteria"
          : "No payment records available"}
      </h3>
      <p className="text-xs text-gray-500 mt-1 max-w-sm">
        {isFiltered
          ? "Try clearing your search query or selecting a different filter tab."
          : "Customer bills and payment records will automatically appear here."}
      </p>
      {isFiltered && (
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

interface PaymentContentViewProps {
  orders: PaymentOrder[];
  viewMode: "cards" | "table";
  isFiltered: boolean;
  onResetFilters: () => void;
  onViewOrder: (order: PaymentOrder) => void;
  onOpenCollectModal: (order: PaymentOrder) => void;
  onUpdateMethod: (orderId: string, method: PaymentMethod) => void;
}

function PaymentContentView({
  orders,
  viewMode,
  isFiltered,
  onResetFilters,
  onViewOrder,
  onOpenCollectModal,
  onUpdateMethod,
}: Readonly<PaymentContentViewProps>) {
  if (orders.length === 0) {
    return <PaymentEmptyState isFiltered={isFiltered} onResetFilters={onResetFilters} />;
  }

  if (viewMode === "cards") {
    return (
      <PaymentCardsView
        orders={orders}
        onViewOrder={onViewOrder}
        onOpenCollectModal={onOpenCollectModal}
        onUpdateMethod={onUpdateMethod}
      />
    );
  }

  return (
    <PaymentTableView
      orders={orders}
      onViewOrder={onViewOrder}
      onOpenCollectModal={onOpenCollectModal}
      onUpdateMethod={onUpdateMethod}
    />
  );
}

interface PaymentPaginationControlsProps {
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  safeCurrentPage: number;
  totalPages: number;
  startItemNumber: number;
  endItemNumber: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

function PaymentPaginationControls({
  pageSize,
  onPageSizeChange,
  safeCurrentPage,
  totalPages,
  startItemNumber,
  endItemNumber,
  totalItems,
  onPageChange
}: Readonly<PaymentPaginationControlsProps>) {
  const pageNumbers = getPageNumbers(safeCurrentPage, totalPages);

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
            <option value={9}>9</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        <div>
          Showing <span className="font-semibold text-gray-800">{startItemNumber}</span> to{" "}
          <span className="font-semibold text-gray-800">{endItemNumber}</span> of{" "}
          <span className="font-semibold text-gray-800">{totalItems}</span> transactions
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 p-0 rounded-lg border-gray-200 bg-white"
          onClick={() => onPageChange(1)}
          disabled={safeCurrentPage === 1}
          title="First Page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 p-0 rounded-lg border-gray-200 bg-white"
          onClick={() => onPageChange(Math.max(1, safeCurrentPage - 1))}
          disabled={safeCurrentPage === 1}
          title="Previous Page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-1 mx-1">
          {pageNumbers.map((p) => {
            if (typeof p === "string") {
              return (
                <span key={p} className="px-2 text-xs text-gray-400">
                  ...
                </span>
              );
            }
            const isCurrent = p === safeCurrentPage;
            return (
              <button
                type="button"
                key={`page-${p}`}
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
          onClick={() => onPageChange(Math.min(totalPages, safeCurrentPage + 1))}
          disabled={safeCurrentPage === totalPages}
          title="Next Page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 p-0 rounded-lg border-gray-200 bg-white"
          onClick={() => onPageChange(totalPages)}
          disabled={safeCurrentPage === totalPages}
          title="Last Page"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

interface CollectPaymentModalProps {
  order: PaymentOrder | null;
  selectedMethod: PaymentMethod;
  setSelectedMethod: (method: PaymentMethod) => void;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function CollectPaymentModal({
  order,
  selectedMethod,
  setSelectedMethod,
  isSubmitting,
  onClose,
  onConfirm
}: Readonly<CollectPaymentModalProps>) {
  return (
    <Dialog open={!!order} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 font-cormorant flex items-center gap-2">
            <DollarSign className="text-emerald-600 h-5 w-5" /> Collect Payment
          </DialogTitle>
        </DialogHeader>

        {order && (
          <div className="space-y-5 py-3">
            {/* Order Info Banner */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500 font-medium">Order: <span className="font-bold text-gray-800">{order.orderNumber}</span></p>
                <p className="text-xs text-gray-500 mt-0.5">Table: <span className="font-bold text-culinary-primary">Table {order.table?.tableNumber}</span></p>
                <p className="text-xs text-gray-500 mt-0.5">Customer: <span className="font-semibold text-gray-800">{order.customerName || "Walk-in"}</span></p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Total Bill</p>
                <p className="text-2xl font-bold text-gray-900">₹{Number(order.totalAmount || 0).toFixed(2)}</p>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-2.5">
                Select Payment Method
              </span>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedMethod("UPI")}
                  className={`p-3.5 rounded-xl border text-center flex flex-col items-center gap-1.5 transition-all ${selectedMethod === "UPI"
                    ? "border-purple-500 bg-purple-50/80 text-purple-900 ring-2 ring-purple-500/20 font-bold"
                    : "border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
                    }`}
                >
                  <QrCode size={20} className={selectedMethod === "UPI" ? "text-purple-600" : "text-gray-400"} />
                  <span className="text-xs">UPI / QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod("CASH")}
                  className={`p-3.5 rounded-xl border text-center flex flex-col items-center gap-1.5 transition-all ${selectedMethod === "CASH"
                    ? "border-emerald-500 bg-emerald-50/80 text-emerald-900 ring-2 ring-emerald-500/20 font-bold"
                    : "border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
                    }`}
                >
                  <Banknote size={20} className={selectedMethod === "CASH" ? "text-emerald-600" : "text-gray-400"} />
                  <span className="text-xs">Cash</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod("CARD")}
                  className={`p-3.5 rounded-xl border text-center flex flex-col items-center gap-1.5 transition-all ${selectedMethod === "CARD"
                    ? "border-blue-500 bg-blue-50/80 text-blue-900 ring-2 ring-blue-500/20 font-bold"
                    : "border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
                    }`}
                >
                  <CreditCard size={20} className={selectedMethod === "CARD" ? "text-blue-600" : "text-gray-400"} />
                  <span className="text-xs">Card / POS</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={isSubmitting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl px-5"
            onClick={onConfirm}
          >
            {isSubmitting ? "Processing..." : "Confirm & Mark as Paid"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface PaymentDetailsSheetProps {
  order: PaymentOrder | null;
  onClose: () => void;
  onCollectPayment: (order: PaymentOrder) => void;
  onUpdateMethod: (orderId: string, method: PaymentMethod) => void;
}

function PaymentDetailsSheet({
  order,
  onClose,
  onCollectPayment,
  onUpdateMethod
}: Readonly<PaymentDetailsSheetProps>) {
  return (
    <Sheet open={!!order} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-[400px] sm:w-[520px] overflow-y-auto bg-white border-l border-gray-200 shadow-2xl p-0">
        <div className="p-6">
          <SheetHeader className="border-b border-gray-100 pb-5 mb-6">
            <div className="flex justify-between items-center pr-6">
              <div>
                <SheetTitle className="text-xl font-bold text-gray-900 font-cormorant">
                  Bill #{order?.orderNumber}
                </SheetTitle>
                <p className="text-xs text-gray-400 mt-0.5">
                  {order?.createdAt ? format(order.createdAt, "MMMM d, yyyy - h:mm a") : ""}
                </p>
              </div>
              {order && (() => {
                const isPaid = isOrderPaid(order);
                return (
                  <Badge
                    variant={isPaid ? "default" : "secondary"}
                    className={
                      isPaid
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200 shadow-none px-3 py-1 text-xs font-semibold"
                        : "bg-amber-50 text-amber-700 border-amber-200 shadow-none px-3 py-1 text-xs font-semibold"
                    }
                  >
                    {isPaid ? "PAID" : "UNPAID"}
                  </Badge>
                );
              })()}
            </div>
          </SheetHeader>

          {order && (
            <div className="space-y-6">
              {/* Customer & Table Grid */}
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

              {/* Bill Amount & Payment Method Summary */}
              <div className="flex gap-4">
                <div className="flex-1 bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center shadow-sm">
                  <p className="text-[10px] text-gray-500 font-bold mb-1 uppercase tracking-widest">Grand Total</p>
                  <p className="font-bold text-2xl text-gray-900">₹{Number(order.totalAmount || 0).toFixed(2)}</p>
                </div>
                <div className="flex-1 bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center shadow-sm">
                  <p className="text-[10px] text-gray-500 font-bold mb-1 uppercase tracking-widest">Payment Method</p>
                  <div className="mt-1">
                    <PaymentMethodDropdown order={order} onUpdateMethod={onUpdateMethod} />
                  </div>

                  {!isOrderPaid(order) && (
                    <Button
                      size="sm"
                      onClick={() => onCollectPayment(order)}
                      className="mt-2.5 w-full bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-xs font-semibold rounded-lg"
                    >
                      Collect Payment
                    </Button>
                  )}
                </div>
              </div>

              {/* Itemized Order Breakdown */}
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-3">Item Breakdown</p>
                <div className="space-y-2">
                  {order.items?.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between bg-white border border-gray-100 rounded-lg p-3 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center min-w-[28px] h-[28px] rounded bg-culinary-primary/10 text-culinary-primary font-bold text-xs">
                          {item.quantity}x
                        </span>
                        <span className="text-sm font-medium text-gray-900">{item.product?.name}</span>
                      </div>
                      {item.totalPrice && (
                        <span className="text-xs font-semibold text-gray-700">
                          ₹{Number(item.totalPrice).toFixed(2)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Print Receipts & Invoice Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Link href={`/dashboard/payments/receipt/${order.id}`} className="w-full">
                  <Button variant="outline" className="w-full text-xs font-semibold h-10 rounded-xl">
                    <Printer size={13} className="mr-1.5 text-gray-500" /> Print Receipt
                  </Button>
                </Link>
                <Link href={`/dashboard/payments/invoice/${order.id}`} className="w-full">
                  <Button variant="outline" className="w-full text-xs font-semibold h-10 rounded-xl">
                    <FileText size={13} className="mr-1.5 text-gray-500" /> Print Invoice
                  </Button>
                </Link>
              </div>
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

/* =========================================================================
   MAIN PAYMENTS CLIENT COMPONENT
   ========================================================================= */

export function PaymentsClient() {
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // View Mode: Cards vs Table (default to cards matching user's request)
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  const searchParams = useSearchParams();
  const urlSearchQuery = searchParams.get("search") || "";

  // Filter & Pagination States
  const [filterType, setFilterType] = useState<string>("ALL");
  const [localSearch, setLocalSearch] = useState<string>(urlSearchQuery);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(9);

  // Collect Payment Modal State
  const [collectOrder, setCollectOrder] = useState<PaymentOrder | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("UPI");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // View Bill Sheet State
  const [viewOrder, setViewOrder] = useState<PaymentOrder | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const rawData = (await res.json()) as Array<Omit<PaymentOrder, "createdAt" | "updatedAt"> & { createdAt: string; updatedAt: string }>;
        const formattedData: PaymentOrder[] = rawData.map((o) => ({
          ...o,
          createdAt: new Date(o.createdAt),
          updatedAt: new Date(o.updatedAt),
        }));

        formattedData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setOrders(formattedData);

        // Sync viewOrder if modal is currently open
        setViewOrder((prev) => {
          if (!prev) return null;
          const updated = formattedData.find((o) => o.id === prev.id);
          if (updated && (updated.status !== prev.status || updated.totalAmount !== prev.totalAmount || updated.paymentMethod !== prev.paymentMethod)) {
            return updated;
          }
          return prev;
        });
      }
    } catch (error) {
      console.error("Failed to fetch payments data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchOrders();
    setIsRefreshing(false);
  };

  useEffect(() => {
    const loadInitialData = async () => {
      await fetchOrders();
    };

    void loadInitialData();

    // Real-time socket sync
    let socket: Socket | undefined;
    try {
      socket = io();
      socket.on("order:updated", () => { void fetchOrders(); });
      socket.on("order:served", () => { void fetchOrders(); });
      socket.on("order:new", () => { void fetchOrders(); });
    } catch (err) {
      console.warn("Socket connection failed:", err);
    }

    // Polling fallback every 3s
    const interval = setInterval(() => { void fetchOrders(); }, 3000);
    return () => {
      clearInterval(interval);
      if (socket) socket.disconnect();
    };
  }, [fetchOrders]);

  const handleCollectPayment = async () => {
    if (!collectOrder) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/orders/${collectOrder.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "PAID",
          paymentMethod: selectedMethod
        }),
      });

      if (res.ok) {
        setCollectOrder(null);
        await fetchOrders();
      } else {
        alert("Failed to process payment");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred while collecting payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updatePaymentMethod = async (orderId: string, newMethod: PaymentMethod) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod: newMethod
        }),
      });

      if (res.ok) {
        await fetchOrders();
      } else {
        alert("Failed to update payment method");
      }
    } catch (error) {
      console.error(error);
    }
  };

  // KPI Metrics Calculation
  const kpiStats = useMemo(() => calculateKpiStats(orders), [orders]);

  // Filter Counts
  const filterCounts = useMemo(() => calculateFilterCounts(orders), [orders]);

  // Filtered orders list
  const filteredOrders = useMemo(
    () => filterPaymentOrders(orders, filterType, localSearch),
    [orders, filterType, localSearch]
  );

  // Pagination calculations
  const totalItems = filteredOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedOrders = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, safeCurrentPage, pageSize]);

  const startItemNumber = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endItemNumber = Math.min(safeCurrentPage * pageSize, totalItems);

  const handleOpenCollectModal = (order: PaymentOrder) => {
    setCollectOrder(order);
    setSelectedMethod(order.paymentMethod || "UPI");
  };

  const handleCollectFromDetails = (order: PaymentOrder) => {
    setCollectOrder(order);
    setViewOrder(null);
  };

  const handleResetFilters = () => {
    setLocalSearch("");
    setFilterType("ALL");
    setCurrentPage(1);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-culinary-primary border-t-transparent"></div>
        <p className="text-sm text-gray-500 font-medium">Loading billing & payments data...</p>
      </div>
    );
  }

  const isFiltered = Boolean(localSearch || filterType !== "ALL");

  return (
    <div className="space-y-6 font-sans">
      {/* Top KPI Cards Overview */}
      <PaymentKpiCards stats={kpiStats} />

      {/* Main Unified Payments Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-culinary-border/40 overflow-hidden">
        {/* Top Controls: Search, Payment Method Filter Pills, View Mode & Refresh */}
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

            {/* View Mode Toggle, Refresh & Count */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
              {/* Cards vs Table Toggle */}
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
                onClick={() => void handleRefresh()}
                disabled={isRefreshing}
                className="text-xs h-9 gap-1.5 border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-xl shadow-none"
              >
                <RotateCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-culinary-primary" : ""}`} />
                Refresh
              </Button>

              {/* Total Transactions Badge */}
              <div className="bg-emerald-50 text-emerald-700 px-3.5 py-2 rounded-xl flex items-center gap-2 border border-emerald-200/60 text-xs font-bold shadow-none">
                <CheckCircle2 size={15} />
                <span>{orders.length} Bills Total</span>
              </div>
            </div>
          </div>

          {/* Payment Method / Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin pt-2">
            <span className="text-xs font-semibold text-gray-400 flex items-center gap-1 mr-1 shrink-0 uppercase tracking-wider text-[11px]">
              <Filter className="h-3 w-3" /> Filter:
            </span>
            {PAYMENT_FILTERS.map((filter) => {
              const count = filterCounts[filter.value] || 0;
              const isSelected = filterType === filter.value;
              return (
                <button type="button"
                  key={filter.value}
                  onClick={() => {
                    setFilterType(filter.value);
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

        {/* Content Section: Cards Grid View OR Table List View */}
        <PaymentContentView
          orders={paginatedOrders}
          viewMode={viewMode}
          isFiltered={isFiltered}
          onResetFilters={handleResetFilters}
          onViewOrder={setViewOrder}
          onOpenCollectModal={handleOpenCollectModal}
          onUpdateMethod={updatePaymentMethod}
        />

        {/* Integrated Pagination Footer */}
        {filteredOrders.length > 0 && (
          <PaymentPaginationControls
            pageSize={pageSize}
            onPageSizeChange={handlePageSizeChange}
            safeCurrentPage={safeCurrentPage}
            totalPages={totalPages}
            startItemNumber={startItemNumber}
            endItemNumber={endItemNumber}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Collect Payment Modal Dialog */}
      <CollectPaymentModal
        order={collectOrder}
        selectedMethod={selectedMethod}
        setSelectedMethod={setSelectedMethod}
        isSubmitting={isSubmitting}
        onClose={() => setCollectOrder(null)}
        onConfirm={handleCollectPayment}
      />

      {/* View Bill Details Drawer/Sheet */}
      <PaymentDetailsSheet
        order={viewOrder}
        onClose={() => setViewOrder(null)}
        onCollectPayment={handleCollectFromDetails}
        onUpdateMethod={updatePaymentMethod}
      />
    </div>
  );
}
