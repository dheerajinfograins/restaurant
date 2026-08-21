"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import { format, formatDistanceToNow } from "date-fns";
import {
  Armchair,
  ChefHat,
  Users,
  RotateCw,
  Search,
  CheckCircle2,
  Clock,
  IndianRupee,
  Sparkles,
  ShoppingBag,
  Bell,
  X,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useSocket } from "@/components/providers/socket-provider";
import { toast } from "react-hot-toast";
import { WaiterPerformanceSection } from "@/components/dashboard/waiters/WaiterPerformanceSection";
import { AdminWaiterAckModal, WaiterAckData } from "@/components/dashboard/waiters/AdminWaiterAckModal";

export type FloorTable = {
  id: string;
  tableNumber: string;
  capacity: number;
  status: string;
  dynamicStatus: string;
  activeOrder: {
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
    waiterId?: string | null;
    waiter?: { id: string; name: string } | null;
    itemsCount: number;
    itemsSummary: string;
    createdAt: string;
  } | null;
};

export type ReadyOrder = {
  id: string;
  orderNumber: string;
  customerName?: string | null;
  customerPhone?: string | null;
  totalAmount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  waiterId?: string | null;
  waiter?: { id: string; name: string; phone?: string | null } | null;
  table: { id: string; tableNumber: string; capacity: number };
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    product: { name: string; foodType?: string | null };
  }>;
};

export type FloorTab = "TABLES" | "PASS" | "WAITERS";
export type TableFilterType = "ALL" | "OCCUPIED" | "AVAILABLE" | "READY";

// ==========================================
// PURE HELPER FUNCTIONS
// ==========================================

function playChimeAudio() {
  try {
    const audioCtx = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.35);
  } catch {
    // Audio context might be restricted in some browsers
  }
}

function isTableOccupied(table: FloorTable): boolean {
  return Boolean(table.activeOrder) || table.status === "OCCUPIED";
}

function matchesTableFilter(table: FloorTable, query: string, filter: TableFilterType): boolean {
  const isOccupied = isTableOccupied(table);
  const isReady = table.dynamicStatus === "READY_TO_SERVE";

  if (filter === "OCCUPIED" && !isOccupied) return false;
  if (filter === "AVAILABLE" && isOccupied) return false;
  if (filter === "READY" && !isReady) return false;

  if (!query) return true;

  const q = query.toLowerCase().trim();
  const matchNumber = table.tableNumber.toLowerCase().includes(q);
  const matchWaiter = table.activeOrder?.waiter?.name?.toLowerCase().includes(q) ?? false;
  const matchOrder = table.activeOrder?.orderNumber?.toLowerCase().includes(q) ?? false;

  return matchNumber || matchWaiter || matchOrder;
}

function getTableCardVisuals(table: FloorTable) {
  const isOccupied = isTableOccupied(table);
  const isReady = table.dynamicStatus === "READY_TO_SERVE";

  if (isReady) {
    return {
      statusBadgeColor: "bg-emerald-500 text-white animate-pulse shadow-sm",
      statusText: "🔔 Food Ready",
      cardBorder: "border-emerald-400 bg-emerald-50/20 ring-2 ring-emerald-400/20",
    };
  }

  if (isOccupied) {
    return {
      statusBadgeColor: "bg-amber-50 text-amber-800 border-amber-200",
      statusText: "Seated & Dining",
      cardBorder: "border-amber-200 bg-amber-50/10 hover:border-amber-300",
    };
  }

  return {
    statusBadgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    statusText: "Available",
    cardBorder: "border-gray-200/80 bg-white hover:border-gray-300",
  };
}

// ==========================================
// SUBCOMPONENTS
// ==========================================

interface FloorKpiCardsProps {
  totalTables: number;
  occupiedTables: number;
  readyCount: number;
  activeDiningRevenue: number;
  onSelectPassTab: () => void;
  onSelectWaitersTab: () => void;
}

