"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import {
  Printer,
  FileSpreadsheet,
  TrendingUp,
  ShoppingBag,
  IndianRupee,
  RotateCw,
  Clock,
  Banknote,
  QrCode,
  CreditCard,
  Utensils,
  Award,
  Layers,
  Sparkles,
  Eye,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AllTablesTurnoverModal } from "@/components/dashboard/reports/AllTablesTurnoverModal";
import { io, Socket } from "socket.io-client";

const CHART_COLORS = ["#d4af37", "#0ea5e9", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#ec4899", "#14b8a6"];

function getProductRankBadgeStyle(idx: number): string {
  if (idx === 0) return "bg-amber-100 text-amber-800";
  if (idx === 1) return "bg-gray-200 text-gray-700";
  if (idx === 2) return "bg-amber-50 text-amber-700";
  return "bg-gray-100 text-gray-500";
}

export interface ReportPayload {
  kpis: {
    totalSales: number;
    totalOrders: number;
    completedOrders: number;
    pendingOrders: number;
    pendingAmount: number;
    avgOrderValue: number;
  };
  salesChart: Array<{ name: string; sales: number; orders: number }>;
  orderAnalytics: Array<{ name: string; orders: number }>;
  paymentAnalytics: Array<{ name: string; value: number }>;
  paymentSummary: { paid: number; pending: number; cash: number; upi: number; card: number };
  topProducts: Array<{ name: string; category: string; orders: number; revenue: number }>;
  categoryPerformance: Array<{ name: string; orders: number; revenue: number }>;
  tablePerformance: Array<{ name: string; orderCount: number; revenue: number }>;
  currentRange: string;
}

const RANGE_OPTIONS = [
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "Last 7 Days", value: "last7" },
  { label: "Last 30 Days", value: "last30" },
  { label: "This Month", value: "this_month" },
  { label: "All Time", value: "all" },
] as const;

