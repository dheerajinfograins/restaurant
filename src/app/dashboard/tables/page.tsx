"use client";

import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { 
  Plus, 
  Search, 
  RotateCw, 
  Utensils, 
  Users, 
  CheckCircle2, 
  Clock, 
  LayoutGrid, 
  List, 
  QrCode,
  Filter,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight
} from "lucide-react";
import { RestaurantTable } from "@prisma/client";

import { Button } from "@/components/ui/button";
import TableList from "@/components/table/table-list";
import TableFormModal from "@/components/table/table-form-modal";
import DeleteTableDialog from "@/components/table/delete-table-dialog";
import TableQrModal from "@/components/table/table-qr-modal";

const FILTER_TABS = [
  { label: "All Tables", value: "ALL" },
  { label: "Available", value: "AVAILABLE" },
  { label: "Occupied", value: "OCCUPIED" },
  { label: "Reserved", value: "RESERVED" },
] as const;

export default function TablesPage() {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // View Mode: Cards Grid vs Table List
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(9);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTables = async (showIndicator = false) => {
    if (showIndicator) setIsRefreshing(true);
    try {
      const res = await axios.get("/api/tables");
      if (res.data.success) {
        setTables(res.data.data);
      }
    } catch (error) {
      toast.error("Failed to load tables");
      console.error(error);
    } finally {
      setIsLoading(false);
      if (showIndicator) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchTables();
  }, []);

  const handleAddClick = () => {
    setSelectedTable(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (table: RestaurantTable) => {
    setSelectedTable(table);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (table: RestaurantTable) => {
    setSelectedTable(table);
    setIsDeleteOpen(true);
  };

  const handleViewQrClick = (table: RestaurantTable) => {
    setSelectedTable(table);
    setIsQrModalOpen(true);
  };

  const handleStatusChange = async (tableId: string, newStatus: "AVAILABLE" | "OCCUPIED" | "RESERVED") => {
    try {
      await axios.put(`/api/tables/${tableId}`, { status: newStatus });
      setTables((prev) =>
        prev.map((t) => (t.id === tableId ? { ...t, status: newStatus } : t))
      );
      toast.success(`Table status updated to ${newStatus.toLowerCase()}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  const handleFormSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      if (selectedTable) {
        await axios.put(`/api/tables/${selectedTable.id}`, values);
        toast.success("Table updated successfully");
      } else {
        await axios.post("/api/tables", values);
        toast.success("Table created successfully");
      }
      setIsFormOpen(false);
      await fetchTables();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTable) return;
    setIsSubmitting(true);
    try {
      await axios.delete(`/api/tables/${selectedTable.id}`);
      toast.success("Table deleted successfully");
      setIsDeleteOpen(false);
      setSelectedTable(null);
      await fetchTables();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete table");
    } finally {
      setIsSubmitting(false);
    }
  };

  // KPI Calculations
  const kpis = useMemo(() => {
    const totalTables = tables.length;
    const totalCapacity = tables.reduce((sum, t) => sum + (Number(t.capacity) || 0), 0);
    const available = tables.filter((t) => t.status === "AVAILABLE").length;
    const occupied = tables.filter((t) => t.status === "OCCUPIED").length;
    const reserved = tables.filter((t) => t.status === "RESERVED").length;

    return {
      totalTables,
      totalCapacity,
      available,
      occupied,
      reserved,
    };
  }, [tables]);

  // Filter Counts
  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: tables.length };
    tables.forEach((t) => {
      counts[t.status] = (counts[t.status] || 0) + 1;
    });
    return counts;
  }, [tables]);

  // Filtered list
  const filteredTables = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return tables.filter((table) => {
      let matchesStatus = true;
      if (statusFilter !== "ALL") {
        matchesStatus = table.status === statusFilter;
      }
      if (!matchesStatus) return false;

      if (!q) return true;
      return (
        table.tableNumber.toLowerCase().includes(q) ||
        String(table.capacity).includes(q) ||
        table.id.toLowerCase().includes(q)
      );
    });
  }, [tables, statusFilter, searchQuery]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery, pageSize]);

  // Pagination calculation
  const totalItems = filteredTables.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedTables = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredTables.slice(start, start + pageSize);
  }, [filteredTables, safeCurrentPage, pageSize]);

  const startItemNumber = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endItemNumber = Math.min(safeCurrentPage * pageSize, totalItems);

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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-3 bg-white rounded-3xl border border-gray-100 shadow-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-culinary-primary border-t-transparent"></div>
        <p className="text-sm font-semibold text-gray-500">Loading restaurant dining tables...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans pb-16">
      
      {/* Top Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 font-cormorant">
          Dining Tables & QR Menus
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Manage restaurant seating capacity, table floor statuses, and instant contactless QR ordering codes.
        </p>
      </div>

      {/* Top 4 KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tables */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Tables</p>
            <p className="text-3xl font-bold text-gray-900">{kpis.totalTables}</p>
            <p className="text-[11px] text-gray-500 font-medium">Registered dining stations</p>
          </div>
          <div className="p-3.5 bg-amber-50 text-culinary-primary rounded-2xl border border-amber-100">
            <Utensils size={24} />
          </div>
        </div>

        {/* Total Seating Capacity */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Seating</p>
            <p className="text-3xl font-bold text-blue-700">{kpis.totalCapacity} <span className="text-sm font-normal text-gray-400">Covers</span></p>
            <p className="text-[11px] text-blue-600 font-semibold flex items-center gap-1">
              <Users size={12} /> Total guest seating capacity
            </p>
          </div>
          <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
            <Users size={24} />
          </div>
        </div>

        {/* Available Now */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Available Now</p>
            <p className="text-3xl font-bold text-emerald-700">{kpis.available}</p>
            <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 size={12} /> Ready for walk-in guests
            </p>
          </div>
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
            <CheckCircle2 size={24} />
          </div>
        </div>

        {/* Occupied / Reserved */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Occupied & Reserved</p>
            <p className="text-3xl font-bold text-purple-700">{kpis.occupied + kpis.reserved}</p>
            <p className="text-[11px] text-gray-400 font-medium">
              {kpis.occupied} Dining · {kpis.reserved} Reserved
            </p>
          </div>
          <div className="p-3.5 bg-purple-50 text-purple-600 rounded-2xl border border-purple-100">
            <Clock size={24} />
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-culinary-border/40 overflow-hidden">
        
        {/* Top Control Bar */}
        <div className="p-5 border-b border-gray-100 space-y-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            
            {/* Search Input */}
            <div className="relative w-full lg:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
              <input
                type="text"
                placeholder="Search tables by number, capacity..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-culinary-primary/20 focus:border-culinary-primary transition-all placeholder:text-gray-400 text-gray-800"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 bg-gray-200/80 rounded-full w-4 h-4 flex items-center justify-center"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Right Controls: View Mode, Refresh & Add Table */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
              {/* Cards vs Table Switcher */}
              <div className="flex items-center bg-gray-100/90 p-1 rounded-xl border border-gray-200/80">
                <button
                  type="button"
                  onClick={() => setViewMode("cards")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    viewMode === "cards"
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    viewMode === "table"
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
                onClick={() => fetchTables(true)}
                disabled={isRefreshing}
                className="text-xs h-9 gap-1.5 border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-xl shadow-none"
              >
                <RotateCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-culinary-primary" : ""}`} />
                Refresh
              </Button>

              {/* Add Table Button */}
              <Button
                size="sm"
                onClick={handleAddClick}
                className="bg-culinary-primary hover:bg-culinary-primary/90 text-white font-bold h-9 px-4 rounded-xl shadow-sm text-xs gap-1.5"
              >
                <Plus size={15} /> Add Dining Table
              </Button>
            </div>
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin pt-2">
            <span className="text-xs font-semibold text-gray-400 flex items-center gap-1 mr-1 shrink-0 uppercase tracking-wider text-[11px]">
              <Filter className="h-3 w-3" /> Status:
            </span>
            {FILTER_TABS.map((tab) => {
              const count = filterCounts[tab.value] || 0;
              const isSelected = statusFilter === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => setStatusFilter(tab.value)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-culinary-primary text-white shadow-sm font-semibold"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200/70"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected ? "bg-white/20 text-white" : "bg-white text-gray-600 border border-gray-200"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content View: Cards Grid vs Table View */}
        <div className="p-6">
          <TableList
            tables={paginatedTables}
            viewMode={viewMode}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
            onViewQr={handleViewQrClick}
            onStatusChange={handleStatusChange}
          />
        </div>

        {/* Integrated Pagination Footer */}
        {filteredTables.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <span className="font-medium">Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-culinary-primary/30"
                >
                  <option value={6}>6</option>
                  <option value={9}>9</option>
                  <option value={12}>12</option>
                  <option value={24}>24</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div>
                Showing <span className="font-semibold text-gray-800">{startItemNumber}</span> to{" "}
                <span className="font-semibold text-gray-800">{endItemNumber}</span> of{" "}
                <span className="font-semibold text-gray-800">{totalItems}</span> dining tables
              </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 p-0 rounded-lg border-gray-200 bg-white"
                onClick={() => setCurrentPage(1)}
                disabled={safeCurrentPage === 1}
                title="First Page"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 p-0 rounded-lg border-gray-200 bg-white"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1}
                title="Previous Page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

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
                      key={`page-${pageNum}`}
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
                className="h-8 w-8 p-0 rounded-lg border-gray-200 bg-white"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage === totalPages}
                title="Next Page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 p-0 rounded-lg border-gray-200 bg-white"
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

      {/* Modals & Drawers */}
      <TableFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={selectedTable}
        isLoading={isSubmitting}
      />

      <DeleteTableDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        tableNumber={selectedTable?.tableNumber || ""}
        isDeleting={isSubmitting}
      />

      <TableQrModal
        table={selectedTable}
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
      />
    </div>
  );
}