function FloorKpiCards({
  totalTables,
  occupiedTables,
  readyCount,
  activeDiningRevenue,
  onSelectPassTab,
  onSelectWaitersTab,
}: Readonly<FloorKpiCardsProps>) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Active Dining Tables */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold tracking-wider text-gray-500 uppercase">
              Active Tables
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-cormorant text-gray-900">
                {occupiedTables}
              </span>
              <span className="text-xs text-gray-400 font-medium">/ {totalTables} Total</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100/80 shadow-sm">
            <Armchair size={22} />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-700 font-medium">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          {occupiedTables > 0 ? `${occupiedTables} dining tables occupied` : "All tables available"}
        </div>
      </div>

      {/* Ready Food Pass Alert */}
      <button
        type="button"
        onClick={onSelectPassTab}
        className={`text-left w-full rounded-2xl border p-5 shadow-sm transition-all cursor-pointer ${
          readyCount > 0
            ? "bg-gradient-to-br from-emerald-50 to-emerald-100/60 border-emerald-300 ring-2 ring-emerald-400/20"
            : "bg-white border-gray-100 hover:shadow-md"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold tracking-wider text-emerald-800 uppercase">
              Kitchen Ready Pass
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-cormorant text-emerald-950">
                {readyCount}
              </span>
              <span className="text-xs text-emerald-700 font-medium">Ready Orders</span>
            </div>
          </div>
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm ${
              readyCount > 0
                ? "bg-emerald-600 text-white border-emerald-500 animate-bounce"
                : "bg-emerald-50 text-emerald-600 border-emerald-100/80"
            }`}
          >
            <ChefHat size={22} />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
          <Bell size={12} className={readyCount > 0 ? "animate-pulse text-emerald-600" : "text-gray-400"} />
          {readyCount > 0 ? "Dishes cooked & waiting pickup!" : "No dishes waiting at pass"}
        </div>
      </button>

      {/* Active Dining Value */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold tracking-wider text-gray-500 uppercase">
              Live Dining Value
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-cormorant text-gray-900">
                ₹{activeDiningRevenue.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100/80 shadow-sm">
            <IndianRupee size={22} />
          </div>
        </div>
        <div className="mt-3 text-xs text-indigo-700 font-medium flex items-center gap-1">
          <ShoppingBag size={12} />
          In-flight orders on tables
        </div>
      </div>

      {/* Waitstaff Operation Link */}
      <button
        type="button"
        onClick={onSelectWaitersTab}
        className="text-left w-full bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold tracking-wider text-gray-500 uppercase">
              Waitstaff Status
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-cormorant text-gray-900 group-hover:text-culinary-primary transition-colors">
                View Roster
              </span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100/80 shadow-sm group-hover:scale-105 transition-transform">
            <Users size={22} />
          </div>
        </div>
        <div className="mt-3 text-xs text-amber-700 font-semibold flex items-center gap-1">
          <Sparkles size={12} />
          Check live shift & service metrics →
        </div>
      </button>
    </div>
  );
}

interface FloorTabNavigationProps {
  activeTab: FloorTab;
  setActiveTab: (tab: FloorTab) => void;
  tablesCount: number;
  readyCount: number;
  isRefreshing: boolean;
  onRefresh: () => void;
}