export function ReportsDashboard({ initialData }: Readonly<{ initialData?: ReportPayload }>) {
  const [data, setData] = useState<ReportPayload | null>(initialData || null);
  const [range, setRange] = useState<string>("last7");
  const [isLoading, setIsLoading] = useState(!initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAllTablesModalOpen, setIsAllTablesModalOpen] = useState(false);

  const fetchReports = useCallback(async (selectedRange: string) => {
    try {
      const res = await fetch(`/api/reports?range=${selectedRange}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to fetch live reports:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchReports(range);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    const loadReports = async () => {
      try {
        const res = await fetch(`/api/reports?range=${range}`);
        if (res.ok && !ignore) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        if (!ignore) {
          console.error("Failed to fetch live reports:", err);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    void loadReports();

    return () => {
      ignore = true;
    };
  }, [range]);

  // Real-time live synchronization via Socket.io & 4s polling fallback
  useEffect(() => {
    let socket: Socket | undefined;
    try {
      socket = io();
      const onUpdate = () => {
        void fetchReports(range);
      };
      socket.on("order:updated", onUpdate);
      socket.on("order:served", onUpdate);
      socket.on("order:new", onUpdate);
      socket.on("order:ready", onUpdate);
    } catch (e) {
      console.warn("Socket init skipped:", e);
    }

    const interval = setInterval(() => {
      void fetchReports(range);
    }, 4000);

    return () => {
      clearInterval(interval);
      if (socket) socket.disconnect();
    };
  }, [range, fetchReports]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!data) return;

    let csv = `RESTAURANT PERFORMANCE REPORT (${range.toUpperCase()})\n`;
    csv += `Generated On: ${new Date().toLocaleString()}\n\n`;

    csv += `EXECUTIVE SUMMARY\n`;
    csv += `Total Sales (₹),Total Orders,Completed Orders,Pending Orders,Pending Amount (₹),Avg Order Value (₹)\n`;
    csv += `${data.kpis.totalSales},${data.kpis.totalOrders},${data.kpis.completedOrders},${data.kpis.pendingOrders},${data.kpis.pendingAmount},${data.kpis.avgOrderValue.toFixed(2)}\n\n`;

    csv += `PAYMENT BREAKDOWN\n`;
    csv += `Cash (₹),UPI / Online (₹),Card (₹),Total Collected (₹),Pending Unpaid (₹)\n`;
    csv += `${data.paymentSummary.cash},${data.paymentSummary.upi},${data.paymentSummary.card},${data.paymentSummary.paid},${data.paymentSummary.pending}\n\n`;

    csv += `TOP SELLING DISHES\n`;
    csv += `Dish Name,Category,Quantity Sold,Revenue Generated (₹)\n`;
    data.topProducts.forEach((p) => {
      csv += `"${p.name}","${p.category}",${p.orders},${p.revenue}\n`;
    });
    csv += `\n`;

    csv += `CATEGORY PERFORMANCE\n`;
    csv += `Category Name,Items Sold,Revenue Generated (₹)\n`;
    data.categoryPerformance.forEach((c) => {
      csv += `"${c.name}",${c.orders},${c.revenue}\n`;
    });
    csv += `\n`;

    csv += `TABLE TURNOVER & SALES\n`;
    csv += `Table Number,Orders Count,Revenue Generated (₹)\n`;
    data.tablePerformance.forEach((t) => {
      csv += `"${t.name}",${t.orderCount},${t.revenue}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `restaurant-report-${range}-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  if (isLoading || !data) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4 bg-white rounded-3xl border border-gray-100 shadow-sm">
        <div className="animate-spin rounded-full h-9 w-9 border-2 border-culinary-primary border-t-transparent"></div>
        <p className="text-sm font-semibold text-gray-500">Calculating live restaurant analytics...</p>
      </div>
    );
  }

  const completionRate = data.kpis.totalOrders > 0
    ? Math.round((data.kpis.completedOrders / data.kpis.totalOrders) * 100)
    : 100;

  return (
    <div className="space-y-6 pb-12 font-sans">

      {/* Top Header & Range Filters */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 font-cormorant">
              Reports & Analytics
            </h1>
            <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Sync</span>
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Real-time financial performance, menu demand, payment splits and table turnovers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Time Range Pills */}
          <div className="flex items-center bg-gray-100/90 p-1 rounded-xl border border-gray-200/80 overflow-x-auto">
            {RANGE_OPTIONS.map((opt) => {
              const isSelected = range === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRange(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${isSelected
                    ? "bg-white text-culinary-primary shadow-sm font-bold"
                    : "text-gray-600 hover:text-gray-900"
                    }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="text-xs h-9 gap-1.5 border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-xl shadow-none"
          >
            <RotateCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-culinary-primary" : ""}`} />
            Refresh
          </Button>

          {/* Export CSV Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="text-xs h-9 gap-1.5 border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-xl shadow-none"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
            CSV
          </Button>

          {/* Print / PDF Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="text-xs h-9 gap-1.5 border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-xl shadow-none"
          >
            <Printer className="h-3.5 w-3.5 text-blue-600" />
            Print / PDF
          </Button>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Sales</p>
            <p className="text-3xl font-bold text-gray-900 font-sans">₹{data.kpis.totalSales.toFixed(2)}</p>
            <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <TrendingUp size={12} /> {data.kpis.completedOrders} Paid & Settled
            </p>
          </div>
          <div className="p-3.5 bg-amber-50 text-culinary-primary rounded-2xl border border-amber-100">
            <IndianRupee size={24} />
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Orders</p>
            <p className="text-3xl font-bold text-gray-900 font-sans">{data.kpis.totalOrders}</p>
            <p className="text-[11px] text-blue-600 font-semibold flex items-center gap-1">
              <ShoppingBag size={12} /> {completionRate}% Completion Rate
            </p>
          </div>
          <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
            <ShoppingBag size={24} />
          </div>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Avg Order Value</p>
            <p className="text-3xl font-bold text-gray-900 font-sans">₹{data.kpis.avgOrderValue.toFixed(2)}</p>
            <p className="text-[11px] text-purple-600 font-semibold flex items-center gap-1">
              <Sparkles size={12} /> Per Table Average Ticket
            </p>
          </div>
          <div className="p-3.5 bg-purple-50 text-purple-600 rounded-2xl border border-purple-100">
            <TrendingUp size={24} />
          </div>
        </div>

        {/* Pending Collections */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending Collections</p>
            <p className="text-3xl font-bold text-amber-700 font-sans">₹{data.kpis.pendingAmount.toFixed(2)}</p>
            <p className="text-[11px] text-amber-600 font-semibold flex items-center gap-1">
              <Clock size={12} /> {data.kpis.pendingOrders} Unpaid Table Bills
            </p>
          </div>
          <div className="p-3.5 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
            <Clock size={24} />
          </div>
        </div>
      </div>

      {/* Sales Overview Trend Bar Chart */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900 font-cormorant text-xl">
              Sales Revenue & Traffic Trend
            </h2>
            <p className="text-xs text-gray-400">
              {range === "today" || range === "yesterday"
                ? "Hourly sales distribution throughout the day"
                : "Daily revenue flow and volume across the selected period"}
            </p>
          </div>
          <div className="text-xs font-bold px-3 py-1 bg-gray-50 text-gray-600 rounded-lg border border-gray-200">
            Period: {range.replace("_", " ").toUpperCase()}
          </div>
        </div>

        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.salesChart} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#888888" }}
              />
              <YAxis
                tickFormatter={(val) => `₹${val}`}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#888888" }}
              />
              <Tooltip
                formatter={(val: unknown) => [`₹${Number(val || 0).toFixed(2)}`, "Revenue"]}
                labelStyle={{ fontWeight: "bold", color: "#111827" }}
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="sales" fill="#0ea5e9" barSize={34} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: Payment Analytics & Order Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Payment Methods Analytics */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 font-cormorant text-xl">Payment Channels</h3>
                <p className="text-xs text-gray-400">Revenue split across payment methods</p>
              </div>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold">
                Settled: ₹{data.paymentSummary.paid.toFixed(2)}
              </Badge>
            </div>

            <div className="h-[210px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.paymentAnalytics.map((entry, index) => ({
                      ...entry,
                      fill: CHART_COLORS[index % CHART_COLORS.length],
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  />
                  <Tooltip formatter={(val: unknown) => [`₹${Number(val || 0).toFixed(2)}`, "Collected"]} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Payment Method Details Pills */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100">
            <div className="bg-purple-50/70 p-3 rounded-xl border border-purple-100 text-center">
              <div className="flex items-center justify-center gap-1 text-[11px] text-purple-700 font-semibold mb-0.5">
                <QrCode size={12} /> UPI / Online
              </div>
              <p className="font-bold text-sm text-purple-950">₹{data.paymentSummary.upi.toFixed(2)}</p>
            </div>

            <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-100 text-center">
              <div className="flex items-center justify-center gap-1 text-[11px] text-emerald-700 font-semibold mb-0.5">
                <Banknote size={12} /> Cash Register
              </div>
              <p className="font-bold text-sm text-emerald-950">₹{data.paymentSummary.cash.toFixed(2)}</p>
            </div>

            <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-100 text-center">
              <div className="flex items-center justify-center gap-1 text-[11px] text-blue-700 font-semibold mb-0.5">
                <CreditCard size={12} /> Card / POS
              </div>
              <p className="font-bold text-sm text-blue-950">₹{data.paymentSummary.card.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Order Lifecycle Status Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 font-cormorant text-xl">Order Lifecycle Distribution</h3>
                <p className="text-xs text-gray-400">Order distribution across preparation stages</p>
              </div>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-semibold">
                Total: {data.kpis.totalOrders} Orders
              </Badge>
            </div>

            <div className="h-[210px] w-full">
              {data.orderAnalytics.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.orderAnalytics.map((entry, index) => ({
                        ...entry,
                        fill: CHART_COLORS[index % CHART_COLORS.length],
                      }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="orders"
                    />
                    <Tooltip formatter={(val: unknown) => [`${Number(val ?? 0)} orders`, "Volume"]} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-xs text-gray-400">
                  No orders recorded for this time range.
                </div>
              )}
            </div>
          </div>

          {/* Quick status bar */}
          <div className="flex flex-wrap items-center justify-around gap-2 pt-4 border-t border-gray-100 text-xs">
            {data.orderAnalytics.slice(0, 4).map((item) => (
              <div key={item.name} className="text-center">
                <span className="text-[10px] text-gray-400 uppercase font-bold block">{item.name}</span>
                <span className="font-bold text-gray-800 text-sm">{item.orders}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Top Selling Dishes Leaderboard & Category Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Top Selling Dishes Leaderboard */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
          <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-100">
            <div>
              <h3 className="text-lg font-bold text-gray-900 font-cormorant text-xl flex items-center gap-2">
                <Award className="text-culinary-primary h-5 w-5" /> Top Selling Menu Items
              </h3>
              <p className="text-xs text-gray-400">Best performing dishes by revenue & quantity</p>
            </div>
            <span className="text-xs font-semibold text-gray-500">Top {data.topProducts.length}</span>
          </div>

          <div className="space-y-3.5">
            {data.topProducts.map((prod, idx) => {
              const maxRev = Math.max(...data.topProducts.map((p) => p.revenue), 1);
              const pct = (prod.revenue / maxRev) * 100;
              return (
                <div key={prod.name} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${getProductRankBadgeStyle(
                          idx
                        )}`}
                      >
                        #{idx + 1}
                      </span>
                      <span className="font-semibold text-gray-900 truncate" title={prod.name}>
                        {prod.name}
                      </span>
                      <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100 shrink-0">
                        {prod.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-2">
                      <span className="text-gray-500 font-medium">{prod.orders} sold</span>
                      <span className="font-bold text-gray-900">₹{prod.revenue.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-culinary-primary to-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}

            {data.topProducts.length === 0 && (
              <div className="text-center py-10 text-xs text-gray-400">
                No product sales recorded in this period.
              </div>
            )}
          </div>
        </div>

        {/* Category Performance */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
          <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-100">
            <div>
              <h3 className="text-lg font-bold text-gray-900 font-cormorant text-xl flex items-center gap-2">
                <Layers className="text-blue-600 h-5 w-5" /> Category Share & Sales
              </h3>
              <p className="text-xs text-gray-400">Revenue and order volume split by category</p>
            </div>
            <span className="text-xs font-semibold text-gray-500">{data.categoryPerformance.length} Categories</span>
          </div>

          <div className="space-y-3.5">
            {data.categoryPerformance.map((cat, idx) => {
              const maxCatRev = Math.max(...data.categoryPerformance.map((c) => c.revenue), 1);
              const catPct = (cat.revenue / maxCatRev) * 100;
              return (
                <div key={cat.name} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                      />
                      <span className="font-semibold text-gray-900">{cat.name}</span>
                      <span className="text-[10px] text-gray-400">({cat.orders} items)</span>
                    </div>
                    <span className="font-bold text-gray-900">₹{cat.revenue.toFixed(2)}</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${catPct}%`,
                        backgroundColor: CHART_COLORS[idx % CHART_COLORS.length],
                      }}
                    />
                  </div>
                </div>
              );
            })}

            {data.categoryPerformance.length === 0 && (
              <div className="text-center py-10 text-xs text-gray-400">
                No category data available in this period.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 4: Table Turnover & Active Tables */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5 pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900 font-cormorant text-xl flex items-center gap-2">
              <Utensils className="text-emerald-600 h-5 w-5" /> Table Turnover & Revenue Performance
            </h3>
            <p className="text-xs text-gray-400">Sales volume and order counts generated per dining table</p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAllTablesModalOpen(true)}
              className="rounded-xl border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/80 text-emerald-900 font-bold text-xs gap-1.5 shadow-2xs transition-all"
            >
              <Eye size={14} className="text-emerald-700" />
              <span>View All ({data.tablePerformance.length})</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.tablePerformance.slice(0, 6).map((table) => {
            const avgTableTicket = table.orderCount > 0 ? table.revenue / table.orderCount : 0;
            return (
              <div
                key={table.name}
                className="bg-gray-50/70 p-4 rounded-xl border border-gray-100 space-y-2 hover:bg-gray-50 hover:border-gray-200 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm text-culinary-primary font-cormorant text-base">
                    {table.name}
                  </span>
                  <Badge variant="outline" className="bg-white text-gray-700 text-[10px] font-semibold">
                    {table.orderCount} Orders
                  </Badge>
                </div>
                <div className="flex justify-between items-baseline pt-1">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold">Total Revenue</span>
                    <span className="font-bold text-base text-gray-900">₹{table.revenue.toFixed(2)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold">Avg Ticket</span>
                    <span className="text-xs font-semibold text-gray-600">₹{avgTableTicket.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {data.tablePerformance.length === 0 && (
            <div className="col-span-3 text-center py-8 text-xs text-gray-400">
              No table activity recorded in this period.
            </div>
          )}
        </div>

        {/* Footer info banner if more than 6 tables */}
        {data.tablePerformance.length > 6 && (
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>
              Showing top <strong>6</strong> of <strong>{data.tablePerformance.length}</strong> dining tables
            </span>
            <button
              type="button"
              onClick={() => setIsAllTablesModalOpen(true)}
              className="text-emerald-700 font-bold hover:underline inline-flex items-center gap-1"
            >
              <span>View all {data.tablePerformance.length} tables</span>
              <ChevronRight size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Complete All Tables Performance Modal */}
      <AllTablesTurnoverModal
        isOpen={isAllTablesModalOpen}
        onClose={() => setIsAllTablesModalOpen(false)}
        tables={data.tablePerformance}
      />
    </div>
  );
}

