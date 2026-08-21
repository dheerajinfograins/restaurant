"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useSocket } from "@/components/providers/socket-provider";
import { useWaiterUser } from "@/components/providers/waiter-user-provider";
import { WaiterMobileApp } from "@/components/waiter/WaiterMobileApp";
import toast from "react-hot-toast";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  ChefHat,
  ShoppingBag,
  CheckCircle,
  Clock,
  RotateCw,
  Volume2,
  VolumeX,
  Armchair,
  Receipt,
  ArrowRight,
  Sparkles,
  Flame,
  CheckCircle2,
  UserCheck,
  Search,
  BellRing,
  Award,
  CircleDollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type WaiterOrder = {
  id: string;
  orderNumber: string;
  customerName?: string;
  notes?: string;
  totalAmount: number;
  status: string;
  waiterId?: string | null;
  waiter?: {
    id: string;
    name: string;
    email: string;
  } | null;
  table: { tableNumber: string; capacity?: number };
  items: Array<{
    id: string;
    quantity: number;
    product: { name: string; foodType?: string };
  }>;
  createdAt: string;
  updatedAt: string;
};

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case "PREPARING":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "SERVED":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "PAID":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    default:
      return "bg-blue-50 text-blue-700 border-blue-200";
  }
};

export default function WaiterDashboardPage() {
  const { socket, isConnected } = useSocket();
  const { currentUser } = useWaiterUser();

  const [orders, setOrders] = useState<WaiterOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeTabFilter, setActiveTabFilter] = useState<"ALL" | "MINE">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const audioContextRef = useRef<AudioContext | null>(null);

  // Play notification chime for newly ready orders
  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }

      if (audioContextRef.current.state === "suspended") {
        void audioContextRef.current.resume();
      }

      const ctx = audioContextRef.current;
      const now = ctx.currentTime;

      // Note 1: High bell chime
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(659.25, now); // E5
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.5);

      // Note 2: Higher bell chime
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(987.77, now + 0.12); // B5
      gain2.gain.setValueAtTime(0.35, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.7);
    } catch (e) {
      console.log("Audio play error", e);
    }
  }, [soundEnabled]);

  const testChime = () => {
    playNotificationSound();
    toast.success("🔔 Audio Chime is active!", { id: "chime-test" });
  };

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`/api/waiter/orders?status=ALL&t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle Free Waiter Claim & Serve
  const handleServe = useCallback(
    async (orderId: string) => {
      setLoadingOrderId(orderId);
      try {
        const res = await fetch(`/api/orders/${orderId}/status`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "SERVED",
            waiterId: currentUser.id,
          }),
        });

        if (res.ok) {
          const updated = await res.json();
          toast.success(`Table ${updated.table?.tableNumber || ""} marked as SERVED by You!`, {
            icon: "🍽️",
          });

          setOrders((prev) =>
            prev.map((o) =>
              o.id === orderId
                ? {
                  ...o,
                  status: "SERVED",
                  waiterId: currentUser.id,
                  waiter: currentUser.id
                    ? { id: currentUser.id, name: currentUser.name, email: currentUser.email }
                    : o.waiter,
                }
                : o
            )
          );

          // Also fetch to sync all details
          void fetchOrders();
        } else {
          toast.error("Failed to mark order as served");
        }
      } catch (error) {
        console.error("Failed to serve order:", error);
        toast.error("An error occurred while updating order");
      } finally {
        setLoadingOrderId(null);
      }
    },
    [currentUser.id, currentUser.name, currentUser.email, fetchOrders]
  );

  // Initial load
  useEffect(() => {
    let ignore = false;
    async function loadInitialOrders() {
      try {
        const res = await fetch(`/api/waiter/orders?status=ALL&t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          if (!ignore) {
            setOrders(data);
          }
        }
      } catch (error) {
        if (!ignore) {
          console.error("Failed to fetch orders:", error);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void loadInitialOrders();

    return () => {
      ignore = true;
    };
  }, []);

  // Periodic backup polling every 6 seconds to guarantee 100% sync
  useEffect(() => {
    const interval = setInterval(() => {
      void fetchOrders();
    }, 6000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchOrders();
    setIsRefreshing(false);
    toast.success("Floor orders refreshed", { id: "refresh-toast" });
  };

  // Socket listener for real-time kitchen & floor events
  useEffect(() => {
    if (!socket) return;

    const handleOrderReady = (order: WaiterOrder) => {
      setOrders((prev) => {
        const exists = prev.some((o) => o.id === order.id);
        if (exists) {
          return prev.map((o) => (o.id === order.id ? { ...o, ...order, status: "READY" } : o));
        }
        return [{ ...order, status: "READY" }, ...prev];
      });

      playNotificationSound();

      toast.custom(
        (t) => (
          <div className="bg-white border-2 border-emerald-500 shadow-2xl rounded-2xl p-4 flex flex-col gap-2.5 font-sans w-88 max-w-sm border-l-8 border-l-emerald-600 animate-in slide-in-from-top-4 duration-300">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl text-xl animate-bounce">
                  🛎️
                </span>
                <div>
                  <h3 className="font-bold text-base text-gray-900 font-cormorant leading-tight">
                    Food Ready for Table {order.table?.tableNumber || "Takeaway"}!
                  </h3>
                  <p className="text-[11px] text-gray-500 font-mono">
                    Order #{order.orderNumber}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => toast.dismiss(t.id)}
                className="text-gray-400 hover:text-gray-600 text-xs px-1 py-0.5 rounded"
              >
                ✕
              </button>
            </div>
            <div className="bg-emerald-50 p-2.5 rounded-xl text-xs text-emerald-900 font-medium">
              Kitchen has plated this order. Any available waiter, please deliver to the guest.
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-emerald-700 font-bold">Urgent Food Pass</span>
              <button
                type="button"
                onClick={() => {
                  toast.dismiss(t.id);
                  void handleServe(order.id);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded-xl text-xs shadow-sm transition-colors flex items-center gap-1"
              >
                <CheckCircle2 size={13} />
                <span>I am Serving This</span>
              </button>
            </div>
          </div>
        ),
        { id: `order-ready-${order.id}`, duration: 8000, position: "top-right" }
      );
    };

    const handleOrderServed = () => {
      void fetchOrders();
    };

    const handleOrderCreated = () => {
      void fetchOrders();
    };

    const handleOrderUpdated = () => {
      void fetchOrders();
    };

    socket.on("order:ready", handleOrderReady);
    socket.on("order:served", handleOrderServed);
    socket.on("order:created", handleOrderCreated);
    socket.on("order:new", handleOrderCreated);
    socket.on("order:updated", handleOrderUpdated);

    return () => {
      socket.off("order:ready", handleOrderReady);
      socket.off("order:served", handleOrderServed);
      socket.off("order:created", handleOrderCreated);
      socket.off("order:new", handleOrderCreated);
      socket.off("order:updated", handleOrderUpdated);
    };
  }, [socket, playNotificationSound, fetchOrders, handleServe]);

  // Operational categories
  const newOrders = useMemo(
    () => orders.filter((o) => ["PENDING", "ACCEPTED"].includes(o.status)),
    [orders]
  );
  const preparingOrders = useMemo(
    () => orders.filter((o) => o.status === "PREPARING"),
    [orders]
  );
  const readyOrders = useMemo(
    () => orders.filter((o) => o.status === "READY"),
    [orders]
  );
  const servedOrders = useMemo(
    () => orders.filter((o) => ["SERVED", "PAID"].includes(o.status)),
    [orders]
  );

  // My Personal Waiter Stats
  const myServedOrders = useMemo(() => {
    if (!currentUser.id) return [];
    return orders.filter(
      (o) => o.waiterId === currentUser.id && ["SERVED", "PAID"].includes(o.status)
    );
  }, [orders, currentUser.id]);

  const myTotalServedValue = useMemo(() => {
    return myServedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  }, [myServedOrders]);

  const myActiveDiningTables = useMemo(() => {
    if (!currentUser.id) return [];
    return orders.filter((o) => o.waiterId === currentUser.id && o.status === "SERVED");
  }, [orders, currentUser.id]);

  // Filtered orders list for the floor table view
  const filteredOrders = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return orders.filter((o) => {
      const matchesSearch =
        !q ||
        o.orderNumber.toLowerCase().includes(q) ||
        o.table.tableNumber.toLowerCase().includes(q) ||
        o.customerName?.toLowerCase().includes(q) ||
        o.waiter?.name.toLowerCase().includes(q);

      const matchesTab =
        activeTabFilter === "ALL"
          ? true
          : currentUser.id
            ? o.waiterId === currentUser.id
            : true;

      return matchesSearch && matchesTab;
    });
  }, [orders, searchQuery, activeTabFilter, currentUser.id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 space-y-4 bg-white rounded-3xl border border-gray-100 shadow-sm">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-culinary-primary border-t-transparent"></div>
        <p className="text-sm font-semibold text-gray-500 animate-pulse">
          Connecting to live waitstaff floor terminal...
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile-First Waiter App (< md screens / smartphones) */}
      <div className="block md:hidden min-h-full">
        <WaiterMobileApp />
      </div>

      {/* Desktop / Tablet Floor Terminal (>= md screens) */}
      <div className="hidden md:block space-y-6 font-sans pb-16 animate-in fade-in duration-500">
        {/* ===================== TOP COMMAND BAR ===================== */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-amber-50 text-culinary-primary rounded-2xl border border-amber-100 shrink-0">
              <ChefHat size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold font-cormorant text-gray-900">
                  Waitstaff Floor Terminal
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
                  {isConnected ? "🟢 Kitchen Live Sync" : "🔴 Reconnecting..."}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Logged in as <strong className="text-gray-800 font-semibold">{currentUser.name}</strong> • Real-time dish ready alerts and table dispatch
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
            {/* Sound toggle & Test */}
            <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-200/80">
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${soundEnabled
                  ? "bg-amber-100 text-culinary-primary shadow-xs"
                  : "bg-white text-gray-400"
                  }`}
                title="Toggle notification chime sound"
              >
                {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                <span>{soundEnabled ? "Chime On" : "Muted"}</span>
              </button>
              {soundEnabled && (
                <button
                  type="button"
                  onClick={testChime}
                  className="px-2 py-1.5 text-[11px] font-bold text-gray-600 hover:text-culinary-primary hover:bg-white rounded-lg transition-colors flex items-center gap-1"
                  title="Test audio chime"
                >
                  <BellRing size={12} />
                  <span>Test</span>
                </button>
              )}
            </div>

            {/* Sync Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-xs h-9 gap-1.5 border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-xl shadow-none font-bold"
            >
              <RotateCw
                className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-culinary-primary" : ""
                  }`}
              />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* ===================== MY SHIFT STATS SUMMARY ===================== */}
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent p-4 md:p-5 rounded-2xl border border-amber-200/70 shadow-xs">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-3">
            <div className="flex items-center gap-2">
              <Award className="text-culinary-primary" size={18} />
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                My Waitstaff Shift Performance • {currentUser.name}
              </h2>
            </div>
            <span className="text-[11px] font-semibold text-gray-500 bg-white/80 px-2.5 py-0.5 rounded-full border border-amber-200">
              Personal service tracker
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-amber-100 shadow-xs">
              <p className="text-[10px] uppercase font-bold text-gray-400">My Served Orders</p>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-emerald-700">{myServedOrders.length}</span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                  Delivered
                </span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-amber-100 shadow-xs">
              <p className="text-[10px] uppercase font-bold text-gray-400">My Active Dining</p>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-purple-700">{myActiveDiningTables.length}</span>
                <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                  Tables
                </span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-amber-100 shadow-xs">
              <p className="text-[10px] uppercase font-bold text-gray-400">My Shift Value Served</p>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-gray-900">₹{Number(myTotalServedValue || 0).toFixed(0)}</span>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  <CircleDollarSign size={10} /> Total
                </span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-amber-100 shadow-xs flex flex-col justify-center">
              <p className="text-[10px] uppercase font-bold text-gray-400">Floor Pass Status</p>
              <p className="text-xs font-bold text-gray-800 mt-1 flex items-center gap-1.5">
                {readyOrders.length > 0 ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <Sparkles size={13} className="text-emerald-600 animate-spin" />
                    {readyOrders.length} dish{readyOrders.length > 1 ? "es" : ""} waiting at pass!
                  </span>
                ) : (
                  <span className="text-gray-500 font-medium">All hot dishes delivered to tables</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* ===================== TOP 4 OPERATIONAL KPI CARDS ===================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* New Orders */}
          <Link href="/waiter/orders" className="block group">
            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm group-hover:border-blue-300 group-hover:shadow-md transition-all flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">New Orders</p>
                <p className="text-3xl font-bold text-blue-700">{newOrders.length}</p>
                <p className="text-[11px] text-blue-600 font-semibold flex items-center gap-1">
                  <ShoppingBag size={12} /> Pending kitchen
                </p>
              </div>
              <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
                <ShoppingBag size={24} />
              </div>
            </div>
          </Link>

          {/* Kitchen Cooking */}
          <Link href="/waiter/orders" className="block group">
            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm group-hover:border-amber-300 group-hover:shadow-md transition-all flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Kitchen Cooking</p>
                <p className="text-3xl font-bold text-amber-700">{preparingOrders.length}</p>
                <p className="text-[11px] text-amber-600 font-semibold flex items-center gap-1">
                  <Flame size={12} /> In preparation
                </p>
              </div>
              <div className="p-3.5 bg-amber-50 text-culinary-primary rounded-2xl border border-amber-100">
                <Flame size={24} />
              </div>
            </div>
          </Link>

          {/* Ready to Serve (Urgent Alert) */}
          <Link href="/waiter/ready" className="block group">
            <div
              className={`p-5 rounded-2xl shadow-sm transition-all flex items-center justify-between border-2 ${readyOrders.length > 0
                ? "bg-emerald-50/90 border-emerald-500 shadow-emerald-100 shadow-md ring-2 ring-emerald-400/40 animate-pulse"
                : "bg-white border-gray-200/80 group-hover:border-emerald-300"
                }`}
            >
              <div className="space-y-1">
                <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={13} className="text-emerald-600" /> Ready to Serve
                </p>
                <p className="text-3xl font-bold text-emerald-700">{readyOrders.length}</p>
                <p className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 size={12} /> At kitchen food pass
                </p>
              </div>
              <div className="p-3.5 bg-emerald-100 text-emerald-700 rounded-2xl border border-emerald-300 shadow-sm">
                <ChefHat size={24} />
              </div>
            </div>
          </Link>

          {/* Served / Dining */}
          <Link href="/waiter/served" className="block group">
            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm group-hover:border-purple-300 group-hover:shadow-md transition-all flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Served / Dining</p>
                <p className="text-3xl font-bold text-purple-700">{servedOrders.length}</p>
                <p className="text-[11px] text-purple-600 font-semibold flex items-center gap-1">
                  <CheckCircle size={12} /> Active guest tables
                </p>
              </div>
              <div className="p-3.5 bg-purple-50 text-purple-600 rounded-2xl border border-purple-100">
                <CheckCircle size={24} />
              </div>
            </div>
          </Link>
        </div>

        {/* ===================== URGENT: READY TO SERVE PASS ===================== */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-gray-200 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
              <h2 className="text-xl font-bold font-cormorant text-gray-900 tracking-wide">
                URGENT FOOD PASS • READY FOR TABLE DELIVERY
              </h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                {readyOrders.length} Ready
              </span>
            </div>

            <Link
              href="/waiter/ready"
              className="text-xs font-bold text-culinary-primary hover:underline flex items-center gap-1"
            >
              <span>Pass View</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {readyOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200/80 p-8 text-center space-y-2 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center mx-auto border border-gray-100">
                <ChefHat size={24} />
              </div>
              <p className="font-bold text-gray-800 text-sm">No dishes waiting at the pass right now.</p>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                When the kitchen flags an order as &quot;Ready&quot;, an urgent card and audio chime will trigger here automatically for all active waiters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {readyOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white border-2 border-emerald-500 shadow-lg shadow-emerald-500/10 rounded-2xl overflow-hidden flex flex-col justify-between"
                >
                  {/* Header */}
                  <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-4 text-white flex justify-between items-center">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-white text-emerald-800 font-bold text-base flex items-center justify-center font-cormorant text-xl shadow-sm">
                        T{order.table?.tableNumber || "T"}
                      </div>
                      <div>
                        <h3 className="font-bold text-base font-cormorant leading-tight">
                          Table {order.table?.tableNumber || "Takeaway"}
                        </h3>
                        <p className="text-[10px] text-emerald-100 font-mono">
                          #{order.orderNumber}
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                      {formatDistanceToNow(new Date(order.createdAt))} ago
                    </span>
                  </div>

                  {/* Items */}
                  <div className="p-4 flex-1 space-y-3">
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                        Ordered Dishes ({order.items.length})
                      </p>
                      <div className="divide-y divide-gray-100 bg-gray-50/60 rounded-xl p-2.5 border border-gray-200/60 max-h-36 overflow-y-auto">
                        {order.items.map((item) => (
                          <div key={item.id} className="py-1 flex justify-between items-center text-xs">
                            <span className="font-semibold text-gray-800">{item.product.name}</span>
                            <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                              x{item.quantity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {order.notes && (
                      <div className="p-2 bg-amber-50/70 border border-amber-200 rounded-xl text-[11px] text-amber-900 font-medium">
                        📝 <span className="font-bold">Guest Note:</span> {order.notes}
                      </div>
                    )}
                  </div>

                  {/* Single Click Pick Up & Serve Action */}
                  <div className="p-4 pt-0">
                    <Button
                      onClick={() => handleServe(order.id)}
                      disabled={loadingOrderId === order.id}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                      {loadingOrderId === order.id ? (
                        <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                      ) : (
                        <>
                          <CheckCircle2 size={15} />
                          Pick Up & Serve Table
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ===================== ACTIVE FLOOR ORDERS LIST ===================== */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-lg font-cormorant text-gray-900 flex items-center gap-2">
                <Receipt size={16} className="text-culinary-primary" /> Active Dining Tickets
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Live status tracking of all active guest orders on the floor
              </p>
            </div>

            {/* Filter toggle: All vs My Served Only */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center bg-gray-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTabFilter("ALL")}
                  className={`px-3 py-1.5 rounded-lg transition-all ${activeTabFilter === "ALL"
                    ? "bg-white text-gray-900 font-bold shadow-xs"
                    : "text-gray-500 hover:text-gray-900"
                    }`}
                >
                  All Floor Tickets ({orders.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTabFilter("MINE")}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${activeTabFilter === "MINE"
                    ? "bg-emerald-600 text-white font-bold shadow-xs"
                    : "text-gray-500 hover:text-gray-900"
                    }`}
                >
                  <UserCheck size={13} />
                  <span>My Served ({myServedOrders.length})</span>
                </button>
              </div>

              <div className="relative w-full sm:w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input
                  type="text"
                  placeholder="Search ticket..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-gray-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-culinary-primary/20 text-gray-800"
                />
              </div>

              <Link href="/waiter/orders">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs font-bold rounded-xl border-amber-200 text-culinary-primary hover:bg-amber-50 h-8 gap-1"
                >
                  <span>View Full Page</span>
                  <ArrowRight size={13} />
                </Button>
              </Link>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {filteredOrders.length === 0 ? (
              <div className="p-12 text-center text-gray-400 text-xs">
                <ShoppingBag size={28} className="mx-auto mb-2 text-gray-300" />
                {activeTabFilter === "MINE"
                  ? "You haven't served any orders in this session yet."
                  : "No active floor tickets found."}
              </div>
            ) : (
              filteredOrders.slice(0, 8).map((order) => {
                const isMine = order.waiterId === currentUser.id;

                return (
                  <div
                    key={order.id}
                    className="p-4 hover:bg-gray-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 text-culinary-primary font-bold text-sm flex items-center justify-center border border-amber-200 font-cormorant shrink-0 mt-0.5">
                        T{order.table?.tableNumber || "T"}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-gray-900 font-cormorant text-base">
                            Table {order.table?.tableNumber || "Takeaway"}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono">
                            #{order.orderNumber}
                          </span>

                          {/* Waiter badge */}
                          {isMine ? (
                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-full border border-emerald-200 flex items-center gap-1">
                              <UserCheck size={10} /> Served by You
                            </span>
                          ) : order.waiter?.name ? (
                            <span className="text-[10px] font-semibold bg-gray-100 text-gray-700 px-2 py-0.2 rounded-full border border-gray-200">
                              Waiter: {order.waiter.name}
                            </span>
                          ) : null}
                        </div>

                        <p className="text-[11px] text-gray-500">
                          {order.items.map((i) => `${i.quantity}x ${i.product.name}`).join(", ")}
                        </p>
                        <p className="text-[10px] text-gray-400 flex items-center gap-1">
                          <Clock size={10} /> Placed {formatDistanceToNow(new Date(order.createdAt))} ago
                        </p>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0">
                      <span className="font-bold text-sm text-gray-900">
                        ₹{Number(order.totalAmount || 0).toFixed(2)}
                      </span>
                      <div>
                        {order.status === "READY" ? (
                          <Button
                            size="sm"
                            onClick={() => handleServe(order.id)}
                            disabled={loadingOrderId === order.id}
                            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg px-2.5"
                          >
                            {loadingOrderId === order.id ? "Serving..." : "Serve Now"}
                          </Button>
                        ) : (
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(
                              order.status
                            )}`}
                          >
                            {order.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ===================== QUICK FLOOR SHORTCUTS ===================== */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          <Link
            href="/waiter/tables"
            className="bg-white p-4 rounded-2xl border border-gray-200/80 hover:border-amber-300 hover:shadow-md transition-all flex items-center gap-3 group"
          >
            <div className="p-2.5 bg-amber-50 text-culinary-primary rounded-xl group-hover:scale-110 transition-transform">
              <Armchair size={18} />
            </div>
            <div>
              <h5 className="font-bold text-xs text-gray-900 group-hover:text-culinary-primary">Floor Tables</h5>
              <p className="text-[10px] text-gray-400">View table occupancy</p>
            </div>
          </Link>

          <Link
            href="/waiter/orders"
            className="bg-white p-4 rounded-2xl border border-gray-200/80 hover:border-blue-300 hover:shadow-md transition-all flex items-center gap-3 group"
          >
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
              <Receipt size={18} />
            </div>
            <div>
              <h5 className="font-bold text-xs text-gray-900 group-hover:text-blue-600">All Orders</h5>
              <p className="text-[10px] text-gray-400">Filter floor tickets</p>
            </div>
          </Link>

          <Link
            href="/waiter/ready"
            className="bg-white p-4 rounded-2xl border border-gray-200/80 hover:border-emerald-300 hover:shadow-md transition-all flex items-center gap-3 group"
          >
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
              <ChefHat size={18} />
            </div>
            <div>
              <h5 className="font-bold text-xs text-gray-900 group-hover:text-emerald-600">Ready Pass</h5>
              <p className="text-[10px] text-gray-400">Food ready to run</p>
            </div>
          </Link>

          <Link
            href="/waiter/history"
            className="bg-white p-4 rounded-2xl border border-gray-200/80 hover:border-purple-300 hover:shadow-md transition-all flex items-center gap-3 group"
          >
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 transition-transform">
              <CheckCircle size={18} />
            </div>
            <div>
              <h5 className="font-bold text-xs text-gray-900 group-hover:text-purple-600">Shift History</h5>
              <p className="text-[10px] text-gray-400">Completed services</p>
            </div>
          </Link>
        </div>
      </div>
    </>
  );
}
