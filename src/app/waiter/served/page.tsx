"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useSocket } from "@/components/providers/socket-provider";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import {
  CheckCircle2,
  Clock,
  RotateCw,
  Search,
  Armchair
} from "lucide-react";
import { Button } from "@/components/ui/button";

type ServedOrder = {
  id: string;
  orderNumber: string;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  totalAmount: number;
  status: string;
  paymentMethod?: string;
  table: { tableNumber: string; capacity?: number };
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    product: { name: string };
  }>;
  createdAt: string;
  updatedAt: string;
};

export default function ServedOrdersPage() {
  const { socket } = useSocket();
  const [orders, setOrders] = useState<ServedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchServedOrders = useCallback(async () => {
    try {
      const res = await fetch(`/api/waiter/orders?status=SERVED&t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Failed to fetch served orders:", error);
      toast.error("Failed to load served orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadInitialServedOrders() {
      try {
        const res = await fetch(`/api/waiter/orders?status=SERVED&t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          if (!ignore) {
            setOrders(data);
          }
        }
      } catch (error) {
        if (!ignore) {
          console.error("Failed to fetch served orders:", error);
          toast.error("Failed to load served orders");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void loadInitialServedOrders();

    return () => {
      ignore = true;
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchServedOrders();
    setIsRefreshing(false);
  };

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      void fetchServedOrders();
    };

    socket.on("order:served", handleUpdate);
    socket.on("order:updated", handleUpdate);

    return () => {
      socket.off("order:served", handleUpdate);
      socket.off("order:updated", handleUpdate);
    };
  }, [socket, fetchServedOrders]);

  const filteredOrders = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return orders.filter((o) => {
      return (
        !q ||
        o.orderNumber.toLowerCase().includes(q) ||
        o.table.tableNumber.toLowerCase().includes(q) ||
        o.customerName?.toLowerCase().includes(q)
      );
    });
  }, [orders, searchQuery]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 space-y-4 bg-white rounded-3xl border border-gray-100 shadow-sm">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-culinary-primary border-t-transparent"></div>
        <p className="text-sm font-semibold text-gray-500 animate-pulse">
          Loading active dining tables...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans pb-16 animate-in fade-in duration-500">

      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-purple-50 text-purple-700 rounded-2xl border border-purple-200 shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-cormorant text-gray-900">
                Served Orders • Guests Currently Dining
              </h1>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-300">
                {orders.length} Active Tables
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Tables that have received their meals and are currently dining
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input
              type="text"
              placeholder="Search table or order..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-8 py-1.5 text-xs rounded-xl border border-gray-200 bg-gray-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-culinary-primary/20 text-gray-800"
            />
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
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200/80 p-16 text-center space-y-3 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center mx-auto border border-gray-100">
            <Armchair size={28} />
          </div>
          <p className="font-bold text-gray-800 text-base font-cormorant text-lg">
            No tables currently in dining state.
          </p>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Once food is served to guests, the active dining session will show here with elapsed meal timers.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-purple-200 shadow-sm rounded-2xl overflow-hidden flex flex-col justify-between"
            >
              {/* Header */}
              <div className="p-4 bg-purple-50/80 border-b border-purple-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-600 text-white font-bold text-base flex items-center justify-center font-cormorant text-xl shadow-sm">
                    T{order.table?.tableNumber || "T"}
                  </div>
                  <div>
                    <h3 className="font-bold text-base font-cormorant text-gray-900 leading-tight">
                      Table {order.table?.tableNumber || "Takeaway"}
                    </h3>
                    <p className="text-[10px] text-gray-500 font-mono">
                      Order #{order.orderNumber}
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full border border-purple-200 flex items-center gap-1">
                  <CheckCircle2 size={11} className="text-purple-600" /> Served
                </span>
              </div>

              {/* Items */}
              <div className="p-4 flex-1 space-y-3 text-xs">
                <div className="space-y-1.5">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    Delivered Dishes ({order.items.length})
                  </p>
                  <div className="divide-y divide-gray-100 bg-gray-50/60 rounded-xl p-2.5 border border-gray-100 max-h-40 overflow-y-auto">
                    {order.items.map((item) => (
                      <div key={item.id} className="py-1 flex justify-between items-center text-xs">
                        <span className="font-medium text-gray-800">{item.product.name}</span>
                        <span className="font-bold text-gray-900 bg-white px-2 py-0.5 rounded-lg border border-gray-200 text-[11px]">
                          x{item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-gray-100 text-gray-500 text-[11px]">
                  <span className="flex items-center gap-1">
                    <Clock size={11} /> Served {formatDistanceToNow(new Date(order.updatedAt))} ago
                  </span>
                  <span className="font-bold text-sm text-gray-900">
                    ₹{order.totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-gray-50 border-t border-gray-100 text-center text-[11px] font-semibold text-gray-500">
                Guests currently dining • Ready for settlement on request
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
