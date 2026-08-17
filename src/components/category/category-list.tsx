"use client";

import Image from "next/image";
import { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Folder,
  RotateCw,
  Utensils,
  CheckCircle2,
  XCircle,
  Filter,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Layers,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ICategory } from "@/modules/category/types";
import { CategoryFormModal } from "./category-form-modal";
import { DeleteCategoryDialog } from "./delete-category-dialog";

const STATUS_FILTER_TABS = [
  { label: "All Categories", value: "ALL" },
  { label: "Active Live", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
] as const;

export function CategoryList() {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters and Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ICategory | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await axios.get("/api/categories");
      setCategories(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      toast.error("Failed to load menu categories");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchCategories();
    setIsRefreshing(false);
  };

  useEffect(() => {
    const loadCategories = async () => {
      await fetchCategories();
    };

    void loadCategories();
  }, [fetchCategories]);

  const handleAdd = () => {
    setSelectedCategory(null);
    setIsFormOpen(true);
  };

  const handleEdit = (category: ICategory) => {
    setSelectedCategory(category);
    setIsFormOpen(true);
  };

  const handleDelete = (category: ICategory) => {
    setSelectedCategory(category);
    setIsDeleteOpen(true);
  };

  // Instant In-Table Toggle for Category Status (Active/Inactive)
  const handleToggleStatus = async (category: ICategory) => {
    const newStatus = category.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    // Optimistic UI update
    setCategories((prev) =>
      prev.map((c) => (c.id === category.id ? { ...c, status: newStatus } : c))
    );
    try {
      await axios.put(`/api/categories/${category.id}`, {
        name: category.name,
        description: category.description,
        image: category.image,
        status: newStatus,
      });
      toast.success(`${category.name} is now ${newStatus === "ACTIVE" ? "Active" : "Inactive"}`);
    } catch (error) {
      console.error("Failed to update category status:", error);
      // Revert on error
      setCategories((prev) =>
        prev.map((c) => (c.id === category.id ? { ...c, status: category.status } : c))
      );
      toast.error("Failed to update category status");
    }
  };

  // KPI Calculations
  const kpis = useMemo(() => {
    const total = categories.length;
    const activeCount = categories.filter((c) => c.status === "ACTIVE").length;
    const inactiveCount = categories.filter((c) => c.status === "INACTIVE").length;
    const totalProducts = categories.reduce((sum, c) => sum + (c._count?.products || 0), 0);
    const avgProducts = total > 0 ? (totalProducts / total).toFixed(1) : "0";

    return {
      total,
      activeCount,
      inactiveCount,
      totalProducts,
      avgProducts,
    };
  }, [categories]);

  // Filter Counts
  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: categories.length };
    categories.forEach((c) => {
      counts[c.status] = (counts[c.status] || 0) + 1;
    });
    return counts;
  }, [categories]);

  // Filtered Categories
  const filteredCategories = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return categories.filter((cat) => {
      let matchesStatus = true;
      if (statusFilter !== "ALL") {
        matchesStatus = cat.status === statusFilter;
      }
      if (!matchesStatus) return false;

      if (!q) return true;
      return Boolean(
        cat.name.toLowerCase().includes(q) ||
        cat.description?.toLowerCase().includes(q)
      );
    });
  }, [categories, statusFilter, searchQuery]);


  // Pagination calculation
  const totalItems = filteredCategories.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedCategories = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredCategories.slice(start, start + pageSize);
  }, [filteredCategories, safeCurrentPage, pageSize]);

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

  const getCategoryMonogram = (name: string) => {
    const words = name.trim().split(" ");
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-3 bg-white rounded-3xl border border-gray-100 shadow-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-culinary-primary border-t-transparent"></div>
        <p className="text-sm font-semibold text-gray-500">Loading menu categories...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans pb-16">

      {/* Top 4 KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Categories */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Categories</p>
            <p className="text-3xl font-bold text-gray-900">{kpis.total}</p>
            <p className="text-[11px] text-amber-700 font-semibold flex items-center gap-1">
              <Layers size={12} /> Menu sections catalog
            </p>
          </div>
          <div className="p-3.5 bg-amber-50 text-culinary-primary rounded-2xl border border-amber-100">
            <Folder size={24} />
          </div>
        </div>

        {/* Categorized Products */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned Dishes</p>
            <p className="text-3xl font-bold text-blue-700">{kpis.totalProducts} <span className="text-sm font-normal text-gray-400">Items</span></p>
            <p className="text-[11px] text-blue-600 font-semibold flex items-center gap-1">
              <Utensils size={12} /> Avg {kpis.avgProducts} dishes / category
            </p>
          </div>
          <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
            <Utensils size={24} />
          </div>
        </div>

        {/* Active Categories */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active on QR</p>
            <p className="text-3xl font-bold text-emerald-700">{kpis.activeCount}</p>
            <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 size={12} /> Displayed on customer menu
            </p>
          </div>
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
            <CheckCircle2 size={24} />
          </div>
        </div>

        {/* Inactive Sections */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Hidden / Draft</p>
            <p className="text-3xl font-bold text-gray-600">{kpis.inactiveCount}</p>
            <p className="text-[11px] text-gray-400 font-medium">
              {kpis.inactiveCount} Hidden from public view
            </p>
          </div>
          <div className="p-3.5 bg-gray-50 text-gray-500 rounded-2xl border border-gray-200">
            <XCircle size={24} />
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-culinary-border/40 overflow-hidden">

        {/* Top Control Bar */}
        <div className="p-5 border-b border-gray-100 space-y-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">

            {/* Search Input */}
            <div className="relative w-full lg:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
              <input
                type="text"
                placeholder="Search categories by name, description..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-9 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-culinary-primary/20 focus:border-culinary-primary transition-all placeholder:text-gray-400 text-gray-800"
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

            {/* Right Controls: Refresh & Add Category */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
              {/* Refresh Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleRefresh()}
                disabled={isRefreshing}
                className="text-xs h-9 gap-1.5 border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-xl shadow-none"
              >
                <RotateCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-culinary-primary" : ""}`} />
                Refresh
              </Button>

              {/* Add Category Button */}
              <Button
                size="sm"
                onClick={handleAdd}
                className="bg-culinary-primary hover:bg-culinary-primary/90 text-white font-bold h-9 px-4 rounded-xl shadow-sm text-xs gap-1.5"
              >
                <Plus size={15} /> Add Menu Category
              </Button>
            </div>
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin pt-2">
            <span className="text-xs font-semibold text-gray-400 flex items-center gap-1 mr-1 shrink-0 uppercase tracking-wider text-[11px]">
              <Filter className="h-3 w-3" /> Status:
            </span>
            {STATUS_FILTER_TABS.map((tab) => {
              const count = filterCounts[tab.value] || 0;
              const isSelected = statusFilter === tab.value;
              return (
                <button type="button"
                  key={tab.value}
                  onClick={() => {
                    setStatusFilter(tab.value);
                    setCurrentPage(1);
                  }}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${isSelected
                    ? "bg-culinary-primary text-white shadow-sm font-semibold"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200/70"
                    }`}
                >
                  {tab.label}
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isSelected ? "bg-white/20 text-white" : "bg-white text-gray-600 border border-gray-200"
                      }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Structured Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/70 border-b border-gray-200 text-gray-600 uppercase font-bold text-[11px] tracking-wider">
              <tr>
                <th scope="col" className="px-6 py-4">Menu Category</th>
                <th scope="col" className="px-6 py-4 text-center">Assigned Dishes</th>
                <th scope="col" className="px-6 py-4 text-center">Live QR Visibility</th>
                <th scope="col" className="px-6 py-4">Created Date</th>
                <th scope="col" className="px-6 py-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {paginatedCategories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-3 border border-gray-100">
                        <Folder className="text-gray-300" size={26} />
                      </div>
                      <p className="text-gray-800 font-bold text-sm">No menu categories found</p>
                      <p className="text-gray-400 text-xs mt-0.5 max-w-xs">
                        {searchQuery || statusFilter !== "ALL"
                          ? "Try clearing your search query or selecting a different status filter."
                          : "Start organizing your menu by creating your first category."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedCategories.map((category) => {
                  const monogram = getCategoryMonogram(category.name);
                  const isActive = category.status === "ACTIVE";
                  const productCount = category._count?.products || 0;

                  return (
                    <tr
                      key={category.id}
                      className="hover:bg-gray-50/70 transition-colors group"
                    >
                      {/* Image Thumbnail & Name */}
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3.5">
                          {/* Image or Monogram */}
                          <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 overflow-hidden shrink-0 border border-amber-200/70 shadow-sm flex items-center justify-center">
                            {category.image ? (
                              <Image
                                src={category.image}
                                alt={category.name}
                                fill
                                sizes="48px"
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <span className="font-bold text-culinary-primary font-cormorant text-base">
                                {monogram}
                              </span>
                            )}
                          </div>

                          {/* Name & Description */}
                          <div className="min-w-0 max-w-sm">
                            <p className="font-bold text-gray-900 text-sm font-cormorant text-base truncate" title={category.name}>
                              {category.name}
                            </p>
                            {category.description ? (
                              <p
                                className="text-[11px] text-gray-400 truncate max-w-[280px] mt-0.5"
                                title={category.description}
                              >
                                {category.description}
                              </p>
                            ) : (
                              <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                                ID: {category.id.slice(-6)}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Assigned Products Count */}
                      <td className="px-6 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-culinary-primary border border-amber-200/80">
                          <Utensils size={12} />
                          {productCount} <span className="font-normal text-gray-500">Dishes</span>
                        </span>
                      </td>

                      {/* Live In-Table Active Switch */}
                      <td className="px-6 py-3.5 text-center">
                        <div className="inline-flex items-center gap-2">
                          <Switch
                            checked={isActive}
                            onCheckedChange={() => handleToggleStatus(category)}
                          />
                          <span
                            className={`text-[11px] font-bold ${isActive ? "text-emerald-600" : "text-gray-400"
                              }`}
                          >
                            {isActive ? "Active" : "Hidden"}
                          </span>
                        </div>
                      </td>

                      {/* Created Date */}
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-1.5 text-gray-500 text-xs font-medium">
                          <Calendar size={12} className="text-gray-400" />
                          <span>{format(new Date(category.createdAt), "MMM dd, yyyy")}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-3.5 text-right pr-6">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Edit Category"
                            onClick={() => handleEdit(category)}
                            className="h-8 w-8 text-amber-700 hover:text-amber-800 hover:bg-amber-50 rounded-lg"
                          >
                            <Edit3 size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Delete Category"
                            onClick={() => handleDelete(category)}
                            className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Integrated Pagination Footer */}
        {filteredCategories.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <span className="font-medium">Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
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
                <span className="font-semibold text-gray-800">{totalItems}</span> menu categories
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
                    <button type="button"
                      key={`page-${pageNum}`}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`h-8 min-w-[32px] px-2 text-xs font-semibold rounded-lg transition-all ${isCurrent
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

      {/* Modals & Drawers */}
      <CategoryFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        category={selectedCategory}
        onSuccess={fetchCategories}
      />

      <DeleteCategoryDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        category={selectedCategory}
        onSuccess={fetchCategories}
      />
    </div>
  );
}
