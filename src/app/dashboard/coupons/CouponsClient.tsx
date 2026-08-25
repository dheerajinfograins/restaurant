"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  TicketPercent,
  Plus,
  Search,
  Banknote,
  ShoppingBag,
  Target,
  Sparkles,
  Edit3,
  Trash2,
  Copy,
  Check,
  Shield,
  Store,
  RefreshCw,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import CouponCreateModal from "./components/CouponCreateModal";
import CouponEditModal, { CouponItem } from "./components/CouponEditModal";

interface RestaurantFilterItem {
  id: string;
  name: string;
  dietaryCategory?: string;
}

interface CouponsClientProps {
  userRole: string;
  restaurantId?: string;
  restaurantName?: string;
}

function matchesCouponFilters(
  c: CouponItem,
  selectedTypeFilter: string,
  selectedStatusFilter: string,
  searchQuery: string
): boolean {
  if (selectedTypeFilter !== "ALL" && c.couponType !== selectedTypeFilter) {
    return false;
  }
  if (selectedStatusFilter === "ACTIVE" && !c.isActive) {
    return false;
  }
  if (selectedStatusFilter === "INACTIVE" && c.isActive) {
    return false;
  }

  const query = searchQuery.trim().toLowerCase();
  if (query) {
    const matchesCode = c.code.toLowerCase().includes(query);
    const matchesDesc = c.description?.toLowerCase().includes(query) ?? false;
    const matchesRest = c.restaurant?.name.toLowerCase().includes(query) ?? false;
    if (!matchesCode && !matchesDesc && !matchesRest) {
      return false;
    }
  }

  return true;
}

interface EmptyCouponsStateProps {
  searchQuery: string;
  isSuperAdmin: boolean;
  onCreateNew: () => void;
}

function EmptyCouponsState({
  searchQuery,
  isSuperAdmin,
  onCreateNew,
}: Readonly<EmptyCouponsStateProps>) {
  const getEmptyMessage = () => {
    if (searchQuery) {
      return "No coupons matched your search filters. Try clearing your search.";
    }
    if (isSuperAdmin) {
      return "No promotional coupons have been created for this outlet yet.";
    }
    return "Create your first promotional discount coupon to attract dining customers!";
  };

  return (
    <div className="p-16 bg-white rounded-3xl border border-stone-200/90 text-center space-y-3">
      <div className="w-14 h-14 rounded-3xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center mx-auto text-2xl">
        🎟️
      </div>
      <h3 className="text-base font-bold text-stone-800">No Coupons Found</h3>
      <p className="text-xs text-stone-500 max-w-sm mx-auto">
        {getEmptyMessage()}
      </p>
      {!isSuperAdmin && (
        <Button
          onClick={onCreateNew}
          className="mt-2 h-9 px-4 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold cursor-pointer"
        >
          + Create First Coupon
        </Button>
      )}
    </div>
  );
}

interface CouponCardProps {
  coupon: CouponItem;
  isSuperAdmin: boolean;
  copiedCode: string | null;
  onCopyCode: (code: string) => void;
  onToggleActive: (coupon: CouponItem) => void;
  onEditCoupon: (coupon: CouponItem) => void;
  onDeleteCoupon: (coupon: CouponItem) => void;
}

function getCouponAccentGradient(couponType?: string): string {
  if (couponType === "TIERED_MIN_ORDER") {
    return "bg-gradient-to-r from-purple-500 to-indigo-600";
  }
  if (couponType === "PRODUCT_DISCOUNT") {
    return "bg-gradient-to-r from-amber-500 to-orange-600";
  }
  return "bg-gradient-to-r from-emerald-500 to-teal-600";
}

function CouponTypeBadge({ coupon }: Readonly<{ coupon: CouponItem }>) {
  if (coupon.couponType === "TIERED_MIN_ORDER") {
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 font-bold border border-purple-200">
        🎯 Min ₹{coupon.minOrderAmount ?? 1200}
      </span>
    );
  }
  if (coupon.couponType === "PRODUCT_DISCOUNT") {
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-200">
        📦 Dishes Only
      </span>
    );
  }
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold border border-emerald-200">
      💳 Cart Discount
    </span>
  );
}

