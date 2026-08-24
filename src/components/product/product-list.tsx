"use client";

import Image from "next/image";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  RotateCw,
  Utensils,
  Leaf,
  Flame,
  CheckCircle2,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Star,
  Building2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { IProduct } from "@/modules/product/types";
import { ICategory } from "@/modules/category/types";
import { ProductFormModal } from "./product-form-modal";
import { DeleteProductDialog } from "./delete-product-dialog";

export type DietaryCategory = "PURE_VEG" | "PURE_NON_VEG" | "BOTH";

/* ==========================================================================
   Helper Functions
   ========================================================================== */

function matchesSearch(product: IProduct, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase().trim();
  return (
    product.name.toLowerCase().includes(q) ||
    Boolean(product.description?.toLowerCase().includes(q)) ||
    Boolean(product.category?.name?.toLowerCase().includes(q))
  );
}

function matchesCategory(product: IProduct, selectedCategory: string): boolean {
  return selectedCategory === "ALL" || product.categoryId === selectedCategory;
}

function matchesFoodType(product: IProduct, selectedFoodType: string): boolean {
  return selectedFoodType === "ALL" || product.foodType === selectedFoodType;
}

function matchesAvailability(product: IProduct, selectedAvailability: string): boolean {
  if (selectedAvailability === "IN_STOCK") return product.isAvailable;
  if (selectedAvailability === "OUT_OF_STOCK") return !product.isAvailable;
  return true;
}

function calculateKpis(products: IProduct[]) {
  const total = products.length;
  const vegCount = products.filter((p) => p.foodType === "VEG").length;
  const meatCount = products.filter((p) => p.foodType === "NON_VEG").length;
  const eggCount = products.filter((p) => p.foodType === "EGG").length;
  const nonVegCount = meatCount + eggCount;
  const inStockCount = products.filter((p) => p.isAvailable).length;
  const featuredCount = products.filter((p) => p.isFeatured).length;

  return {
    total,
    vegCount,
    meatCount,
    eggCount,
    nonVegCount,
    inStockCount,
    featuredCount,
  };
}

function calculatePageNumbers(currentPage: number, totalPages: number): (number | string)[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | string)[] = [1];
  if (currentPage > 3) {
    pages.push("dots-left");
  }

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (currentPage < totalPages - 2) {
    pages.push("dots-right");
  }
  pages.push(totalPages);
  return pages;
}

/* ==========================================================================
   Subcomponents
   ========================================================================== */

function FoodTypeBadge({ type }: Readonly<{ type: string }>) {
  switch (type) {
    case "VEG":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Pure Veg
        </span>
      );
    case "NON_VEG":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Non-Veg
        </span>
      );
    case "EGG":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Contains Egg
        </span>
      );
    default:
      return null;
  }
}

function ProductListLoading() {
  return (
    <div className="flex flex-col items-center justify-center p-20 space-y-3 bg-white rounded-3xl border border-gray-100 shadow-sm">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-culinary-primary border-t-transparent" />
      <p className="text-sm font-semibold text-gray-500">Loading restaurant menu & dishes...</p>
    </div>
  );
}

interface SuperAdminScopeBarProps {
  restaurants: Array<{ id: string; name: string; dietaryCategory?: string }>;
  selectedRestaurant: string;
  productsCount: number;
  onSelectRestaurant: (restaurantId: string) => void;
}

