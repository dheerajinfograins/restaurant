"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useSocket } from "@/components/providers/socket-provider";
import toast from "react-hot-toast";
import {
  Armchair,
  Clock,
  RotateCw,
  Search,
  CheckCircle2,
  Users,
  Eye,
  Flame
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";
import { formatDistanceToNow } from "date-fns";

type TableData = {
  id: string;
  tableNumber: string;
  capacity: number;
  status: string;
  dynamicStatus: string;
  activeOrder?: {
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
    itemsCount: number;
    itemsSummary: string;
    createdAt: string;
  } | null;
};

export default function WaiterTablesPage() {
  const { socket } = useSocket();
  const [tables, setTables] = useState<TableData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("ALL");
  const [selectedTable, setSelectedTable] = useState<TableData | null>(null);
  const [servingOrderId, setServingOrderId] = useState<string | null>(null);

  const fetchTables = useCallback(async () => {
    try {
      const res = await fetch(`/api/waiter/tables?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setTables(data);
      }
    } catch (error) {
      console.error("Failed to fetch tables:", error);
      toast.error("Failed to load tables");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadInitialTables() {
      try {
        const res = await fetch(`/api/waiter/tables?t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          if (!ignore) {
            setTables(data);
          }
        }
      } catch (error) {
        if (!ignore) {
          console.error("Failed to fetch tables:", error);
          toast.error("Failed to load tables");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void loadInitialTables();

    return () => {
      ignore = true;
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchTables();
    setIsRefreshing(false);
  };

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      void fetchTables();
    };

    socket.on("order:ready", handleUpdate);
    socket.on("order:served", handleUpdate);
    socket.on("order:created", handleUpdate);
    socket.on("order:updated", handleUpdate);

    return () => {
      socket.off("order:ready", handleUpdate);
      socket.off("order:served", handleUpdate);
      socket.off("order:created", handleUpdate);
      socket.off("order:updated", handleUpdate);
    };
  }, [socket, fetchTables]);

  const handleServeOrder = async (orderId: string) => {
    setServingOrderId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "SERVED" }),
      });
      if (res.ok) {
        toast.success("Order served to table!");
        await fetchTables();
        setSelectedTable(null);
      } else {
        toast.error("Failed to serve order");
      }
    } catch (e) {
      toast.error("Error serving order");
    } finally {
      setServingOrderId(null);
    }
  };

  // KPIs
  const kpis = useMemo(() => {
    const total = tables.length;
    const ready = tables.filter((t) => t.dynamicStatus === "READY_TO_SERVE").length;
    const cooking = tables.filter((t) => t.dynamicStatus === "PREPARING").length;
    const dining = tables.filter((t) => t.dynamicStatus === "SERVED" || t.status === "OCCUPIED").length;
    const available = tables.filter((t) => t.dynamicStatus === "AVAILABLE").length;
    return { total, ready, cooking, dining, available };
  }, [tables]);

  const filteredTables = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return tables.filter((t) => {
      const matchesSearch = !q || t.tableNumber.toLowerCase().includes(q);
      let matchesFilter = true;
      if (selectedFilter === "READY") matchesFilter = t.dynamicStatus === "READY_TO_SERVE";
      else if (selectedFilter === "PREPARING") matchesFilter = t.dynamicStatus === "PREPARING";
      else if (selectedFilter === "ORDERING") matchesFilter = t.dynamicStatus === "ORDERING";
      else if (selectedFilter === "SERVED") matchesFilter = t.dynamicStatus === "SERVED";
      else if (selectedFilter === "AVAILABLE") matchesFilter = t.dynamicStatus === "AVAILABLE";

      return matchesSearch && matchesFilter;
    });
  }, [tables, searchQuery, selectedFilter]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 space-y-4 bg-white rounded-3xl border border-gray-100 shadow-sm">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-culinary-primary border-t-transparent"></div>
        <p className="text-sm font-semibold text-gray-500 animate-pulse">
          Loading floor seating map...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans pb-16 animate-in fade-in duration-500">

      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-amber-50 text-culinary-primary rounded-2xl border border-amber-100 shrink-0">
            <Armchair size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-cormorant text-gray-900">
                Floor Seating & Table Activity
              </h1>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-culinary-primary border border-amber-200">
                {tables.length} Total Tables
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Live status, dining progression, and food pass ready alerts per table
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="text-xs h-8 gap-1.5 border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-xl shadow-none font-bold"
        >
          <RotateCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-culinary-primary" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button type="button"
          onClick={() => setSelectedFilter("ALL")}
          className={`p-4 rounded-2xl border text-left transition-all ${selectedFilter === "ALL"
            ? "bg-amber-50 border-amber-300 shadow-sm"
            : "bg-white border-gray-200/80 hover:bg-gray-50"
            }`}
        >
          <p className="text-[10px] uppercase font-bold text-gray-400">All Tables</p>
          <p className="text-2xl font-bold text-gray-900 mt-0.5">{kpis.total}</p>
        </button>

        <button type="button"
          onClick={() => setSelectedFilter("READY")}
          className={`p-4 rounded-2xl border text-left transition-all ${selectedFilter === "READY"
            ? "bg-emerald-100/70 border-emerald-400 shadow-sm"
            : "bg-emerald-50/60 border-emerald-200 hover:bg-emerald-100/50"
            }`}
        >
          <p className="text-[10px] uppercase font-bold text-emerald-800 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> Food Ready
          </p>
          <p className="text-2xl font-bold text-emerald-700 mt-0.5">{kpis.ready}</p>
        </button>

        <button type="button"
          onClick={() => setSelectedFilter("PREPARING")}
          className={`p-4 rounded-2xl border text-left transition-all ${selectedFilter === "PREPARING"
            ? "bg-amber-100/70 border-amber-400 shadow-sm"
            : "bg-amber-50/60 border-amber-200 hover:bg-amber-100/50"
            }`}
        >
          <p className="text-[10px] uppercase font-bold text-amber-800">🍳 Cooking</p>
          <p className="text-2xl font-bold text-amber-700 mt-0.5">{kpis.cooking}</p>
        </button>

        <button type="button"
          onClick={() => setSelectedFilter("SERVED")}
          className={`p-4 rounded-2xl border text-left transition-all ${selectedFilter === "SERVED"
            ? "bg-purple-100/70 border-purple-400 shadow-sm"
            : "bg-purple-50/60 border-purple-200 hover:bg-purple-100/50"
            }`}
        >
          <p className="text-[10px] uppercase font-bold text-purple-800">🍽️ Dining</p>
          <p className="text-2xl font-bold text-purple-700 mt-0.5">{kpis.dining}</p>
        </button>

        <button
          onClick={() => setSelectedFilter("AVAILABLE")}
          className={`p-4 rounded-2xl border text-left transition-all ${selectedFilter === "AVAILABLE"
            ? "bg-gray-100 border-gray-400 shadow-sm"
            : "bg-gray-50 border-gray-200 hover:bg-gray-100"
            }`}
        >
          <p className="text-[10px] uppercase font-bold text-gray-500">⚪ Vacant / Clean</p>
          <p className="text-2xl font-bold text-gray-700 mt-0.5">{kpis.available}</p>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search table number (e.g. 1, 2, VIP)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-9 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-culinary-primary/20 focus:border-culinary-primary transition-all text-gray-800 placeholder:text-gray-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 bg-gray-200 rounded-full w-4 h-4 flex items-center justify-center"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredTables.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <Armchair size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="font-bold text-gray-800 text-sm">No tables match current filter.</p>
            <p className="text-xs text-gray-400 mt-0.5">Try resetting filter or search query.</p>
          </div>
        ) : (
          filteredTables.map((table) => {
            const isReady = table.dynamicStatus === "READY_TO_SERVE";
            const isCooking = table.dynamicStatus === "PREPARING";
            const isOrdering = table.dynamicStatus === "ORDERING";
            const isServed = table.dynamicStatus === "SERVED";
            const isVacant = table.dynamicStatus === "AVAILABLE";

            return (
              <div
                key={table.id}
                className={`bg-white rounded-2xl shadow-sm transition-all flex flex-col justify-between overflow-hidden border-2 ${isReady
                  ? "border-emerald-500 shadow-emerald-100 shadow-md ring-2 ring-emerald-400/30"
                  : isCooking
                    ? "border-amber-300 hover:border-amber-400"
                    : isServed
                      ? "border-purple-200 hover:border-purple-300"
                      : "border-gray-200/80 hover:border-gray-300"
                  }`}
              >
                {/* Top Card Header */}
                <div className={`p-4 border-b flex justify-between items-start ${isReady
                  ? "bg-emerald-50/80 border-emerald-100"
                  : isCooking
                    ? "bg-amber-50/60 border-amber-100"
                    : isServed
                      ? "bg-purple-50/60 border-purple-100"
                      : "bg-gray-50/60 border-gray-100"
                  }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-cormorant font-bold text-xl shadow-sm ${isReady
                      ? "bg-emerald-600 text-white"
                      : isCooking
                        ? "bg-amber-500 text-white"
                        : isServed
                          ? "bg-purple-600 text-white"
                          : "bg-gray-200 text-gray-700"
                      }`}>
                      T{table.tableNumber}
                    </div>

                    <div>
                      <h3 className="font-bold text-base font-cormorant text-gray-900">
                        Table {table.tableNumber}
                      </h3>
                      <p className="text-[11px] text-gray-500 flex items-center gap-1 font-medium">
                        <Users size={11} /> {table.capacity} Seats
                      </p>
                    </div>
                  </div>

                  {/* Status Tag */}
                  <div>
                    {isReady && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Food Ready
                      </span>
                    )}
                    {isCooking && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                        <Flame size={10} /> Cooking
                      </span>
                    )}
                    {isOrdering && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                        New Order
                      </span>
                    )}
                    {isServed && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
                        Dining
                      </span>
                    )}
                    {isVacant && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200">
                        Vacant
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 space-y-2 text-xs">
                  {table.activeOrder ? (
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-gray-500 text-[11px]">
                        <span className="font-mono font-semibold">#{table.activeOrder.orderNumber}</span>
                        <span className="font-bold text-gray-900">₹{table.activeOrder.totalAmount.toFixed(2)}</span>
                      </div>
                      <p className="text-gray-700 text-xs line-clamp-2 bg-gray-50 p-2 rounded-xl border border-gray-100">
                        {table.activeOrder.itemsSummary}
                      </p>
                      <p className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Clock size={10} /> Placed {formatDistanceToNow(new Date(table.activeOrder.createdAt))} ago
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-400 italic py-2 text-center text-xs">
                      Table is clear and ready for guests.
                    </p>
                  )}
                </div>

                {/* Card Action Footer */}
                <div className="p-3 border-t border-gray-100 bg-gray-50/50 flex gap-2">
                  {isReady && table.activeOrder ? (
                    <Button
                      size="sm"
                      onClick={() => handleServeOrder(table.activeOrder!.id)}
                      disabled={servingOrderId === table.activeOrder.id}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 rounded-xl"
                    >
                      <CheckCircle2 size={13} className="mr-1" />
                      {servingOrderId === table.activeOrder.id ? "Serving..." : "Serve Food"}
                    </Button>
                  ) : table.activeOrder ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTable(table)}
                      className="w-full text-xs h-8 rounded-xl border-gray-200 text-gray-700 hover:bg-white"
                    >
                      <Eye size={13} className="mr-1" /> View Ticket
                    </Button>
                  ) : (
                    <span className="w-full text-center text-[11px] font-semibold text-gray-400 py-1">
                      Available for Walk-in
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ===================== TABLE DETAILS RIGHT SHEET ===================== */}
      <Sheet open={!!selectedTable} onOpenChange={(open) => { if (!open) setSelectedTable(null); }}>
        <SheetContent side="right" className="w-[380px] sm:w-[480px] overflow-y-auto bg-white border-l border-gray-200 shadow-2xl p-0">
          {selectedTable && (
            <div className="p-6 space-y-6 text-xs">
              <SheetHeader className="border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white font-bold text-xl flex items-center justify-center font-cormorant shrink-0 shadow-sm">
                    T{selectedTable.tableNumber}
                  </div>
                  <div>
                    <SheetTitle className="text-2xl font-bold font-cormorant text-gray-900">
                      Table {selectedTable.tableNumber} Order Details
                    </SheetTitle>
                    <p className="text-xs text-gray-400">
                      Seating Capacity: {selectedTable.capacity} Persons
                    </p>
                  </div>
                </div>
              </SheetHeader>

              {selectedTable.activeOrder ? (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 font-medium">Order Number</span>
                      <span className="font-bold text-gray-900 font-mono">#{selectedTable.activeOrder.orderNumber}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 font-medium">Order Status</span>
                      <span className="font-bold px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800">
                        {selectedTable.activeOrder.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 font-medium">Total Bill</span>
                      <span className="font-bold text-sm text-gray-900">
                        ₹{selectedTable.activeOrder.totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="font-bold text-gray-900 uppercase tracking-wider text-[11px]">
                      Dishes Ordered
                    </p>
                    <div className="p-3 bg-gray-50/70 rounded-2xl border border-gray-200 text-gray-700 text-xs">
                      {selectedTable.activeOrder.itemsSummary}
                    </div>
                  </div>

                  {selectedTable.activeOrder.status === "READY" && (
                    <Button
                      onClick={() => handleServeOrder(selectedTable.activeOrder!.id)}
                      disabled={servingOrderId === selectedTable.activeOrder.id}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs py-2.5"
                    >
                      <CheckCircle2 size={14} className="mr-1" />
                      Mark Order as Served
                    </Button>
                  )}
                </div>
              ) : (
                <p className="text-center text-gray-400 py-8">No active orders for this table.</p>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

    </div>
  );
}