function FloorTabNavigation({
  activeTab,
  setActiveTab,
  tablesCount,
  readyCount,
  isRefreshing,
  onRefresh,
}: Readonly<FloorTabNavigationProps>) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200/80 pb-3">
      <div className="flex items-center gap-2 bg-gray-100/80 p-1.5 rounded-2xl border border-gray-200/60 shadow-inner">
        <button
          type="button"
          onClick={() => setActiveTab("TABLES")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "TABLES"
              ? "bg-white text-gray-900 shadow-sm font-extrabold"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50"
          }`}
        >
          <Armchair size={15} className={activeTab === "TABLES" ? "text-amber-600" : "text-gray-400"} />
          <span>Live Floor Tables ({tablesCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("PASS")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
            activeTab === "PASS"
              ? "bg-white text-gray-900 shadow-sm font-extrabold"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50"
          }`}
        >
          <ChefHat size={15} className={activeTab === "PASS" ? "text-emerald-600" : "text-gray-400"} />
          <span>Kitchen Food Pass</span>
          {readyCount > 0 && (
            <span className="bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full animate-pulse">
              {readyCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("WAITERS")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "WAITERS"
              ? "bg-white text-gray-900 shadow-sm font-extrabold"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50"
          }`}
        >
          <Users size={15} className={activeTab === "WAITERS" ? "text-culinary-primary" : "text-gray-400"} />
          <span>Waitstaff Live Tracker</span>
        </button>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="rounded-xl text-xs font-bold border-gray-200 hover:bg-gray-50 flex items-center gap-1.5 h-9"
      >
        <RotateCw size={13} className={isRefreshing ? "animate-spin text-culinary-primary" : ""} />
        <span>{isRefreshing ? "Refreshing..." : "Refresh Live Feed"}</span>
      </Button>
    </div>
  );
}

interface TableCardProps {
  table: FloorTable;
  onSelect: (table: FloorTable) => void;
}

function TableCard({ table, onSelect }: Readonly<TableCardProps>) {
  const { statusBadgeColor, statusText, cardBorder } = getTableCardVisuals(table);

  return (
    <button
      type="button"
      onClick={() => onSelect(table)}
      className={`text-left w-full rounded-2xl border p-4.5 shadow-sm transition-all duration-200 cursor-pointer flex flex-col justify-between h-[210px] group ${cardBorder}`}
    >
      <div>
        {/* Top Row: Table Number & Status Badge */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-800 flex items-center justify-center font-cormorant font-bold text-lg border border-gray-200/80 group-hover:bg-culinary-primary group-hover:text-white transition-colors">
              {table.tableNumber}
            </div>
            <div>
              <span className="text-xs font-bold text-gray-900 block">Table {table.tableNumber}</span>
              <span className="text-[10px] text-gray-400 font-medium">{table.capacity} Guests Max</span>
            </div>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadgeColor}`}>
            {statusText}
          </span>
        </div>

        {/* Active Order Info or Available Banner */}
        {table.activeOrder ? (
          <div className="space-y-2 bg-white p-2.5 rounded-xl border border-gray-100 shadow-2xs">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-gray-700">#{table.activeOrder.orderNumber}</span>
              <span className="font-bold text-culinary-primary font-cormorant text-sm">
                ₹{table.activeOrder.totalAmount.toLocaleString("en-IN")}
              </span>
            </div>
            <p className="text-[11px] text-gray-500 truncate" title={table.activeOrder.itemsSummary}>
              {table.activeOrder.itemsSummary || `${table.activeOrder.itemsCount} items`}
            </p>
          </div>
        ) : (
          <div className="h-16 flex items-center justify-center bg-gray-50/60 rounded-xl border border-dashed border-gray-200/80 text-gray-400 text-xs">
            Table is empty & clean
          </div>
        )}
      </div>

      {/* Bottom Row: Waiter and Elapsed Time */}
      <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px]">
        {table.activeOrder?.waiter ? (
          <div className="flex items-center gap-1.5 text-gray-700 font-medium">
            <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[9px] font-bold">
              {table.activeOrder.waiter.name[0]}
            </div>
            <span className="truncate max-w-[90px]">{table.activeOrder.waiter.name}</span>
          </div>
        ) : (
          <span className="text-gray-400 italic text-[10px]">No waiter assigned</span>
        )}

        {table.activeOrder ? (
          <span className="text-gray-400 flex items-center gap-1 text-[10px]">
            <Clock size={10} />
            {formatDistanceToNow(new Date(table.activeOrder.createdAt), { addSuffix: true })}
          </span>
        ) : (
          <span className="text-emerald-600 font-semibold text-[10px]">Ready to seat</span>
        )}
      </div>
    </button>
  );
}

interface PassStationCardProps {
  order: ReadyOrder;
  isServing: boolean;
  onMarkServed: (orderId: string, tableNumber: string) => void;
}

