"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSocket } from "@/components/providers/socket-provider";
import toast from "react-hot-toast";
import {
  CheckCircle2,
  Clock,
  ChefHat,
  BellRing,
  RotateCw,
  Search,
  Volume2,
  VolumeX,
  Flame,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface KDSOrder {
  id: string;
  orderNumber: string;
  customerName?: string;
  customerPhone?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  notes: string | null;
  table: { tableNumber: string; capacity?: number };
  items: Array<{
    id: string;
    quantity: number;
    product: {
      id: string;
      name: string;
      foodType?: string;
      preparationTime?: number;
    };
  }>;
}

const TERMINAL_STATUSES = new Set(["SERVED", "PAID", "CANCELLED"]);

function playChimeSound() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch {
    // Ignore audio playback failures in unsupported environments
  }
}

function upsertOrder(prev: KDSOrder[], order: KDSOrder): KDSOrder[] {
  const exists = prev.some((o) => o.id === order.id);
  if (exists) {
    return prev.map((o) => (o.id === order.id ? order : o));
  }
  return [order, ...prev];
}

function updateOrRemoveOrder(prev: KDSOrder[], order: KDSOrder): KDSOrder[] {
  const isTerminal = TERMINAL_STATUSES.has(order.status);
  const exists = prev.some((o) => o.id === order.id);

  if (isTerminal) {
    return exists ? prev.filter((o) => o.id !== order.id) : prev;
  }
  if (exists) {
    return prev.map((o) => (o.id === order.id ? order : o));
  }
  return [order, ...prev];
}

function getStatusSuccessMessage(status: string): string {
  switch (status) {
    case "PREPARING":
      return "Order cooking started!";
    case "READY":
      return "Dish marked as Ready at the pass!";
    default:
      return "Order marked as served!";
  }
}

export type KDSTabType = "NEW" | "PREPARING" | "READY" | "ALL";

interface KDSEmptyStateProps {
  activeTab: KDSTabType;
}

function KDSEmptyState({ activeTab }: Readonly<KDSEmptyStateProps>) {
  const getDetails = () => {
    switch (activeTab) {
      case "NEW":
        return {
          icon: <Clock size={32} />,
          title: "No new orders waiting.",
        };
      case "PREPARING":
        return {
          icon: <ChefHat size={32} />,
          title: "Nothing currently cooking on stoves.",
        };
      default:
        return {
          icon: <CheckCircle2 size={32} />,
          title: "No dishes waiting at the pass.",
        };
    }
  };

  const { icon, title } = getDetails();

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-16 text-center space-y-3 shadow-sm">
      <div className="w-16 h-16 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center mx-auto border border-gray-100">
        {icon}
      </div>
      <p className="font-bold text-gray-800 text-lg font-cormorant">{title}</p>
      <p className="text-xs text-gray-400 max-w-sm mx-auto">
        Table QR orders and POS tickets will stream into this station automatically in real-time.
      </p>
    </div>
  );
}

interface OrderTheme {
  cardBorder: string;
  headerBg: string;
  badgeBg: string;
  quantityBg: string;
}

const ORDER_STATUS_THEMES: Record<string, OrderTheme> = {
  READY: {
    cardBorder: "border-emerald-400 shadow-emerald-50",
    headerBg: "bg-emerald-50/70 border-emerald-100",
    badgeBg: "bg-emerald-600 text-white",
    quantityBg: "bg-emerald-600",
  },
  PREPARING: {
    cardBorder: "border-amber-300",
    headerBg: "bg-amber-50/70 border-amber-100",
    badgeBg: "bg-amber-500 text-white",
    quantityBg: "bg-amber-500",
  },
  DEFAULT: {
    cardBorder: "border-blue-300",
    headerBg: "bg-blue-50/70 border-blue-100",
    badgeBg: "bg-blue-600 text-white",
    quantityBg: "bg-blue-600",
  },
};

function getOrderCardTheme(status: string, isDelayed: boolean): OrderTheme {
  const theme = ORDER_STATUS_THEMES[status] ?? ORDER_STATUS_THEMES.DEFAULT;
  if (isDelayed) {
    return {
      ...theme,
      cardBorder: "border-rose-400 ring-2 ring-rose-300/30",
    };
  }
  return theme;
}

