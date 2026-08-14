"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import {
  History,
  RotateCw,
  Search,
  CreditCard,
  Banknote,
  Smartphone
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
      <>
        <Smartphone size={11} className="text-blue-600" /> UPI
      </>
    );
  }

  if (paymentMethod === "CARD") {
    return (
      <>
        <CreditCard size={11} className="text-purple-600" /> Card
      </>
    );
  }

  return (
    <>
      <Banknote size={11} className="text-emerald-600" /> Cash
    </>
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

export default function WaiterHistoryPage() {
  const [orders, setOrders] = useState<HistoryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`/api/waiter/orders?status=HISTORY&t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Failed to fetch order history:", error);
      toast.error("Failed to load order history");
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
          toast.error("Failed to load order history");
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
  };

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

  const totalCollected = useMemo(() => {
    return filteredOrders
      .filter((o) => o.status === "PAID")
      .reduce((acc, curr) => acc + curr.totalAmount, 0);
  }, [filteredOrders]);

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
    <div className="space-y-6 font-sans pb-16 animate-in fade-in duration-500">

      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-amber-50 text-culinary-primary rounded-2xl border border-amber-100 shrink-0">
            <History size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-cormorant text-gray-900">
                Shift Service & Order History
              </h1>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-culinary-primary border border-amber-200">
                {orders.length} Completed Services
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Archive of served tickets, billing settlements, and guest logs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] uppercase font-bold text-gray-400">Total Settled</p>
            <p className="text-sm font-bold text-emerald-700">₹{totalCollected.toFixed(2)}</p>
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

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input
            type="text"
            placeholder="Search history by table, order #, customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-8 py-1.5 text-xs rounded-xl border border-gray-200 bg-gray-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-culinary-primary/20 text-gray-800"
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

        <div className="text-xs text-gray-500 font-medium">
          Showing <span className="font-bold text-gray-900">{filteredOrders.length}</span> records
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
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-3 border border-gray-100">
                        <History className="text-gray-300" size={26} />
                      </div>
                      <p className="text-gray-800 font-bold text-sm">No history records found.</p>
                      <p className="text-gray-400 text-xs mt-0.5 max-w-xs">
                        Completed and served orders will appear here for your shift reference.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/70 transition-colors">

                    {/* Table */}
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 text-culinary-primary font-bold text-xs flex items-center justify-center border border-amber-200 font-cormorant shrink-0">
                          T{order.table?.tableNumber || "T"}
                        </div>
                        <span className="font-bold text-gray-900 font-cormorant text-base">
                          Table {order.table?.tableNumber || "Takeaway"}
                        </span>
                      </div>
                    </td>

                    {/* Order ID */}
                    <td className="px-6 py-3.5 font-mono text-[11px] text-gray-500 font-medium">
                      #{order.orderNumber}
                    </td>

                    {/* Dishes summary */}
                    <td className="px-6 py-3.5 max-w-xs">
                      <p className="truncate text-gray-700 font-medium" title={order.items.map((i) => `${i.quantity}x ${i.product.name}`).join(", ")}>
                        {order.items.map((i) => `${i.quantity}x ${i.product.name}`).join(", ")}
                      </p>
                    </td>

                    {/* Payment Method */}
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">
                        {renderPaymentMethod(order.paymentMethod)}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="px-6 py-3.5 font-bold text-gray-900">
                      ₹{order.totalAmount.toFixed(2)}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(order.status)}`}>
                        {order.status}
                      </span>
                    </td>

                    {/* Date Time */}
                    <td className="px-6 py-3.5 text-right pr-6 text-gray-400 text-[11px]">
                      {format(new Date(order.createdAt), "dd MMM, hh:mm a")}
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