function PassStationCard({ order, isServing, onMarkServed }: Readonly<PassStationCardProps>) {
  return (
    <div className="bg-white rounded-2xl border border-emerald-200/90 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-cormorant font-bold text-lg shadow-sm">
              {order.table?.tableNumber || "T"}
            </div>
            <div>
              <span className="text-sm font-bold text-gray-900 block">
                Table {order.table?.tableNumber}
              </span>
              <span className="text-[11px] text-gray-400">Order #{order.orderNumber}</span>
            </div>
          </div>
          <Badge className="bg-emerald-500 text-white animate-pulse font-bold text-[10px]">
            🔔 READY
          </Badge>
        </div>

        {/* Items List */}
        <div className="space-y-1.5 bg-gray-50/70 p-3 rounded-xl border border-gray-100 max-h-48 overflow-y-auto">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
            Prepared Dishes:
          </span>
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-xs text-gray-800">
              <span className="font-semibold">
                {item.quantity}x {item.product.name}
              </span>
              <span className="text-gray-500 font-cormorant">₹{item.totalPrice}</span>
            </div>
          ))}
        </div>

        {/* Waiter & Timestamp */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            Waiter: <strong className="text-gray-800">{order.waiter?.name || "Unassigned"}</strong>
          </span>
          <span className="text-[11px] text-gray-400">
            {formatDistanceToNow(new Date(order.updatedAt), { addSuffix: true })}
          </span>
        </div>
      </div>

      {/* 1-Click Action Button */}
      <Button
        onClick={() => onMarkServed(order.id, order.table?.tableNumber)}
        disabled={isServing}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold py-2.5 shadow-sm cursor-pointer flex items-center justify-center gap-2"
      >
        {isServing ? (
          <>
            <RotateCw size={14} className="animate-spin" />
            <span>Updating...</span>
          </>
        ) : (
          <>
            <Check size={16} />
            <span>Mark as Served at Table {order.table?.tableNumber}</span>
          </>
        )}
      </Button>
    </div>
  );
}

interface TableDetailsDrawerProps {
  table: FloorTable | null;
  isOpen: boolean;
  onClose: () => void;
  onMarkServed: (orderId: string, tableNumber: string) => Promise<void>;
}

