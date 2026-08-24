"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format, isToday, isYesterday, isAfter, subDays } from "date-fns";
import {
  History,
  Calendar,
  Clock,
  Search,
  RotateCw,
  CreditCard,
  Banknote,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Utensils,
  Receipt,
  X,
  Armchair,
  User,
  CheckCircle2,
} from "lucide-react";
import { toast } from "react-hot-toast";

export type HistoryOrderItem = {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product: {
    name: string;
    foodType?: string;
  };
};

export type HistoryOrder = {
  id: string;
  orderNumber: string;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  totalAmount: number;
  status: string;
  paymentMethod?: string;
  waiterId?: string | null;
  table: {
    tableNumber: string;
    capacity?: number;
  };
  items: HistoryOrderItem[];
  createdAt: string;
  updatedAt: string;
};

interface WaiterHistoryModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly waiterId?: string;
  readonly waiterName?: string;
}

type TimeFilter = "ALL" | "TODAY" | "YESTERDAY" | "WEEK" | "MONTH";

export function WaiterHistoryModal({
  isOpen,
  onClose,
  waiterId,
  waiterName,
}: Readonly<WaiterHistoryModalProps>) {
  const [orders, setOrders] = useState<HistoryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("ALL");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const loadHistoryData = useCallback(async () => {
    try {
      const waiterQuery = waiterId ? `&waiterId=${encodeURIComponent(waiterId)}` : "";
      const res = await fetch(`/api/waiter/orders?status=HISTORY${waiterQuery}&t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        return data as HistoryOrder[];
      }
    } catch (err) {
      console.error("Failed to fetch waiter history:", err);
    }
    return null;
  }, [waiterId]);

  useEffect(() => {
    if (!isOpen) return;

    let ignore = false;

    async function load() {
      const data = await loadHistoryData();
      if (!ignore) {
        if (data) {
          setOrders(data);
        }
        setLoading(false);
      }
    }

    void load();

    return () => {
      ignore = true;
    };
  }, [isOpen, loadHistoryData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const data = await loadHistoryData();
    if (data) {
      setOrders(data);
    }
    setIsRefreshing(false);
    toast.success("History refreshed", { id: "refresh-history-modal" });
  };

  // Filter orders by waiter, search query, and time range
  const filteredOrders = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const now = new Date();

    return orders.filter((order) => {
      // Strictly filter by current waiter if waiterId is available
      if (waiterId && order.waiterId !== waiterId) {
        return false;
      }

      // Time Range Filter
      const orderDate = new Date(order.updatedAt || order.createdAt);
      if (timeFilter === "TODAY" && !isToday(orderDate)) return false;
      if (timeFilter === "YESTERDAY" && !isYesterday(orderDate)) return false;
      if (timeFilter === "WEEK" && !isAfter(orderDate, subDays(now, 7))) return false;
      if (timeFilter === "MONTH" && !isAfter(orderDate, subDays(now, 30))) return false;

      // Text Search Filter
      if (!q) return true;
      const matchesOrderNo = order.orderNumber.toLowerCase().includes(q);
      const matchesTable = order.table?.tableNumber?.toLowerCase().includes(q);
      const matchesCustomer = order.customerName?.toLowerCase().includes(q);
      const matchesItem = order.items?.some((item) =>
        item.product?.name?.toLowerCase().includes(q)
      );

      return matchesOrderNo || matchesTable || matchesCustomer || matchesItem;
    });
  }, [orders, waiterId, searchQuery, timeFilter]);

  // Group filtered orders day-wise (by formatted date key)
  const groupedOrders = useMemo(() => {
    const groups: {
      dateKey: string;
      displayDate: string;
      totalSales: number;
      orders: HistoryOrder[];
    }[] = [];

    const groupMap = new Map<
      string,
      { displayDate: string; totalSales: number; orders: HistoryOrder[] }
    >();

    // Sort all orders chronologically descending first
    const sorted = [...filteredOrders].sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt).getTime() -
        new Date(a.updatedAt || a.createdAt).getTime()
    );

    for (const order of sorted) {
      const orderDate = new Date(order.updatedAt || order.createdAt);
      const dateKey = format(orderDate, "yyyy-MM-dd");

      let displayDate = format(orderDate, "EEEE, dd MMM yyyy");
      if (isToday(orderDate)) {
        displayDate = `Today • ${format(orderDate, "dd MMM yyyy")}`;
      } else if (isYesterday(orderDate)) {
        displayDate = `Yesterday • ${format(orderDate, "dd MMM yyyy")}`;
      }

      if (!groupMap.has(dateKey)) {
        groupMap.set(dateKey, {
          displayDate,
          totalSales: 0,
          orders: [],
        });
      }

      const grp = groupMap.get(dateKey)!;
      grp.orders.push(order);
      grp.totalSales += Number(order.totalAmount || 0);
    }

    groupMap.forEach((val, key) => {
      groups.push({
        dateKey: key,
        displayDate: val.displayDate,
        totalSales: val.totalSales,
        orders: val.orders,
      });
    });

    return groups;
  }, [filteredOrders]);

  // Overall stats for filtered orders
  const totalSales = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
  }, [filteredOrders]);

  const renderPaymentIcon = (method?: string) => {
    const m = (method || "").toUpperCase();
    if (m === "UPI") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
          <Smartphone size={10} className="text-blue-600" /> UPI
        </span>
      );
    }
    if (m === "CARD") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md">
          <CreditCard size={10} className="text-purple-600" /> Card
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
        <Banknote size={10} className="text-emerald-600" /> Cash
      </span>
    );
  };

  const renderHistoryContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-amber-600 border-t-transparent" />
          <p className="text-xs text-gray-500 font-semibold animate-pulse">
            Loading order history...
          </p>
        </div>
      );
    }

    if (groupedOrders.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-14 px-4 text-center bg-white rounded-2xl border border-dashed border-gray-200 space-y-2">
          <div className="p-3 bg-amber-50 rounded-xl text-amber-700">
            <Receipt size={24} />
          </div>
          <p className="text-sm font-bold text-gray-800 font-cormorant">No history records found</p>
          <p className="text-xs text-gray-500 max-w-xs">
            {searchQuery
              ? `No orders matching "${searchQuery}" in this timeframe.`
              : "No served or paid tables recorded for this period."}
          </p>
          {searchQuery && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSearchQuery("")}
              className="rounded-xl text-xs h-7 mt-2"
            >
              Clear Search
            </Button>
          )}
        </div>
      );
    }

    return groupedOrders.map((group) => (
      <div key={group.dateKey} className="space-y-2">
        {/* Day Header Banner - Natural flowing timeline header that scrolls smoothly with items */}
        <div className="bg-white px-3.5 py-2.5 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
              <Calendar size={13} />
            </div>
            <span className="font-bold text-xs text-gray-900 font-sans">{group.displayDate}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              {group.orders.length} {group.orders.length === 1 ? "table" : "tables"}
            </span>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              ₹{group.totalSales.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Orders under this day, sorted with Time */}
        <div className="space-y-2">
          {group.orders.map((order) => {
            const isExpanded = expandedOrderId === order.id;
            const orderDate = new Date(order.updatedAt || order.createdAt);
            const formattedTime = format(orderDate, "hh:mm a");

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs overflow-hidden transition-all hover:border-amber-300"
              >
                {/* Order Summary Row */}
                <button
                  type="button"
                  onClick={() =>
                    setExpandedOrderId(isExpanded ? null : order.id)
                  }
                  aria-expanded={isExpanded}
                  className="w-full text-left p-3.5 flex items-start justify-between gap-3 cursor-pointer select-none active:bg-gray-50/80 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Left Badge with Table Info */}
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-100/90 border border-emerald-200/90 text-emerald-800 flex flex-col items-center justify-center shrink-0 shadow-2xs">
                      <Armchair size={15} />
                      <span className="text-[9px] font-extrabold leading-none mt-0.5">T-{order.table?.tableNumber || "?"}</span>
                    </div>

                    {/* Center Details */}
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs text-gray-900 leading-tight">
                          Table {order.table?.tableNumber || "-"}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono font-medium">
                          #{order.orderNumber}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-gray-500 flex-wrap">
                        <span className="inline-flex items-center gap-1 font-semibold text-gray-700 bg-gray-100 px-1.5 py-0.2 rounded-md">
                          <Clock size={10} className="text-amber-600" />
                          {formattedTime}
                        </span>
                        <span>•</span>
                        <span>{order.items?.length || 0} items</span>
                        {order.customerName && (
                          <>
                            <span>•</span>
                            <span className="text-gray-600 truncate max-w-[120px] font-medium inline-flex items-center gap-0.5">
                              <User size={9} className="text-gray-400" />
                              {order.customerName}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Price & Payment */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="font-extrabold text-xs sm:text-sm text-gray-900 font-sans">
                      ₹{Number(order.totalAmount || 0).toLocaleString("en-IN")}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {renderPaymentIcon(order.paymentMethod)}
                      <div className="p-0.5 text-gray-400">
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </div>
                    </div>
                  </div>
                </button>

                {/* Expanded Item Breakdown */}
                {isExpanded && (
                  <div className="bg-gray-50/90 border-t border-gray-100 p-3 text-xs space-y-2 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between text-[11px] font-bold text-gray-600">
                      <span className="flex items-center gap-1">
                        <Utensils size={12} className="text-amber-700" />
                        Ordered Dishes Breakdown
                      </span>
                      <span>Amount</span>
                    </div>

                    <div className="divide-y divide-gray-200/60 bg-white rounded-xl border border-gray-200/60 overflow-hidden">
                      {order.items && order.items.length > 0 ? (
                        order.items.map((item) => (
                          <div
                            key={item.id}
                            className="p-2.5 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded text-[10px]">
                                {item.quantity}x
                              </span>
                              <span className="text-gray-800 font-medium">
                                {item.product?.name || "Dish item"}
                              </span>
                            </div>
                            <span className="font-semibold text-gray-700">
                              ₹{Number(item.totalPrice || item.unitPrice * item.quantity).toLocaleString("en-IN")}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="p-2.5 text-[11px] text-gray-400 italic">
                          No item breakdown available.
                        </p>
                      )}
                    </div>

                    {/* Additional metadata */}
                    <div className="flex items-center justify-between pt-1 text-[10px] text-gray-500">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 size={11} className="text-emerald-600" />
                        Delivered & Settled: {format(orderDate, "hh:mm:ss a, dd MMM yyyy")}
                      </span>
                      <span className="font-bold text-emerald-700">Status: {order.status}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    ));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="w-[96vw] sm:max-w-2xl p-0 overflow-hidden bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-200 max-h-[92vh] sm:max-h-[88vh] flex flex-col font-sans"
      >
        {/* Modern Dark Header with Gradient & Summary */}
        <div className="relative bg-gradient-to-r from-stone-900 via-neutral-900 to-amber-950 p-4 sm:p-5 text-white shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/20 border border-amber-400/30 rounded-xl text-amber-400 shrink-0 shadow-inner">
                <History size={20} />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold font-cormorant text-white leading-tight">
                  Served Orders History
                </DialogTitle>
                <DialogDescription className="text-[11px] text-gray-300 mt-0.5">
                  {waiterName ? `${waiterName}'s shift records` : "All past served tables"} • Grouped by Day & Time
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => void handleRefresh()}
                disabled={isRefreshing}
                title="Refresh History"
                className="p-2 bg-white/10 hover:bg-white/20 active:bg-white/30 border border-white/15 rounded-xl text-white transition-all"
              >
                <RotateCw size={15} className={isRefreshing ? "animate-spin text-amber-400" : ""} />
              </button>

              <button
                type="button"
                onClick={onClose}
                title="Close"
                className="p-2 bg-white/10 hover:bg-white/20 active:bg-white/30 border border-white/15 rounded-xl text-white transition-all"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Quick Summary Chips */}
          <div className="grid grid-cols-2 gap-2 mt-3.5 pt-3 border-t border-white/10">
            <div className="bg-white/10 px-3 py-2 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-gray-300">
                <Armchair size={12} className="text-amber-400" />
                <span>Total Served</span>
              </div>
              <span className="text-sm font-extrabold text-amber-300 font-sans">
                {filteredOrders.length} <span className="text-[10px] font-normal text-amber-200">Tables</span>
              </span>
            </div>

            <div className="bg-white/10 px-3 py-2 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-gray-300">
                <Receipt size={12} className="text-emerald-400" />
                <span>Total Sales</span>
              </div>
              <span className="text-sm font-extrabold text-emerald-300 font-sans">
                ₹{totalSales.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-3 bg-gray-50/90 border-b border-gray-200/90 space-y-2.5 shrink-0">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search table, order #, or dish name..."
              className="pl-8.5 pr-8 py-1.5 h-8.5 text-xs bg-white rounded-xl border-gray-200 focus-visible:ring-amber-500 shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Time Filter Tabs (Fits 100% width on all screens without horizontal scroll) */}
          <div className="grid grid-cols-5 gap-1 p-1 bg-gray-200/80 rounded-xl">
            {(
              [
                { id: "ALL", label: "All" },
                { id: "TODAY", label: "Today" },
                { id: "YESTERDAY", label: "Y'day" },
                { id: "WEEK", label: "7 Days" },
                { id: "MONTH", label: "30 Days" },
              ] as const
            ).map((tab) => {
              const active = timeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTimeFilter(tab.id)}
                  className={`py-1.5 px-0.5 rounded-lg text-[11px] font-bold text-center transition-all ${
                    active
                      ? "bg-amber-600 text-white shadow-xs"
                      : "text-gray-600 hover:text-gray-900 hover:bg-white/60 active:bg-white"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Order List by Day & Time */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 bg-gray-50/60 scrollbar-thin pb-8">
          {renderHistoryContent()}
        </div>

        {/* Footer with Close Button */}
        <div className="p-3 px-4 bg-white border-t border-gray-200 flex items-center justify-between shrink-0 shadow-2xs">
          <p className="text-[11px] text-gray-500">
            Showing <strong className="text-gray-900 font-bold">{filteredOrders.length}</strong> orders
          </p>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={onClose}
            className="bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl text-xs h-8 px-4"
          >
            Close History
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
