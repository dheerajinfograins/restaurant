"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Search,
  CheckCircle2,
  History as HistoryIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  RotateCw,
  User,
} from "lucide-react";
import type { OrderStatus } from "@prisma/client";
import { format } from "date-fns";
import { getKitchenHistoryAction } from "@/modules/kitchen/controller";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface HistoryOrder {
  id: string;
  orderNumber: string;
  customerName?: string;
  customerPhone?: string;
  status: OrderStatus;
  paymentMethod?: string | null;
  totalAmount?: number;
  createdAt: string;
  updatedAt: string;
  notes?: string | null;
  table: { tableNumber: string };
  items: Array<{
    id: string;
    quantity: number;
    unitPrice?: number;
    totalPrice?: number;
    product: { name: string; price?: number; foodType?: string };
  }>;
}

export type TimeRange = "today" | "week" | "all";

const STATUS_FILTERS = [
  { label: "All Status", value: "ALL" },
  { label: "Preparing", value: "PREPARING" },
  { label: "Ready", value: "READY" },
  { label: "Served", value: "SERVED" },
  { label: "Paid", value: "PAID" },
] as const;

export function HistoryClient({ history: initialHistory }: Readonly<{ history: HistoryOrder[] }>) {
  const [history, setHistory] = useState<HistoryOrder[]>(initialHistory || []);
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch orders based on selected time range and status
  const fetchHistory = async (range: TimeRange, status = statusFilter) => {
    setIsLoading(true);
    try {
      // 1. Try REST API first
      const res = await fetch(`/api/kitchen/history?timeRange=${range}&status=${status}`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
        return;
      }

      // 2. Fallback to Server Action
      const actionRes = await getKitchenHistoryAction(range);
      if (actionRes.success && actionRes.data) {
        setHistory(actionRes.data as unknown as HistoryOrder[]);
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load if initialHistory is not provided
  useEffect(() => {
    if (initialHistory && initialHistory.length > 0) {
      return;
    }

    let ignore = false;

    async function loadInitialHistory() {
      try {
        const res = await fetch(`/api/kitchen/history?timeRange=all&status=ALL`);
        if (res.ok) {
          const data = await res.json();
          if (!ignore) {
            setHistory(data);
          }
          return;
        }

        const actionRes = await getKitchenHistoryAction("all");
        if (actionRes.success && actionRes.data && !ignore) {
          setHistory(actionRes.data as unknown as HistoryOrder[]);
        }
      } catch (err) {
        if (!ignore) {
          console.error("Failed to load history:", err);
        }
      }
    }

    void loadInitialHistory();

    return () => {
      ignore = true;
    };
  }, [initialHistory]);

  const handleTimeRangeChange = async (newRange: TimeRange) => {
    setTimeRange(newRange);
    setCurrentPage(1);
    await fetchHistory(newRange, statusFilter);
  };

  const handleStatusFilterChange = async (newStatus: string) => {
    setStatusFilter(newStatus);
    setCurrentPage(1);
    await fetchHistory(timeRange, newStatus);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  // Filter orders by search term
  const filteredHistory = useMemo(() => {
    let result = history;

    // Filter by status if not "ALL"
    if (statusFilter !== "ALL") {
      result = result.filter((o) => o.status === statusFilter);
    }

    const q = search.toLowerCase().trim();
    if (!q) return result;

    return result.filter(
      (o) =>
        o.orderNumber?.toLowerCase().includes(q) ||
        o.table?.tableNumber?.toString().toLowerCase().includes(q) ||
        o.customerName?.toLowerCase().includes(q) ||
        o.notes?.toLowerCase().includes(q) ||
        o.items?.some((item) => item.product?.name?.toLowerCase().includes(q))
    );
  }, [history, statusFilter, search]);

  // Pagination calculation
  const totalItems = filteredHistory.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedOrders = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredHistory.slice(start, start + pageSize);
  }, [filteredHistory, safeCurrentPage, pageSize]);

  const startItemNumber = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endItemNumber = Math.min(safeCurrentPage * pageSize, totalItems);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safeCurrentPage > 3) pages.push("dots-prev");
      const start = Math.max(2, safeCurrentPage - 1);
      const end = Math.min(totalPages - 1, safeCurrentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (safeCurrentPage < totalPages - 2) pages.push("dots-next");
      pages.push(totalPages);
    }
    return pages;
  };

  const renderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "PREPARING":
        return (
          <Badge className="bg-amber-100 text-amber-900 border-amber-300 shadow-none text-[10px] font-bold uppercase tracking-wider">
            Preparing
          </Badge>
        );
      case "READY":
        return (
          <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 shadow-none text-[10px] font-bold uppercase tracking-wider">
            Ready
          </Badge>
        );
      case "SERVED":
        return (
          <Badge className="bg-purple-100 text-purple-900 border-purple-300 shadow-none text-[10px] font-bold uppercase tracking-wider">
            Served
          </Badge>
        );
      case "PAID":
        return (
          <Badge className="bg-emerald-600 text-white border-emerald-700 shadow-none text-[10px] font-bold uppercase tracking-wider">
            Paid
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge className="bg-rose-100 text-rose-900 border-rose-300 shadow-none text-[10px] font-bold uppercase tracking-wider">
            Cancelled
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-culinary-border/40 font-sans space-y-6">
      {/* Top Header Controls: Search, Time Filter Tabs, and Refresh */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        {/* Search Bar */}
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
          <input
            type="text"
            placeholder="Search order #, table, item, customer..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-culinary-primary/20 bg-gray-50/60 focus:bg-white transition-all text-gray-800"
          />
          {search && (
            <button type="button"
              onClick={() => handleSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 bg-gray-200 rounded-full w-4 h-4 flex items-center justify-center"
            >
              ✕
            </button>
          )}
        </div>

        {/* Time Filter Pills & Summary Counter */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
          {/* Time range buttons */}
          <div className="flex items-center gap-1 bg-gray-100/90 p-1 rounded-xl border border-gray-200">
            <button
              type="button"
              onClick={() => handleTimeRangeChange("today")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${timeRange === "today"
                ? "bg-white text-culinary-primary shadow-sm font-bold"
                : "text-gray-600 hover:text-gray-900"
                }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => handleTimeRangeChange("week")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${timeRange === "week"
                ? "bg-white text-culinary-primary shadow-sm font-bold"
                : "text-gray-600 hover:text-gray-900"
                }`}
            >
              Last 7 Days
            </button>
            <button
              type="button"
              onClick={() => handleTimeRangeChange("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${timeRange === "all"
                ? "bg-white text-culinary-primary shadow-sm font-bold"
                : "text-gray-600 hover:text-gray-900"
                }`}
            >
              All History
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchHistory(timeRange, statusFilter)}
            disabled={isLoading}
            className="text-xs h-9 gap-1.5 border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl"
          >
            <RotateCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-culinary-primary" : ""}`} />
            Refresh
          </Button>

          {/* Badge Counter */}
          <div className="bg-emerald-50 text-emerald-700 px-3.5 py-2 rounded-xl flex items-center gap-2 border border-emerald-200 text-xs font-bold shadow-2xs">
            <CheckCircle2 size={15} />
            <span>{history.length} Orders in History</span>
          </div>
        </div>
      </div>

      {/* Status Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin pt-1">
        <span className="text-xs font-semibold text-gray-400 flex items-center gap-1 mr-1 shrink-0 uppercase tracking-wider text-[11px]">
          <Filter className="h-3 w-3" /> Status:
        </span>
        {STATUS_FILTERS.map((s) => {
          const isSelected = statusFilter === s.value;
          return (
            <button type="button"
              key={s.value}
              onClick={() => handleStatusFilterChange(s.value)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all whitespace-nowrap ${isSelected
                ? "bg-culinary-primary text-white shadow-sm font-bold"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200/80"
                }`}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Cards Grid */}
      <div className="space-y-6">
        {paginatedOrders.length === 0 ? (
          <div className="text-center py-16 text-gray-500 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
            <HistoryIcon size={44} className="mx-auto mb-3 text-gray-300" />
            <p className="font-cormorant text-2xl font-bold text-gray-800">No orders found in history.</p>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              {search || statusFilter !== "ALL"
                ? "Try adjusting your search terms or selecting 'All Status' / 'All History'."
                : "Completed and served kitchen orders will appear here automatically."}
            </p>
            {(search || statusFilter !== "ALL" || timeRange !== "all") && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4 text-xs rounded-xl"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("ALL");
                  setTimeRange("all");
                  setCurrentPage(1);
                  void fetchHistory("all", "ALL");
                }}
              >
                Reset All Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginatedOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Card Header */}
                  <div className="flex justify-between items-start mb-3.5 pb-3 border-b border-gray-100">
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
                        {format(new Date(order.createdAt), "hh:mm a")}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {format(new Date(order.createdAt), "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>

                  {/* Customer Info */}
                  {order.customerName && (
                    <div className="mb-3 flex items-center gap-1.5 text-xs text-gray-700 bg-gray-50/60 p-2 rounded-lg border border-gray-100">
                      <User size={13} className="text-gray-400 shrink-0" />
                      <span className="font-semibold text-gray-800">{order.customerName}</span>
                      {order.customerPhone && (
                        <span className="text-gray-400 text-[11px]">({order.customerPhone})</span>
                      )}
                    </div>
                  )}

                  {/* Items List */}
                  <div className="space-y-2 mb-3">
                    {order.items?.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between text-sm text-gray-800 items-center bg-gray-50/70 p-2 rounded-lg border border-gray-100"
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <span className="font-bold text-white bg-culinary-primary w-5 h-5 rounded flex items-center justify-center text-[10px] shrink-0 shadow-2xs">
                            {item.quantity}
                          </span>
                          <span className="font-medium text-xs text-gray-800 truncate">{item.product?.name}</span>
                        </div>
                        {item.totalPrice && (
                          <span className="text-[11px] font-semibold text-gray-500 shrink-0">
                            ₹{Number(item.totalPrice).toFixed(2)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Order Notes */}
                  {order.notes && (
                    <div className="mb-3 p-2.5 bg-amber-50/80 border border-amber-200/60 rounded-lg text-xs text-amber-800 italic">
                      <span className="font-bold not-italic mr-1">📝 Note:</span>
                      {order.notes}
                    </div>
                  )}
                </div>

                {/* Bottom Card Footer */}
                <div className="pt-3 border-t border-gray-100 flex justify-between items-center text-xs">
                  {order.totalAmount ? (
                    <span className="font-bold text-sm text-gray-900 font-cormorant">
                      ₹{Number(order.totalAmount).toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-[11px]">Kitchen Ticket</span>
                  )}
                  <div>{renderStatusBadge(order.status)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Interactive Pagination Footer */}
      {filteredHistory.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200 bg-gray-50/60 p-4 rounded-xl">
          {/* Rows per page & Count display */}
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <span className="font-medium">Cards per page:</span>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-culinary-primary/30"
              >
                <option value={6}>6</option>
                <option value={9}>9</option>
                <option value={12}>12</option>
                <option value={18}>18</option>
                <option value={24}>24</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div>
              Showing <span className="font-semibold text-gray-800">{startItemNumber}</span> to{" "}
              <span className="font-semibold text-gray-800">{endItemNumber}</span> of{" "}
              <span className="font-semibold text-gray-800">{totalItems}</span> orders
            </div>
          </div>

          {/* Pagination Navigation */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 p-0"
              onClick={() => setCurrentPage(1)}
              disabled={safeCurrentPage === 1}
              title="First Page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 p-0"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safeCurrentPage === 1}
              title="Previous Page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-1 mx-1">
              {getPageNumbers().map((p) => {
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
                    key={`p-${p}`}
                    onClick={() => setCurrentPage(p)}
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
              className="h-8 w-8 p-0"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage === totalPages}
              title="Next Page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 p-0"
              onClick={() => setCurrentPage(totalPages)}
              disabled={safeCurrentPage === totalPages}
              title="Last Page"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
