"use client";

import { useState, useMemo, useEffect } from "react";
import { toggleProductAvailabilityAction } from "@/modules/kitchen/controller";
import toast from "react-hot-toast";
import {
  Search,
  CheckCircle2,
  XCircle,
  Layers,
  Utensils,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

interface Product {
  id: string;
  name: string;
  isAvailable: boolean;
  foodType?: string;
  category: {
    id?: string;
    name: string;
  };
}

export function StockClient({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts || []);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleToggle = async (productId: string, currentStatus: boolean) => {
    setIsUpdating(productId);
    const newStatus = !currentStatus;

    // Optimistic UI update
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, isAvailable: newStatus } : p))
    );

    try {
      const res = await toggleProductAvailabilityAction(productId, newStatus);
      if (res.success) {
        toast.success(newStatus ? "Dish marked as In Stock" : "Dish marked as 86'd / Out of Stock");
      } else {
        // Revert
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, isAvailable: currentStatus } : p))
        );
        toast.error("Failed to update stock status");
      }
    } catch (e) {
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, isAvailable: currentStatus } : p))
      );
      toast.error("Error updating stock");
    } finally {
      setIsUpdating(null);
    }
  };

  const categories = useMemo(() => {
    const unique = new Set<string>();
    products.forEach((p) => {
      if (p.category?.name) unique.add(p.category.name);
    });
    return Array.from(unique);
  }, [products]);

  const kpis = useMemo(() => {
    const total = products.length;
    const available = products.filter((p) => p.isAvailable).length;
    const outOfStock = products.filter((p) => !p.isAvailable).length;
    return { total, available, outOfStock, totalCategories: categories.length };
  }, [products, categories]);

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase().trim();
    return products.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.category?.name.toLowerCase().includes(q);

      const matchesCat =
        selectedCategory === "ALL" || p.category?.name === selectedCategory;

      let matchesStatus = true;
      if (selectedStatus === "IN_STOCK") matchesStatus = p.isAvailable;
      else if (selectedStatus === "OUT_OF_STOCK") matchesStatus = !p.isAvailable;

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [products, search, selectedCategory, selectedStatus]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory, selectedStatus, pageSize]);

  const totalItems = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedProducts = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, safeCurrentPage, pageSize]);

  const startItemNumber = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endItemNumber = Math.min(safeCurrentPage * pageSize, totalItems);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safeCurrentPage > 3) pages.push("...");
      const start = Math.max(2, safeCurrentPage - 1);
      const end = Math.min(totalPages - 1, safeCurrentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (safeCurrentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  const getMonogram = (name: string) => {
    const words = name.trim().split(" ");
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Menu Items</p>
            <p className="text-3xl font-bold text-gray-900">{kpis.total}</p>
            <p className="text-[11px] text-gray-500 font-semibold flex items-center gap-1">
              <Utensils size={12} /> Kitchen dishes catalog
            </p>
          </div>
          <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
            <Utensils size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">In Stock Ready</p>
            <p className="text-3xl font-bold text-emerald-700">{kpis.available}</p>
            <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 size={12} /> Active on QR menus
            </p>
          </div>
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
            <CheckCircle2 size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">86&apos;d / Out of Stock</p>
            <p className="text-3xl font-bold text-rose-700">{kpis.outOfStock}</p>
            <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1">
              <XCircle size={12} /> Temporarily disabled
            </p>
          </div>
          <div className="p-3.5 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100">
            <XCircle size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Categories</p>
            <p className="text-3xl font-bold text-amber-700">{kpis.totalCategories}</p>
            <p className="text-[11px] text-amber-700 font-semibold flex items-center gap-1">
              <Layers size={12} /> Menu sections
            </p>
          </div>
          <div className="p-3.5 bg-amber-50 text-culinary-primary rounded-2xl border border-amber-100">
            <Layers size={24} />
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden">
        
        {/* Filters Bar */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search items or categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-9 py-2 text-xs rounded-xl border border-gray-200 bg-gray-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-culinary-primary/20 transition-all text-gray-800"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 bg-gray-200 rounded-full w-4 h-4 flex items-center justify-center"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-culinary-primary/30"
            >
              <option value="ALL">All Categories ({categories.length})</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-culinary-primary/30"
            >
              <option value="ALL">All Status</option>
              <option value="IN_STOCK">In Stock Only</option>
              <option value="OUT_OF_STOCK">86&apos;d (Out of Stock)</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/70 border-b border-gray-200 text-gray-600 uppercase font-bold text-[11px] tracking-wider">
              <tr>
                <th scope="col" className="px-6 py-4">Dish Name</th>
                <th scope="col" className="px-6 py-4">Category</th>
                <th scope="col" className="px-6 py-4">Dietary Type</th>
                <th scope="col" className="px-6 py-4 text-center">Instant Stock Toggle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-3 border border-gray-100">
                        <Utensils className="text-gray-300" size={26} />
                      </div>
                      <p className="text-gray-800 font-bold text-sm">No items found.</p>
                      <p className="text-gray-400 text-xs mt-0.5 max-w-xs">
                        Try adjusting your search query or filters.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((product) => {
                  const monogram = getMonogram(product.name);
                  return (
                    <tr key={product.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 text-culinary-primary font-bold text-sm flex items-center justify-center border border-amber-200 font-cormorant shrink-0">
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
                        {product.foodType === "NON_VEG" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            🔴 Non-Veg
                          </span>
                        ) : product.foodType === "EGG" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            🟡 Egg
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            🟢 Pure Veg
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-3.5 text-center">
                        <div className="inline-flex items-center gap-2.5">
                          <Switch
                            checked={product.isAvailable}
                            onCheckedChange={() => handleToggle(product.id, product.isAvailable)}
                            disabled={isUpdating === product.id}
                          />
                          <span
                            className={`text-xs font-bold ${
                              product.isAvailable ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            {product.isAvailable ? "In Stock" : "86'd"}
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

        {/* Pagination Footer */}
        {filteredProducts.length > 0 && (
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
                </select>
              </div>

              <div>
                Showing <span className="font-semibold text-gray-800">{startItemNumber}</span> to{" "}
                <span className="font-semibold text-gray-800">{endItemNumber}</span> of{" "}
                <span className="font-semibold text-gray-800">{totalItems}</span> dishes
              </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 p-0 rounded-lg border-gray-200 bg-white"
                onClick={() => setCurrentPage(1)}
                disabled={safeCurrentPage === 1}
                title="First Page"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 p-0 rounded-lg border-gray-200 bg-white"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1}
                title="Previous Page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-1 mx-1">
                {getPageNumbers().map((p, idx) => {
                  if (p === "...") {
                    return (
                      <span key={`dots-${idx}`} className="px-2 text-xs text-gray-400">
                        ...
                      </span>
                    );
                  }
                  const pageNum = Number(p);
                  const isCurrent = pageNum === safeCurrentPage;
                  return (
                    <button
                      key={`page-${pageNum}`}
                      onClick={() => setCurrentPage(pageNum)}
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
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage === totalPages}
                title="Next Page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 p-0 rounded-lg border-gray-200 bg-white"
                onClick={() => setCurrentPage(totalPages)}
                disabled={safeCurrentPage === totalPages}
                title="Last Page"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