function CouponConditions({ coupon }: { coupon: CouponItem }) {
  const isProductType = coupon.couponType === "PRODUCT_DISCOUNT";
  const hasMinOrder = typeof coupon.minOrderAmount === "number" && coupon.minOrderAmount > 0;
  const hasMaxDiscount = typeof coupon.maxDiscount === "number" && coupon.maxDiscount > 0;
  const dishCount = coupon.productIds?.length ?? 0;

  return (
    <div className="p-3 bg-stone-50 rounded-2xl border border-stone-100 space-y-1.5 text-[11px] mb-4">
      {hasMinOrder && (
        <div className="flex items-center justify-between text-stone-600">
          <span className="text-stone-400">Min Cart Value:</span>
          <span className="font-bold text-stone-800 font-mono">
            ₹{coupon.minOrderAmount?.toFixed(2)}
          </span>
        </div>
      )}

      {hasMaxDiscount && (
        <div className="flex items-center justify-between text-stone-600">
          <span className="text-stone-400">Max Discount Cap:</span>
          <span className="font-bold text-stone-800 font-mono">
            ₹{coupon.maxDiscount?.toFixed(2)}
          </span>
        </div>
      )}

      {isProductType && coupon.productIds && (
        <div className="flex items-center justify-between text-stone-600">
          <span className="text-stone-400">Applicable Dishes:</span>
          <span className="font-bold text-amber-900">
            {dishCount > 0 ? `${dishCount} Selected Dishes` : "All Menu Items"}
          </span>
        </div>
      )}

      {coupon.endDate && (
        <div className="flex items-center justify-between text-stone-600">
          <span className="text-stone-400">Expires On:</span>
          <span className="font-semibold text-stone-700">
            {new Date(coupon.endDate).toLocaleDateString()}
          </span>
        </div>
      )}
    </div>
  );
}

interface CouponCardActionsProps {
  coupon: CouponItem;
  isSuperAdmin: boolean;
  onToggleActive: (coupon: CouponItem) => void;
  onEditCoupon: (coupon: CouponItem) => void;
  onDeleteCoupon: (coupon: CouponItem) => void;
}

function CouponCardActions({
  coupon,
  isSuperAdmin,
  onToggleActive,
  onEditCoupon,
  onDeleteCoupon,
}: Readonly<CouponCardActionsProps>) {
  if (isSuperAdmin) {
    return (
      <span className="text-[10px] text-stone-400 font-semibold italic">
        Audit Only
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Active Toggle Switch */}
      <Switch
        checked={coupon.isActive}
        onCheckedChange={() => onToggleActive(coupon)}
        className="data-[state=checked]:bg-amber-600"
        title={coupon.isActive ? "Deactivate coupon" : "Activate coupon"}
      />

      {/* Edit */}
      <button
        type="button"
        onClick={() => onEditCoupon(coupon)}
        className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
        title="Edit coupon"
        aria-label={`Edit coupon ${coupon.code}`}
      >
        <Edit3 size={15} />
      </button>

      {/* Delete */}
      <button
        type="button"
        onClick={() => onDeleteCoupon(coupon)}
        className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
        title="Delete coupon"
        aria-label={`Delete coupon ${coupon.code}`}
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}

function CouponCard({
  coupon,
  isSuperAdmin,
  copiedCode,
  onCopyCode,
  onToggleActive,
  onEditCoupon,
  onDeleteCoupon,
}: Readonly<CouponCardProps>) {
  const discountLabel =
    coupon.discountType === "PERCENTAGE"
      ? `${coupon.discountValue}% OFF`
      : `₹${coupon.discountValue} FLAT`;

  const redemptionCount = coupon._count?.orders ?? coupon.usedCount ?? 0;

  return (
    <div
      className={`p-5 rounded-3xl border transition-all flex flex-col justify-between relative overflow-hidden bg-white ${coupon.isActive
        ? "border-stone-200/90 hover:border-amber-400/80 hover:shadow-md"
        : "border-stone-200/60 bg-stone-50/50 opacity-80"
        }`}
    >
      {/* Decorative Top Accent Tag */}
      <div className={`absolute top-0 right-0 left-0 h-1.5 ${getCouponAccentGradient(coupon.couponType)}`} />

      <div>
        {/* Top Row: Restaurant Name (if super admin) & Status */}
        <div className="flex items-center justify-between gap-2 mb-3 pt-1">
          {isSuperAdmin && coupon.restaurant ? (
            <div className="flex items-center gap-1.5 min-w-0">
              <Store size={13} className="text-amber-700 shrink-0" />
              <span className="text-xs font-bold text-stone-800 truncate">
                {coupon.restaurant.name}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <span
                className={`w-2 h-2 rounded-full ${coupon.isActive ? "bg-emerald-500 animate-pulse" : "bg-stone-300"
                  }`}
              />
              <span className="text-[11px] font-semibold text-stone-500">
                {coupon.isActive ? "Live in Menu & Cart" : "Disabled"}
              </span>
            </div>
          )}

          <CouponTypeBadge coupon={coupon} />
        </div>

        {/* Coupon Code Pill & Value Header */}
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 bg-stone-900 text-amber-300 font-mono font-black text-sm tracking-wider rounded-xl border border-stone-800 flex items-center gap-1.5 shadow-2xs">
              <Tag size={13} />
              <span>{coupon.code}</span>
            </div>
            <button
              type="button"
              onClick={() => onCopyCode(coupon.code)}
              title="Copy code"
              aria-label={`Copy coupon code ${coupon.code}`}
              className="p-1.5 rounded-lg border border-stone-200 text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              {copiedCode === coupon.code ? (
                <Check size={14} className="text-emerald-600" />
              ) : (
                <Copy size={14} />
              )}
            </button>
          </div>

          <div className="text-right">
            <span className="text-base font-black text-amber-900 font-mono">
              {discountLabel}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-stone-600 mb-3 line-clamp-2 leading-relaxed">
          {coupon.description || "Valid promotional discount coupon."}
        </p>

        {/* Conditions & Criteria Badges */}
        <CouponConditions coupon={coupon} />
      </div>

      {/* Footer Controls & Actions */}
      <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
        <div className="text-[11px] text-stone-500 font-medium">
          Redeemed:{" "}
          <span className="font-bold font-mono text-stone-800">
            {redemptionCount}
          </span>
          {coupon.usageLimit ? ` / ${coupon.usageLimit}` : " times"}
        </div>

        <CouponCardActions
          coupon={coupon}
          isSuperAdmin={isSuperAdmin}
          onToggleActive={onToggleActive}
          onEditCoupon={onEditCoupon}
          onDeleteCoupon={onDeleteCoupon}
        />
      </div>
    </div>
  );
}