interface ActionButtonConfig {
  nextStatus: string;
  className: string;
  icon: React.ReactNode;
  label: string;
}

function getActionButtonConfig(status: string): ActionButtonConfig | null {
  if (["PENDING", "ACCEPTED"].includes(status)) {
    return {
      nextStatus: "PREPARING",
      className: "w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 rounded-xl shadow-sm gap-1.5",
      icon: <ChefHat size={15} />,
      label: "Start Cooking",
    };
  }
  if (status === "PREPARING") {
    return {
      nextStatus: "READY",
      className: "w-full bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs h-9 rounded-xl shadow-sm gap-1.5",
      icon: <BellRing size={15} />,
      label: "Mark as Ready for Runner",
    };
  }
  if (status === "READY") {
    return {
      nextStatus: "SERVED",
      className: "w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 rounded-xl shadow-sm gap-1.5",
      icon: <CheckCircle2 size={15} />,
      label: "Mark as Served",
    };
  }
  return null;
}

interface KDSOrderActionButtonProps {
  orderId: string;
  status: string;
  isLoading: boolean;
  onUpdateStatus: (orderId: string, newStatus: string) => Promise<void>;
}

function KDSOrderActionButton({
  orderId,
  status,
  isLoading,
  onUpdateStatus,
}: Readonly<KDSOrderActionButtonProps>) {
  const config = getActionButtonConfig(status);
  if (!config) return null;

  return (
    <Button
      onClick={() => void onUpdateStatus(orderId, config.nextStatus)}
      disabled={isLoading}
      className={config.className}
    >
      {isLoading ? (
        <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
      ) : (
        <>
          {config.icon}
          {config.label}
        </>
      )}
    </Button>
  );
}

interface KDSOrderItemRowProps {
  item: KDSOrder["items"][number];
  quantityBgClass: string;
}

function KDSOrderItemRow({ item, quantityBgClass }: Readonly<KDSOrderItemRowProps>) {
  return (
    <div className="flex gap-2.5 text-gray-900 bg-gray-50/80 p-2.5 rounded-xl border border-gray-100 items-center justify-between">
      <div className="flex items-center gap-2 truncate">
        <span
          className={`w-6 h-6 rounded-lg text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm ${quantityBgClass}`}
        >
          {item.quantity}
        </span>
        <span className="font-bold text-xs truncate">
          {item.product.name}
        </span>
      </div>

      {item.product.preparationTime && (
        <span className="text-[10px] text-gray-400 font-mono shrink-0">
          ~{item.product.preparationTime}m
        </span>
      )}
    </div>
  );
}

interface KDSOrderCardProps {
  order: KDSOrder;
  currentTime: number;
  loadingOrderId: string | null;
  onUpdateStatus: (orderId: string, newStatus: string) => Promise<void>;
}

