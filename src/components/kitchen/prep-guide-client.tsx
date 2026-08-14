"use client";

import { useState, useMemo } from "react";
import {
  Search,
  ChefHat,
  Clock,
  Info,
  CheckCircle2,
  Utensils,
  BookOpen,
  Sparkles,
  Layers,
  Flame
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Product {
  id: string;
  name: string;
  foodType?: string;
  description: string | null;
  preparationTime: number | null;
  ingredients: any;
  recipeInstructions: any;
  category: {
    name: string;
  };
}

export function PrepGuideClient({ products }: { products: Product[] }) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(
    products.length > 0 ? products[0] : null
  );

  const categories = useMemo(() => {
    const unique = new Set<string>();
    products.forEach((p) => {
      if (p.category?.name) unique.add(p.category.name);
    });
    return Array.from(unique);
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase().trim();
    return products.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.category?.name.toLowerCase().includes(q);

      const matchesCat =
        selectedCategory === "ALL" || p.category?.name === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [products, search, selectedCategory]);

  const getMonogram = (name: string) => {
    const words = name.trim().split(" ");
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* 2-Column Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Sidebar List (1 col) */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm flex flex-col overflow-hidden col-span-1 max-h-[750px]">
          <div className="p-4 border-b border-gray-100 bg-gray-50/70 space-y-3">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <input
                type="text"
                placeholder="Search recipe catalog..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-8 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-culinary-primary/20 bg-white text-gray-800"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              <button
                type="button"
                onClick={() => setSelectedCategory("ALL")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
                  selectedCategory === "ALL"
                    ? "bg-culinary-primary text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
                }`}
              >
                All ({products.length})
              </button>
              {categories.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setSelectedCategory(c)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
                    selectedCategory === c
                      ? "bg-culinary-primary text-white"
                      : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Dish List */}
          <div className="overflow-y-auto flex-1 p-2 space-y-1 divide-y divide-gray-100/60">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-xs italic">
                No recipes matching search.
              </div>
            ) : (
              filteredProducts.map((product) => {
                const isSelected = selectedProduct?.id === product.id;
                const monogram = getMonogram(product.name);

                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => setSelectedProduct(product)}
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between gap-2.5 ${
                      isSelected
                        ? "bg-amber-50 text-culinary-primary font-bold border border-amber-200 shadow-sm"
                        : "hover:bg-gray-50 text-gray-800"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div
                        className={`w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center font-cormorant shrink-0 ${
                          isSelected
                            ? "bg-culinary-primary text-white"
                            : "bg-gray-100 text-gray-600 border border-gray-200"
                        }`}
                      >
                        {monogram}
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold truncate">{product.name}</p>
                        <p className="text-[10px] text-gray-400">{product.category?.name}</p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-white px-2 py-0.5 rounded-md border border-gray-200 text-blue-700">
                        <Clock size={10} /> {product.preparationTime || 10}m
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Detail Pane (2 cols) */}
        <div className="col-span-1 lg:col-span-2">
          {selectedProduct ? (
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden flex flex-col space-y-6 p-6">
              
              {/* Header */}
              <div className="bg-gradient-to-r from-amber-50/80 via-orange-50/40 to-transparent p-5 rounded-2xl border border-amber-200/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-culinary-primary bg-white px-2.5 py-0.5 rounded-full border border-amber-200">
                    {selectedProduct.category?.name || "General"}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-bold font-cormorant text-gray-900">
                    {selectedProduct.name}
                  </h2>
                  <p className="text-xs text-gray-500 max-w-lg">
                    {selectedProduct.description || "Executive kitchen standard operating procedure & culinary recipe."}
                  </p>
                </div>

                <div className="bg-white px-4 py-2.5 rounded-2xl shadow-sm border border-amber-200 text-center shrink-0">
                  <p className="text-[10px] uppercase font-bold text-gray-400">KDS Target Time</p>
                  <p className="text-xl font-bold text-culinary-primary flex items-center justify-center gap-1">
                    <Clock size={16} /> {selectedProduct.preparationTime || 10} Mins
                  </p>
                </div>
              </div>

              {/* Ingredients Checklist */}
              <div className="space-y-3">
                <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <Utensils size={15} className="text-culinary-primary" /> Ingredients Checklist
                </h3>

                {selectedProduct.ingredients &&
                Array.isArray(selectedProduct.ingredients) &&
                selectedProduct.ingredients.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {selectedProduct.ingredients.map((ing: string, i: number) => (
                      <div
                        key={i}
                        className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50/80 border border-gray-200/80 text-xs font-medium text-gray-800"
                      >
                        <span className="w-5 h-5 rounded-full bg-amber-100 text-culinary-primary font-bold text-[10px] flex items-center justify-center shrink-0">
                          {i + 1}
                        </span>
                        <span>{ing}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-xs text-gray-400 italic text-center">
                    No custom ingredients list configured. You can add ingredients under Menu Management.
                  </div>
                )}
              </div>

              {/* Step-by-Step Cooking Steps */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <ChefHat size={16} className="text-orange-500" /> Kitchen Preparation Instructions
                </h3>

                {selectedProduct.recipeInstructions &&
                Array.isArray(selectedProduct.recipeInstructions) &&
                selectedProduct.recipeInstructions.length > 0 ? (
                  <div className="space-y-3">
                    {selectedProduct.recipeInstructions.map((step: string, i: number) => (
                      <div
                        key={i}
                        className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm flex gap-3.5 items-start"
                      >
                        <div className="w-7 h-7 rounded-xl bg-amber-500 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                          {i + 1}
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-gray-900">Step {i + 1}</p>
                          <p className="text-xs text-gray-700 leading-relaxed">{step}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                    <Info size={16} className="shrink-0 mt-0.5 text-culinary-primary" />
                    <span>
                      No specific step-by-step instructions configured for this item yet. You can configure recipes in Menu Management.
                    </span>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-16 text-center text-gray-400 space-y-2">
              <ChefHat size={36} className="mx-auto text-gray-300 mb-2" />
              <p className="font-bold text-gray-800 text-base">Select a recipe from the list</p>
              <p className="text-xs text-gray-400">Click any dish on the left to view instructions & ingredients.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
