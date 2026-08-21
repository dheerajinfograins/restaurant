"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useWaiterUser } from "@/components/providers/waiter-user-provider";
import toast from "react-hot-toast";
import { format } from "date-fns";
import {
  History,
  RotateCw,
  Search,
  CreditCard,
  Banknote,
  Smartphone,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type HistoryOrder = {
  id: string;
  orderNumber: string;
  customerName?: string;
  customerPhone?: string;
  totalAmount: number;
  status: string;
  paymentMethod?: string;
  waiterId?: string | null;
  waiter?: {
    id: string;
    name: string;
    email: string;
  } | null;
  table: { tableNumber: string };
  items: Array<{
    id: string;
    quantity: number;
    product: { name: string };
  }>;
  createdAt: string;
};

function renderPaymentMethod(paymentMethod?: string) {
  if (paymentMethod === "UPI") {
    return (
      <span className="flex items-center gap-1 font-semibold text-blue-700">
        <Smartphone size={11} className="text-blue-600" /> UPI
      </span>
    );
  }

  if (paymentMethod === "CARD") {
    return (
      <span className="flex items-center gap-1 font-semibold text-purple-700">
        <CreditCard size={11} className="text-purple-600" /> Card
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1 font-semibold text-emerald-700">
      <Banknote size={11} className="text-emerald-600" /> Cash
    </span>
  );
}

function getStatusBadgeClass(status: string) {
  if (status === "PAID") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
  if (status === "SERVED") {
    return "bg-purple-50 text-purple-700 border-purple-200";
  }
  return "bg-gray-100 text-gray-700 border-gray-200";
}

function renderServedBy(isMine: boolean, waiterName?: string | null) {
  if (isMine) {
    return (
      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1 w-fit">
        <UserCheck size={11} className="text-emerald-700" /> You
      </span>
    );
  }

  if (waiterName) {
    return (
      <span className="text-[11px] font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
        {waiterName}
      </span>
    );
  }

  return <span className="text-[10px] text-gray-400 italic">Floor Staff</span>;
}

export default function WaiterHistoryPage() {
  const { currentUser } = useWaiterUser();

  const [orders, setOrders] = useState<HistoryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTabFilter, setActiveTabFilter] = useState<"ALL" | "MINE">("ALL");

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`/api/waiter/orders?status=HISTORY&t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Failed to fetch order history:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadInitialHistory() {
      try {
        const res = await fetch(`/api/waiter/orders?status=HISTORY&t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          if (!ignore) {
            setOrders(data);
          }
        }
      } catch (error) {
        if (!ignore) {
          console.error("Failed to fetch order history:", error);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void loadInitialHistory();

    return () => {
      ignore = true;
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchHistory();
    setIsRefreshing(false);
    toast.success("History refreshed", { id: "refresh-history" });
  };

  const myOrders = useMemo(() => {
    if (!currentUser.id) return [];
    return orders.filter((o) => o.waiterId === currentUser.id);
  }, [orders, currentUser.id]);

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
        activeTabFilter === "ALL" ||
        !currentUser.id ||
        o.waiterId === currentUser.id;

      return matchesSearch && matchesTab;
    });
  }, [orders, searchQuery, activeTabFilter, currentUser.id]);

  const totalRestaurantCollected = useMemo(() => {
    return orders
      .filter((o) => o.status === "PAID")
      .reduce((acc, curr) => acc + curr.totalAmount, 0);
  }, [orders]);

  const myCollected = useMemo(() => {
    if (!currentUser.id) return 0;
    return orders
      .filter((o) => o.waiterId === currentUser.id && o.status === "PAID")
      .reduce((acc, curr) => acc + curr.totalAmount, 0);
  }, [orders, currentUser.id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 space-y-4 bg-white rounded-3xl border border-gray-100 shadow-sm">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-culinary-primary border-t-transparent"></div>
        <p className="text-sm font-semibold text-gray-500 animate-pulse">
          Loading completed shift history...
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-0 space-y-6 font-sans pb-16 animate-in fade-in duration-500">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-amber-50 text-culinary-primary rounded-2xl border border-amber-100 shrink-0">
            <History size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold font-cormorant text-gray-900">
                Shift Service & Order History
              </h1>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-culinary-primary border border-amber-200">
                {orders.length} Completed Services
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Archive of served tickets, billing settlements, and waitstaff attribution
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
          <div className="text-right hidden sm:block bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200/60">
            <p className="text-[9px] uppercase font-bold text-gray-400">My Settled Value</p>
            <p className="text-sm font-bold text-emerald-700">₹{Number(myCollected || 0).toFixed(2)}</p>
          </div>

          <div className="text-right hidden sm:block bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200/60">
            <p className="text-[9px] uppercase font-bold text-gray-400">Total Restaurant</p>
            <p className="text-sm font-bold text-gray-900">₹{Number(totalRestaurantCollected || 0).toFixed(2)}</p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-xs h-9 gap-1.5 border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-xl shadow-none font-bold"
          >
            <RotateCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-culinary-primary" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        {/* Toggle between all vs mine */}
        <div className="flex items-center bg-gray-100 p-1 rounded-xl text-xs font-semibold w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTabFilter("ALL")}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg transition-all ${activeTabFilter === "ALL"
              ? "bg-white text-gray-900 font-bold shadow-xs"
              : "text-gray-500 hover:text-gray-900"
              }`}
          >
            All Shift Records ({orders.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTabFilter("MINE")}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${activeTabFilter === "MINE"
              ? "bg-emerald-600 text-white font-bold shadow-xs"
              : "text-gray-500 hover:text-gray-900"
              }`}
          >
            <UserCheck size={14} />
            <span>My Served History ({myOrders.length})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input
            type="text"
            placeholder="Search history by table, order #, waiter..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-8 py-2 text-xs rounded-xl border border-gray-200 bg-gray-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-culinary-primary/20 text-gray-800"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/70 border-b border-gray-200 text-gray-600 uppercase font-bold text-[11px] tracking-wider">
              <tr>
                <th scope="col" className="px-6 py-4">Dining Table</th>
                <th scope="col" className="px-6 py-4">Order ID</th>
                <th scope="col" className="px-6 py-4">Served By</th>
                <th scope="col" className="px-6 py-4">Ordered Dishes</th>
                <th scope="col" className="px-6 py-4">Payment</th>
                <th scope="col" className="px-6 py-4">Amount</th>
                <th scope="col" className="px-6 py-4">Status</th>
                <th scope="col" className="px-6 py-4 text-right pr-6">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-3 border border-gray-100">
                        <History className="text-gray-300" size={26} />
                      </div>
                      <p className="text-gray-800 font-bold text-sm">No history records found.</p>
                      <p className="text-gray-400 text-xs mt-0.5 max-w-xs">
                        {activeTabFilter === "MINE"
                          ? "You haven't served any orders in this session yet."
                          : "Completed and served orders will appear here for your shift reference."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isMine = order.waiterId === currentUser.id;

                  return (
                    <tr key={order.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-amber-50 text-culinary-primary font-bold text-xs flex items-center justify-center border border-amber-200">
                            T{order.table?.tableNumber || "T"}
                          </span>
                          <span className="font-bold text-gray-900">
                            Table {order.table?.tableNumber || "Takeaway"}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 font-mono text-[11px] text-gray-500 font-semibold">
                        #{order.orderNumber}
                      </td>

                      {/* Served By Column */}
                      <td className="px-6 py-4">
                        {renderServedBy(isMine, order.waiter?.name)}
                      </td>

                      <td className="px-6 py-4 max-w-xs">
                        <p className="truncate text-gray-700">
                          {order.items.map((i) => `${i.quantity}x ${i.product.name}`).join(", ")}
                        </p>
                      </td>

                      <td className="px-6 py-4">{renderPaymentMethod(order.paymentMethod)}</td>

                      <td className="px-6 py-4 font-bold text-gray-900">
                        ₹{Number(order.totalAmount || 0).toFixed(2)}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right pr-6 text-gray-400 font-mono text-[11px]">
                        {format(new Date(order.createdAt), "MMM d, h:mm a")}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
