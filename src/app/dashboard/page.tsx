"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { toast } from "react-hot-toast";
import {
  IndianRupee,
  ShoppingBag,
  Armchair,
  Users,
  Clock,

  Utensils,
  ArrowRight,
  TrendingUp,
  RotateCw,

  ChefHat,
  QrCode,
  Store,
  Check,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";


const AMBIANCE_PRESETS = [
  {
    id: "fine-dining",
    label: "Fine Dining",
    url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&q=80",
  },
  {
    id: "cozy-bistro",
    label: "Cozy Bistro",
    url: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=1600&q=80",
  },
  {
    id: "luxury-lounge",
    label: "Luxury Lounge",
    url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1600&q=80",
  },
  {
    id: "rustic-bar",
    label: "Rustic Bar",
    url: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1600&q=80",
  },
];

interface RestaurantProfile {
  id?: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  logo?: string | null;
  coverImage?: string | null;
  isActive: boolean;
}

interface DashboardMetrics {
  revenue: number;
  todayRevenue: number;
  totalOrders: number;
  todayOrders: number;
  totalTables: number;
  occupiedTables: number;
  availableTables: number;
  totalCustomers: number;
}

interface DashboardRecentOrder {
  id: string;
  tableNumber: string | number;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  itemsCount: number;
  itemsSummary: string;
  createdAt: string | Date;
}

interface TopDish {
  id: string;
  name: string;
  image?: string | null;
  totalSold: number;
  revenue: number;
}

interface DashboardData {
  restaurant: RestaurantProfile;
  metrics: DashboardMetrics;
  recentOrders: DashboardRecentOrder[];
  weeklyChartData: number[];
  weeklyRevenue: number[];
  dayLabels: string[];
  topDishes: TopDish[];
}

export default function DashboardHome() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingCover, setIsUpdatingCover] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await axios.get(`/api/dashboard?t=${Date.now()}`);
      setData(res.data.data);
    } catch (e) {
      console.error("Dashboard fetch error:", e);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    async function loadDashboard() {
      try {
        const res = await axios.get(`/api/dashboard?t=${Date.now()}`);
        if (!ignore) {
          setData(res.data.data);
        }
      } catch (e) {
        if (!ignore) {
          console.error("Dashboard fetch error:", e);
          toast.error("Failed to load dashboard data");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      ignore = true;
    };
  }, []);

  // Master Dining Open/Closed Switch
  const handleToggleDiningStatus = async (isActive: boolean) => {
    setIsUpdatingStatus(true);
    try {
      await axios.patch("/api/restaurant", { isActive });
      setData((prev) =>
        prev
          ? {
              ...prev,
              restaurant: { ...prev.restaurant, isActive },
            }
          : null
      );
      toast.success(
        isActive ? "🟢 Restaurant opened for dining!" : "🔴 Restaurant marked as closed"
      );
    } catch (error) {
      console.error("Failed to update restaurant status:", error);
      toast.error("Failed to update restaurant status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Quick Cover Image Changer
  const handleUpdateCover = async (coverImage: string) => {
    setIsUpdatingCover(true);
    try {
      await axios.patch("/api/restaurant", { coverImage });
      setData((prev) =>
        prev
          ? {
              ...prev,
              restaurant: { ...prev.restaurant, coverImage },
            }
          : null
      );
      toast.success("Ambiance cover updated!");
    } catch (error) {
      console.error("Failed to update cover image:", error);
      toast.error("Failed to update cover image");
    } finally {
      setIsUpdatingCover(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 space-y-4 bg-white rounded-3xl border border-gray-100 shadow-sm">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-culinary-primary border-t-transparent"></div>
        <p className="text-sm font-semibold text-gray-500 animate-pulse">
          Loading executive restaurant control center...
        </p>
      </div>
    );
  }

  const restaurant = data?.restaurant || {
    name: "The Culinary Ledger",
    city: "Main Dining",
    phone: "+91 98765 43210",
    isActive: true,
    coverImage: AMBIANCE_PRESETS[0].url,
    logo: null,
  };

  const metrics = data?.metrics || {
    revenue: 0,
    todayRevenue: 0,
    totalOrders: 0,
    todayOrders: 0,
    totalTables: 0,
    occupiedTables: 0,
    availableTables: 0,
    totalCustomers: 0,
  };

  const currentCover = restaurant.coverImage || AMBIANCE_PRESETS[0].url;
  const restaurantMonogram = restaurant.name ? restaurant.name.slice(0, 2).toUpperCase() : "CL";
  const occupancyPercent =
    metrics.totalTables > 0
      ? Math.round((metrics.occupiedTables / metrics.totalTables) * 100)
      : 0;

  const totalWeeklyRev = (data?.weeklyRevenue || []).reduce((a: number, b: number) => a + b, 0);

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Paid & Settled</span>;
      case "PREPARING":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Kitchen Cooking</span>;
      case "READY":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Ready to Serve</span>;
      case "SERVED":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">Dining Table</span>;
      case "CANCELLED":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Cancelled</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700 border border-gray-200">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 font-sans pb-16 animate-in fade-in duration-500">

      {/* ===================== LUXURY HERO AMBIANCE COVER BANNER ===================== */}
      <div className="relative rounded-3xl overflow-hidden shadow-md border border-amber-900/10 min-h-[220px] md:min-h-[240px] flex flex-col justify-between p-6 md:p-8 bg-gray-900 text-white">

        {/* Background Image with Dark Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src={currentCover}
            alt="Restaurant Ambiance"
            fill
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1200px"
            className="object-cover object-center opacity-45 transform hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />
        </div>

        {/* Top Row on Banner: Status & Quick Controls */}
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">

          {/* Status Badge & Open Toggle */}
          <div className="flex items-center gap-3">
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full backdrop-blur-md border shadow-sm flex items-center gap-1.5 ${restaurant.isActive
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/40"
                : "bg-rose-500/20 text-rose-300 border-rose-400/40"
                }`}
            >
              <span className={`w-2 h-2 rounded-full ${restaurant.isActive ? "bg-emerald-400 animate-pulse" : "bg-rose-400"}`} />
              {restaurant.isActive ? "🟢 OPEN FOR DINING" : "🔴 CURRENTLY CLOSED"}
            </span>

            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-xs">
              <span className="text-[11px] text-gray-300 font-medium">Service Switch</span>
              <Switch
                checked={restaurant.isActive}
                onCheckedChange={handleToggleDiningStatus}
                disabled={isUpdatingStatus}
              />
            </div>
          </div>

          {/* Right Top Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-xs h-8 gap-1.5 bg-black/40 hover:bg-black/60 border-white/20 text-white rounded-xl backdrop-blur-md shadow-none"
            >
              <RotateCw className={`h-3 w-3 ${isRefreshing ? "animate-spin text-amber-400" : ""}`} />
              Sync Live
            </Button>

            <Link href="/dashboard/restaurant">
              <Button
                size="sm"
                className="text-xs h-8 bg-amber-500/90 hover:bg-amber-500 text-black font-bold rounded-xl shadow-sm gap-1.5 border border-amber-300"
              >
                <Store size={13} /> Edit Profile & Covers
              </Button>
            </Link>
          </div>
        </div>

        {/* Bottom Row on Banner: Brand Identity & Ambiance Quick Selector */}
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-5 pt-6">

          {/* Brand Info */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-gray-950 font-bold text-2xl flex items-center justify-center border-2 border-white/40 shadow-xl font-cormorant shrink-0 relative overflow-hidden">
              {restaurant.logo ? (
                <Image
                  src={restaurant.logo}
                  alt={restaurant.name ? `${restaurant.name} Logo` : "Restaurant Logo"}
                  fill
                  sizes="(max-width: 768px) 56px, 64px"
                  className="object-cover rounded-2xl"
                />
              ) : (
                restaurantMonogram
              )}
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold font-cormorant text-white tracking-wide">
                  {restaurant.name}
                </h1>
                <span className="text-[10px] font-bold bg-amber-400/30 text-amber-200 px-2 py-0.5 rounded-full border border-amber-400/40 backdrop-blur-sm">
                  👑 POS Control Center
                </span>
              </div>
              <p className="text-xs text-gray-300 flex items-center gap-3">
                <span>📍 {restaurant.city || "Main Dining Hall"}</span>
                <span>•</span>
                <span>📞 {restaurant.phone || "+91 Contact"}</span>
              </p>
            </div>
          </div>

          {/* Preset Ambiance Cover Switcher */}
          <div className="bg-black/50 backdrop-blur-md p-2 rounded-2xl border border-white/10 flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold text-gray-400 px-2">Ambiance:</span>
            {AMBIANCE_PRESETS.map((preset) => {
              const isSelected = currentCover === preset.url;
              return (
                <button
                  type="button"
                  key={preset.id}
                  onClick={() => handleUpdateCover(preset.url)}
                  disabled={isUpdatingCover}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-xl transition-all flex items-center gap-1 ${isSelected
                    ? "bg-amber-500 text-black font-bold shadow-sm"
                    : "text-gray-300 hover:text-white hover:bg-white/10"
                    }`}
                >
                  {isSelected && <Check size={11} className="stroke-[3]" />}
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===================== TOP 4 EXECUTIVE KPI METRICS ===================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Revenue Overview</p>
            <p className="text-3xl font-bold text-gray-900">
              ₹{metrics.revenue.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <TrendingUp size={12} /> Today: ₹{metrics.todayRevenue.toFixed(2)}
            </p>
          </div>
          <div className="p-3.5 bg-amber-50 text-culinary-primary rounded-2xl border border-amber-100 shadow-sm">
            <IndianRupee size={24} />
          </div>
        </div>

        {/* Orders */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Orders</p>
            <p className="text-3xl font-bold text-blue-700">{metrics.totalOrders}</p>
            <p className="text-[11px] text-blue-600 font-semibold flex items-center gap-1">
              <ShoppingBag size={12} /> {metrics.todayOrders} Orders Placed Today
            </p>
          </div>
          <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 shadow-sm">
            <ShoppingBag size={24} />
          </div>
        </div>

        {/* Table Occupancy */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Table Occupancy</p>
            <p className="text-3xl font-bold text-purple-700">
              {metrics.occupiedTables} / {metrics.totalTables}
            </p>
            <p className="text-[11px] text-purple-600 font-semibold flex items-center gap-1">
              <Armchair size={12} /> {occupancyPercent}% Seating Capacity Active
            </p>
          </div>
          <div className="p-3.5 bg-purple-50 text-purple-600 rounded-2xl border border-purple-100 shadow-sm">
            <Armchair size={24} />
          </div>
        </div>

        {/* Unique Diners */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Unique Diners</p>
            <p className="text-3xl font-bold text-emerald-700">{metrics.totalCustomers}</p>
            <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <Users size={12} /> Registered Guest Profiles
            </p>
          </div>
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 shadow-sm">
            <Users size={24} />
          </div>
        </div>
      </div>

      {/* ===================== 2-COLUMN MAIN OPERATIONAL GRID ===================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">

        {/* LEFT 2 COLS: RECENT LIVE ORDERS FEED */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden flex flex-col justify-between h-full">
          <div>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg font-cormorant text-gray-900 flex items-center gap-2">
                  <Clock size={16} className="text-culinary-primary" /> Live Table Orders Feed
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Real-time incoming dining tickets and settlement status
                </p>
              </div>

              <Link href="/dashboard/orders">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs font-bold rounded-xl border-amber-200 text-culinary-primary hover:bg-amber-50 h-8 gap-1"
                >
                  <span>View All Orders</span>
                  <ArrowRight size={13} />
                </Button>
              </Link>
            </div>

            <div className="divide-y divide-gray-100">
              {data?.recentOrders?.length === 0 ? (
                <div className="p-16 text-center text-gray-400 text-xs">
                  <ShoppingBag size={28} className="mx-auto mb-2 text-gray-300" />
                  No orders placed yet. Table QR orders will stream here live.
                </div>
              ) : (
                data?.recentOrders?.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 hover:bg-gray-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 text-culinary-primary font-bold text-sm flex items-center justify-center border border-amber-200 font-cormorant shrink-0 mt-0.5 shadow-2xs">
                        T{order.tableNumber}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-gray-900 font-cormorant text-base">
                            Table {order.tableNumber}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono">
                            ID: {order.id.slice(-6)}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 line-clamp-1 max-w-sm" title={order.itemsSummary}>
                          {order.itemsSummary || `${order.itemsCount} Dishes ordered`}
                        </p>
                        <p className="text-[10px] text-gray-400 flex items-center gap-1">
                          <Clock size={10} /> {formatDistanceToNow(new Date(order.createdAt))} ago
                        </p>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1.5 shrink-0">
                      <span className="font-bold text-sm text-gray-900">
                        ₹{Number(order.totalAmount).toFixed(2)}
                      </span>
                      <div>{getOrderStatusBadge(order.status)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-3.5 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span className="flex items-center gap-1 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Orders Stream
            </span>
            <Link href="/dashboard/orders" className="text-culinary-primary font-bold hover:underline">
              Open POS Order Terminal →
            </Link>
          </div>
        </div>

        {/* RIGHT 1 COL: SALES OVERVIEW CHART & POPULAR DISHES */}
        <div className="flex flex-col justify-between gap-6 h-full">

          {/* Weekly Sales Pattern Bar Chart */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm space-y-4 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h4 className="font-bold text-sm text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp size={14} className="text-culinary-primary" /> Weekly Sales Trend
                  </h4>
                  <p className="text-[11px] text-gray-400">Past 7 Days Revenue Stream</p>
                </div>
                <span className="font-bold text-sm text-culinary-primary font-cormorant text-lg">
                  ₹{totalWeeklyRev.toLocaleString()}
                </span>
              </div>

              {/* Taller Bars Container */}
              <div className="mt-4 h-48 bg-gradient-to-b from-amber-50/50 via-amber-50/20 to-transparent rounded-2xl border border-amber-100/70 p-4 flex items-end justify-between gap-2.5">
                {(data?.dayLabels || ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]).map((dayLabel, idx) => {
                  const height = data?.weeklyChartData?.[idx] ?? [30, 50, 40, 70, 45, 90, 60][idx] ?? 0;
                  const amount = data?.weeklyRevenue?.[idx] ?? 0;
                  return (
                    <div key={dayLabel} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                      <div className="w-full relative flex items-end justify-center h-34">
                        {/* Tooltip */}
                        <div className="absolute -top-8 bg-gray-900 text-white text-[10px] px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20 shadow-lg font-mono font-bold">
                          ₹{amount.toLocaleString()}
                        </div>
                        {/* Bar */}
                        <div
                          className="w-full max-w-[32px] bg-gradient-to-t from-amber-600 via-amber-500 to-amber-400 rounded-t-lg opacity-85 group-hover:opacity-100 transition-all cursor-pointer shadow-xs hover:shadow-md group-hover:scale-y-105 origin-bottom"
                          style={{ height: `${Math.max(height, 10)}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-gray-500 uppercase">{dayLabel}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Chart Stat Insight */}
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
              <span className="flex items-center gap-1">
                <Sparkles size={12} className="text-amber-600" />
                <span>Daily Avg: <strong className="text-gray-900">₹{(totalWeeklyRev / 7).toFixed(0)}</strong></span>
              </span>
              <span className="text-emerald-700 font-semibold">Active Trend</span>
            </div>
          </div>

          {/* Top Selling Dishes Leaderboard */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm space-y-3.5 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h4 className="font-bold text-sm text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ChefHat size={14} className="text-culinary-primary" /> Top Selling Dishes
                  </h4>
                  <p className="text-[11px] text-gray-400">Best Performing Menu Items</p>
                </div>
                <Link href="/dashboard/products" className="text-xs text-culinary-primary font-bold hover:underline">
                  Catalog →
                </Link>
              </div>

              <div className="space-y-2.5 pt-2">
                {(data?.topDishes?.length || 0) === 0 ? (
                  <p className="text-xs text-gray-400 italic py-6 text-center">
                    Top selling dishes will appear once table orders are completed.
                  </p>
                ) : (
                  data?.topDishes?.slice(0, 5).map((dish, idx: number) => {
                    const topRevenue = data?.topDishes?.[0]?.revenue || 1;
                    const share = (dish.revenue / topRevenue) * 100;
                    const isTopThree = idx < 3;

                    return (
                      <div
                        key={dish.id}
                        className="p-2.5 bg-gray-50/70 hover:bg-amber-50/40 rounded-xl border border-gray-100 transition-all flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-6 h-6 rounded-lg font-bold text-[10px] flex items-center justify-center shrink-0 border ${
                              idx === 0
                                ? "bg-amber-100 text-amber-900 border-amber-300"
                                : idx === 1
                                ? "bg-slate-200 text-slate-800 border-slate-300"
                                : idx === 2
                                ? "bg-amber-700/10 text-amber-900 border-amber-600/30"
                                : "bg-white text-gray-600 border-gray-200"
                            }`}
                          >
                            {isTopThree ? (idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉") : idx + 1}
                          </span>
                          <div className="truncate">
                            <p className="font-bold text-gray-900 truncate" title={dish.name}>
                              {dish.name}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              {dish.totalSold} Orders Sold
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-bold text-gray-900 block font-mono text-xs">
                            ₹{dish.revenue.toFixed(0)}
                          </span>
                          <div className="w-16 h-1 bg-gray-200 rounded-full mt-1 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full"
                              style={{ width: `${Math.max(10, share)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Bottom Dish Stat Footer */}
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
              <span>Menu Popularity Metrics</span>
              <Link href="/dashboard/products" className="text-culinary-primary font-bold hover:underline flex items-center gap-1">
                <span>View Products</span>
                <ArrowRight size={11} />
              </Link>
            </div>
          </div>

        </div>

      </div>

      {/* ===================== QUICK SHORTCUTS ROW ===================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
        <Link
          href="/dashboard/orders"
          className="bg-white p-4 rounded-2xl border border-gray-200/80 hover:border-amber-300 hover:shadow-md transition-all flex items-center gap-3 group"
        >
          <div className="p-2.5 bg-amber-50 text-culinary-primary rounded-xl group-hover:scale-110 transition-transform">
            <ShoppingBag size={18} />
          </div>
          <div>
            <h5 className="font-bold text-xs text-gray-900 group-hover:text-culinary-primary">POS Terminal</h5>
            <p className="text-[10px] text-gray-400">Manage live orders</p>
          </div>
        </Link>

        <Link
          href="/dashboard/tables"
          className="bg-white p-4 rounded-2xl border border-gray-200/80 hover:border-blue-300 hover:shadow-md transition-all flex items-center gap-3 group"
        >
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
            <QrCode size={18} />
          </div>
          <div>
            <h5 className="font-bold text-xs text-gray-900 group-hover:text-blue-600">Table QR Menus</h5>
            <p className="text-[10px] text-gray-400">Generate QR stickers</p>
          </div>
        </Link>

        <Link
          href="/dashboard/products"
          className="bg-white p-4 rounded-2xl border border-gray-200/80 hover:border-emerald-300 hover:shadow-md transition-all flex items-center gap-3 group"
        >
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
            <Utensils size={18} />
          </div>
          <div>
            <h5 className="font-bold text-xs text-gray-900 group-hover:text-emerald-600">Menu Catalog</h5>
            <p className="text-[10px] text-gray-400">Add & edit dishes</p>
          </div>
        </Link>

        <Link
          href="/dashboard/reports"
          className="bg-white p-4 rounded-2xl border border-gray-200/80 hover:border-purple-300 hover:shadow-md transition-all flex items-center gap-3 group"
        >
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 transition-transform">
            <TrendingUp size={18} />
          </div>
          <div>
            <h5 className="font-bold text-xs text-gray-900 group-hover:text-purple-600">Financial Reports</h5>
            <p className="text-[10px] text-gray-400">Analytics & exports</p>
          </div>
        </Link>
      </div>

    </div>
  );
}
