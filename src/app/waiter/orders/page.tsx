"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useSocket } from "@/components/providers/socket-provider";
import toast from "react-hot-toast";
import {
  Receipt,
  Search,
  RotateCw,
  Clock,
  CheckCircle2,
  Flame
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

type WaiterOrder = {
  id: string;
  orderNumber: string;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  totalAmount: number;
  status: string;
  table: { tableNumber: string; capacity?: number };
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    product: { name: string; foodType?: string };
  }>;
  createdAt: string;
};

const TABS = [
  { id: "ALL", label: "All Orders" },
  { id: "NEW", label: "New Orders" },
  { id: "PREPARING", label: "Kitchen Cooking" },
  { id: "READY", label: "Ready to Serve" },
  { id: "SERVED", label: "Dining Table" },
  { id: "PAID", label: "Settled / Paid" },
];

export default function WaiterOrdersPage() {
  const { socket } = useSocket();
  const [orders, setOrders] = useState<WaiterOrder[]>([]);
  const [activeTab, setActiveTab] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`/api/waiter/orders?status=ALL&t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      toast.error("Failed to fetch orders");
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
          toast.error("Failed to fetch orders");
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

    const handleOrderUpdate = () => {
      void fetchOrders();
    };

    socket.on("order:ready", handleOrderUpdate);
    socket.on("order:served", handleOrderUpdate);
    socket.on("order:created", handleOrderUpdate);
    socket.on("order:updated", handleOrderUpdate);

    return () => {
      socket.off("order:ready", handleOrderUpdate);
      socket.off("order:served", handleOrderUpdate);
      socket.off("order:created", handleOrderUpdate);
      socket.off("order:updated", handleOrderUpdate);
    };
  }, [socket, fetchOrders]);

  const handleServe = async (orderId: string) => {
    setLoadingOrderId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
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
      console.error("Failed to update order status:", error);
      toast.error("An error occurred");
    } finally {
      setLoadingOrderId(null);
    }
  };

  const filteredOrders = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return orders.filter((o) => {
      const matchesSearch =
        !q ||
        o.orderNumber.toLowerCase().includes(q) ||
        o.table.tableNumber.toLowerCase().includes(q) ||
        o.customerName?.toLowerCase().includes(q);

      let matchesTab = true;
      if (activeTab === "NEW") matchesTab = ["PENDING", "ACCEPTED"].includes(o.status);
      else if (activeTab === "PREPARING") matchesTab = o.status === "PREPARING";
      else if (activeTab === "READY") matchesTab = o.status === "READY";
      else if (activeTab === "SERVED") matchesTab = o.status === "SERVED";
      else if (activeTab === "PAID") matchesTab = o.status === "PAID";

      return matchesSearch && matchesTab;
    });
  }, [orders, searchQuery, activeTab]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "READY":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Ready to Serve</span>
          </span>
        );
      case "PREPARING":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
            <Flame size={10} />
            <span>Cooking</span>
          </span>
        );
      case "SERVED":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
            Dining Table
          </span>
        );
      case "PAID":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Paid & Settled
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
            New / Pending
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 space-y-4 bg-white rounded-3xl border border-gray-100 shadow-sm">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-culinary-primary border-t-transparent"></div>
        <p className="text-sm font-semibold text-gray-500 animate-pulse">
          Loading active dining orders...
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
            <Receipt size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-cormorant text-gray-900">
                Floor Orders & Service Tickets
              </h1>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-culinary-primary border border-amber-200">
                {orders.length} Total Orders
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Filter incoming dining tickets, food readiness, and table service actions
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
          <span>Refresh</span>
        </Button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">

          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {TABS.map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button type="button"
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${isSelected
                    ? "bg-culinary-primary text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input
              type="text"
              placeholder="Search table or order #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-8 py-1.5 text-xs rounded-xl border border-gray-200 bg-gray-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-culinary-primary/20 focus:border-culinary-primary text-gray-800"
            />
            {searchQuery && (
              <button type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOrders.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <Receipt size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="font-bold text-gray-800 text-sm">No orders found.</p>
            <p className="text-xs text-gray-400 mt-0.5">Try selecting another filter or search term.</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isReady = order.status === "READY";

            return (
              <div
                key={order.id}
                className={`bg-white rounded-2xl shadow-sm transition-all flex flex-col justify-between overflow-hidden border-2 ${isReady
                  ? "border-emerald-500 shadow-emerald-100 shadow-md ring-2 ring-emerald-400/30"
                  : "border-gray-200/80 hover:border-gray-300"
                  }`}
              >
                {/* Header */}
                <div className={`p-4 border-b flex justify-between items-start ${isReady ? "bg-emerald-50/70 border-emerald-100" : "bg-gray-50/60 border-gray-100"
                  }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-cormorant font-bold text-xl shadow-sm ${isReady ? "bg-emerald-600 text-white" : "bg-amber-100 text-culinary-primary"
                      }`}>
                      T{order.table?.tableNumber || "T"}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-base font-cormorant text-gray-900">
                          Table {order.table?.tableNumber || "Takeaway"}
                        </h3>
                      </div>
                      <p className="text-[10px] text-gray-400 font-mono">
                        Order #{order.orderNumber}
                      </p>
                    </div>
                  </div>

                  <div>{getStatusBadge(order.status)}</div>
                </div>

                {/* Items */}
                <div className="p-4 flex-1 space-y-3 text-xs">
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      Dishes Ordered ({order.items.length})
                    </p>
                    <div className="divide-y divide-gray-100 bg-gray-50/60 rounded-xl p-2.5 border border-gray-100 max-h-40 overflow-y-auto">
                      {order.items.map((item) => (
                        <div key={item.id} className="py-1 flex justify-between items-center text-xs">
                          <span className="font-medium text-gray-800">
                            {item.product.name}
                          </span>
                          <span className="font-bold text-gray-900 bg-white px-2 py-0.5 rounded-lg border border-gray-200 text-[11px]">
                            x{item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {order.notes && (
                    <div className="p-2 bg-amber-50/70 border border-amber-200 rounded-xl text-[11px] text-amber-900 font-medium">
                      📝 <span className="font-bold">Note:</span> {order.notes}
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2 border-t border-gray-100 text-gray-500 text-[11px]">
                    <span className="flex items-center gap-1">
                      <Clock size={11} /> {formatDistanceToNow(new Date(order.createdAt))} ago
                    </span>
                    <span className="font-bold text-sm text-gray-900">
                      ₹{order.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Action */}
                {isReady && (
                  <div className="p-3 border-t border-emerald-100 bg-emerald-50/40">
                    <Button
                      onClick={() => handleServe(order.id)}
                      disabled={loadingOrderId === order.id}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 rounded-xl"
                    >
                      <CheckCircle2 size={14} className="mr-1" />
                      {loadingOrderId === order.id ? "Serving..." : "Serve to Table"}
                    </Button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
