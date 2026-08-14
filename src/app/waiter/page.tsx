"use client";

import { useEffect, useState, useCallback } from "react";
import { useSocket } from "@/components/providers/socket-provider";
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

} from "lucide-react";
import { Button } from "@/components/ui/button";

type WaiterOrder = {
  id: string;
  orderNumber: string;
  customerName?: string;
  notes?: string;
  totalAmount: number;
  status: string;
  table: { tableNumber: string; capacity?: number };
  items: Array<{
    id: string;
    quantity: number;
    product: { name: string; foodType?: string };
  }>;
  createdAt: string;
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
  const [orders, setOrders] = useState<WaiterOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`/api/waiter/orders?status=ALL&t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      toast.error("Failed to load live orders");
    } finally {
      setLoading(false);
    }
  }, []);

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
          toast.error("Failed to load live orders");
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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchOrders();
    setIsRefreshing(false);
  };

  // Socket listener for real-time updates
  useEffect(() => {
    if (!socket) return;

    const playNotificationSound = () => {
      if (!soundEnabled) return;
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } catch (e) {
        console.log("Audio play error", e);
      }
    };

    const handleOrderReady = (order: WaiterOrder) => {
      // Add or update the order in the list
      setOrders((prev) => {
        const exists = prev.some((o) => o.id === order.id);
        if (exists) {
          return prev.map((o) => (o.id === order.id ? { ...o, status: "READY" } : o));
        }
        return [{ ...order, status: "READY" }, ...prev];
      });

      playNotificationSound();

      toast.custom(
        (t) => (
          <div className="bg-white border-l-4 border-emerald-500 shadow-2xl rounded-2xl p-4 flex flex-col gap-2 font-sans w-84 border border-gray-100">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl text-lg">🛎️</span>
              <div>
                <h3 className="font-bold text-sm text-gray-900 font-cormorant text-base">
                  Dish Ready for Table {order.table?.tableNumber || "Takeaway"}!
                </h3>
                <p className="text-[11px] text-gray-500 font-mono">
                  Order #{order.orderNumber}
                </p>
              </div>
            </div>
            <div className="bg-emerald-50/60 p-2 rounded-xl text-xs text-emerald-800 font-medium">
              Kitchen has prepared this order. Please serve to guest.
            </div>
            <button type="button"
              onClick={() => toast.dismiss(t.id)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-1 px-3 rounded-xl text-xs font-bold transition-colors self-end"
            >
              Dismiss
            </button>
          </div>
        ),
        { duration: 6000, position: "top-right" }
      );
    };

    const handleOrderServed = () => {
      void fetchOrders();
    };

    const handleNewOrder = () => {
      void fetchOrders();
    };

    socket.on("order:ready", handleOrderReady);
    socket.on("order:served", handleOrderServed);
    socket.on("order:created", handleNewOrder);
    socket.on("order:updated", handleOrderServed);

    return () => {
      socket.off("order:ready", handleOrderReady);
      socket.off("order:served", handleOrderServed);
      socket.off("order:created", handleNewOrder);
      socket.off("order:updated", handleOrderServed);
    };
  }, [socket, soundEnabled, fetchOrders]);

  const handleServe = async (orderId: string) => {
    setLoadingOrderId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "SERVED" }),
      });
      if (res.ok) {
        toast.success("Order marked as served to table!");
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: "SERVED" } : o))
        );
      } else {
        toast.error("Failed to serve order");
      }
    } catch (error) {
      console.error("Failed to serve order:", error);
      toast.error("An error occurred while updating order");
    } finally {
      setLoadingOrderId(null);
    }
  };

  const newOrders = orders.filter((o) => ["PENDING", "ACCEPTED"].includes(o.status));
  const preparingOrders = orders.filter((o) => o.status === "PREPARING");
  const readyOrders = orders.filter((o) => o.status === "READY");
  const servedOrders = orders.filter((o) => ["SERVED", "PAID"].includes(o.status));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 space-y-4 bg-white rounded-3xl border border-gray-100 shadow-sm">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-culinary-primary border-t-transparent"></div>
        <p className="text-sm font-semibold text-gray-500 animate-pulse">
          Connecting to live floor waitstaff feed...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans pb-16 animate-in fade-in duration-500">

      {/* ===================== TOP COMMAND BAR ===================== */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-amber-50 text-culinary-primary rounded-2xl border border-amber-100 shrink-0">
            <ChefHat size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
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
                {isConnected ? "🟢 Kitchen Live Sync" : "🔴 Disconnected"}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Live dispatch channel for order serving and table dining assistance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* Sound toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${soundEnabled
              ? "bg-amber-50 text-culinary-primary border-amber-200"
              : "bg-gray-50 text-gray-400 border-gray-200"
              }`}
            title="Toggle notification chime sound"
          >
            {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            <span>{soundEnabled ? "Chime On" : "Muted"}</span>
          </button>

          {/* Sync Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
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

      {/* ===================== TOP 4 OPERATIONAL KPI CARDS ===================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* New Orders */}
        <Link href="/waiter/orders" className="block group">
          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm group-hover:border-blue-300 group-hover:shadow-md transition-all flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">New Orders</p>
              <p className="text-3xl font-bold text-blue-700">{newOrders.length}</p>
              <p className="text-[11px] text-blue-600 font-semibold flex items-center gap-1">
                <ShoppingBag size={12} /> Pending routing
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
          <div className={`p-5 rounded-2xl shadow-sm transition-all flex items-center justify-between border-2 ${readyOrders.length > 0
            ? "bg-emerald-50/70 border-emerald-400 shadow-emerald-100 shadow-md animate-pulse"
            : "bg-white border-gray-200/80 group-hover:border-emerald-300"
            }`}>
            <div className="space-y-1">
              <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={13} className="text-emerald-600" /> Ready to Serve
              </p>
              <p className="text-3xl font-bold text-emerald-700">{readyOrders.length}</p>
              <p className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 size={12} /> At the kitchen pass
              </p>
            </div>
            <div className="p-3.5 bg-emerald-100 text-emerald-700 rounded-2xl border border-emerald-300 shadow-sm">
              <ChefHat size={24} />
            </div>
          </div>
        </Link>

        {/* Served Today */}
        <Link href="/waiter/served" className="block group">
          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm group-hover:border-purple-300 group-hover:shadow-md transition-all flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Served / Dining</p>
              <p className="text-3xl font-bold text-purple-700">{servedOrders.length}</p>
              <p className="text-[11px] text-purple-600 font-semibold flex items-center gap-1">
                <CheckCircle size={12} /> Delivered to tables
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

          <Link href="/waiter/ready" className="text-xs font-bold text-culinary-primary hover:underline flex items-center gap-1">
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
              When the kitchen flags an order as &quot;Ready&quot;, an urgent card and audio chime will trigger here automatically.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {readyOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white border-2 border-emerald-400 shadow-lg rounded-2xl overflow-hidden flex flex-col justify-between"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-4 text-white flex justify-between items-center">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-white text-emerald-800 font-bold text-sm flex items-center justify-center font-cormorant text-lg shadow-sm">
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
                          <span className="font-semibold text-gray-800">
                            {item.product.name}
                          </span>
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

                {/* Action Button */}
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
                        Mark as Served to Table
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
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg font-cormorant text-gray-900 flex items-center gap-2">
              <Receipt size={16} className="text-culinary-primary" /> Active Dining Tickets
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Live status tracking of all active guest orders on the floor
            </p>
          </div>

          <Link href="/waiter/orders">
            <Button
              variant="outline"
              size="sm"
              className="text-xs font-bold rounded-xl border-amber-200 text-culinary-primary hover:bg-amber-50 h-8 gap-1"
            >
              <span>View All ({orders.length})</span>
              <ArrowRight size={13} />
            </Button>
          </Link>
        </div>

        <div className="divide-y divide-gray-100">
          {orders.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-xs">
              <ShoppingBag size={28} className="mx-auto mb-2 text-gray-300" />
              No active floor tickets found.
            </div>
          ) : (
            orders.slice(0, 6).map((order) => (
              <div
                key={order.id}
                className="p-4 hover:bg-gray-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 text-culinary-primary font-bold text-sm flex items-center justify-center border border-amber-200 font-cormorant shrink-0 mt-0.5">
                    T{order.table?.tableNumber || "T"}
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-gray-900 font-cormorant text-base">
                        Table {order.table?.tableNumber || "Takeaway"}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        #{order.orderNumber}
                      </span>
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
                    ₹{order.totalAmount.toFixed(2)}
                  </span>
                  <div>
                    {order.status === "READY" ? (
                      <Button
                        size="sm"
                        onClick={() => handleServe(order.id)}
                        disabled={loadingOrderId === order.id}
                        className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg px-2.5"
                      >
                        Serve Now
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
            ))
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
  );
}
