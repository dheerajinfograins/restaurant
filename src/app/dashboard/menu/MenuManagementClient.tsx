"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  ExternalLink,
  Star,
  Search,
  ChefHat,
  Plus,
  Trash2,
  Save,
  RotateCw,
  Folder,
  Utensils,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter
} from "@/components/ui/sheet";
import Link from "next/link";

interface CategoryData {
  id: string;
  name: string;
  sortOrder?: number;
  _count?: {
    products: number;
  };
}

type RawStringList = string[] | string | null;

interface ProductData {
  id: string;
  name: string;
  isAvailable: boolean;
  isFeatured?: boolean;
  preparationTime?: number;
  ingredients?: RawStringList;
  recipeInstructions?: RawStringList;
  category?: {
    name: string;
  };
}

interface MenuSettingsData {
  qrMenuStatus?: boolean;
  allowOrdering?: boolean;
  qrShowImages?: boolean;
  qrShowPrices?: boolean;
  showVegNonVeg?: boolean;
  showFeaturedItems?: boolean;
}

interface RecipeItem {
  id: string;
  text: string;
}

interface RecipeFormData {
  preparationTime: number;
  ingredients: RecipeItem[];
  recipeInstructions: RecipeItem[];
}

function createRecipeItem(text = ""): RecipeItem {
  return {
    id: typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `recipe-${Date.now()}-${Date.now().toString(36)}`,
    text,
  };
}


// ---------------------------------------------------------------------------
// Pure Helper Functions (Extracted to keep component complexity low)
// ---------------------------------------------------------------------------

