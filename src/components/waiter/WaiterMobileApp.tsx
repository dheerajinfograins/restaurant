"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSocket } from "@/components/providers/socket-provider";
import { useWaiterUser } from "@/components/providers/waiter-user-provider";
import { WaiterMobileNav, WaiterTab } from "./WaiterMobileNav";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "react-hot-toast";
import {
  ChefHat,
  Armchair,
  CheckCircle2,
  Clock,
  RotateCw,
  Volume2,
  VolumeX,
  Search,
  UserCheck,
  LogOut,
  BellRing,
  User,
  UserCog,
  Pencil,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ProfileModal from "@/components/dashboard/profile-modal";
import { WaiterHistoryModal } from "./WaiterHistoryModal";
import Image from "next/image";

export type WaiterOrderItem = {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product: {
    id: string;
    name: string;
    foodType?: string;
    image?: string | null;
  };
};

export type WaiterOrder = {
  id: string;
  orderNumber: string;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  totalAmount: number;
  status: string;
  waiterId?: string | null;
  waiter?: {
    id?: string;
    name: string;
    email?: string;
  } | null;
  table: {
    id?: string;
    tableNumber: string;
    capacity?: number;
  };
  items: WaiterOrderItem[];
  createdAt: string;
  updatedAt: string;
};

export type TableOverview = {
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

const getOrderStatusBadgeClass = (status: string) => {
  switch (status) {
    case "READY":
      return "bg-emerald-100 text-emerald-800";
    case "PREPARING":
      return "bg-amber-100 text-amber-800";
    case "SERVED":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-blue-100 text-blue-800";
  }
};

export function WaiterMobileApp() {
  const { socket, isConnected } = useSocket();
  const { currentUser } = useWaiterUser();
  const [customUser, setCustomUser] = useState<typeof currentUser | null>(null);
  const user = customUser ? { ...currentUser, ...customUser } : currentUser;
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<WaiterTab>("PASS");
  const [orders, setOrders] = useState<WaiterOrder[]>([]);
  const [tables, setTables] = useState<TableOverview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "PREPARING" | "SERVED">("ALL");

  const audioContextRef = useRef<AudioContext | null>(null);

  // Play audio chime for urgent kitchen ready dishes
  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      // Trigger mobile haptic vibration if supported
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([200, 100, 250]);
      }

      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      audioContextRef.current ??= new AudioCtx();

      if (audioContextRef.current.state === "suspended") {
        void audioContextRef.current.resume();
      }

      const ctx = audioContextRef.current;
      const now = ctx.currentTime;

      // Bell chime chord (High E + B)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.4, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.6);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(987.77, now + 0.12);
      gain2.gain.setValueAtTime(0.45, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.8);
    } catch {
      // Audio playback handling
    }
  }, [soundEnabled]);

  const testChime = () => {
    playNotificationSound();
    toast.success("🔔 Sound chime & alert working!", { id: "test-chime" });
  };

  // Fetch all orders
  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`/api/waiter/orders?status=ALL&t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error("Failed to fetch waiter orders:", err);
    }
  }, []);

  // Fetch tables
  const fetchTables = useCallback(async () => {
    try {
      const res = await fetch(`/api/waiter/tables?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setTables(data);
      }
    } catch (err) {
      console.error("Failed to fetch waiter tables:", err);
    }
  }, []);

  const refreshAll = async (showToast = true) => {
    setIsRefreshing(true);
    await Promise.all([fetchOrders(), fetchTables()]);
    setIsRefreshing(false);
    if (showToast) toast.success("Floor & Pass updated", { id: "mobile-refresh" });
  };

  useEffect(() => {
    let ignore = false;
    async function init() {
      await Promise.all([fetchOrders(), fetchTables()]);
      if (!ignore) setIsLoading(false);
    }
    void init();

    // Auto poll every 6 seconds as a backup
    const interval = setInterval(() => {
      void fetchOrders();
      void fetchTables();
    }, 6000);

    return () => {
      ignore = true;
      clearInterval(interval);
    };
  }, [fetchOrders, fetchTables]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleOrderReady = (order: WaiterOrder) => {
      setOrders((prev) => {
        const exists = prev.some((o) => o.id === order.id);
        if (exists) return prev.map((o) => (o.id === order.id ? { ...o, ...order, status: "READY" } : o));
        return [{ ...order, status: "READY" }, ...prev];
      });

      void fetchTables();
      playNotificationSound();

      toast.custom(
        (t) => (
          <div className="bg-emerald-900 text-white border-2 border-emerald-400 shadow-2xl rounded-2xl p-4 flex flex-col gap-2 font-sans w-80 max-w-sm animate-in slide-in-from-top-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl animate-bounce">🛎️</span>
                <p className="font-bold text-sm">Table {order.table?.tableNumber || "Takeaway"} Ready!</p>
              </div>
              <button
                type="button"
                onClick={() => toast.dismiss(t.id)}
                className="text-white/70 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-emerald-100">Dishes plated & hot on kitchen pass. Ready for delivery.</p>
            <button
              type="button"
              onClick={() => {
                toast.dismiss(t.id);
                setActiveTab("PASS");
              }}
              className="mt-1 bg-emerald-400 text-emerald-950 font-bold py-1.5 px-3 rounded-xl text-xs text-center"
            >
              View in Food Pass ➔
            </button>
          </div>
        ),
        { id: `order-ready-mobile-${order.id}`, duration: 6000 }
      );
    };

    const handleOrderServed = (order: WaiterOrder) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: "SERVED", waiterId: order.waiterId } : o))
      );
      void fetchTables();
    };

    const handleOrderUpdated = (order: WaiterOrder) => {
      setOrders((prev) => {
        const exists = prev.some((o) => o.id === order.id);
        if (exists) return prev.map((o) => (o.id === order.id ? { ...o, ...order } : o));
        return [order, ...prev];
      });
      void fetchTables();
    };

    socket.on("order:ready", handleOrderReady);
    socket.on("order:served", handleOrderServed);
    socket.on("order:updated", handleOrderUpdated);

    return () => {
      socket.off("order:ready", handleOrderReady);
      socket.off("order:served", handleOrderServed);
      socket.off("order:updated", handleOrderUpdated);
    };
  }, [socket, playNotificationSound, fetchTables]);

  // Handle Waiter Claim / Pick up
  const handleClaim = async (orderId: string, tableNumber: string) => {
    setLoadingOrderId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          waiterId: currentUser.id,
        }),
      });

      if (res.ok) {
        toast.success(`You picked up Table ${tableNumber}'s dishes! 🍽️`);
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId ? { ...o, waiterId: currentUser.id, waiter: { id: currentUser.id, name: currentUser.name, email: currentUser.email } } : o
          )
        );
      }
    } catch {
      toast.error("Failed to pick up dish");
    } finally {
      setLoadingOrderId(null);
    }
  };

  // Handle Mark as Served
  const handleServe = async (orderId: string, tableNumber: string) => {
    setLoadingOrderId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "SERVED",
          waiterId: currentUser.id,
        }),
      });

      if (res.ok) {
        toast.success(`Table ${tableNumber} marked as SERVED! 🎉`, { icon: "✅" });
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? {
                ...o,
                status: "SERVED",
                waiterId: currentUser.id,
                waiter: { id: currentUser.id, name: currentUser.name, email: currentUser.email },
              }
              : o
          )
        );
        void fetchTables();
      } else {
        toast.error("Failed to mark served");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setLoadingOrderId(null);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch {
      window.location.href = "/login";
    }
  };

  // Ready orders waiting for table delivery
  const readyOrders = useMemo(() => {
    return orders.filter((o) => o.status === "READY");
  }, [orders]);

  // New incoming orders (PENDING, ACCEPTED)
  const newOrders = useMemo(() => {
    return orders.filter((o) => o.status === "PENDING" || o.status === "ACCEPTED");
  }, [orders]);

  // My served orders today
  const myServedOrders = useMemo(() => {
    return orders.filter(
      (o) => (o.status === "SERVED" || o.status === "PAID") && o.waiterId === currentUser.id
    );
  }, [orders, currentUser.id]);

  // Filtered orders for ORDERS tab
  const filteredOrders = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return orders.filter((o) => {
      if (statusFilter !== "ALL" && o.status !== statusFilter) return false;
      if (!q) return true;
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        o.table.tableNumber.toLowerCase().includes(q) ||
        o.customerName?.toLowerCase().includes(q)
      );
    });
  }, [orders, searchQuery, statusFilter]);

  // Waiter Initials
  const initials = (user.name || "Waiter")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-culinary-background space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-3 border-culinary-primary border-t-transparent"></div>
        <p className="text-sm font-bold text-gray-600 font-sans animate-pulse">
          Connecting to Waitstaff Terminal...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/70 pb-24 font-sans text-gray-900">
      {/* Mobile Top App Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200/90 px-4 py-3 shadow-xs">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center gap-3 text-left group transition-all"
            title="Edit Profile"
          >
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name}
                width={40}
                height={40}
                className="w-10 h-10 rounded-xl object-cover border border-amber-300/40 shadow-xs group-hover:ring-2 group-hover:ring-amber-400 transition-all"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white font-cormorant font-bold text-base flex items-center justify-center shadow-xs group-hover:ring-2 group-hover:ring-amber-400 transition-all">
                {initials}
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-sm text-gray-900 font-cormorant leading-tight group-hover:text-amber-800 transition-colors">
                  {user.name}
                </h1>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                  Waiter
                </span>
              </div>
              <p className="text-[10px] text-gray-500 font-medium flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                {isConnected ? "Live Floor Sync" : "Sync Active"}
              </p>
            </div>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsProfileModalOpen(true)}
              title="Profile Settings"
              className="p-2 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-200 text-amber-800 transition-all"
            >
              <UserCog size={16} />
            </button>

            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? "Mute Chime" : "Enable Chime"}
              className={`p-2 rounded-xl border text-xs font-semibold transition-all ${soundEnabled
                ? "bg-amber-50 text-amber-800 border-amber-200"
                : "bg-gray-100 text-gray-400 border-gray-200"
                }`}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            <button
              type="button"
              onClick={() => void refreshAll(true)}
              disabled={isRefreshing}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl border border-gray-200 text-gray-700 transition-all"
            >
              <RotateCw size={16} className={isRefreshing ? "animate-spin text-culinary-primary" : ""} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content View by Active Tab */}
      <main className="p-4 max-w-lg mx-auto space-y-4">
        {/* ========================================================================= */}
        {/* TAB 1: FOOD PASS (KITCHEN READY ORDERS) */}
        {/* ========================================================================= */}
        {activeTab === "PASS" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Urgent Pass Banner */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-4 rounded-2xl shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/20 rounded-xl">
                  <ChefHat size={22} className="text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-base font-cormorant">Kitchen Food Pass</h2>
                  <p className="text-xs text-emerald-100">
                    {readyOrders.length > 0
                      ? `${readyOrders.length} Hot dishes plated & ready for tables`
                      : "All dishes delivered to tables"}
                  </p>
                </div>
              </div>

              <span className="text-xs font-black px-2.5 py-1 rounded-full bg-white text-emerald-800 shadow-xs">
                {readyOrders.length} Ready
              </span>
            </div>

            {/* Ready Dishes List */}
            {readyOrders.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-gray-200 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={30} />
                </div>
                <h3 className="font-bold text-base text-gray-900 font-cormorant">No Dishes Waiting</h3>
                <p className="text-xs text-gray-500 max-w-xs mx-auto">
                  When the kitchen finishes cooking, dishes will beep and appear here immediately for pickup.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={testChime}
                  className="rounded-xl border-emerald-200 text-emerald-700 text-xs font-bold gap-1.5"
                >
                  <BellRing size={13} />
                  <span>Test Chime Sound</span>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {readyOrders.map((order) => {
                  const isClaimedByMe = order.waiterId === currentUser.id;
                  const isClaimedByOther = order.waiterId && order.waiterId !== currentUser.id;

                  return (
                    <div
                      key={order.id}
                      className={`bg-white rounded-2xl border-2 shadow-md p-4 space-y-3 transition-all ${isClaimedByMe
                        ? "border-emerald-500 bg-emerald-50/30"
                        : "border-emerald-400 hover:border-emerald-500"
                        }`}
                    >
                      {/* Card Header: Table + Time */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1.5 bg-amber-500 text-white font-extrabold text-sm rounded-xl shadow-xs flex items-center gap-1">
                            <Armchair size={15} /> Table {order.table?.tableNumber}
                          </span>
                          <div>
                            <p className="font-mono text-xs font-bold text-gray-800">
                              #{order.orderNumber}
                            </p>
                            <p className="text-[10px] text-gray-500 font-semibold flex items-center gap-1">
                              <Clock size={11} />
                              {formatDistanceToNow(new Date(order.updatedAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>

                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[11px] font-bold">
                          ⚡ Ready Hot
                        </Badge>
                      </div>

                      {/* Dispatched Plated Items */}
                      <div className="bg-gray-50 p-3 rounded-xl space-y-1.5 border border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          Plated Dishes to Deliver:
                        </p>
                        <div className="space-y-1">
                          {order.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between text-xs font-medium text-gray-800"
                            >
                              <span className="flex items-center gap-1.5">
                                <span className="font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                                  {item.quantity}x
                                </span>
                                <span>{item.product?.name}</span>
                              </span>
                            </div>
                          ))}
                        </div>

                        {order.notes && (
                          <div className="pt-1 text-[11px] text-red-600 bg-red-50 p-1.5 rounded-md font-semibold">
                            ⚠️ Note: {order.notes}
                          </div>
                        )}
                      </div>

                      {/* Active Delivery Status Banner */}
                      {isClaimedByMe && (
                        <div className="p-3 bg-amber-500/15 border-2 border-amber-400 rounded-2xl flex items-center justify-between text-xs text-amber-950 font-bold animate-pulse">
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl">🏃</span>
                            <div>
                              <p className="leading-tight text-amber-950 font-bold">You are delivering this order!</p>
                              <p className="text-[10px] text-amber-800 font-medium mt-0.5">
                                Dishes are with you. Deliver to Table {order.table?.tableNumber}, then tap below.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Waiter Status Badge (if another waiter picked up) */}
                      {isClaimedByOther && (
                        <div className="p-2.5 bg-gray-100 rounded-xl text-xs text-gray-700 font-semibold flex items-center gap-2 border border-gray-200">
                          <User size={14} className="text-gray-500" />
                          <span>Being delivered by: <strong>{order.waiter?.name || "Another staff"}</strong></span>
                        </div>
                      )}

                      {/* Action Buttons: 2-Step Safe Delivery Flow */}
                      <div className="pt-1">
                        {!order.waiterId ? (
                          <Button
                            type="button"
                            onClick={() => void handleClaim(order.id, order.table?.tableNumber)}
                            disabled={loadingOrderId === order.id}
                            className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold py-3 rounded-2xl text-xs sm:text-sm shadow-sm gap-2 cursor-pointer active:scale-[0.98] transition-all"
                          >
                            <UserCheck size={16} />
                            <span>🍽️ Pick Up & Deliver to Table {order.table?.tableNumber}</span>
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            onClick={() => void handleServe(order.id, order.table?.tableNumber)}
                            disabled={loadingOrderId === order.id}
                            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold py-3.5 rounded-2xl text-xs sm:text-sm shadow-md gap-2 cursor-pointer active:scale-[0.98] transition-all"
                          >
                            <CheckCircle2 size={17} />
                            <span>✅ Food Delivered • Mark Served at Table {order.table?.tableNumber}</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: LIVE ORDERS STREAM */}
        {/* ========================================================================= */}
        {activeTab === "ORDERS" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-base font-cormorant text-gray-900">
                Floor Guest Orders ({filteredOrders.length})
              </h2>
              <span className="text-xs font-semibold text-gray-500">
                {orders.length} Active Total
              </span>
            </div>

            {/* Search and Filters */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                <input
                  type="text"
                  placeholder="Search table # or order..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-gray-200 text-xs text-gray-800 placeholder:text-gray-400 shadow-xs focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide">
                {(["ALL", "PENDING", "PREPARING", "SERVED"] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setStatusFilter(filter)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${statusFilter === filter
                      ? "bg-gray-900 text-white shadow-xs"
                      : "bg-white text-gray-600 border border-gray-200"
                      }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders Feed */}
            <div className="space-y-3">
              {filteredOrders.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-gray-200 text-xs text-gray-500">
                  No orders match your filter.
                </div>
              ) : (
                filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl border border-gray-200/90 p-4 space-y-2.5 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-200 font-bold rounded-lg text-xs flex items-center gap-1">
                        <Armchair size={12} /> Table {order.table?.tableNumber}
                      </span>
                      <span className="font-mono text-xs font-bold text-gray-600">
                        #{order.orderNumber}
                      </span>
                    </div>

                    <div className="bg-gray-50 p-2.5 rounded-xl text-xs space-y-1">
                      <div className="flex flex-wrap gap-1">
                        {order.items.map((item) => (
                          <span
                            key={item.id}
                            className="bg-white px-2 py-0.5 rounded border border-gray-200 text-gray-700 text-[11px]"
                          >
                            {item.quantity}x {item.product?.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-gray-100 text-[11px] text-gray-500">
                      <span>₹{order.totalAmount.toLocaleString("en-IN")}</span>
                      <Badge
                        className={`text-[10px] font-bold ${getOrderStatusBadgeClass(order.status)}`}
                      >
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: DINING TABLES GRID */}
        {/* ========================================================================= */}
        {activeTab === "TABLES" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-base font-cormorant text-gray-900">
                Floor Tables Matrix ({tables.length})
              </h2>
              <span className="text-xs font-semibold text-gray-500">
                {tables.filter((t) => t.activeOrder).length} Occupied
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {tables.map((table) => {
                const isReady = table.dynamicStatus === "READY_TO_SERVE";
                const isOccupied = Boolean(table.activeOrder);

                let cardStyles = "border-gray-200";
                let iconColor = "text-gray-400";
                let badgeStyles = "bg-gray-100 text-gray-600";

                if (isReady) {
                  cardStyles = "border-emerald-500 bg-emerald-50/40 animate-pulse";
                  iconColor = "text-emerald-600";
                  badgeStyles = "bg-emerald-600 text-white";
                } else if (isOccupied) {
                  cardStyles = "border-amber-300 bg-amber-50/20";
                  iconColor = "text-amber-600";
                  badgeStyles = "bg-amber-100 text-amber-900";
                }

                return (
                  <div
                    key={table.id}
                    className={`bg-white rounded-2xl border-2 p-3.5 space-y-2 shadow-xs transition-all ${cardStyles}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Armchair size={16} className={iconColor} />
                        <span className="font-bold text-sm text-gray-900 font-cormorant">
                          Table {table.tableNumber}
                        </span>
                      </div>

                      <span className="text-[10px] font-semibold text-gray-400">
                        {table.capacity}p
                      </span>
                    </div>

                    {table.activeOrder ? (
                      <div className="text-[11px] text-gray-600 bg-white/80 p-2 rounded-lg border border-gray-100">
                        <p className="font-bold text-gray-900 line-clamp-1">
                          #{table.activeOrder.orderNumber}
                        </p>
                        <p className="text-gray-500 text-[10px] line-clamp-1">
                          {table.activeOrder.itemsSummary}
                        </p>
                      </div>
                    ) : (
                      <div className="py-2 text-center text-[10px] text-emerald-700 font-bold bg-emerald-50/60 rounded-lg">
                        Available / Empty
                      </div>
                    )}

                    <div className="pt-1 flex items-center justify-between text-[10px]">
                      <Badge className={`text-[9px] font-bold ${badgeStyles}`}>
                        {isReady ? "⚡ READY TO SERVE" : table.dynamicStatus}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: MY SHIFT & PERFORMANCE */}
        {/* ========================================================================= */}
        {activeTab === "SHIFT" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Waiter Card */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white p-5 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  {user.image ? (
                    <Image
                      src={user.image}
                      alt={user.name}
                      width={50}
                      height={50}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-white/20 shadow-md"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white font-cormorant font-bold text-xl flex items-center justify-center border-2 border-white/20 shadow-md">
                      {initials}
                    </div>
                  )}
                  <div>
                    <h2 className="text-lg font-bold font-cormorant text-white">{user.name}</h2>
                    <p className="text-xs text-gray-300">{user.email}</p>
                    <p className="text-[10px] text-emerald-400 font-semibold mt-0.5">
                      🟢 Active On Floor Shift
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(true)}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 active:bg-white/25 border border-white/20 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <Pencil size={13} className="text-amber-400" />
                  <span>Edit</span>
                </button>
              </div>

              {/* Action button to update profile */}
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(true)}
                className="w-full bg-white/10 hover:bg-white/15 active:bg-white/20 border border-white/15 text-white font-medium py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
              >
                <UserCog size={15} className="text-amber-400" />
                <span>Update Profile & Settings</span>
              </button>

              {/* Stats Strip */}
              <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-white/10">
                <div className="bg-white/10 p-3 rounded-xl text-center">
                  <p className="text-[10px] text-gray-300 uppercase font-semibold">
                    My Served Today
                  </p>
                  <p className="text-2xl font-bold text-amber-300 mt-0.5">
                    {myServedOrders.length}{" "}
                    <span className="text-xs font-normal text-amber-200">Tables</span>
                  </p>
                </div>

                <div className="bg-white/10 p-3 rounded-xl text-center">
                  <p className="text-[10px] text-gray-300 uppercase font-semibold">
                    My Shift Sales
                  </p>
                  <p className="text-2xl font-bold text-emerald-300 mt-0.5">
                    ₹
                    {myServedOrders
                      .reduce((s, o) => s + Number(o.totalAmount), 0)
                      .toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            </div>

            {/* My Served Orders Today */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-gray-900 font-cormorant flex items-center gap-1.5">
                  <span>Today&apos;s Served Tables</span>
                  <span className="text-[11px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                    {myServedOrders.length}
                  </span>
                </h3>

                <button
                  type="button"
                  onClick={() => setIsHistoryModalOpen(true)}
                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 active:bg-amber-200 border border-amber-200/80 rounded-xl text-xs font-bold text-amber-900 flex items-center gap-1.5 transition-all shadow-2xs"
                >
                  <History size={13} className="text-amber-700" />
                  <span>View All History</span>
                </button>
              </div>

              {myServedOrders.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-gray-200 text-xs text-gray-500 space-y-2">
                  <p>You haven&apos;t marked any tables as served yet today.</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsHistoryModalOpen(true)}
                    className="rounded-xl text-xs h-8 border-amber-200 text-amber-800 hover:bg-amber-50 gap-1.5"
                  >
                    <History size={13} />
                    <span>View Past Days History</span>
                  </Button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {myServedOrders.map((order) => (
                    <button
                      key={order.id}
                      type="button"
                      onClick={() => setIsHistoryModalOpen(true)}
                      className="w-full text-left bg-white p-3.5 rounded-xl border border-gray-200/90 shadow-xs flex items-center justify-between cursor-pointer hover:border-amber-300 transition-all active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                          <CheckCircle2 size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-xs text-gray-900">
                            Table {order.table?.tableNumber} (#{order.orderNumber})
                          </p>
                          <p className="text-[10px] text-gray-500 flex items-center gap-1">
                            <Clock size={10} className="text-amber-600" />
                            {format(new Date(order.updatedAt || order.createdAt), "hh:mm a")} • {order.items.length} items
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-xs text-gray-900">
                          ₹{Number(order.totalAmount).toLocaleString("en-IN")}
                        </span>
                        <p className="text-[9px] text-amber-700 font-semibold flex items-center justify-end gap-0.5 mt-0.5">
                          <span>Details</span> ➔
                        </p>
                      </div>
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setIsHistoryModalOpen(true)}
                    className="w-full py-2.5 px-3 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 border border-amber-200 rounded-xl text-xs font-bold text-amber-900 flex items-center justify-center gap-2 transition-all shadow-2xs"
                  >
                    <History size={15} className="text-amber-700" />
                    <span>Open Full History (Day & Time Wise)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Logout / End Shift Button */}
            <div className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleLogout}
                className="w-full rounded-2xl border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold py-3 gap-2"
              >
                <LogOut size={15} />
                <span>End Shift / Logout</span>
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Mobile Navigation Bar */}
      <WaiterMobileNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        readyOrdersCount={readyOrders.length}
        newOrdersCount={newOrders.length}
      />

      {/* Interactive Profile Management Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={user}
        onProfileUpdated={(updated) => setCustomUser(updated)}
      />

      {/* Full Order History Modal (Day-wise & Time-wise) */}
      <WaiterHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        waiterId={currentUser.id}
        waiterName={user.name}
      />
    </div>
  );
}