function KDSOrderCard({
  order,
  currentTime,
  loadingOrderId,
  onUpdateStatus,
}: Readonly<KDSOrderCardProps>) {
  const rawMinutes = Math.floor(
    (currentTime - new Date(order.createdAt).getTime()) / 60000
  );
  const isDelayed = rawMinutes > 15;
  const isLoading = loadingOrderId === order.id;
  const theme = getOrderCardTheme(order.status, isDelayed);
  const tableNumber = order.table?.tableNumber;

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm transition-all flex flex-col justify-between overflow-hidden border-2 relative ${theme.cardBorder}`}
    >
      {/* Delayed warning bar */}
      {isDelayed && (
        <div className="bg-rose-500 text-white text-[10px] font-bold px-3 py-0.5 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <AlertTriangle size={11} /> Delayed Cooking Ticket
          </span>
          <span>{rawMinutes}m waiting</span>
        </div>
      )}

      {/* Card Header */}
      <div className={`p-4 border-b flex justify-between items-start ${theme.headerBg}`}>
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center font-cormorant font-bold text-xl shadow-sm ${theme.badgeBg}`}
          >
            T{tableNumber || "T"}
          </div>
          <div>
            <h3 className="font-bold text-base font-cormorant text-gray-900 leading-tight">
              Table {tableNumber || "Takeaway"}
            </h3>
            <p className="text-[10px] text-gray-500 font-mono">
              #{order.orderNumber}
            </p>
          </div>
        </div>

        {/* Timer Badge */}
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold ${isDelayed
            ? "bg-rose-100 text-rose-800 border border-rose-300 animate-pulse"
            : "bg-white text-gray-700 border border-gray-200 shadow-sm"
            }`}
        >
          <Clock size={12} className={isDelayed ? "text-rose-600" : "text-gray-400"} />
          {rawMinutes > 30 ? "30+ min" : `${Math.max(0, rawMinutes)} min`}
        </span>
      </div>

      {/* Ordered Items List */}
      <div className="p-4 flex-1 space-y-3 text-xs">
        <div className="space-y-1.5">
          {order.items.map((item) => (
            <KDSOrderItemRow
              key={item.id}
              item={item}
              quantityBgClass={theme.quantityBg}
            />
          ))}
        </div>

        {/* Guest Cooking Notes */}
        {order.notes && (
          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium space-y-0.5">
            <span className="font-bold text-[10px] uppercase tracking-wider text-amber-800 block">
              📝 Cooking Note:
            </span>
            <p className="italic text-[11px]">{order.notes}</p>
          </div>
        )}
      </div>

      {/* Card Action Button */}
      <div className="p-3 border-t border-gray-100 bg-gray-50/50">
        <KDSOrderActionButton
          orderId={order.id}
          status={order.status}
          isLoading={isLoading}
          onUpdateStatus={onUpdateStatus}
        />
      </div>
    </div>
  );
}

async function fetchKitchenOrders(): Promise<KDSOrder[] | null> {
  try {
    const res = await fetch(`/api/kitchen/orders?t=${Date.now()}`);
    if (res.ok) {
      return (await res.json()) as KDSOrder[];
    }
  } catch (error) {
    console.error("Failed to load kitchen orders:", error);
  }
  return null;
}

async function updateKitchenOrderStatus(orderId: string, newStatus: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/kitchen/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function filterKDSOrders(
  orders: KDSOrder[],
  activeTab: KDSTabType,
  searchQuery: string
): KDSOrder[] {
  let list: KDSOrder[];
  if (activeTab === "NEW") {
    list = orders.filter((o) => ["PENDING", "ACCEPTED"].includes(o.status));
  } else if (activeTab === "PREPARING") {
    list = orders.filter((o) => o.status === "PREPARING");
  } else if (activeTab === "READY") {
    list = orders.filter((o) => o.status === "READY");
  } else {
    list = orders;
  }

  const q = searchQuery.toLowerCase().trim();
  if (!q) return list;

  return list.filter(
    (o) =>
      o.orderNumber.toLowerCase().includes(q) ||
      Boolean(o.table?.tableNumber.toLowerCase().includes(q)) ||
      o.items.some((i) => i.product.name.toLowerCase().includes(q))
  );
}

function KDSLoadingState() {
  return (
    <div className="flex flex-col items-center justify-center p-24 space-y-4 bg-white rounded-3xl border border-gray-100 shadow-sm">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-culinary-primary border-t-transparent" />
      <p className="text-sm font-semibold text-gray-500 animate-pulse">
        Connecting to live Kitchen Display System (KDS)...
      </p>
    </div>
  );
}

interface KDSTopBarProps {
  isConnected: boolean;
  soundEnabled: boolean;
  isRefreshing: boolean;
  onToggleSound: () => void;
  onRefresh: () => void;
}

function KDSTopBar({
  isConnected,
  soundEnabled,
  isRefreshing,
  onToggleSound,
  onRefresh,
}: Readonly<KDSTopBarProps>) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="flex items-center gap-3.5">
        <div className="p-3 bg-amber-50 text-culinary-primary rounded-2xl border border-amber-100 shrink-0">
          <Flame size={24} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-cormorant text-gray-900">
              Kitchen Display System (KDS)
            </h1>
            <span
              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${isConnected
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-rose-50 text-rose-700 border-rose-200"
                }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                  }`}
              />
              {isConnected ? "🟢 Live Dispatch Sync" : "🔴 Disconnected"}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Live preparation timers, ticket routing, and instant waitstaff pass alerts
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
        {/* Audio Chime */}
        <button
          type="button"
          onClick={onToggleSound}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${soundEnabled
            ? "bg-amber-50 text-culinary-primary border-amber-200"
            : "bg-gray-50 text-gray-400 border-gray-200"
            }`}
        >
          {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          <span>{soundEnabled ? "Chime On" : "Muted"}</span>
        </button>

        {/* Refresh Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="text-xs h-8 gap-1.5 border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-xl shadow-none font-bold"
        >
          <RotateCw
            className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-culinary-primary" : ""
              }`}
          />
          Refresh
        </Button>
      </div>
    </div>
  );
}

