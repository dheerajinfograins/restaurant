"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Utensils,
  Search,
  X,
  Armchair,
  ArrowUpDown,
  Download,
  LayoutGrid,
  ListFilter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

export interface TablePerformanceItem {
  name: string;
  orderCount: number;
  revenue: number;
}

interface AllTablesTurnoverModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly tables: TablePerformanceItem[];
}

type SortOption = "REVENUE_DESC" | "ORDERS_DESC" | "AVG_TICKET_DESC" | "NAME_ASC";
type ViewMode = "GRID" | "TABLE";
type QuickFilter = "ALL" | "TOP_EARNERS" | "HIGH_ORDERS";

export function AllTablesTurnoverModal({
  isOpen,
  onClose,
  tables = [],
}: Readonly<AllTablesTurnoverModalProps>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("REVENUE_DESC");
  const [viewMode, setViewMode] = useState<ViewMode>("GRID");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);

  // Keyboard shortcut (Escape to close)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Summary Metrics
  const totalRevenue = useMemo(
    () => tables.reduce((sum, t) => sum + (t.revenue || 0), 0),
    [tables]
  );
  const totalOrders = useMemo(
    () => tables.reduce((sum, t) => sum + (t.orderCount || 0), 0),
    [tables]
  );
  const overallAvgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Filtered and Sorted Tables
  const filteredAndSortedTables = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    let result = tables.filter((t) => !q || t.name.toLowerCase().includes(q));

    // Quick Filters
    if (quickFilter === "TOP_EARNERS") {
      result = result.filter((t) => t.revenue >= 1000);
    } else if (quickFilter === "HIGH_ORDERS") {
      result = result.filter((t) => t.orderCount >= 3);
    }

    result = [...result].sort((a, b) => {
      const avgA = a.orderCount > 0 ? a.revenue / a.orderCount : 0;
      const avgB = b.orderCount > 0 ? b.revenue / b.orderCount : 0;
      switch (sortBy) {
        case "REVENUE_DESC":
          return b.revenue - a.revenue;
        case "ORDERS_DESC":
          return b.orderCount - a.orderCount;
        case "AVG_TICKET_DESC":
          return avgB - avgA;
        case "NAME_ASC":
          return a.name.localeCompare(b.name, undefined, { numeric: true });
        default:
          return 0;
      }
    });

    return result;
  }, [tables, searchQuery, quickFilter, sortBy]);

  // Pagination Math
  const totalItems = filteredAndSortedTables.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedTables = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredAndSortedTables.slice(start, start + pageSize);
  }, [filteredAndSortedTables, safeCurrentPage, pageSize]);

  // Export to CSV Function
  const handleExportCSV = () => {
    if (tables.length === 0) {
      toast.error("No table performance data to export");
      return;
    }

    const headers = ["Rank", "Table Name", "Orders Count", "Total Revenue (INR)", "Average Ticket (INR)", "Revenue Share (%)"];
    const rows = filteredAndSortedTables.map((t, idx) => {
      const avg = t.orderCount > 0 ? (t.revenue / t.orderCount).toFixed(2) : "0.00";
      const share = totalRevenue > 0 ? ((t.revenue / totalRevenue) * 100).toFixed(2) : "0.00";
      return [idx + 1, `"${t.name}"`, t.orderCount, t.revenue.toFixed(2), avg, `${share}%`];
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `table_turnover_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();

    toast.success("Table turnover data exported to CSV! 📊");
  };

  if (!isOpen) return null;

  const renderContent = () => {
    if (paginatedTables.length === 0) {
      return (
        <div className="py-16 text-center text-gray-400 space-y-2">
          <Armchair size={40} className="mx-auto text-gray-300" />
          <p className="text-sm font-semibold">No dining tables match &ldquo;{searchQuery}&rdquo;</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setQuickFilter("ALL");
            }}
            className="text-xs text-emerald-700 font-bold hover:underline"
          >
            Reset all filters
          </button>
        </div>
      );
    }

    if (viewMode === "GRID") {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedTables.map((table, idx) => {
            const globalIndex = (safeCurrentPage - 1) * pageSize + idx;
            const avgTicket = table.orderCount > 0 ? table.revenue / table.orderCount : 0;
            const revenueShare = totalRevenue > 0 ? (table.revenue / totalRevenue) * 100 : 0;

            // Rank medal styling
            let rankBadge = (
              <span className="w-6 h-6 rounded-lg bg-gray-100 text-gray-700 font-mono text-[11px] font-bold flex items-center justify-center">
                #{globalIndex + 1}
              </span>
            );

            if (globalIndex === 0 && sortBy === "REVENUE_DESC") {
              rankBadge = (
                <span className="px-2 py-0.5 rounded-lg bg-amber-400/20 text-amber-900 border border-amber-300 font-bold text-[10px] flex items-center gap-1 shadow-2xs">
                  🥇 #1 Top Earner
                </span>
              );
            } else if (globalIndex === 1 && sortBy === "REVENUE_DESC") {
              rankBadge = (
                <span className="px-2 py-0.5 rounded-lg bg-slate-200 text-slate-800 border border-slate-300 font-bold text-[10px] flex items-center gap-1">
                  🥈 #2
                </span>
              );
            } else if (globalIndex === 2 && sortBy === "REVENUE_DESC") {
              rankBadge = (
                <span className="px-2 py-0.5 rounded-lg bg-amber-700/15 text-amber-900 border border-amber-600/30 font-bold text-[10px] flex items-center gap-1">
                  🥉 #3
                </span>
              );
            }

            return (
              <div
                key={table.name}
                className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/90 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all space-y-3 relative overflow-hidden flex flex-col justify-between"
              >
                {/* Header */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      {rankBadge}
                      <span className="font-bold text-lg font-cormorant text-gray-900">
                        {table.name}
                      </span>
                    </div>
                    <Badge variant="outline" className="bg-amber-50 text-amber-900 border-amber-200 text-[11px] font-bold">
                      {table.orderCount} Orders
                    </Badge>
                  </div>

                  {/* Numbers Grid */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold">
                        Total Revenue
                      </span>
                      <span className="font-extrabold text-base sm:text-lg text-gray-900">
                        ₹{table.revenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold">
                        Avg Spend
                      </span>
                      <span className="font-bold text-sm text-emerald-700">
                        ₹{avgTicket.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress Bar (Revenue Share) */}
                <div className="space-y-1 pt-2 border-t border-gray-50">
                  <div className="flex items-center justify-between text-[10px] text-gray-400 font-semibold">
                    <span>Revenue Contribution</span>
                    <span className="font-bold text-gray-700">{revenueShare.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full"
                      style={{ width: `${Math.min(100, Math.max(3, revenueShare))}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    return (
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-200/80 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Dining Table</th>
                <th className="py-3 px-4 text-center">Orders Count</th>
                <th className="py-3 px-4 text-right">Avg Ticket</th>
                <th className="py-3 px-4 text-right">Sales Share</th>
                <th className="py-3 px-4 text-right">Total Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedTables.map((table, idx) => {
                const globalIndex = (safeCurrentPage - 1) * pageSize + idx;
                const avgTicket = table.orderCount > 0 ? table.revenue / table.orderCount : 0;
                const revenueShare = totalRevenue > 0 ? (table.revenue / totalRevenue) * 100 : 0;

                return (
                  <tr key={table.name} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-gray-500">
                      #{globalIndex + 1}
                    </td>
                    <td className="py-3 px-4 font-bold text-sm font-cormorant text-gray-900">
                      {table.name}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 font-semibold text-[10px]">
                        {table.orderCount} Orders
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-700">
                      ₹{avgTicket.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-emerald-700">
                      {revenueShare.toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-gray-900 text-sm">
                      ₹{table.revenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-md animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog Modal */}
      <dialog
        open
        aria-labelledby="all-tables-turnover-title"
        className="relative z-10 w-full max-w-6xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-gray-200/90 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 p-0 m-0"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-emerald-50/60 via-white to-amber-50/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-900/10 shrink-0">
              <Utensils size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2
                  id="all-tables-turnover-title"
                  className="text-2xl sm:text-3xl font-bold font-cormorant text-gray-900 leading-tight"
                >
                  Table Turnover & Revenue Performance
                </h2>
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 font-bold text-xs">
                  {tables.length} Total Tables
                </Badge>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Complete sales volume, turnover frequency, and customer spend per dining table
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold shadow-2xs transition-all"
              title="Download CSV Report"
            >
              <Download size={14} className="text-emerald-600" />
              <span>Export CSV</span>
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200/80">
              <button
                type="button"
                onClick={() => setViewMode("GRID")}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === "GRID" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-800"
                  }`}
                title="Grid Cards View"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("TABLE")}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === "TABLE" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-800"
                  }`}
                title="Detailed Table View"
              >
                <ListFilter size={15} />
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="text-gray-400 hover:text-gray-700 p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Top Summary KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 sm:px-6 bg-gray-50/80 border-b border-gray-100 text-center">
          <div className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-2xs">
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Active Tables</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{tables.length} <span className="text-xs font-normal text-gray-500">Tables</span></p>
          </div>
          <div className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-2xs">
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total Sales Generated</p>
            <p className="text-xl font-bold text-emerald-700 mt-0.5">₹{totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-2xs">
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total Served Orders</p>
            <p className="text-xl font-bold text-amber-800 mt-0.5">{totalOrders} <span className="text-xs font-normal text-gray-500">Orders</span></p>
          </div>
          <div className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-2xs">
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Avg Spend / Table</p>
            <p className="text-xl font-bold text-purple-700 mt-0.5">₹{overallAvgTicket.toFixed(2)}</p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-4 sm:px-6 border-b border-gray-100 flex flex-col md:flex-row items-center justify-between gap-3 bg-white">
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <Input
                type="text"
                placeholder="Search table (e.g. Table 1)..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 pr-4 py-2 bg-gray-50 border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white transition-all h-9"
              />
            </div>

            {/* Quick Filter Buttons */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setQuickFilter("ALL");
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${quickFilter === "ALL" ? "bg-white text-gray-900 shadow-2xs" : "text-gray-600 hover:text-gray-900"
                  }`}
              >
                All ({tables.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setQuickFilter("TOP_EARNERS");
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${quickFilter === "TOP_EARNERS" ? "bg-white text-emerald-800 shadow-2xs" : "text-gray-600 hover:text-gray-900"
                  }`}
              >
                High Revenue (≥₹1k)
              </button>
              <button
                type="button"
                onClick={() => {
                  setQuickFilter("HIGH_ORDERS");
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${quickFilter === "HIGH_ORDERS" ? "bg-white text-amber-800 shadow-2xs" : "text-gray-600 hover:text-gray-900"
                  }`}
              >
                Frequent (≥3 Orders)
              </button>
            </div>
          </div>

          {/* Sort Selector & Page Size */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end overflow-x-auto">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <ArrowUpDown size={12} /> Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as SortOption);
                setCurrentPage(1);
              }}
              className="h-9 px-2.5 bg-gray-50 border border-gray-200 text-xs font-bold text-gray-800 rounded-xl focus:bg-white transition-all outline-none cursor-pointer"
            >
              <option value="REVENUE_DESC">💰 Highest Revenue</option>
              <option value="ORDERS_DESC">📦 Most Orders</option>
              <option value="AVG_TICKET_DESC">🏷️ Highest Avg Ticket</option>
              <option value="NAME_ASC">🔢 Table Number</option>
            </select>

            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="h-9 px-2 bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-600 rounded-xl outline-none cursor-pointer"
            >
              <option value="6">6 / page</option>
              <option value="9">9 / page</option>
              <option value="12">12 / page</option>
              <option value="18">18 / page</option>
            </select>
          </div>
        </div>

        {/* Scrollable Content (Grid or Table) */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-gray-50/50">
          {renderContent()}
        </div>

        {/* Footer with Pagination Controls */}
        <div className="p-4 sm:px-6 bg-white border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <div>
            Showing{" "}
            <strong>
              {totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1} -{" "}
              {Math.min(safeCurrentPage * pageSize, totalItems)}
            </strong>{" "}
            of <strong>{totalItems}</strong> tables
          </div>

          {/* Pagination Navigation */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1}
                className="px-2.5 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed font-bold flex items-center gap-1 transition-all"
              >
                <ChevronLeft size={14} />
                <span>Prev</span>
              </button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 rounded-xl text-xs font-bold transition-all ${safeCurrentPage === pageNum
                      ? "bg-emerald-600 text-white shadow-2xs"
                      : "text-gray-600 hover:bg-gray-100"
                      }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage === totalPages}
                className="px-2.5 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed font-bold flex items-center gap-1 transition-all"
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </dialog>
    </div>
  );
}
