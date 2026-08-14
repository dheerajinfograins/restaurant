"use client";

import { useEffect, useState, useCallback } from "react";
import { useSocket } from "@/components/providers/socket-provider";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import {
  ChefHat,
  RotateCw,
  CheckCircle2,
  Volume2,
  VolumeX,
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
  items: Array<{ id: string; quantity: number; product: { name: string } }>;
  createdAt: string;
};

export default function ReadyOrdersPage() {
  const { socket } = useSocket();
  const [orders, setOrders] = useState<WaiterOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`/api/waiter/orders?status=READY&t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Failed to fetch ready orders:", error);
      toast.error("Failed to load ready orders");
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
          toast.error("Failed to load ready orders");
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

  useEffect(() => {
    if (!socket) return;

    const playNotificationSound = () => {
      if (!soundEnabled) return;
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } catch {
        // audio play failed or not allowed
      }
    };

    const handleOrderReady = (order: WaiterOrder) => {
      setOrders((prev) => {
        const exists = prev.some((o) => o.id === order.id);
        if (exists) return prev.map((o) => (o.id === order.id ? order : o));
        return [order, ...prev];
      });
      playNotificationSound();
    };

    const handleOrderServed = (data: { orderId: string }) => {
      setOrders((prev) => prev.filter((o) => o.id !== data.orderId));
    };

    socket.on("order:ready", handleOrderReady);
    socket.on("order:served", handleOrderServed);

    return () => {
      socket.off("order:ready", handleOrderReady);
      socket.off("order:served", handleOrderServed);
    };
  }, [socket, soundEnabled]);

  const handleServe = async (orderId: string) => {
    setLoadingOrderId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "SERVED" }),
      });
      if (res.ok) {
        toast.success("Order served to table!");
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
    <div className="space-y-6 font-sans pb-16 animate-in fade-in duration-500">

      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-200 shrink-0">
            <ChefHat size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-cormorant text-gray-900">
                Kitchen Pass • Ready for Table Service
              </h1>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                {orders.length} Ready Now
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Urgent food runner queue — dishes plated and hot on the counter
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${soundEnabled
              ? "bg-amber-50 text-culinary-primary border-amber-200"
              : "bg-gray-50 text-gray-400 border-gray-200"
              }`}
          >
            {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            <span>{soundEnabled ? "Chime On" : "Muted"}</span>
          </button>

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
              className="bg-white border-2 border-emerald-400 shadow-lg rounded-2xl overflow-hidden flex flex-col justify-between"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-4 text-white flex justify-between items-center">
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
              <div className="p-4 flex-1 space-y-3 text-xs">
                <div className="space-y-1.5">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    Dishes on Counter ({order.items.length})
                  </p>
                  <div className="divide-y divide-gray-100 bg-gray-50/60 rounded-xl p-2.5 border border-gray-200/60 max-h-40 overflow-y-auto">
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
  );
}