interface KDSWorkflowTabsProps {
  activeTab: KDSTabType;
  newCount: number;
  preparingCount: number;
  readyCount: number;
  totalCount: number;
  searchQuery: string;
  onSelectTab: (tab: KDSTabType) => void;
  onSearchChange: (query: string) => void;
}

function KDSWorkflowTabs({
  activeTab,
  newCount,
  preparingCount,
  readyCount,
  totalCount,
  searchQuery,
  onSelectTab,
  onSearchChange,
}: Readonly<KDSWorkflowTabsProps>) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {/* New Orders */}
        <button
          type="button"
          onClick={() => onSelectTab("NEW")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === "NEW"
            ? "bg-blue-600 text-white shadow-sm"
            : "text-blue-600 bg-blue-50/70 hover:bg-blue-100/70"
            }`}
        >
          <Clock size={14} />
          <span>NEW ORDERS</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${activeTab === "NEW" ? "bg-white/20 text-white" : "bg-blue-200 text-blue-800"
              }`}
          >
            {newCount}
          </span>
        </button>

        {/* Preparing */}
        <button
          type="button"
          onClick={() => onSelectTab("PREPARING")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === "PREPARING"
            ? "bg-amber-500 text-white shadow-sm"
            : "text-amber-700 bg-amber-50/70 hover:bg-amber-100/70"
            }`}
        >
          <ChefHat size={14} />
          <span>COOKING NOW</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${activeTab === "PREPARING" ? "bg-white/20 text-white" : "bg-amber-200 text-amber-900"
              }`}
          >
            {preparingCount}
          </span>
        </button>

        {/* Ready */}
        <button
          type="button"
          onClick={() => onSelectTab("READY")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === "READY"
            ? "bg-emerald-600 text-white shadow-sm"
            : "text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100/70"
            }`}
        >
          <CheckCircle2 size={14} />
          <span>READY AT PASS</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${activeTab === "READY" ? "bg-white/20 text-white" : "bg-emerald-200 text-emerald-900"
              }`}
          >
            {readyCount}
          </span>
        </button>

        {/* All Active */}
        <button
          type="button"
          onClick={() => onSelectTab("ALL")}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === "ALL"
            ? "bg-gray-900 text-white shadow-sm"
            : "text-gray-600 hover:bg-gray-100"
            }`}
        >
          <span>All Active</span>
          <span className="text-[10px] text-gray-400">({totalCount})</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
        <input
          type="text"
          placeholder="Search table or order #..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-8 pr-8 py-1.5 text-xs rounded-xl border border-gray-200 bg-gray-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-culinary-primary/20 text-gray-800"
        />
        {searchQuery && (
          <button type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

interface KDSOrdersGridProps {
  orders: KDSOrder[];
  activeTab: KDSTabType;
  currentTime: number;
  loadingOrderId: string | null;
  onUpdateStatus: (orderId: string, newStatus: string) => Promise<void>;
}

function KDSOrdersGrid({
  orders,
  activeTab,
  currentTime,
  loadingOrderId,
  onUpdateStatus,
}: Readonly<KDSOrdersGridProps>) {
  if (orders.length === 0) {
    return <KDSEmptyState activeTab={activeTab} />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {orders.map((order) => (
        <KDSOrderCard
          key={order.id}
          order={order}
          currentTime={currentTime}
          loadingOrderId={loadingOrderId}
          onUpdateStatus={onUpdateStatus}
        />
      ))}
    </div>
  );
}

export function KDSClient() {
  const { socket, isConnected } = useSocket();
  const [orders, setOrders] = useState<KDSOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<KDSTabType>("NEW");
  const [searchQuery, setSearchQuery] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  // Fetch kitchen orders from dedicated REST endpoint
  const fetchOrders = useCallback(async (showIndicator = false) => {
    if (showIndicator) setIsRefreshing(true);
    const data = await fetchKitchenOrders();
    if (data) {
      setOrders(data);
    }
    setLoading(false);
    if (showIndicator) setIsRefreshing(false);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadInitialOrders = async () => {
      const data = await fetchKitchenOrders();
      if (data && isMounted) {
        setOrders(data);
      }
      if (isMounted) {
        setLoading(false);
      }
    };

    void loadInitialOrders();

    const timerInterval = setInterval(() => setCurrentTime(Date.now()), 15000);
    const pollInterval = setInterval(() => {
      void fetchOrders();
    }, 10000);

    return () => {
      isMounted = false;
      clearInterval(timerInterval);
      clearInterval(pollInterval);
    };
  }, [fetchOrders]);

  // Socket.io live listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (order: KDSOrder) => {
      setOrders((prev) => upsertOrder(prev, order));
      if (soundEnabled) {
        playChimeSound();
      }
      toast.success(`New Ticket: Table ${order.table?.tableNumber || "Takeaway"}`);
    };

    const handleOrderUpdated = (order: KDSOrder) => {
      setOrders((prev) => updateOrRemoveOrder(prev, order));
    };

    socket.on("order:created", handleNewOrder);
    socket.on("order:updated", handleOrderUpdated);
    socket.on("order:ready", handleOrderUpdated);
    socket.on("order:served", handleOrderUpdated);

    return () => {
      socket.off("order:created", handleNewOrder);
      socket.off("order:updated", handleOrderUpdated);
      socket.off("order:ready", handleOrderUpdated);
      socket.off("order:served", handleOrderUpdated);
    };
  }, [socket, soundEnabled]);

  // Status Updaters
  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setLoadingOrderId(orderId);
    const success = await updateKitchenOrderStatus(orderId, newStatus);
    if (success) {
      toast.success(getStatusSuccessMessage(newStatus));
      await fetchOrders();
    } else {
      toast.error("Failed to update status");
    }
    setLoadingOrderId(null);
  };

  // Tab counts
  const newCount = useMemo(
    () => orders.filter((o) => ["PENDING", "ACCEPTED"].includes(o.status)).length,
    [orders]
  );
  const preparingCount = useMemo(
    () => orders.filter((o) => o.status === "PREPARING").length,
    [orders]
  );
  const readyCount = useMemo(
    () => orders.filter((o) => o.status === "READY").length,
    [orders]
  );

  const displayedOrders = useMemo(
    () => filterKDSOrders(orders, activeTab, searchQuery),
    [orders, activeTab, searchQuery]
  );

  if (loading) {
    return <KDSLoadingState />;
  }

  return (
    <div className="space-y-6 font-sans pb-16 animate-in fade-in duration-500">
      <KDSTopBar
        isConnected={isConnected}
        soundEnabled={soundEnabled}
        isRefreshing={isRefreshing}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
        onRefresh={() => void fetchOrders(true)}
      />

      <KDSWorkflowTabs
        activeTab={activeTab}
        newCount={newCount}
        preparingCount={preparingCount}
        readyCount={readyCount}
        totalCount={orders.length}
        searchQuery={searchQuery}
        onSelectTab={setActiveTab}
        onSearchChange={setSearchQuery}
      />

      <KDSOrdersGrid
        orders={displayedOrders}
        activeTab={activeTab}
        currentTime={currentTime}
        loadingOrderId={loadingOrderId}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
}