function TableDetailsDrawer({ table, isOpen, onClose, onMarkServed }: Readonly<TableDetailsDrawerProps>) {
  if (!table) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="sm:max-w-md w-full p-0 flex flex-col h-full bg-white z-50">
        {/* Drawer Header */}
        <div className="p-6 border-b border-gray-100 bg-gray-50/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-culinary-primary text-white flex items-center justify-center font-cormorant font-bold text-2xl shadow-sm">
              {table.tableNumber}
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Table {table.tableNumber}</h3>
              <p className="text-xs text-gray-500">Max Capacity: {table.capacity} Guests</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-500 hover:text-gray-900 flex items-center justify-center cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {table.activeOrder ? (
            <>
              <div className="bg-amber-50/60 border border-amber-200 p-4 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900">
                    Order #{table.activeOrder.orderNumber}
                  </span>
                  <Badge className="bg-amber-500 text-white font-bold text-[10px]">
                    {table.activeOrder.status}
                  </Badge>
                </div>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-xs text-amber-800">Total Order Amount</span>
                  <span className="text-xl font-bold font-cormorant text-amber-950">
                    ₹{table.activeOrder.totalAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Waiter Details */}
              <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-2xs space-y-1.5">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                  Assigned Waiter
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-800">
                    {table.activeOrder.waiter?.name || "Unassigned"}
                  </span>
                </div>
              </div>

              {/* Items Summary */}
              <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-2xs space-y-2">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                  Ordered Items
                </span>
                <p className="text-xs text-gray-700 leading-relaxed">
                  {table.activeOrder.itemsSummary}
                </p>
              </div>

              {/* Seated Timestamp */}
              <div className="text-xs text-gray-400 flex items-center justify-between px-1">
                <span>Order Placed:</span>
                <span>{format(new Date(table.activeOrder.createdAt), "hh:mm a, dd MMM yyyy")}</span>
              </div>

              {/* Mark as Served Quick Action */}
              {table.activeOrder.status === "READY" && (
                <Button
                  onClick={async () => {
                    if (!table.activeOrder) return;
                    await onMarkServed(table.activeOrder.id, table.tableNumber);
                    onClose();
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold py-3 shadow-sm cursor-pointer mt-4"
                >
                  <Check size={16} className="mr-2" />
                  Mark as Served at Table {table.tableNumber}
                </Button>
              )}
            </>
          ) : (
            <div className="text-center py-16 space-y-3">
              <Armchair size={48} className="mx-auto text-gray-300" />
              <h4 className="text-base font-bold text-gray-800">Table is Available</h4>
              <p className="text-xs text-gray-400 max-w-xs mx-auto">
                No active order or guests currently seated at Table {table.tableNumber}.
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export function FloorOperationsClient() {
  const { socket } = useSocket();
  const [activeTab, setActiveTab] = useState<FloorTab>("TABLES");
  const [tables, setTables] = useState<FloorTable[]>([]);
  const [readyOrders, setReadyOrders] = useState<ReadyOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tableSearch, setTableSearch] = useState("");
  const [tableFilter, setTableFilter] = useState<TableFilterType>("ALL");

  // Selected Table for Inspection Drawer
  const [selectedTable, setSelectedTable] = useState<FloorTable | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isServingId, setIsServingId] = useState<string | null>(null);
  const [waiterAckData, setWaiterAckData] = useState<WaiterAckData | null>(null);

  // Fetch Tables and Ready Orders
  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const [tablesRes, readyRes] = await Promise.all([
        axios.get("/api/waiter/tables"),
        axios.get("/api/waiter/orders?status=READY"),
      ]);

      if (Array.isArray(tablesRes.data)) {
        setTables(tablesRes.data);
        setSelectedTable((prevSelected) => {
          if (!prevSelected) return null;
          return tablesRes.data.find((t: FloorTable) => t.id === prevSelected.id) ?? prevSelected;
        });
      }

      if (Array.isArray(readyRes.data)) {
        setReadyOrders((prevReady) => {
          if (readyRes.data.length > prevReady.length && prevReady.length > 0) {
            playChimeAudio();
          }
          return readyRes.data;
        });
      }
    } catch (err) {
      console.error("Failed to fetch floor data:", err);
      if (isManual) toast.error("Failed to refresh floor operations");
    } finally {
      setIsLoading(false);
      if (isManual) {
        setIsRefreshing(false);
        toast.success("Floor operations updated");
      }
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await fetchData();
    };

    void init();

    // Auto poll every 6s for live real-time presence
    const interval = setInterval(() => {
      void fetchData();
    }, 6000);

    return () => clearInterval(interval);
  }, [fetchData]);

  // Socket listener for real-time order events
  useEffect(() => {
    if (!socket) return;

    const handleOrderEvent = () => {
      void fetchData();
    };

    const handleReadyEvent = () => {
      playChimeAudio();
      void fetchData();
      toast.success("🔔 New food ready from kitchen!");
    };

    const handleWaiterAck = (data: WaiterAckData) => {
      setWaiterAckData(data);
    };

    socket.on("order:ready", handleReadyEvent);
    socket.on("order:served", handleOrderEvent);
    socket.on("order:updated", handleOrderEvent);
    socket.on("table:updated", handleOrderEvent);
    socket.on("waiter:call:acknowledged", handleWaiterAck);

    return () => {
      socket.off("order:ready", handleReadyEvent);
      socket.off("order:served", handleOrderEvent);
      socket.off("order:updated", handleOrderEvent);
      socket.off("table:updated", handleOrderEvent);
      socket.off("waiter:call:acknowledged", handleWaiterAck);
    };
  }, [socket, fetchData]);

  // Mark an order as SERVED
  const handleMarkServed = async (orderId: string, tableNumber: string) => {
    setIsServingId(orderId);
    try {
      await axios.patch(`/api/orders/${orderId}/status`, { status: "SERVED" });
      toast.success(`Order marked as served at Table ${tableNumber}! 🍽️`);
      await fetchData();
    } catch (err: unknown) {
      console.error("Failed to mark served:", err);
      let msg = "Failed to update order status";
      if (axios.isAxiosError(err)) {
        msg = err.response?.data?.message || msg;
      }
      toast.error(msg);
    } finally {
      setIsServingId(null);
    }
  };

  // Filtered Tables
  const filteredTables = useMemo(() => {
    return tables.filter((t) => matchesTableFilter(t, tableSearch, tableFilter));
  }, [tables, tableSearch, tableFilter]);

  // KPIs
  const totalTables = tables.length;
  const occupiedTables = tables.filter(isTableOccupied).length;
  const readyCount = readyOrders.length;
  const activeDiningRevenue = tables.reduce((sum, t) => sum + (t.activeOrder?.totalAmount || 0), 0);

  const filterOptions = [
    { key: "ALL" as const, label: `All (${tables.length})` },
    { key: "OCCUPIED" as const, label: `Occupied (${occupiedTables})` },
    { key: "AVAILABLE" as const, label: `Available (${totalTables - occupiedTables})` },
    { key: "READY" as const, label: `Food Ready (${tables.filter((t) => t.dynamicStatus === "READY_TO_SERVE").length})` },
  ];

  return (
    <div className="space-y-6">
      {/* 4 Top KPI Cards */}
      <FloorKpiCards
        totalTables={totalTables}
        occupiedTables={occupiedTables}
        readyCount={readyCount}
        activeDiningRevenue={activeDiningRevenue}
        onSelectPassTab={() => setActiveTab("PASS")}
        onSelectWaitersTab={() => setActiveTab("WAITERS")}
      />

      {/* Main Tab Navigation Switcher */}
      <FloorTabNavigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tablesCount={tables.length}
        readyCount={readyCount}
        isRefreshing={isRefreshing}
        onRefresh={() => void fetchData(true)}
      />

      {/* TAB 1: Live Floor & Dining Tables */}
      {activeTab === "TABLES" && (
        <div className="space-y-5">
          {/* Table Filters & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <Input
                placeholder="Search table number or waiter..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="pl-9 h-9 text-xs rounded-xl bg-gray-50/80 border-gray-200"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              {filterOptions.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setTableFilter(f.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    tableFilter === f.key
                      ? "bg-culinary-primary text-white shadow-sm"
                      : "bg-gray-100/70 text-gray-600 hover:bg-gray-200/60"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tables Matrix Grid */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="h-44 bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          )}

          {!isLoading && filteredTables.length === 0 && (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-3">
              <Armchair size={36} className="mx-auto text-gray-300" />
              <h3 className="text-base font-bold text-gray-800">No tables match your filter</h3>
              <p className="text-xs text-gray-400">Try searching for a different table number or reset filters.</p>
            </div>
          )}

          {!isLoading && filteredTables.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredTables.map((table) => (
                <TableCard
                  key={table.id}
                  table={table}
                  onSelect={(selected) => {
                    setSelectedTable(selected);
                    setIsDrawerOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Kitchen Ready Food Pass Station */}
      {activeTab === "PASS" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-emerald-50/60 border border-emerald-200 p-4 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                <ChefHat size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-950">Kitchen Ready Food Pass</h3>
                <p className="text-xs text-emerald-700">
                  Dishes freshly cooked and waiting for table delivery by waitstaff.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold bg-emerald-600 text-white px-3 py-1 rounded-full shadow-sm">
              {readyOrders.length} Ready to Serve
            </span>
          </div>

          {readyOrders.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-3">
              <CheckCircle2 size={40} className="mx-auto text-emerald-500" />
              <h3 className="text-base font-bold text-gray-800">All Dishes Served! 🎉</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                No orders are currently waiting at the kitchen pass. New cooked orders will appear here in real-time.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {readyOrders.map((order) => (
                <PassStationCard
                  key={order.id}
                  order={order}
                  isServing={isServingId === order.id}
                  onMarkServed={handleMarkServed}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Waitstaff Live Activity Tracker */}
      {activeTab === "WAITERS" && (
        <div className="space-y-4">
          <WaiterPerformanceSection />
        </div>
      )}

      {/* Slide-over Table Details Drawer */}
      <TableDetailsDrawer
        table={selectedTable}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onMarkServed={handleMarkServed}
      />

      {/* Real-time Waiter Responded / On The Way Center Notification Modal */}
      <AdminWaiterAckModal
        ackData={waiterAckData}
        onDismiss={() => setWaiterAckData(null)}
      />
    </div>
  );
}