function getProductMonogram(name: string): string {
  const words = name.trim().split(" ");
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getPageNumbers(totalPages: number, safeCurrentPage: number): (number | string)[] {
  const pages: (number | string)[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    pages.push(1);
    if (safeCurrentPage > 3) {
      pages.push("dots-prev");
    }
    const start = Math.max(2, safeCurrentPage - 1);
    const end = Math.min(totalPages - 1, safeCurrentPage + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (safeCurrentPage < totalPages - 2) {
      pages.push("dots-next");
    }
    pages.push(totalPages);
  }
  return pages;
}

function normalizeStringList(val?: RawStringList): string[] {
  if (Array.isArray(val)) return val;
  if (typeof val === "string" && val.trim().length > 0) return [val];
  return [];
}

function filterProducts(
  products: ProductData[],
  searchQuery: string,
  selectedCategory: string,
  selectedStock: string
): ProductData[] {
  const q = searchQuery.toLowerCase().trim();
  return products.filter((p) => {
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      Boolean(p.category?.name?.toLowerCase().includes(q));

    const matchesCategory =
      selectedCategory === "ALL" || p.category?.name === selectedCategory;

    let matchesStock = true;
    if (selectedStock === "IN_STOCK") matchesStock = p.isAvailable;
    else if (selectedStock === "OUT_OF_STOCK") matchesStock = !p.isAvailable;
    else if (selectedStock === "FEATURED") matchesStock = Boolean(p.isFeatured);

    return matchesSearch && matchesCategory && matchesStock;
  });
}

// ---------------------------------------------------------------------------
// Extracted Sub-Components
// ---------------------------------------------------------------------------

function MenuStatusBanner({
  settings,
  previewTableId,
  onTogglePublish,
}: Readonly<{
  settings: MenuSettingsData | null;
  previewTableId: string | null;
  onTogglePublish: (val: boolean) => Promise<void>;
}>) {
  const isPublished = settings?.qrMenuStatus ?? true;

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="flex items-center gap-3.5">
        <div className="p-3 bg-amber-50 text-culinary-primary rounded-2xl border border-amber-100 shrink-0">
          <Sparkles size={22} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${isPublished
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-rose-50 text-rose-700 border-rose-200"
                }`}
            >
              {isPublished ? "🟢 MENU PUBLISHED" : "🔴 MENU HIDDEN"}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {isPublished
              ? "Digital menu is active and accepting guest QR scans on tables."
              : "Digital menu is temporarily disabled. Guests scanning QR will see unavailable notice."}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200 text-xs">
          <span className="font-semibold text-gray-700">Publish Switch</span>
          <Switch checked={isPublished} onCheckedChange={onTogglePublish} />
        </div>

        {previewTableId ? (
          <Link href={`/menu/${previewTableId}`} target="_blank">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-amber-200 text-culinary-primary hover:bg-amber-50 h-9 gap-1.5 text-xs font-bold"
            >
              <ExternalLink size={13} /> Preview Menu
            </Button>
          </Link>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.error("Please add a table in Tables section to preview menu.")}
            className="rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50 h-9 gap-1.5 text-xs font-bold"
          >
            <ExternalLink size={13} /> Preview Menu
          </Button>
        )}
      </div>
    </div>
  );
}

function MenuKpis({
  totalCategories,
  totalProducts,
  availableItems,
  featuredItems,
}: Readonly<{
  totalCategories: number;
  totalProducts: number;
  availableItems: number;
  featuredItems: number;
}>) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Menu Categories</p>
          <p className="text-3xl font-bold text-gray-900">{totalCategories}</p>
          <p className="text-[11px] text-amber-700 font-semibold flex items-center gap-1">
            <Layers size={12} /> Active catalog sections
          </p>
        </div>
        <div className="p-3.5 bg-amber-50 text-culinary-primary rounded-2xl border border-amber-100">
          <Folder size={24} />
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Menu Items</p>
          <p className="text-3xl font-bold text-blue-700">{totalProducts}</p>
          <p className="text-[11px] text-blue-600 font-semibold flex items-center gap-1">
            <Utensils size={12} /> Total dishes catalog
          </p>
        </div>
        <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
          <Utensils size={24} />
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Available on QR</p>
          <p className="text-3xl font-bold text-emerald-700">{availableItems}</p>
          <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle2 size={12} /> Live ready for ordering
          </p>
        </div>
        <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
          <CheckCircle2 size={24} />
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Chef Specials</p>
          <p className="text-3xl font-bold text-purple-700">{featuredItems}</p>
          <p className="text-[11px] text-purple-600 font-semibold flex items-center gap-1">
            <Star size={12} className="fill-purple-500 text-purple-500" /> Featured top badges
          </p>
        </div>
        <div className="p-3.5 bg-purple-50 text-purple-600 rounded-2xl border border-purple-100">
          <Star size={24} />
        </div>
      </div>
    </div>
  );
}

function EmptyTableState({
  icon: Icon,
  title,
  subtitle,
}: Readonly<{
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  subtitle?: string;
}>) {
  return (
    <tr>
      <td colSpan={5} className="px-6 py-16 text-center">
        <div className="flex flex-col items-center justify-center">
          <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-3 border border-gray-100">
            <Icon className="text-gray-300" size={26} />
          </div>
          <p className="text-gray-800 font-bold text-sm">{title}</p>
          {subtitle && <p className="text-gray-400 text-xs mt-0.5 max-w-xs">{subtitle}</p>}
        </div>
      </td>
    </tr>
  );
}

function FeaturedItemsTable({
  products,
  searchQuery,
  selectedCategory,
  selectedStock,
  onUpdateProduct,
}: Readonly<{
  products: ProductData[];
  searchQuery: string;
  selectedCategory: string;
  selectedStock: string;
  onUpdateProduct: (id: string, field: "isFeatured" | "isAvailable", value: boolean) => Promise<void>;
}>) {
  const isFiltered = searchQuery || selectedCategory !== "ALL" || selectedStock !== "ALL";

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-50/70 border-b border-gray-200 text-gray-600 uppercase font-bold text-[11px] tracking-wider">
          <tr>
            <th scope="col" className="px-6 py-4">Menu Dish / Product</th>
            <th scope="col" className="px-6 py-4">Category</th>
            <th scope="col" className="px-6 py-4 text-center">Chef Special (Featured)</th>
            <th scope="col" className="px-6 py-4 text-center">In-Stock Availability</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 text-xs">
          {products.length === 0 ? (
            <EmptyTableState
              icon={Utensils}
              title="No dishes found"
              subtitle={
                isFiltered
                  ? "Try adjusting your search query or filters."
                  : "No items registered in menu."
              }
            />
          ) : (
            products.map((product) => {
              const monogram = getProductMonogram(product.name);
              return (
                <tr key={product.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 text-culinary-primary font-bold text-sm flex items-center justify-center border border-amber-200/70 shadow-sm shrink-0 font-cormorant">
                        {monogram}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm font-cormorant text-base">
                          {product.name}
                        </p>
                        <p className="text-[10px] text-gray-400 font-mono">ID: {product.id.slice(-6)}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-3.5">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700">
                      {product.category?.name || "General"}
                    </span>
                  </td>

                  <td className="px-6 py-3.5 text-center">
                    <button
                      type="button"
                      onClick={() => onUpdateProduct(product.id, "isFeatured", !product.isFeatured)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${product.isFeatured
                        ? "bg-amber-100 text-amber-800 border border-amber-300 shadow-sm"
                        : "bg-gray-50 text-gray-400 hover:text-gray-600 border border-gray-200"
                        }`}
                      title="Toggle Chef's Featured Special"
                    >
                      <Star
                        size={13}
                        className={product.isFeatured ? "fill-amber-500 text-amber-500" : "text-gray-400"}
                      />
                      <span>{product.isFeatured ? "Featured" : "Standard"}</span>
                    </button>
                  </td>

                  <td className="px-6 py-3.5 text-center">
                    <div className="inline-flex items-center gap-2">
                      <Switch
                        checked={product.isAvailable}
                        onCheckedChange={(val) => onUpdateProduct(product.id, "isAvailable", val)}
                      />
                      <span
                        className={`text-[11px] font-bold ${product.isAvailable ? "text-emerald-600" : "text-gray-400"
                          }`}
                      >
                        {product.isAvailable ? "In Stock" : "Out of Stock"}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

function RecipeManagementTable({
  products,
  onConfigureRecipe,
}: Readonly<{
  products: ProductData[];
  onConfigureRecipe: (product: ProductData) => void;
}>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-50/70 border-b border-gray-200 text-gray-600 uppercase font-bold text-[11px] tracking-wider">
          <tr>
            <th scope="col" className="px-6 py-4">Menu Dish</th>
            <th scope="col" className="px-6 py-4">Category</th>
            <th scope="col" className="px-6 py-4">Preparation Time</th>
            <th scope="col" className="px-6 py-4">Recipe Details</th>
            <th scope="col" className="px-6 py-4 text-right pr-6">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 text-xs">
          {products.length === 0 ? (
            <EmptyTableState icon={ChefHat} title="No dishes found" />
          ) : (
            products.map((product) => {
              const monogram = getProductMonogram(product.name);
              const ingredientsList = normalizeStringList(product.ingredients);
              const instructionsList = normalizeStringList(product.recipeInstructions);

              return (
                <tr key={product.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 text-culinary-primary font-bold text-sm flex items-center justify-center border border-amber-200/70 shadow-sm shrink-0 font-cormorant">
                        {monogram}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm font-cormorant text-base">
                          {product.name}
                        </p>
                        <p className="text-[10px] text-gray-400 font-mono">ID: {product.id.slice(-6)}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-3.5">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700">
                      {product.category?.name || "General"}
                    </span>
                  </td>

                  <td className="px-6 py-3.5">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                      <Clock size={12} /> {product.preparationTime ? `${product.preparationTime} mins` : "10 mins"}
                    </span>
                  </td>

                  <td className="px-6 py-3.5">
                    <div className="text-gray-500 text-xs font-medium">
                      {ingredientsList.length > 0 || instructionsList.length > 0 ? (
                        <span className="text-emerald-700 font-semibold">
                          {ingredientsList.length} Ingredients • {instructionsList.length} Steps
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">No recipe configured</span>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-3.5 text-right pr-6">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onConfigureRecipe(product)}
                      className="rounded-xl border-amber-200 text-culinary-primary hover:bg-amber-50 text-xs font-semibold h-8"
                    >
                      Configure Recipe
                    </Button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

function MenuPaginationFooter({
  pageSize,
  setPageSize,
  startItemNumber,
  endItemNumber,
  totalItems,
  currentPage,
  totalPages,
  setCurrentPage,
}: Readonly<{
  pageSize: number;
  setPageSize: (size: number) => void;
  startItemNumber: number;
  endItemNumber: number;
  totalItems: number;
  currentPage: number;
  totalPages: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
}>) {
  const pageNumbers = getPageNumbers(totalPages, currentPage);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-gray-100 bg-gray-50/50">
      <div className="flex items-center gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <span className="font-medium">Per page:</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-culinary-primary/30"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        <div>
          Showing <span className="font-semibold text-gray-800">{startItemNumber}</span> to{" "}
          <span className="font-semibold text-gray-800">{endItemNumber}</span> of{" "}
          <span className="font-semibold text-gray-800">{totalItems}</span> menu dishes
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 p-0 rounded-lg border-gray-200 bg-white"
          onClick={() => setCurrentPage(1)}
          disabled={currentPage === 1}
          title="First Page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 p-0 rounded-lg border-gray-200 bg-white"
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          title="Previous Page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-1 mx-1">
          {pageNumbers.map((p) => {
            if (typeof p === "string") {
              return (
                <span key={p} className="px-2 text-xs text-gray-400">
                  ...
                </span>
              );
            }
            const isCurrent = p === currentPage;
            return (
              <button
                type="button"
                key={`page-${p}`}
                onClick={() => setCurrentPage(p)}
                className={`h-8 min-w-[32px] px-2 text-xs font-semibold rounded-lg transition-all ${isCurrent
                  ? "bg-culinary-primary text-white shadow-sm"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                  }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 p-0 rounded-lg border-gray-200 bg-white"
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          title="Next Page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 p-0 rounded-lg border-gray-200 bg-white"
          onClick={() => setCurrentPage(totalPages)}
          disabled={currentPage === totalPages}
          title="Last Page"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function RecipeDrawer({
  editingProduct,
  isOpen,
  onClose,
  recipeForm,
  setRecipeForm,
  isSavingRecipe,
  onSaveRecipe,
}: Readonly<{
  editingProduct: ProductData | null;
  isOpen: boolean;
  onClose: () => void;
  recipeForm: RecipeFormData;
  setRecipeForm: React.Dispatch<React.SetStateAction<RecipeFormData>>;
  isSavingRecipe: boolean;
  onSaveRecipe: () => Promise<void>;
}>) {
  const monogram = editingProduct ? getProductMonogram(editingProduct.name) : "R";

  const handleUpdateIngredient = (id: string, value: string) => {
    setRecipeForm((prev) => ({
      ...prev,
      ingredients: prev.ingredients.map((item) =>
        item.id === id ? { ...item, text: value } : item
      ),
    }));
  };

  const handleRemoveIngredient = (id: string) => {
    setRecipeForm((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((item) => item.id !== id),
    }));
  };

  const handleAddIngredient = () => {
    setRecipeForm((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, createRecipeItem()],
    }));
  };

  const handleUpdateInstruction = (id: string, value: string) => {
    setRecipeForm((prev) => ({
      ...prev,
      recipeInstructions: prev.recipeInstructions.map((item) =>
        item.id === id ? { ...item, text: value } : item
      ),
    }));
  };

  const handleRemoveInstruction = (id: string) => {
    setRecipeForm((prev) => ({
      ...prev,
      recipeInstructions: prev.recipeInstructions.filter((item) => item.id !== id),
    }));
  };

  const handleAddInstruction = () => {
    setRecipeForm((prev) => ({
      ...prev,
      recipeInstructions: [...prev.recipeInstructions, createRecipeItem()],
    }));
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="right" className="w-[380px] sm:w-[520px] overflow-y-auto bg-white border-l border-gray-200 shadow-2xl p-0">
        <div className="p-6">
          <SheetHeader className="border-b border-gray-100 pb-5 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-culinary-primary font-bold text-xl flex items-center justify-center border border-amber-200/60 shadow-sm shrink-0 font-cormorant">
                {monogram}
              </div>
              <div>
                <SheetTitle className="text-2xl font-bold font-cormorant text-gray-900">
                  {editingProduct ? editingProduct.name : "Dish Recipe & Instructions"}
                </SheetTitle>
                <p className="text-xs text-gray-400 mt-0.5">
                  {editingProduct?.category?.name || "Kitchen KDS Preparation Details"}
                </p>
              </div>
            </div>
          </SheetHeader>

          <div className="space-y-6 text-xs">
            {/* Prep Time Card */}
            <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-200/80 flex items-center justify-between">
              <div>
                <Label className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <Clock size={13} className="text-culinary-primary" /> KDS Kitchen Prep Time
                </Label>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Estimated cooking duration in minutes
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={recipeForm.preparationTime}
                  onChange={(e) =>
                    setRecipeForm((prev) => ({
                      ...prev,
                      preparationTime: Number.parseInt(e.target.value, 10) || 0,
                    }))
                  }
                  className="w-16 text-center px-2 py-1.5 text-xs font-bold border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-culinary-primary/30"
                />
                <span className="text-xs font-bold text-gray-600">mins</span>
              </div>
            </div>

            {/* Ingredients Checklist */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-gray-900 uppercase tracking-wider text-[11px]">
                  Ingredients Checklist ({recipeForm.ingredients.length})
                </Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAddIngredient}
                  className="text-xs h-7 rounded-lg border-amber-200 text-culinary-primary hover:bg-amber-50 font-semibold"
                >
                  <Plus size={12} className="mr-1" /> Add Ingredient
                </Button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {recipeForm.ingredients.length === 0 ? (
                  <p className="text-xs text-gray-400 italic text-center py-5 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    No ingredients added yet. Click &quot;Add Ingredient&quot; above.
                  </p>
                ) : (
                  recipeForm.ingredients.map((ing, idx) => (
                    <div key={ing.id} className="flex gap-2 items-center">
                      <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 font-bold text-[10px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={ing.text}
                        placeholder="e.g. 200g Fresh Paneer, 1 tsp Garam Masala"
                        onChange={(e) => handleUpdateIngredient(ing.id, e.target.value)}
                        className="flex-1 px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-culinary-primary/30"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveIngredient(ing.id)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Step by Step Instructions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-gray-900 uppercase tracking-wider text-[11px]">
                  Kitchen Preparation Steps ({recipeForm.recipeInstructions.length})
                </Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAddInstruction}
                  className="text-xs h-7 rounded-lg border-amber-200 text-culinary-primary hover:bg-amber-50 font-semibold"
                >
                  <Plus size={12} className="mr-1" /> Add Step
                </Button>
              </div>

              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {recipeForm.recipeInstructions.length === 0 ? (
                  <p className="text-xs text-gray-400 italic text-center py-5 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    No preparation steps added yet. Click &quot;Add Step&quot; above.
                  </p>
                ) : (
                  recipeForm.recipeInstructions.map((step, idx) => (
                    <div key={step.id} className="flex gap-2 items-start">
                      <span className="w-6 h-6 rounded-full bg-amber-100 text-culinary-primary font-bold text-[10px] flex items-center justify-center shrink-0 mt-1">
                        {idx + 1}
                      </span>
                      <textarea
                        rows={2}
                        value={step.text}
                        placeholder="e.g. Sauté onions until golden brown, then add spice mix..."
                        onChange={(e) => handleUpdateInstruction(step.id, e.target.value)}
                        className="flex-1 px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-culinary-primary/30 resize-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveInstruction(step.id)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg mt-1"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <SheetFooter className="mt-8 border-t border-gray-100 pt-5 flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="w-full text-xs rounded-xl"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={isSavingRecipe}
              onClick={onSaveRecipe}
              className="w-full bg-culinary-primary hover:bg-culinary-primary/90 text-white font-bold rounded-xl text-xs py-2.5"
            >
              <Save size={14} className="mr-1.5" />
              {isSavingRecipe ? "Saving Recipe..." : "Save Recipe Details"}
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// Main Export Component (Reduced Complexity)
// ---------------------------------------------------------------------------

export default function MenuManagementClient() {
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [settings, setSettings] = useState<MenuSettingsData | null>(null);
  const [previewTableId, setPreviewTableId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"featured" | "recipes">("featured");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedStock, setSelectedStock] = useState<string>("ALL");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Recipe Editing in Right-Side Drawer
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
  const [isSavingRecipe, setIsSavingRecipe] = useState(false);
  const [recipeForm, setRecipeForm] = useState<RecipeFormData>({
    preparationTime: 10,
    ingredients: [],
    recipeInstructions: [],
  });

  const loadMenuData = useCallback(async () => {
    try {
      const { data } = await axios.get(`/api/menu-management?t=${Date.now()}`);
      return data.data;
    } catch (error) {
      console.error("Failed to fetch menu data:", error);
      toast.error("Failed to fetch menu data");
      return null;
    }
  }, []);

  const fetchMenuData = useCallback(async (showIndicator = false) => {
    if (showIndicator) setIsRefreshing(true);
    const data = await loadMenuData();
    if (data) {
      setCategories(data.categories || []);
      setProducts(data.products || []);
      setSettings(data.settings || null);
      setPreviewTableId(data.previewTableId || null);
    }
    setLoading(false);
    if (showIndicator) setIsRefreshing(false);
  }, [loadMenuData]);

  useEffect(() => {
    let ignore = false;

    async function load() {
      const data = await loadMenuData();
      if (!ignore) {
        if (data) {
          setCategories(data.categories || []);
          setProducts(data.products || []);
          setSettings(data.settings || null);
          setPreviewTableId(data.previewTableId || null);
        }
        setLoading(false);
      }
    }

    void load();

    return () => {
      ignore = true;
    };
  }, [loadMenuData]);

  // Toggle Live Availability or Featured
  const handleUpdateProduct = async (id: string, field: "isFeatured" | "isAvailable", value: boolean) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
    try {
      await axios.patch("/api/menu-management/product", { id, [field]: value });
      if (field === "isFeatured") {
        toast.success(value ? "Product marked as Featured" : "Product unmarked as Featured");
      } else {
        toast.success(value ? "Product marked as In Stock" : "Product marked as Out of Stock");
      }
    } catch (error) {
      console.error("Failed to update product:", error);
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, [field]: !value } : p))
      );
      toast.error("Failed to update product");
    }
  };

  // Toggle Publish Status
  const handleTogglePublish = async (val: boolean) => {
    setSettings((prev) => (prev ? { ...prev, qrMenuStatus: val } : { qrMenuStatus: val }));
    try {
      await axios.patch("/api/menu-management/settings", { qrMenuStatus: val });
      toast.success(val ? "Menu published & live on QR!" : "Menu temporarily hidden");
    } catch (error) {
      console.error("Failed to update menu status:", error);
      toast.error("Failed to update menu status");
    }
  };

  const handleOpenRecipeDrawer = (product: ProductData) => {
    setEditingRecipeId(product.id);
    setRecipeForm({
      preparationTime: product.preparationTime || 10,
      ingredients: normalizeStringList(product.ingredients).map(createRecipeItem),
      recipeInstructions: normalizeStringList(product.recipeInstructions).map(createRecipeItem),
    });
  };

  const handleSaveRecipe = async () => {
    if (!editingRecipeId) return;
    setIsSavingRecipe(true);
    try {
      await axios.patch("/api/menu-management/product", {
        id: editingRecipeId,
        preparationTime: recipeForm.preparationTime,
        ingredients: recipeForm.ingredients
          .map((i) => i.text.trim())
          .filter((i) => i !== ""),
        recipeInstructions: recipeForm.recipeInstructions
          .map((i) => i.text.trim())
          .filter((i) => i !== ""),
      });
      toast.success("Recipe instructions saved successfully!");
      setEditingRecipeId(null);
      await fetchMenuData();
    } catch (error) {
      console.error("Failed to save recipe instructions:", error);
      toast.error("Failed to save recipe instructions");
    } finally {
      setIsSavingRecipe(false);
    }
  };

  const currentEditingProduct = useMemo(() => {
    return products.find((p) => p.id === editingRecipeId) || null;
  }, [products, editingRecipeId]);

  const filteredProducts = useMemo(() => {
    return filterProducts(products, searchQuery, selectedCategory, selectedStock);
  }, [products, searchQuery, selectedCategory, selectedStock]);

  // Pagination metrics
  const totalItems = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedProducts = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, safeCurrentPage, pageSize]);

  const startItemNumber = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endItemNumber = Math.min(safeCurrentPage * pageSize, totalItems);

  // KPIs
  const kpis = useMemo(() => {
    return {
      totalCategories: categories.length,
      totalProducts: products.length,
      availableItems: products.filter((p) => p.isAvailable).length,
      featuredItems: products.filter((p) => p.isFeatured).length,
    };
  }, [categories, products]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-3 bg-white rounded-3xl border border-gray-100 shadow-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-culinary-primary border-t-transparent"></div>
        <p className="text-sm font-semibold text-gray-500">Loading menu management catalog...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans pb-16">
      {/* Master Digital Menu Live Status Banner */}
      <MenuStatusBanner
        settings={settings}
        previewTableId={previewTableId}
        onTogglePublish={handleTogglePublish}
      />

      {/* Top 4 KPI Metrics Cards */}
      <MenuKpis
        totalCategories={kpis.totalCategories}
        totalProducts={kpis.totalProducts}
        availableItems={kpis.availableItems}
        featuredItems={kpis.featuredItems}
      />

      {/* Main Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-culinary-border/40 overflow-hidden">
        {/* Horizontal Navigation Tabs */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/70 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab("featured");
                setCurrentPage(1);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === "featured"
                ? "bg-white text-culinary-primary shadow-sm border border-amber-200"
                : "text-gray-600 hover:text-gray-900"
                }`}
            >
              <Star size={14} className={activeTab === "featured" ? "fill-amber-500 text-amber-500" : ""} />
              <span>Items Availability & Featured</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-amber-50 text-culinary-primary border border-amber-200">
                {products.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("recipes");
                setCurrentPage(1);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === "recipes"
                ? "bg-white text-culinary-primary shadow-sm border border-amber-200"
                : "text-gray-600 hover:text-gray-900"
                }`}
            >
              <ChefHat size={14} />
              <span>Kitchen Recipe Management</span>
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchMenuData(true)}
            disabled={isRefreshing}
            className="text-xs h-8 gap-1.5 border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-xl shadow-none"
          >
            <RotateCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-culinary-primary" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Filters Bar */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search dishes by name, category..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-9 py-2 text-xs rounded-xl border border-gray-200 bg-gray-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-culinary-primary/20 focus:border-culinary-primary transition-all placeholder:text-gray-400 text-gray-800"
            />
            {searchQuery && (
              <button type="button"
                onClick={() => {
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 bg-gray-200/80 rounded-full w-4 h-4 flex items-center justify-center"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-culinary-primary/30"
            >
              <option value="ALL">All Categories ({categories.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStock}
              onChange={(e) => {
                setSelectedStock(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-culinary-primary/30"
            >
              <option value="ALL">All Status</option>
              <option value="IN_STOCK">In Stock Only</option>
              <option value="OUT_OF_STOCK">Out of Stock Only</option>
              <option value="FEATURED">⭐ Featured Only</option>
            </select>
          </div>
        </div>

        {/* Tab 1: Availability & Featured Table */}
        {activeTab === "featured" && (
          <FeaturedItemsTable
            products={paginatedProducts}
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            selectedStock={selectedStock}
            onUpdateProduct={handleUpdateProduct}
          />
        )}

        {/* Tab 2: Recipe Management Table */}
        {activeTab === "recipes" && (
          <RecipeManagementTable
            products={paginatedProducts}
            onConfigureRecipe={handleOpenRecipeDrawer}
          />
        )}

        {/* Integrated Pagination Footer */}
        {filteredProducts.length > 0 && (
          <MenuPaginationFooter
            pageSize={pageSize}
            setPageSize={setPageSize}
            startItemNumber={startItemNumber}
            endItemNumber={endItemNumber}
            totalItems={totalItems}
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
          />
        )}
      </div>

      {/* Right-Side Slide-Over Drawer for Recipe Editing */}
      <RecipeDrawer
        editingProduct={currentEditingProduct}
        isOpen={Boolean(editingRecipeId)}
        onClose={() => setEditingRecipeId(null)}
        recipeForm={recipeForm}
        setRecipeForm={setRecipeForm}
        isSavingRecipe={isSavingRecipe}
        onSaveRecipe={handleSaveRecipe}
      />
    </div>
  );
}