function SuperAdminScopeBar({
  restaurants,
  selectedRestaurant,
  productsCount,
  onSelectRestaurant,
}: Readonly<SuperAdminScopeBarProps>) {
  const currentRestName = restaurants.find((r) => r.id === selectedRestaurant)?.name || "Select Restaurant";

  const getDietaryBadgeText = (dietaryCategory?: string) => {
    if (dietaryCategory === "PURE_VEG") return "🌱 Pure Veg";
    if (dietaryCategory === "PURE_NON_VEG") return "🍗 Pure Non-Veg";
    return "🥗🍗 Multi-Cuisine";
  };

  return (
    <div className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-2xs flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-gray-500">Restaurant Scope:</span>
        <Select value={selectedRestaurant} onValueChange={(val) => onSelectRestaurant(val ?? "")}>
          <SelectTrigger className="rounded-xl border-gray-200 text-xs bg-amber-50/70 hover:bg-amber-50 h-9.5 w-full sm:w-80 shadow-2xs font-semibold text-gray-900 border-amber-200/80 transition-colors">
            <div className="flex items-center gap-2 truncate">
              <Building2 size={15} className="text-culinary-primary shrink-0" />
              <span className="truncate">{currentRestName}</span>
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-2xl text-xs w-[360px] min-w-[360px] max-h-72 overflow-y-auto p-1.5 shadow-xl border-gray-100 z-50">
            {restaurants.map((rest) => (
              <SelectItem key={rest.id} value={rest.id} className="text-xs py-2.5 px-3 rounded-xl cursor-pointer">
                <div className="flex items-center justify-between w-full gap-3 pr-3">
                  <span className="font-semibold text-gray-800 truncate">{rest.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-stone-100 border border-stone-200/80 text-stone-700 font-medium shrink-0">
                    {getDietaryBadgeText(rest.dietaryCategory)}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 font-medium">
          Managing <strong>{productsCount}</strong> menu dishes for {currentRestName}
        </span>
      </div>
    </div>
  );
}

interface ProductKpisProps {
  dietaryCategory: DietaryCategory;
  kpis: ReturnType<typeof calculateKpis>;
}

function SecondaryDietaryKpiCard({ dietaryCategory, kpis }: Readonly<ProductKpisProps>) {
  if (dietaryCategory === "PURE_NON_VEG") {
    return (
      <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Contains Egg</p>
          <p className="text-3xl font-bold text-amber-700">{kpis.eggCount}</p>
          <p className="text-[11px] text-amber-600 font-semibold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Egg specialties
          </p>
        </div>
        <div className="p-3.5 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
          <Utensils size={24} />
        </div>
      </div>
    );
  }

  if (dietaryCategory === "PURE_VEG") {
    return (
      <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Chef Specials</p>
          <p className="text-3xl font-bold text-amber-700">{kpis.featuredCount}</p>
          <p className="text-[11px] text-amber-600 font-semibold flex items-center gap-1">
            <Star size={12} className="text-amber-500 fill-amber-500" /> Featured recipes
          </p>
        </div>
        <div className="p-3.5 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
          <Star size={24} />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
      <div className="space-y-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Non-Veg / Egg</p>
        <p className="text-3xl font-bold text-rose-700">{kpis.nonVegCount}</p>
        <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1">
          <Flame size={12} /> Meat, poultry & eggs
        </p>
      </div>
      <div className="p-3.5 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100">
        <Flame size={24} />
      </div>
    </div>
  );
}

function ProductKpis({ dietaryCategory, kpis }: Readonly<ProductKpisProps>) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Products */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Menu Items</p>
          <p className="text-3xl font-bold text-gray-900">{kpis.total}</p>
          <p className="text-[11px] text-amber-700 font-semibold flex items-center gap-1">
            <Star size={12} className="text-amber-500 fill-amber-500" /> {kpis.featuredCount} Chef Specials
          </p>
        </div>
        <div className="p-3.5 bg-amber-50 text-culinary-primary rounded-2xl border border-amber-100">
          <Utensils size={24} />
        </div>
      </div>

      {/* Card 2: Pure Veg OR Meat Specialties */}
      {dietaryCategory === "PURE_NON_VEG" ? (
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Meat & Poultry</p>
            <p className="text-3xl font-bold text-rose-700">{kpis.meatCount}</p>
            <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1">
              <Flame size={12} /> Chicken, mutton & seafood
            </p>
          </div>
          <div className="p-3.5 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100">
            <Flame size={24} />
          </div>
        </div>
      ) : (
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pure Vegetarian</p>
            <p className="text-3xl font-bold text-emerald-700">{kpis.vegCount}</p>
            <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <Leaf size={12} /> Green dot certified items
            </p>
          </div>
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
            <Leaf size={24} />
          </div>
        </div>
      )}

      {/* Card 3: Non-Veg / Egg OR Egg Specials */}
      <SecondaryDietaryKpiCard dietaryCategory={dietaryCategory} kpis={kpis} />

      {/* In Stock & Available */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">In Stock Ready</p>
          <p className="text-3xl font-bold text-blue-700">{kpis.inStockCount}</p>
          <p className="text-[11px] text-blue-600 font-semibold flex items-center gap-1">
            <CheckCircle2 size={12} /> Available on Customer QR
          </p>
        </div>
        <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
          <CheckCircle2 size={24} />
        </div>
      </div>
    </div>
  );
}

interface ProductFiltersBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  categories: ICategory[];
  products: IProduct[];
  dietaryCategory: DietaryCategory;
  selectedFoodType: string;
  setSelectedFoodType: (foodType: string) => void;
  selectedAvailability: string;
  setSelectedAvailability: (availability: string) => void;
  isRefreshing: boolean;
  onRefresh: () => void;
  onAdd: () => void;
  onResetPage: () => void;
}

function ProductFiltersBar({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  categories,
  products,
  dietaryCategory,
  selectedFoodType,
  setSelectedFoodType,
  selectedAvailability,
  setSelectedAvailability,
  isRefreshing,
  onRefresh,
  onAdd,
  onResetPage,
}: Readonly<ProductFiltersBarProps>) {
  const getSelectedCategoryLabel = () => {
    if (selectedCategory === "ALL") return `All Categories (${products.length})`;
    return categories.find((c) => c.id === selectedCategory)?.name || "Categories";
  };

  const getFoodTypeSelectLabel = () => {
    if (selectedFoodType === "ALL") {
      return dietaryCategory === "PURE_NON_VEG" ? "All Non-Veg" : "All Types";
    }
    if (selectedFoodType === "VEG") return "🟢 Veg Only";
    if (selectedFoodType === "NON_VEG") return "🔴 Non-Veg Only";
    return "🟡 Contains Egg";
  };

  const getAvailabilitySelectLabel = () => {
    if (selectedAvailability === "ALL") return "All Stock";
    if (selectedAvailability === "IN_STOCK") return "In Stock";
    return "Out of Stock";
  };

  return (
    <div className="p-5 border-b border-gray-100 space-y-4">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        {/* Search Input */}
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
          <input
            type="text"
            placeholder="Search by dish name, ingredients, category..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              onResetPage();
            }}
            className="w-full pl-10 pr-9 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-culinary-primary/20 focus:border-culinary-primary transition-all placeholder:text-gray-400 text-gray-800"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                onResetPage();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 bg-gray-200/80 rounded-full w-4 h-4 flex items-center justify-center"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Dropdowns & Add Button */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-between lg:justify-end">
          {/* Category Dropdown */}
          <Select
            value={selectedCategory}
            onValueChange={(val) => {
              setSelectedCategory(val ?? "ALL");
              onResetPage();
            }}
          >
            <SelectTrigger className="rounded-xl border-gray-200 text-xs bg-white h-9 min-w-[150px] max-w-[200px]">
              <div className="truncate">{getSelectedCategoryLabel()}</div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl text-xs w-64 max-h-72 overflow-y-auto p-1.5 shadow-xl border-gray-100 z-50">
              <SelectItem value="ALL" className="font-bold text-gray-900 py-2 rounded-xl cursor-pointer">
                All Categories ({products.length})
              </SelectItem>
              {categories.map((cat) => {
                const count = products.filter((p) => p.categoryId === cat.id).length;
                return (
                  <SelectItem key={cat.id} value={cat.id} className="text-xs py-2 rounded-xl cursor-pointer">
                    <div className="flex items-center justify-between w-full gap-2">
                      <span className="truncate font-medium">{cat.name}</span>
                      <span className="text-[10px] text-gray-400 font-mono">({count})</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          {/* Food Type Dropdown */}
          {dietaryCategory !== "PURE_VEG" && (
            <Select
              value={selectedFoodType}
              onValueChange={(val) => {
                setSelectedFoodType(val ?? "ALL");
                onResetPage();
              }}
            >
              <SelectTrigger className="rounded-xl border-gray-200 text-xs bg-white h-9 min-w-[125px]">
                <div className="truncate">{getFoodTypeSelectLabel()}</div>
              </SelectTrigger>
              <SelectContent className="rounded-2xl text-xs w-48 p-1.5 shadow-xl border-gray-100 z-50">
                <SelectItem value="ALL" className="font-semibold text-gray-900 py-2 rounded-xl cursor-pointer">
                  {dietaryCategory === "PURE_NON_VEG" ? "All Non-Veg / Egg" : "All Food Types"}
                </SelectItem>
                {dietaryCategory !== "PURE_NON_VEG" && (
                  <SelectItem value="VEG" className="text-xs py-2 rounded-xl cursor-pointer">
                    🟢 Veg Only
                  </SelectItem>
                )}
                <SelectItem value="NON_VEG" className="text-xs py-2 rounded-xl cursor-pointer">
                  🔴 Non-Veg Only
                </SelectItem>
                <SelectItem value="EGG" className="text-xs py-2 rounded-xl cursor-pointer">
                  🟡 Contains Egg
                </SelectItem>
              </SelectContent>
            </Select>
          )}

          {/* Availability Dropdown */}
          <Select
            value={selectedAvailability}
            onValueChange={(val) => {
              setSelectedAvailability(val ?? "ALL");
              onResetPage();
            }}
          >
            <SelectTrigger className="rounded-xl border-gray-200 text-xs bg-white h-9 min-w-[115px]">
              <div className="truncate">{getAvailabilitySelectLabel()}</div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl text-xs w-44 p-1.5 shadow-xl border-gray-100 z-50">
              <SelectItem value="ALL" className="font-semibold text-gray-900 py-2 rounded-xl cursor-pointer">
                All Stock
              </SelectItem>
              <SelectItem value="IN_STOCK" className="text-xs py-2 rounded-xl cursor-pointer">
                In Stock
              </SelectItem>
              <SelectItem value="OUT_OF_STOCK" className="text-xs py-2 rounded-xl cursor-pointer">
                Out of Stock
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="text-xs h-9 gap-1.5 border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-xl shadow-none"
          >
            <RotateCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-culinary-primary" : ""}`} />
            Refresh
          </Button>

          {/* Add Product Button */}
          <Button
            size="sm"
            onClick={onAdd}
            className="bg-culinary-primary hover:bg-culinary-primary/90 text-white font-bold h-9 px-4 rounded-xl shadow-sm text-xs gap-1.5"
          >
            <Plus size={15} /> Add Menu Product
          </Button>
        </div>
      </div>
    </div>
  );
}

interface ProductTableRowProps {
  product: IProduct;
  onToggleAvailability: (product: IProduct) => void;
  onEdit: (product: IProduct) => void;
  onDelete: (product: IProduct) => void;
}

function ProductTableRow({
  product,
  onToggleAvailability,
  onEdit,
  onDelete,
}: Readonly<ProductTableRowProps>) {
  const finalPrice =
    product.discount > 0
      ? product.price - (product.price * product.discount) / 100
      : product.price;

  return (
    <tr className="hover:bg-gray-50/70 transition-colors group">
      {/* Product Thumbnail & Name */}
      <td className="px-6 py-3.5">
        <div className="flex items-center gap-3.5">
          {/* Image Thumbnail */}
          <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-amber-50 to-gray-100 overflow-hidden shrink-0 border border-gray-200 shadow-sm flex items-center justify-center">
            {product.image ? (
              <Image
                src={product.image}
                alt={product.name}
                fill
                sizes="48px"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <Utensils size={20} className="text-amber-400" />
            )}
          </div>

          {/* Name & Description */}
          <div className="min-w-0 max-w-sm">
            <div className="flex items-center gap-2">
              <p className="font-bold text-gray-900 font-cormorant text-base truncate" title={product.name}>
                {product.name}
              </p>
              {product.isFeatured && (
                <span
                  className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-md flex items-center gap-0.5 shrink-0"
                  title="Chef's Special Featured Item"
                >
                  <Star size={10} className="fill-amber-600 text-amber-600" /> Special
                </span>
              )}
            </div>
            {product.description && (
              <p
                className="text-[11px] text-gray-400 truncate max-w-[280px] mt-0.5"
                title={product.description}
              >
                {product.description}
              </p>
            )}
          </div>
        </div>
      </td>

      {/* Category & Classification */}
      <td className="px-6 py-3.5 space-y-1">
        <div className="font-semibold text-gray-800 text-xs">
          {product.category?.name || "General Menu"}
        </div>
        <div>
          <FoodTypeBadge type={product.foodType} />
        </div>
      </td>

      {/* Price & Discounts */}
      <td className="px-6 py-3.5">
        <div>
          <span className="font-bold text-gray-900 text-sm">
            ₹{finalPrice.toFixed(2)}
          </span>
          {product.discount > 0 && (
            <div className="flex items-center gap-1.5 text-[11px] mt-0.5">
              <span className="text-gray-400 line-through">
                ₹{product.price.toFixed(2)}
              </span>
              <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                {product.discount}% OFF
              </span>
            </div>
          )}
        </div>
      </td>

      {/* Stock / Availability Switch */}
      <td className="px-6 py-3.5 text-center">
        <div className="inline-flex items-center gap-2">
          <Switch
            checked={product.isAvailable}
            onCheckedChange={() => onToggleAvailability(product)}
          />
          <span
            className={`text-[11px] font-bold ${
              product.isAvailable ? "text-emerald-600" : "text-gray-400"
            }`}
          >
            {product.isAvailable ? "In Stock" : "Out of Stock"}
          </span>
        </div>
      </td>

      {/* Actions */}
      <td className="px-6 py-3.5 text-right pr-6">
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            title="Edit Product"
            onClick={() => onEdit(product)}
            className="h-8 w-8 text-amber-700 hover:text-amber-800 hover:bg-amber-50 rounded-lg"
          >
            <Edit3 size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Delete Product"
            onClick={() => onDelete(product)}
            className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </td>
    </tr>
  );
}

interface ProductTableProps {
  products: IProduct[];
  hasSearchFilter: boolean;
  onToggleAvailability: (product: IProduct) => void;
  onEdit: (product: IProduct) => void;
  onDelete: (product: IProduct) => void;
}

function ProductTable({
  products,
  hasSearchFilter,
  onToggleAvailability,
  onEdit,
  onDelete,
}: Readonly<ProductTableProps>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-50/70 border-b border-gray-200 text-gray-600 uppercase font-bold text-[11px] tracking-wider">
          <tr>
            <th scope="col" className="px-6 py-4">Menu Dish / Product</th>
            <th scope="col" className="px-6 py-4">Category & Classification</th>
            <th scope="col" className="px-6 py-4">Price (₹)</th>
            <th scope="col" className="px-6 py-4 text-center">In-Stock Availability</th>
            <th scope="col" className="px-6 py-4 text-right pr-6">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 text-xs">
          {products.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-6 py-16 text-center">
                <div className="flex flex-col items-center justify-center">
                  <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-3 border border-gray-100">
                    <Utensils className="text-gray-300" size={26} />
                  </div>
                  <p className="text-gray-800 font-bold text-sm">No menu products found</p>
                  <p className="text-gray-400 text-xs mt-0.5 max-w-xs">
                    {hasSearchFilter
                      ? "Try clearing your search query or selecting different filters."
                      : "Start building your restaurant menu by adding your first dish."}
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            products.map((product) => (
              <ProductTableRow
                key={product.id}
                product={product}
                onToggleAvailability={onToggleAvailability}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

interface ProductPaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

function ProductPagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: Readonly<ProductPaginationProps>) {
  const startItemNumber = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItemNumber = Math.min(currentPage * pageSize, totalItems);
  const pageNumbers = calculatePageNumbers(currentPage, totalPages);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-gray-100 bg-gray-50/50">
      <div className="flex items-center gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <span className="font-medium">Per page:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-culinary-primary/30"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div>
          Showing <span className="font-semibold text-gray-800">{startItemNumber}</span> to{" "}
          <span className="font-semibold text-gray-800">{endItemNumber}</span> of{" "}
          <span className="font-semibold text-gray-800">{totalItems}</span> menu products
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 p-0 rounded-lg border-gray-200 bg-white"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          title="First Page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 p-0 rounded-lg border-gray-200 bg-white"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          title="Previous Page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-1 mx-1">
          {pageNumbers.map((p) => {
            if (typeof p === "string" && p.startsWith("dots")) {
              return (
                <span key={p} className="px-2 text-xs text-gray-400">
                  ...
                </span>
              );
            }
            const pageNum = Number(p);
            const isCurrent = pageNum === currentPage;
            return (
              <button
                type="button"
                key={`page-${pageNum}`}
                onClick={() => onPageChange(pageNum)}
                className={`h-8 min-w-[32px] px-2 text-xs font-semibold rounded-lg transition-all ${
                  isCurrent
                    ? "bg-culinary-primary text-white shadow-sm"
                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 p-0 rounded-lg border-gray-200 bg-white"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          title="Next Page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 p-0 rounded-lg border-gray-200 bg-white"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          title="Last Page"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/* ==========================================================================
   Main Component
   ========================================================================== */

export function ProductList() {
  const searchParams = useSearchParams();
  const initialRestId = searchParams.get("restaurantId") || "";

  const [products, setProducts] = useState<IProduct[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [restaurants, setRestaurants] = useState<Array<{ id: string; name: string; dietaryCategory?: string }>>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>(initialRestId);
  const [dietaryCategory, setDietaryCategory] = useState<DietaryCategory>("BOTH");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters and Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedFoodType, setSelectedFoodType] = useState<string>("ALL");
  const [selectedAvailability, setSelectedAvailability] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<IProduct | null>(null);

  const fetchData = useCallback(async (showIndicator = false, restId = selectedRestaurant) => {
    if (showIndicator) setIsRefreshing(true);
    try {
      const restParam = restId ? `?restaurantId=${restId}` : "";
      const [productsRes, categoriesRes, restRes, superAdminRes] = await Promise.all([
        axios.get(`/api/products${restParam}`),
        axios.get(`/api/categories${restParam}`),
        axios.get(`/api/restaurant${restParam}`).catch(() => null),
        axios.get("/api/super-admin/restaurants").catch(() => null),
      ]);
      setProducts(productsRes.data.data || []);
      setCategories(categoriesRes.data.data || []);
      if (restRes?.data?.data?.dietaryCategory) {
        setDietaryCategory(restRes.data.data.dietaryCategory);
      }
      if (superAdminRes?.data?.success && Array.isArray(superAdminRes.data.data)) {
        setIsSuperAdmin(true);
        setRestaurants(superAdminRes.data.data);
        if (!selectedRestaurant && superAdminRes.data.data.length > 0) {
          setSelectedRestaurant(superAdminRes.data.data[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load products");
    } finally {
      setIsLoading(false);
      if (showIndicator) setIsRefreshing(false);
    }
  }, [selectedRestaurant]);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      await fetchData();
    };
    if (!ignore) {
      void load();
    }
    return () => {
      ignore = true;
    };
  }, [fetchData]);

  const handleAdd = () => {
    setSelectedProduct(null);
    setIsFormOpen(true);
  };

  const handleEdit = (product: IProduct) => {
    setSelectedProduct(product);
    setIsFormOpen(true);
  };

  const handleDelete = (product: IProduct) => {
    setSelectedProduct(product);
    setIsDeleteOpen(true);
  };

  // Instant In-Table Toggle for Availability / Stock
  const handleToggleAvailability = async (product: IProduct) => {
    const newStatus = !product.isAvailable;
    // Optimistic UI update
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, isAvailable: newStatus } : p))
    );
    try {
      await axios.put(`/api/products/${product.id}`, {
        name: product.name,
        categoryId: product.categoryId,
        price: product.price,
        foodType: product.foodType,
        isAvailable: newStatus,
        description: product.description,
        image: product.image,
        discount: product.discount,
        isFeatured: product.isFeatured,
      });
      toast.success(`${product.name} is now ${newStatus ? "In Stock" : "Out of Stock"}`);
    } catch (error) {
      console.error("Failed to update product stock status:", error);
      // Revert on error
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, isAvailable: !newStatus } : p))
      );
      toast.error("Failed to update product stock status");
    }
  };

  // KPI Calculations
  const kpis = useMemo(() => calculateKpis(products), [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(
      (prod) =>
        matchesSearch(prod, searchQuery) &&
        matchesCategory(prod, selectedCategory) &&
        matchesFoodType(prod, selectedFoodType) &&
        matchesAvailability(prod, selectedAvailability)
    );
  }, [products, searchQuery, selectedCategory, selectedFoodType, selectedAvailability]);

  // Pagination calculation
  const totalItems = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedProducts = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, safeCurrentPage, pageSize]);

  if (isLoading) {
    return <ProductListLoading />;
  }

  return (
    <div className="space-y-6 font-sans pb-16">
      {/* Top Scope Bar for Super Admin */}
      {isSuperAdmin && restaurants.length > 0 && (
        <SuperAdminScopeBar
          restaurants={restaurants}
          selectedRestaurant={selectedRestaurant}
          productsCount={products.length}
          onSelectRestaurant={(val) => {
            setSelectedRestaurant(val);
            setSelectedCategory("ALL");
            setCurrentPage(1);
          }}
        />
      )}

      {/* Top 4 KPI Metrics Cards */}
      <ProductKpis dietaryCategory={dietaryCategory} kpis={kpis} />

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-culinary-border/40 overflow-hidden">
        {/* Top Controls Bar */}
        <ProductFiltersBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          categories={categories}
          products={products}
          dietaryCategory={dietaryCategory}
          selectedFoodType={selectedFoodType}
          setSelectedFoodType={setSelectedFoodType}
          selectedAvailability={selectedAvailability}
          setSelectedAvailability={setSelectedAvailability}
          isRefreshing={isRefreshing}
          onRefresh={() => fetchData(true)}
          onAdd={handleAdd}
          onResetPage={() => setCurrentPage(1)}
        />

        {/* Structured Table */}
        <ProductTable
          products={paginatedProducts}
          hasSearchFilter={Boolean(searchQuery || selectedCategory !== "ALL" || selectedFoodType !== "ALL")}
          onToggleAvailability={handleToggleAvailability}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {/* Integrated Pagination Footer */}
        {filteredProducts.length > 0 && (
          <ProductPagination
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
          />
        )}
      </div>

      {/* Modals & Drawers */}
      <ProductFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        product={selectedProduct}
        categories={categories}
        dietaryCategory={dietaryCategory}
        onSuccess={fetchData}
      />

      <DeleteProductDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        product={selectedProduct}
        onSuccess={fetchData}
      />
    </div>
  );
}
