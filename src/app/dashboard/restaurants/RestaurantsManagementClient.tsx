"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import Link from "next/link";
import {
  Store,
  Plus,
  Search,
  Leaf,
  Drumstick,
  Utensils,
  MapPin,
  Users,
  Package,
  ShieldCheck,
  BarChart3,
  Edit3,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import RestaurantRegistrationModal, { DietaryType } from "./components/RestaurantRegistrationModal";
import RestaurantEditModal from "./components/RestaurantEditModal";

interface RestaurantItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string | null;
  state: string | null;
  pincode: string | null;
  dietaryCategory: DietaryType;
  fssaiLicense: string | null;
  isActive: boolean;
  createdAt: string;
  users: Array<{
    id: string;
    name: string;
    email: string;
    phone: string | null;
    isActive: boolean;
  }>;
  _count: {
    tables: number;
    products: number;
    categories: number;
    users: number;
    orders: number;
  };
}

export default function RestaurantsManagementClient() {
  const [restaurants, setRestaurants] = useState<RestaurantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dietaryFilter, setDietaryFilter] = useState<"ALL" | DietaryType>("ALL");
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<RestaurantItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  const fetchRestaurants = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/super-admin/restaurants");
      if (res.data.success) {
        setRestaurants(res.data.data);
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Failed to load restaurants");
      } else if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("Failed to load restaurants");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadRestaurants = async () => {
      try {
        const res = await axios.get("/api/super-admin/restaurants");
        if (isMounted && res.data?.success) {
          setRestaurants(res.data.data);
        }
      } catch (err: unknown) {
        if (isMounted) {
          if (axios.isAxiosError(err)) {
            toast.error(err.response?.data?.message || "Failed to load restaurants");
          } else if (err instanceof Error) {
            toast.error(err.message);
          } else {
            toast.error("Failed to load restaurants");
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadRestaurants();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggleActive = async (restaurant: RestaurantItem) => {
    try {
      setUpdatingStatusId(restaurant.id);
      const updatedActive = !restaurant.isActive;
      const res = await axios.patch(`/api/super-admin/restaurants/${restaurant.id}`, {
        isActive: updatedActive,
      });

      if (res.data.success) {
        setRestaurants((prev) =>
          prev.map((r) => (r.id === restaurant.id ? { ...r, isActive: updatedActive } : r))
        );
        toast.success(`${restaurant.name} marked as ${updatedActive ? "Active" : "Inactive"}`);
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Failed to update restaurant status");
      } else if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("Failed to update restaurant status");
      }
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // Metrics Calculation
  const stats = useMemo(() => {
    const total = restaurants.length;
    const pureVeg = restaurants.filter((r) => r.dietaryCategory === "PURE_VEG").length;
    const pureNonVeg = restaurants.filter((r) => r.dietaryCategory === "PURE_NON_VEG").length;
    const both = restaurants.filter((r) => r.dietaryCategory === "BOTH").length;
    return { total, pureVeg, pureNonVeg, both };
  }, [restaurants]);

  // Filtered List
  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((r) => {
      const matchesSearch =
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.phone.includes(searchQuery);

      const matchesDietary = dietaryFilter === "ALL" || r.dietaryCategory === dietaryFilter;

      return matchesSearch && matchesDietary;
    });
  }, [restaurants, searchQuery, dietaryFilter]);

  const renderRestaurantContent = () => {
    if (loading) {
      return (
        <div className="p-12 text-center bg-white rounded-3xl border border-culinary-border/80">
          <RefreshCw className="w-8 h-8 animate-spin text-amber-700 mx-auto mb-3" />
          <p className="text-sm font-semibold text-culinary-text">Loading registered restaurants...</p>
        </div>
      );
    }

    if (filteredRestaurants.length === 0) {
      const emptyMessage = searchQuery
        ? "No restaurant matches your search criteria. Try a different query."
        : "No restaurants registered under this category yet. Click 'Register New Restaurant' to add one.";

      return (
        <div className="p-12 text-center bg-white rounded-3xl border border-culinary-border/80 space-y-3">
          <Store className="w-12 h-12 text-culinary-muted/60 mx-auto" />
          <h3 className="text-base font-bold text-culinary-text font-cormorant">No Restaurants Found</h3>
          <p className="text-xs text-culinary-muted max-w-sm mx-auto">
            {emptyMessage}
          </p>
          <Button
            onClick={() => setIsRegisterModalOpen(true)}
            size="sm"
            className="bg-amber-700 hover:bg-amber-800 text-white rounded-xl gap-2"
          >
            <Plus className="w-4 h-4" /> Register Restaurant
          </Button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRestaurants.map((restaurant) => {
          const owner = restaurant.users?.[0];
          return (
            <div
              key={restaurant.id}
              className="bg-white rounded-3xl border border-culinary-border/80 hover:border-amber-400/80 shadow-xs hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col justify-between group"
            >
              <div>
                {/* Card Header with Dietary Tag */}
                <div className="p-5 border-b border-stone-100 bg-gradient-to-b from-stone-50/50 to-white flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg text-culinary-text font-cormorant group-hover:text-amber-800 transition-colors">
                        {restaurant.name}
                      </h3>
                    </div>
                    <p className="text-xs text-culinary-muted flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>{restaurant.city || "Indore"}, {restaurant.state || "MP"}</span>
                    </p>
                  </div>

                  {/* Dietary Classification Badge & Edit Button */}
                  <div className="flex items-center gap-2">
                    <div>
                      {restaurant.dietaryCategory === "PURE_VEG" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <Leaf className="w-3 h-3 text-emerald-600" /> Pure Veg
                        </span>
                      )}
                      {restaurant.dietaryCategory === "PURE_NON_VEG" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                          <Drumstick className="w-3 h-3 text-rose-600" /> Non-Veg
                        </span>
                      )}
                      {restaurant.dietaryCategory === "BOTH" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                          <Utensils className="w-3 h-3 text-amber-700" /> Multi-Cuisine
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingRestaurant(restaurant);
                        setIsEditModalOpen(true);
                      }}
                      className="p-1.5 rounded-xl border border-stone-200/80 bg-white hover:bg-amber-50 hover:border-amber-300 text-stone-500 hover:text-amber-800 transition-colors shadow-2xs cursor-pointer"
                      title="Edit Restaurant"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Body Info */}
                <div className="p-5 space-y-4 text-xs">
                  {/* Owner details */}
                  <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/60 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wider">Owner Account</span>
                      <Badge variant="outline" className="text-[10px] bg-white border-stone-200">
                        OWNER
                      </Badge>
                    </div>
                    <p className="font-semibold text-stone-800">{owner?.name || "Unassigned"}</p>
                    <p className="text-stone-500 font-mono text-[11px] truncate">{owner?.email || restaurant.email}</p>
                  </div>

                  {/* Stats Pill Grid - 4 Columns */}
                  <div className="grid grid-cols-4 gap-1.5 text-center">
                    <div className="p-2 bg-blue-50/60 border border-blue-100 rounded-xl">
                      <span className="text-[9px] font-semibold text-blue-900/70 block uppercase">Staff</span>
                      <span className="text-sm font-bold text-blue-950">{restaurant._count.users}</span>
                    </div>
                    <div className="p-2 bg-emerald-50/60 border border-emerald-100 rounded-xl">
                      <span className="text-[9px] font-semibold text-emerald-900/70 block uppercase">Dishes</span>
                      <span className="text-sm font-bold text-emerald-950">{restaurant._count.products}</span>
                    </div>
                    <div className="p-2 bg-amber-50/60 border border-amber-100 rounded-xl">
                      <span className="text-[9px] font-semibold text-amber-900/70 block uppercase">Tables</span>
                      <span className="text-sm font-bold text-amber-950">{restaurant._count.tables}</span>
                    </div>
                    <div className="p-2 bg-stone-50 border border-stone-200/70 rounded-xl">
                      <span className="text-[9px] font-semibold text-stone-500 block uppercase">Orders</span>
                      <span className="text-sm font-bold text-stone-900">{restaurant._count.orders}</span>
                    </div>
                  </div>

                  {/* Quick Jump Action Buttons for Super Admin */}
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    <Link
                      href={`/dashboard/staff?restaurantId=${restaurant.id}`}
                      className="py-2 px-1 text-center bg-blue-50/80 hover:bg-blue-100 border border-blue-200/70 text-blue-800 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 transition-colors"
                    >
                      <Users className="w-3 h-3 text-blue-600" />
                      <span>Staff ({restaurant._count.users})</span>
                    </Link>
                    <Link
                      href={`/dashboard/products?restaurantId=${restaurant.id}`}
                      className="py-2 px-1 text-center bg-emerald-50/80 hover:bg-emerald-100 border border-emerald-200/70 text-emerald-800 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 transition-colors"
                    >
                      <Package className="w-3 h-3 text-emerald-600" />
                      <span>Dishes ({restaurant._count.products})</span>
                    </Link>
                    <Link
                      href={`/dashboard/reports?restaurantId=${restaurant.id}`}
                      className="py-2 px-1 text-center bg-amber-50/80 hover:bg-amber-100 border border-amber-200/70 text-amber-900 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 transition-colors"
                    >
                      <BarChart3 className="w-3 h-3 text-amber-700" />
                      <span>Reports</span>
                    </Link>
                  </div>

                  {restaurant.fssaiLicense && (
                    <p className="text-[11px] text-stone-500 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>FSSAI: <strong className="font-mono text-stone-700">{restaurant.fssaiLicense}</strong></span>
                    </p>
                  )}
                </div>
              </div>

              {/* Footer Switch & Actions */}
              <div className="p-4 border-t border-stone-100 bg-stone-50/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={restaurant.isActive}
                    onCheckedChange={() => handleToggleActive(restaurant)}
                    disabled={updatingStatusId === restaurant.id}
                  />
                  <span className="text-xs font-semibold text-stone-600">
                    {restaurant.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingRestaurant(restaurant);
                      setIsEditModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-amber-900 hover:text-amber-700 hover:underline cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                    <span>Edit</span>
                  </button>
                  <span className="text-[11px] text-stone-400">
                    Created {new Date(restaurant.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-amber-900/10 via-amber-800/5 to-transparent p-6 rounded-3xl border border-culinary-border/70 backdrop-blur-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-100 text-amber-900 rounded-xl">
              <Store className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold font-cormorant text-culinary-text">
              Restaurant Tenants & Management
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-culinary-muted">
            Register new restaurants, configure dietary policies (Pure Veg, Non-Veg, Both), and manage owner accounts.
          </p>
        </div>

        <Button
          onClick={() => setIsRegisterModalOpen(true)}
          className="bg-amber-700 hover:bg-amber-800 text-white font-medium rounded-2xl gap-2 shadow-lg shadow-amber-900/10 h-11 px-5"
        >
          <Plus className="w-4 h-4" /> Register New Restaurant
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Restaurants */}
        <div className="bg-white p-5 rounded-2xl border border-culinary-border/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-culinary-muted">Total Restaurants</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-culinary-text font-cormorant">{stats.total}</p>
          <p className="text-[11px] text-culinary-muted">Registered tenant outlets</p>
        </div>

        {/* Pure Veg */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800">Pure Veg Outlets</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Leaf className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-950 font-cormorant">{stats.pureVeg}</p>
          <p className="text-[11px] text-emerald-700">100% Vegetarian certified</p>
        </div>

        {/* Pure Non-Veg */}
        <div className="bg-white p-5 rounded-2xl border border-rose-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-800">Pure Non-Veg</span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <Drumstick className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-950 font-cormorant">{stats.pureNonVeg}</p>
          <p className="text-[11px] text-rose-700">Specialist meat & seafood</p>
        </div>

        {/* Both / Multi-Cuisine */}
        <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800">Multi-Cuisine (Both)</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Utensils className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-950 font-cormorant">{stats.both}</p>
          <p className="text-[11px] text-amber-800">Veg & Non-Veg menu options</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-culinary-border/80 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-culinary-muted" />
          <Input
            placeholder="Search by restaurant, city, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 border-culinary-border/80 focus-visible:ring-amber-600 rounded-xl text-xs"
          />
        </div>

        {/* Dietary Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button type="button"
            onClick={() => setDietaryFilter("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${dietaryFilter === "ALL"
              ? "bg-stone-800 text-white shadow-xs"
              : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
          >
            All Types ({restaurants.length})
          </button>
          <button type="button"
            onClick={() => setDietaryFilter("PURE_VEG")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${dietaryFilter === "PURE_VEG"
              ? "bg-emerald-700 text-white shadow-xs"
              : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
              }`}
          >
            <Leaf className="w-3.5 h-3.5" /> Pure Veg
          </button>
          <button type="button"
            onClick={() => setDietaryFilter("PURE_NON_VEG")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${dietaryFilter === "PURE_NON_VEG"
              ? "bg-rose-700 text-white shadow-xs"
              : "bg-rose-50 text-rose-800 hover:bg-rose-100"
              }`}
          >
            <Drumstick className="w-3.5 h-3.5" /> Non-Veg
          </button>
          <button type="button"
            onClick={() => setDietaryFilter("BOTH")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${dietaryFilter === "BOTH"
              ? "bg-amber-700 text-white shadow-xs"
              : "bg-amber-50 text-amber-800 hover:bg-amber-100"
              }`}
          >
            <Utensils className="w-3.5 h-3.5" /> Both (Mixed)
          </button>
        </div>
      </div>

      {/* Restaurant List */}
      {renderRestaurantContent()}

      {/* Registration Modal */}
      <RestaurantRegistrationModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={() => {
          fetchRestaurants();
        }}
      />

      {/* Edit Restaurant Modal */}
      <RestaurantEditModal
        isOpen={isEditModalOpen}
        restaurant={editingRestaurant}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingRestaurant(null);
        }}
        onSuccess={() => {
          fetchRestaurants();
        }}
      />
    </div>
  );
}
