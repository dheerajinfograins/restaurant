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
  UtensilsCrossed
} from "lucide-react";
import type { OrderStatus } from "@prisma/client";
import { format } from "date-fns";
import { getKitchenHistoryAction } from "@/modules/kitchen/controller";
import { Button } from "@/components/ui/button";

export interface HistoryOrder {
  id: string;
  orderNumber: string;
  customerName?: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  notes?: string | null;
  table: { tableNumber: string };
  items: Array<{
    id: string;
    quantity: number;
    product: { name: string; price?: number };
  }>;
}

export function HistoryClient({ history: initialHistory }: { history: HistoryOrder[] }) {
  const [history, setHistory] = useState<HistoryOrder[]>(initialHistory || []);
  const [timeRange, setTimeRange] = useState<"today" | "week" | "all">("today");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10); // Minimum 10 cards default as requested
  const [isLoading, setIsLoading] = useState(false);

  // Fetch orders based on selected time range
  const fetchHistory = async (range: "today" | "week" | "all") => {
    setIsLoading(true);
    try {
      const res = await getKitchenHistoryAction(range);
      if (res.success && res.data) {
        setHistory(res.data as unknown as HistoryOrder[]);
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimeRangeChange = async (newRange: "today" | "week" | "all") => {
    setTimeRange(newRange);
    setCurrentPage(1);
    await fetchHistory(newRange);
  };

  // Filter orders by search term
  const filteredHistory = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return history;
    return history.filter(
      (o) =>
        o.orderNumber?.toLowerCase().includes(q) ||
        o.table?.tableNumber?.toString().toLowerCase().includes(q) ||
        o.customerName?.toLowerCase().includes(q) ||
        o.notes?.toLowerCase().includes(q) ||
        o.items?.some((item) => item.product?.name?.toLowerCase().includes(q))
    );
  }, [history, search]);

  // Reset to page 1 when search or pageSize changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, pageSize]);

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

  // Generate pagination buttons
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safeCurrentPage > 3) pages.push("...");
      const start = Math.max(2, safeCurrentPage - 1);
      const end = Math.min(totalPages - 1, safeCurrentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (safeCurrentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-culinary-border/40 font-sans space-y-6">
      {/* Top Header Controls: Search, Time Filter Tabs, and Refresh */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        {/* Search Bar */}
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-culinary-muted" size={18} />
          <input
            type="text"
            placeholder="Search order #, table, item..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-8 py-2.5 text-sm border border-culinary-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-culinary-primary/20 transition-all bg-culinary-background/30"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full w-4 h-4 flex items-center justify-center"
            >
              ✕
            </button>
          )}
        </div>

        {/* Time Filter Pills & Summary Counter */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
          {/* Time range buttons */}
          <div className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-xl border border-gray-200">
            <button
              type="button"
              onClick={() => handleTimeRangeChange("today")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                timeRange === "today"
                  ? "bg-white text-culinary-primary shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => handleTimeRangeChange("week")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                timeRange === "week"
                  ? "bg-white text-culinary-primary shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Last 7 Days
            </button>
            <button
              type="button"
              onClick={() => handleTimeRangeChange("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                timeRange === "all"
                  ? "bg-white text-culinary-primary shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              All History
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchHistory(timeRange)}
            disabled={isLoading}
            className="text-xs h-9 gap-1.5 border-gray-300 hover:bg-gray-50"
          >
            <RotateCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-culinary-primary" : ""}`} />
            Refresh
          </Button>

          {/* Badge Counter */}
          <div className="bg-green-50 text-green-700 px-3.5 py-2 rounded-xl flex items-center gap-2 border border-green-100 text-xs font-bold shadow-sm">
            <CheckCircle2 size={16} />
            <span>{history.length} Orders Completed</span>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="space-y-6">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-20 text-culinary-muted bg-culinary-background/20 rounded-2xl border border-dashed border-culinary-border/50">
            <HistoryIcon size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-cormorant text-2xl font-semibold text-gray-700">No completed orders found.</p>
            <p className="text-xs text-gray-400 mt-1">
              {search
                ? "Try searching for a different order number or table."
                : "Completed and served orders for this period will appear here."}
            </p>
            {search && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4 text-xs"
                onClick={() => setSearch("")}
              >
                Clear Search
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginatedOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white border border-culinary-border/30 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Card Header */}
                  <div className="flex justify-between items-start mb-4 pb-3 border-b border-culinary-border/20">
                    <div>
                      <h3 className="font-bold text-2xl font-cormorant text-culinary-text">
                        Table {order.table?.tableNumber || "N/A"}
                      </h3>
                      <p className="text-xs text-culinary-muted font-medium uppercase tracking-wider mt-0.5">
                        {order.orderNumber}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600">
                        <Clock size={13} className="text-gray-400" />
                        {format(new Date(order.updatedAt), "hh:mm a")}
                      </span>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="space-y-2 mb-4">
                    {order.items?.map((item) => (
                      <div
                        key={item.id}
                        className="flex gap-2.5 text-sm text-gray-800 items-center bg-gray-50/60 p-2 rounded-lg border border-gray-100"
                      >
                        <span className="font-bold text-white bg-culinary-primary w-6 h-6 rounded flex items-center justify-center text-xs shrink-0 shadow-sm">
                          {item.quantity}
                        </span>
                        <span className="font-medium text-xs text-gray-700 truncate">{item.product?.name}</span>
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
                <div className="pt-3 border-t border-culinary-border/20 flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-medium">
                    Received: {format(new Date(order.createdAt), "hh:mm a")}
                  </span>
                  <span
                    className={`font-bold px-2.5 py-1 rounded-full uppercase tracking-wider text-[10px] ${
                      order.status === "READY"
                        ? "bg-green-100 text-green-800 border border-green-200"
                        : order.status === "PAID"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : "bg-purple-100 text-purple-800 border border-purple-200"
                    }`}
                  >
                    {order.status}
                  </span>
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
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-culinary-primary/30"
              >
                <option value={6}>6</option>
                <option value={9}>9</option>
                <option value={10}>10</option>
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

            {/* Page number buttons */}
            <div className="flex items-center gap-1 mx-1">
              {getPageNumbers().map((p, idx) => {
                if (p === "...") {
                  return (
                    <span key={`dots-${idx}`} className="px-2 text-xs text-gray-400">
                      ...
                    </span>
                  );
                }
                const pageNum = Number(p);
                const isCurrent = pageNum === safeCurrentPage;
                return (
                  <button
                    key={`p-${pageNum}`}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`h-8 min-w-[32px] px-2 text-xs font-semibold rounded-lg transition-all ${
                      isCurrent
                        ? "bg-culinary-primary text-white shadow-sm"
                        : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                    }`}
                  >
                    {pageNum}
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