export default function CouponsClient({
  userRole,
  restaurantId,
  restaurantName,
}: Readonly<CouponsClientProps>) {
  const isSuperAdmin = userRole === "SUPER_ADMIN";

  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");

  // Multi-tenant Restaurant Filter for Super Admin
  const [restaurants, setRestaurants] = useState<RestaurantFilterItem[]>([]);
  const [selectedRestFilter, setSelectedRestFilter] = useState<string>("all");

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponItem | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Fetch Restaurants for Super Admin
  useEffect(() => {
    if (isSuperAdmin) {
      axios
        .get("/api/super-admin/restaurants")
        .then((res) => {
          setRestaurants(res.data?.data || []);
        })
        .catch((err) => {
          console.error("Failed to fetch restaurants for super admin filter:", err);
        });
    }
  }, [isSuperAdmin]);

  // Fetch Coupons
  const fetchCoupons = useCallback(async () => {
    try {
      let url = "/api/coupons";
      const params = new URLSearchParams();

      if (isSuperAdmin && selectedRestFilter !== "all") {
        params.append("restaurantId", selectedRestFilter);
      } else if (!isSuperAdmin && restaurantId) {
        params.append("restaurantId", restaurantId);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await axios.get(url);
      setCoupons(res.data?.data || []);
    } catch (error) {
      console.error("Failed to fetch coupons:", error);
      toast.error("Failed to load coupons. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin, selectedRestFilter, restaurantId]);

  const handleManualRefresh = () => {
    setLoading(true);
    void fetchCoupons();
  };

  useEffect(() => {
    let ignore = false;

    const loadInitialCoupons = async () => {
      try {
        let url = "/api/coupons";
        const params = new URLSearchParams();

        if (isSuperAdmin && selectedRestFilter !== "all") {
          params.append("restaurantId", selectedRestFilter);
        } else if (!isSuperAdmin && restaurantId) {
          params.append("restaurantId", restaurantId);
        }

        if (params.toString()) {
          url += `?${params.toString()}`;
        }

        const res = await axios.get(url);
        if (!ignore) {
          setCoupons(res.data?.data || []);
        }
      } catch (error) {
        if (!ignore) {
          console.error("Failed to fetch coupons:", error);
          toast.error("Failed to load coupons. Please refresh.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    void loadInitialCoupons();

    return () => {
      ignore = true;
    };
  }, [isSuperAdmin, selectedRestFilter, restaurantId]);

  // Toggle Active Status
  const handleToggleActive = async (coupon: CouponItem) => {
    if (isSuperAdmin) {
      toast.error("Super Admin has read-only access. Only tenant owners can change coupon status.");
      return;
    }

    try {
      const newStatus = !coupon.isActive;
      // Optimistic update
      setCoupons((prev) =>
        prev.map((c) => (c.id === coupon.id ? { ...c, isActive: newStatus } : c))
      );

      await axios.put(`/api/coupons/${coupon.id}`, { isActive: newStatus });
      toast.success(
        newStatus
          ? `Coupon '${coupon.code}' is now Active! 🟢`
          : `Coupon '${coupon.code}' is now Inactive! ⏸️`
      );
    } catch (error) {
      console.error("Failed to toggle coupon status:", error);
      toast.error("Failed to update status. Reverting change.");
      void fetchCoupons();
    }
  };

  // Delete Coupon
  const handleDeleteCoupon = async (coupon: CouponItem) => {
    if (isSuperAdmin) {
      toast.error("Super Admin has read-only access to coupons.");
      return;
    }

    if (!confirm(`Are you sure you want to delete coupon '${coupon.code}'?`)) {
      return;
    }

    try {
      await axios.delete(`/api/coupons/${coupon.id}`);
      toast.success(`Coupon '${coupon.code}' deleted successfully`);
      setCoupons((prev) => prev.filter((c) => c.id !== coupon.id));
    } catch (error) {
      console.error("Failed to delete coupon:", error);
      toast.error("Failed to delete coupon.");
    }
  };

  // Copy Coupon Code
  const handleCopyCode = (code: string) => {
    void navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Coupon code '${code}' copied! 📋`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Filtered List
  const filteredCoupons = useMemo(() => {
    return coupons.filter((c) =>
      matchesCouponFilters(c, selectedTypeFilter, selectedStatusFilter, searchQuery)
    );
  }, [coupons, selectedTypeFilter, selectedStatusFilter, searchQuery]);

  // Summary Metrics
  const stats = useMemo(() => {
    const total = coupons.length;
    const active = coupons.filter((c) => c.isActive).length;
    const productDeals = coupons.filter((c) => c.couponType === "PRODUCT_DISCOUNT").length;
    const minOrderDeals = coupons.filter((c) => c.couponType === "TIERED_MIN_ORDER").length;
    const totalRedemptions = coupons.reduce((acc, c) => acc + (c._count?.orders ?? c.usedCount ?? 0), 0);

    return { total, active, productDeals, minOrderDeals, totalRedemptions };
  }, [coupons]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Super Admin Read-Only Notice Banner */}
      {isSuperAdmin && (
        <div className="p-4 bg-gradient-to-r from-amber-900/10 via-amber-800/5 to-transparent border border-amber-500/30 rounded-3xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
              <Shield size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-stone-900">
                  Super Admin Read-Only Audit Console
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-300">
                  View-Only Mode
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                You are auditing promotional offers across registered restaurants. Per platform governance, tenant owners manage and create their own promotional rules.
              </p>
            </div>
          </div>

          {/* Multi-Restaurant Switcher */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-semibold text-stone-600 hidden sm:inline">Outlet:</span>
            <select
              value={selectedRestFilter}
              onChange={(e) => setSelectedRestFilter(e.target.value)}
              className="h-9 px-3 bg-white border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="all">All Restaurants ({restaurants.length})</option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-widest">
            <TicketPercent size={14} />
            <span>Promotions & Revenue Growth</span>
          </div>
          <h1 className="text-3xl font-bold font-cormorant text-stone-900 tracking-tight mt-0.5">
            Coupons & Promotional Offers
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            {isSuperAdmin
              ? "Global repository of restaurant promotional vouchers, menu product deals & minimum order tiers."
              : `Create discount codes, product-level promotions, and min-order value criteria (e.g. Min ₹1,200) for ${restaurantName || "your restaurant"}.`}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            className="h-10 px-3.5 rounded-xl border-stone-200 text-stone-600 hover:bg-stone-50 gap-1.5"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span className="text-xs">Refresh</span>
          </Button>

          {/* Create Button (Hidden for Super Admin) */}
          {!isSuperAdmin && (
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="h-10 px-4 rounded-xl bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 hover:from-amber-600 hover:to-amber-800 text-white font-bold text-xs shadow-md shadow-amber-900/20 gap-2 cursor-pointer"
            >
              <Plus size={16} />
              <span>Create New Coupon</span>
            </Button>
          )}
        </div>
      </div>

      {/* 4 Summary Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-stone-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold">Total Offers</span>
            <TicketPercent size={16} className="text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-stone-900">{stats.total}</div>
          <p className="text-[11px] text-stone-400">Configured vouchers</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold">Active Live</span>
            <Sparkles size={16} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700">{stats.active}</div>
          <p className="text-[11px] text-stone-400">Visible for ordering</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold">Product Deals</span>
            <ShoppingBag size={16} className="text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-blue-700">{stats.productDeals}</div>
          <p className="text-[11px] text-stone-400">Specific dish badges</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold">Tiered (Min ₹1200+)</span>
            <Target size={16} className="text-purple-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-purple-700">{stats.minOrderDeals}</div>
          <p className="text-[11px] text-stone-400">High-ticket cart drivers</p>
        </div>
      </div>

      {/* Filter Bar & Search */}
      <div className="p-4 bg-white rounded-3xl border border-stone-200/90 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by code (e.g. FEAST1200), description..."
              className="pl-9 h-10 bg-stone-50 border-stone-200 text-xs rounded-xl"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setSelectedStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${selectedStatusFilter === "ALL"
                ? "bg-stone-900 text-white shadow-2xs"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
            >
              All ({coupons.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatusFilter("ACTIVE")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${selectedStatusFilter === "ACTIVE"
                ? "bg-emerald-700 text-white shadow-2xs"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
            >
              Active ({stats.active})
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatusFilter("INACTIVE")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${selectedStatusFilter === "INACTIVE"
                ? "bg-amber-800 text-white shadow-2xs"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
            >
              Inactive ({stats.total - stats.active})
            </button>
          </div>
        </div>

        {/* 3 Scope Type Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-hide text-xs">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider shrink-0 mr-1">
            Scope:
          </span>
          <button
            type="button"
            onClick={() => setSelectedTypeFilter("ALL")}
            className={`px-3 py-1 rounded-lg border text-xs font-semibold whitespace-nowrap transition-all ${selectedTypeFilter === "ALL"
              ? "bg-amber-100 text-amber-900 border-amber-300 shadow-2xs"
              : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
              }`}
          >
            All Types
          </button>
          <button
            type="button"
            onClick={() => setSelectedTypeFilter("PRODUCT_DISCOUNT")}
            className={`px-3 py-1 rounded-lg border text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${selectedTypeFilter === "PRODUCT_DISCOUNT"
              ? "bg-amber-100 text-amber-900 border-amber-300 shadow-2xs"
              : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
              }`}
          >
            <ShoppingBag size={12} />
            <span>Product Specific ({stats.productDeals})</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedTypeFilter("ORDER_DISCOUNT")}
            className={`px-3 py-1 rounded-lg border text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${selectedTypeFilter === "ORDER_DISCOUNT"
              ? "bg-amber-100 text-amber-900 border-amber-300 shadow-2xs"
              : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
              }`}
          >
            <Banknote size={12} />
            <span>Total Bill Discount ({stats.total - stats.productDeals - stats.minOrderDeals})</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedTypeFilter("TIERED_MIN_ORDER")}
            className={`px-3 py-1 rounded-lg border text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${selectedTypeFilter === "TIERED_MIN_ORDER"
              ? "bg-amber-100 text-amber-900 border-amber-300 shadow-2xs"
              : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
              }`}
          >
            <Target size={12} />
            <span>Tiered (Min ₹1200+) ({stats.minOrderDeals})</span>
          </button>
        </div>
      </div>

      {/* Coupons List / Grid */}
      {loading && (
        <div className="p-16 bg-white rounded-3xl border border-stone-200/90 text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-amber-600 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-stone-500 font-semibold">Loading promotional coupons...</p>
        </div>
      )}

      {!loading && filteredCoupons.length === 0 && (
        <EmptyCouponsState
          searchQuery={searchQuery}
          isSuperAdmin={isSuperAdmin}
          onCreateNew={() => setIsCreateModalOpen(true)}
        />
      )}

      {!loading && filteredCoupons.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCoupons.map((coupon) => (
            <CouponCard
              key={coupon.id}
              coupon={coupon}
              isSuperAdmin={isSuperAdmin}
              copiedCode={copiedCode}
              onCopyCode={handleCopyCode}
              onToggleActive={handleToggleActive}
              onEditCoupon={setEditingCoupon}
              onDeleteCoupon={handleDeleteCoupon}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <CouponCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchCoupons}
        restaurantId={restaurantId}
      />

      <CouponEditModal
        coupon={editingCoupon}
        isOpen={Boolean(editingCoupon)}
        onClose={() => setEditingCoupon(null)}
        onSuccess={fetchCoupons}
      />
    </div>
  );
}

