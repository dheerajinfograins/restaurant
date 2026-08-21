"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSocket } from "@/components/providers/socket-provider";
import { useWaiterUser } from "@/components/providers/waiter-user-provider";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import {
  ChefHat,
  RotateCw,
  CheckCircle2,
  Volume2,
  VolumeX,
  BellRing,
  Sparkles,
  Clock,
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
  table: { tableNumber: string; capacity?: number };
  items: Array<{ id: string; quantity: number; product: { name: string; foodType?: string } }>;
  createdAt: string;
};

export default function ReadyOrdersPage() {
  const { socket, isConnected } = useSocket();
  const { currentUser } = useWaiterUser();

  const [orders, setOrders] = useState<WaiterOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const audioContextRef = useRef<AudioContext | null>(null);

  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
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

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.5);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(987.77, now + 0.12);
      gain2.gain.setValueAtTime(0.35, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.7);
    } catch {
      // Audio playback handling
    }
  }, [soundEnabled]);

  const testChime = () => {
    playNotificationSound();
    toast.success("🔔 Sound chime is working!", { id: "test-chime" });
  };

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`/api/waiter/orders?status=READY&t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Failed to fetch ready orders:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadInitialOrders() {
      try {
        const res = await fetch(`/api/waiter/orders?status=READY&t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          if (!ignore) {
            setOrders(data);
          }
        }
      } catch (error) {
        if (!ignore) {
          console.error("Failed to fetch ready orders:", error);
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

  // Periodic backup polling every 5 seconds for fast response
  useEffect(() => {
    const interval = setInterval(() => {
      void fetchOrders();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchOrders();
    setIsRefreshing(false);
    toast.success("Food pass refreshed", { id: "refresh-pass" });
  };

  useEffect(() => {
    if (!socket) return;

    const handleOrderReady = (order: WaiterOrder) => {
      setOrders((prev) => {
        const exists = prev.some((o) => o.id === order.id);
        if (exists) return prev.map((o) => (o.id === order.id ? order : o));
        return [order, ...prev];
      });
      playNotificationSound();
      toast.success(
        `🛎️ Hot Dish Ready for Table ${order.table?.tableNumber || "Takeaway"}!`,
        { id: `order-ready-pass-${order.id}` }
      );
    };

    const handleOrderServed = (data: { id?: string; orderId?: string }) => {
      const targetId = data.id || data.orderId;
      if (targetId) {
        setOrders((prev) => prev.filter((o) => o.id !== targetId));
      } else {
        void fetchOrders();
      }
    };

    const handleOrderUpdated = (order: WaiterOrder) => {
      if (order.status !== "READY") {
        setOrders((prev) => prev.filter((o) => o.id !== order.id));
      } else {
        setOrders((prev) => {
          const exists = prev.some((o) => o.id === order.id);
          if (exists) return prev.map((o) => (o.id === order.id ? order : o));
          return [order, ...prev];
        });
      }
    };

    socket.on("order:ready", handleOrderReady);
    socket.on("order:served", handleOrderServed);
    socket.on("order:updated", handleOrderUpdated);

    return () => {
      socket.off("order:ready", handleOrderReady);
      socket.off("order:served", handleOrderServed);
      socket.off("order:updated", handleOrderUpdated);
    };
  }, [socket, playNotificationSound, fetchOrders]);

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
        toast.success(`Table ${tableNumber} marked as Served by You!`, {
          icon: "🍽️",
        });
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
      } else {
        toast.error("Failed to serve order");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setLoadingOrderId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 space-y-4 bg-white rounded-3xl border border-gray-100 shadow-sm">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-culinary-primary border-t-transparent"></div>
        <p className="text-sm font-semibold text-gray-500 animate-pulse">
          Connecting to live kitchen pass...
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-0 space-y-6 font-sans pb-16 animate-in fade-in duration-500">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-200 shrink-0">
            <ChefHat size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold font-cormorant text-gray-900">
                Kitchen Pass • Ready for Table Service
              </h1>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                <Sparkles size={11} className="text-emerald-600" />
                {orders.length} Ready Now
              </span>
              <span className="text-[11px] font-semibold text-gray-400">
                {isConnected ? "🟢 Live Sync Active" : "🟡 Polling Sync"}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Urgent food runner queue — dishes plated and hot on the counter. Free waitstaff please deliver.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
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

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-xs h-9 gap-1.5 border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-xl shadow-none font-bold"
          >
            <RotateCw
              className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-culinary-primary" : ""}`}
            />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Orders Grid */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200/80 p-16 text-center space-y-3 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center mx-auto border border-gray-100">
            <ChefHat size={28} />
          </div>
          <p className="font-bold text-gray-800 text-base font-cormorant text-lg">
            No orders are waiting at the pass right now.
          </p>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Dishes marked as ready by the kitchen will appear here automatically with live audio alerts.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white border-2 border-emerald-500 shadow-lg shadow-emerald-500/10 rounded-2xl overflow-hidden flex flex-col justify-between"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-4 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white text-emerald-800 font-bold text-base flex items-center justify-center font-cormorant text-xl shadow-sm">
                    T{order.table?.tableNumber || "T"}
                  </div>
                  <div>
                    <h3 className="font-bold text-base font-cormorant leading-tight">
                      Table {order.table?.tableNumber || "Takeaway"}
                    </h3>
                    <p className="text-[10px] text-emerald-100 font-mono">
                      Order #{order.orderNumber}
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
                    Dishes To Deliver ({order.items.length})
                  </p>
                  <div className="divide-y divide-gray-100 bg-gray-50/60 rounded-xl p-2.5 border border-gray-200/60 max-h-40 overflow-y-auto">
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

                <div className="flex justify-between items-center pt-2 border-t border-gray-100 text-gray-500 text-[11px]">
                  <span className="flex items-center gap-1">
                    <Clock size={11} /> Placed {formatDistanceToNow(new Date(order.createdAt))} ago
                  </span>
                  <span className="font-bold text-sm text-gray-900">
                    ₹{Number(order.totalAmount || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="p-4 pt-0">
                <Button
                  onClick={() => handleServe(order.id, order.table?.tableNumber || "")}
                  disabled={loadingOrderId === order.id}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  {loadingOrderId === order.id ? (
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      <span>Deliver & Mark Served</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
