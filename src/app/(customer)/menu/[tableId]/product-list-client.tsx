"use client";

import { useState, useMemo, useRef } from "react";
import Image from "next/image";
import {
  Search,
  X,
  UtensilsCrossed,
  Clock,
  Plus,
  Minus,
  ArrowLeft,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import toast from "react-hot-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export type DietaryCategory = "PURE_VEG" | "PURE_NON_VEG" | "BOTH";
export type FoodType = "VEG" | "NON_VEG" | "EGG";
export type FoodTypeFilter = "ALL" | FoodType;

export interface MenuCategory {
  id: string;
  name: string;
  slug?: string;
  image?: string | null;
  description?: string | null;
}

export interface MenuProduct {
  id: string;
  name: string;
  price: number;
  discount?: number;
  foodType: FoodType;
  image?: string | null;
  description?: string | null;
  preparationTime?: number | null;
  isAvailable?: boolean;
  isFeatured?: boolean;
  categoryId: string;
  category?: {
    id: string;
    name: string;
  } | null;
}

export interface MenuSettings {
  showVegNonVeg?: boolean;
  qrShowImages?: boolean;
  qrShowPrices?: boolean;
  allowOrdering?: boolean;
}

interface ProductListClientProps {
  readonly products: MenuProduct[];
  readonly settings?: MenuSettings | null;
  readonly dietaryCategory?: DietaryCategory;
}

export type MainCategoryKey = "fast_food" | "starter" | "lunch" | "dinner" | "drinks" | "dessert";

export interface MainCategoryCardConfig {
  id: MainCategoryKey;
  name: string;
  subtitle: string;
  icon: string;
  bgGradient: string;
  borderClass: string;
  textColor: string;
  badgeBg: string;
  keywords: string[];
}

const MAIN_CATEGORY_CARDS: MainCategoryCardConfig[] = [
  {
    id: "fast_food",
    name: "Fast Food",
    subtitle: "Burgers, Pizzas, Fries & Wraps",
    icon: "🍔",
    bgGradient: "from-amber-500/15 via-orange-50/70 to-amber-50/30",
    borderClass: "border-amber-200/90 hover:border-amber-400 hover:shadow-amber-100",
    textColor: "text-amber-950",
    badgeBg: "bg-amber-100 text-amber-900 border border-amber-200",
    keywords: [
      "fast", "burger", "pizza", "fries", "sandwich", "wrap", "noodle", "pasta",
      "garlic bread", "tacos", "snack", "crunch", "roll", "paneer burger", "chicken burger",
      "veg burger", "kids burger", "veg pizza", "chicken pizza"
    ],
  },
  {
    id: "starter",
    name: "Starter",
    subtitle: "Appetizers, Soups & Snacks",
    icon: "🥗",
    bgGradient: "from-emerald-500/15 via-lime-50/70 to-emerald-50/30",
    borderClass: "border-emerald-200/90 hover:border-emerald-400 hover:shadow-emerald-100",
    textColor: "text-emerald-950",
    badgeBg: "bg-emerald-100 text-emerald-900 border border-emerald-200",
    keywords: [
      "starter", "startup", "appetizer", "tikka", "soup", "salad", "chaat",
      "kabab", "kebab", "crispy", "finger", "momos", "dimsum", "spring roll"
    ],
  },
  {
    id: "lunch",
    name: "Lunch",
    subtitle: "Thalis, Rice & Meal Combos",
    icon: "🍛",
    bgGradient: "from-yellow-500/15 via-amber-50/70 to-yellow-50/30",
    borderClass: "border-yellow-200/90 hover:border-yellow-400 hover:shadow-yellow-100",
    textColor: "text-yellow-950",
    badgeBg: "bg-yellow-100 text-yellow-900 border border-yellow-200",
    keywords: [
      "lunch", "launch", "thali", "rice", "biryani", "pulao", "dal", "combo", "meal", "special thali"
    ],
  },
  {
    id: "dinner",
    name: "Dinner",
    subtitle: "Main Course, Curries & Breads",
    icon: "🍲",
    bgGradient: "from-rose-500/15 via-red-50/70 to-rose-50/30",
    borderClass: "border-rose-200/90 hover:border-rose-400 hover:shadow-rose-100",
    textColor: "text-rose-950",
    badgeBg: "bg-rose-100 text-rose-900 border border-rose-200",
    keywords: [
      "dinner", "main", "curry", "paneer", "gravy", "roti", "naan", "kulcha",
      "sabzi", "kofta", "masala", "handi", "kadhai", "butter chicken", "chicken curry"
    ],
  },
  {
    id: "drinks",
    name: "Drinks",
    subtitle: "Hot & Cold Beverages, Shakes",
    icon: "🍹",
    bgGradient: "from-sky-500/15 via-cyan-50/70 to-blue-50/30",
    borderClass: "border-sky-200/90 hover:border-sky-400 hover:shadow-sky-100",
    textColor: "text-sky-950",
    badgeBg: "bg-sky-100 text-sky-900 border border-sky-200",
    keywords: [
      "drink", "beverage", "hot beverage", "tea", "coffee", "shake", "juice",
      "hot", "cold", "mojito", "cooler", "mocktail", "cocktail", "lassi", "soda", "water", "chocolate"
    ],
  },
  {
    id: "dessert",
    name: "Dessert",
    subtitle: "Ice Creams, Sweets & Cakes",
    icon: "🍰",
    bgGradient: "from-pink-500/15 via-purple-50/70 to-pink-50/30",
    borderClass: "border-pink-200/90 hover:border-pink-400 hover:shadow-pink-100",
    textColor: "text-pink-950",
    badgeBg: "bg-pink-100 text-pink-900 border border-pink-200",
    keywords: [
      "dessert", "dissert", "sweet", "ice cream", "cake", "pastry", "brownie",
      "halwa", "gulab jamun", "rasgulla", "kulfi", "pudding", "waffle", "sundae"
    ],
  },
];

// Helper to determine which of the 6 main groups a product belongs to
function matchProductToGroup(product: MenuProduct): MainCategoryKey {
  const catName = (product.category?.name || "").toLowerCase();
  const prodName = (product.name || "").toLowerCase();
  const prodDesc = (product.description || "").toLowerCase();
  const text = `${catName} ${prodName} ${prodDesc}`;

  // 1. Drinks check
  if (MAIN_CATEGORY_CARDS[4].keywords.some((k) => text.includes(k))) {
    return "drinks";
  }
  // 2. Dessert check
  if (MAIN_CATEGORY_CARDS[5].keywords.some((k) => text.includes(k))) {
    return "dessert";
  }
  // 3. Fast food check
  if (MAIN_CATEGORY_CARDS[0].keywords.some((k) => text.includes(k))) {
    return "fast_food";
  }
  // 4. Starter check
  if (MAIN_CATEGORY_CARDS[1].keywords.some((k) => text.includes(k))) {
    return "starter";
  }
  // 5. Lunch check
  if (MAIN_CATEGORY_CARDS[2].keywords.some((k) => text.includes(k))) {
    return "lunch";
  }
  // 6. Dinner check
  if (MAIN_CATEGORY_CARDS[3].keywords.some((k) => text.includes(k))) {
    return "dinner";
  }

  // Fallback heuristic
  if (text.includes("tea") || text.includes("coffee") || text.includes("drink")) return "drinks";
  if (text.includes("sweet") || text.includes("ice")) return "dessert";
  if (text.includes("starter") || text.includes("tikka")) return "starter";
  if (text.includes("thali") || text.includes("rice")) return "lunch";
  if (text.includes("roti") || text.includes("curry")) return "dinner";

  // Default to fast food
  return "fast_food";
}

const ITEMS_PER_PAGE = 6;

function groupProductsByCategory(
  products: readonly MenuProduct[],
  dietaryCategory: DietaryCategory
): Record<MainCategoryKey, MenuProduct[]> {
  const map: Record<MainCategoryKey, MenuProduct[]> = {
    fast_food: [],
    starter: [],
    lunch: [],
    dinner: [],
    drinks: [],
    dessert: [],
  };

  for (const prod of products) {
    // If Pure Veg, exclude any non-veg products
    if (dietaryCategory === "PURE_VEG" && prod.foodType !== "VEG") {
      continue;
    }
    const groupKey = matchProductToGroup(prod);
    map[groupKey].push(prod);
  }

  return map;
}

function computeCategoryCounts(
  grouped: Record<MainCategoryKey, MenuProduct[]>
): Record<MainCategoryKey, number> {
  return {
    fast_food: grouped.fast_food.length,
    starter: grouped.starter.length,
    lunch: grouped.lunch.length,
    dinner: grouped.dinner.length,
    drinks: grouped.drinks.length,
    dessert: grouped.dessert.length,
  };
}

function filterProductsBySearchAndType(
  products: MenuProduct[],
  foodTypeFilter: FoodTypeFilter,
  searchQuery: string
): MenuProduct[] {
  const query = searchQuery.trim().toLowerCase();

  return products.filter((product) => {
    if (foodTypeFilter !== "ALL" && product.foodType !== foodTypeFilter) {
      return false;
    }
    if (!query) {
      return true;
    }
    const matchName = product.name.toLowerCase().includes(query);
    const matchDesc = product.description?.toLowerCase().includes(query);
    const matchCat = product.category?.name.toLowerCase().includes(query);
    return Boolean(matchName || matchDesc || matchCat);
  });
}

interface FoodTypeBadgeProps {
  readonly foodType: string;
  readonly showVegIcon?: boolean;
}

function FoodTypeBadge({ foodType, showVegIcon = true }: FoodTypeBadgeProps) {
  if (!showVegIcon) return null;

  if (foodType === "VEG") {
    return (
      <div className="w-4 h-4 border border-emerald-600 flex items-center justify-center rounded-sm shrink-0 bg-white shadow-2xs" title="Pure Veg">
        <div className="w-2 h-2 rounded-full bg-emerald-600" />
      </div>
    );
  }
  if (foodType === "NON_VEG") {
    return (
      <div className="w-4 h-4 border border-rose-600 flex items-center justify-center rounded-sm shrink-0 bg-white shadow-2xs" title="Non-Veg">
        <div className="w-2 h-2 rounded-full bg-rose-600" />
      </div>
    );
  }
  if (foodType === "EGG") {
    return (
      <div className="w-4 h-4 border border-amber-500 flex items-center justify-center rounded-sm shrink-0 bg-white shadow-2xs" title="Contains Egg">
        <div className="w-2 h-2 rounded-full bg-amber-500" />
      </div>
    );
  }
  return null;
}

interface CategoryLandingScreenProps {
  readonly mainCategoryCounts: Record<MainCategoryKey, number>;
  readonly onSelectCategory: (categoryId: MainCategoryKey) => void;
}

function CategoryLandingScreen({
  mainCategoryCounts,
  onSelectCategory,
}: CategoryLandingScreenProps) {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300 pb-10">
      {/* Welcome Text */}
      <div className="text-center pt-2">
        <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-800 bg-amber-100/70 px-3 py-1 rounded-full border border-amber-200 shadow-2xs inline-block">
          Menu Categories
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold font-cormorant text-culinary-text mt-2.5 tracking-tight">
          What are you craving today?
        </h2>
        <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
          Choose a dining category below to explore delicious freshly crafted dishes
        </p>
      </div>

      {/* 6 Main Category Cards Grid */}
      <div className="grid grid-cols-2 gap-4 pt-1">
        {MAIN_CATEGORY_CARDS.map((category) => {
          const count = mainCategoryCounts[category.id] || 0;

          return (
            <button
              type="button"
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              className={`relative p-5 rounded-3xl bg-gradient-to-br ${category.bgGradient} bg-white border-2 ${category.borderClass} shadow-sm hover:shadow-md hover:-translate-y-1 active:scale-[0.97] transition-all duration-300 flex flex-col justify-between text-left group overflow-hidden min-h-[160px]`}
            >
              {/* Subtle Glow Overlay */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/50 rounded-full blur-xl pointer-events-none" />

              {/* Top Row: Icon & Count Badge */}
              <div className="flex items-start justify-between w-full relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-white flex items-center justify-center text-3xl group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                  {category.icon}
                </div>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-2xs ${category.badgeBg}`}>
                  {count} {count === 1 ? "dish" : "dishes"}
                </span>
              </div>

              {/* Bottom Row: Category Title & Subtitle */}
              <div className="mt-4 relative z-10">
                <h3 className={`text-xl font-bold font-cormorant leading-tight ${category.textColor} group-hover:text-culinary-primary transition-colors`}>
                  {category.name}
                </h3>
                <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5 font-medium">
                  {category.subtitle}
                </p>

                <div className="flex items-center gap-1 text-xs font-bold text-culinary-primary mt-2.5 group-hover:translate-x-1 transition-transform">
                  <span>Explore</span>
                  <ChevronRight size={13} />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface FoodTypeFilterButtonsProps {
  readonly dietaryCategory?: DietaryCategory;
  readonly foodTypeFilter: FoodTypeFilter;
  readonly filteredCount: number;
  readonly onFilterChange: (filter: FoodTypeFilter) => void;
}

function FoodTypeFilterButtons({
  dietaryCategory,
  foodTypeFilter,
  filteredCount,
  onFilterChange,
}: FoodTypeFilterButtonsProps) {
  if (dietaryCategory === "PURE_VEG") {
    return (
      <div className="bg-emerald-50/90 border border-emerald-300/80 rounded-2xl p-2.5 px-4 flex items-center justify-between text-xs text-emerald-800 shadow-2xs">
        <div className="flex items-center gap-2 font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>🌱 100% Pure Vegetarian Kitchen</span>
        </div>
        <span className="text-[11px] font-semibold text-emerald-800 bg-white px-2.5 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
          {filteredCount} Veg Dishes
        </span>
      </div>
    );
  }

  return (
    <div className={`grid ${dietaryCategory === "PURE_NON_VEG" ? "grid-cols-3" : "grid-cols-4"} gap-2 pt-1 pb-1`}>
      <button
        type="button"
        onClick={() => onFilterChange("ALL")}
        className={`py-2 rounded-xl text-xs font-bold transition-all text-center ${
          foodTypeFilter === "ALL"
            ? "bg-gray-900 text-white shadow-2xs scale-[1.02]"
            : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
        }`}
      >
        All
      </button>

      {dietaryCategory !== "PURE_NON_VEG" && (
        <button
          type="button"
          onClick={() => onFilterChange(foodTypeFilter === "VEG" ? "ALL" : "VEG")}
          className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all border ${
            foodTypeFilter === "VEG"
              ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs scale-[1.02]"
              : "bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50"
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Veg</span>
        </button>
      )}

      <button
        type="button"
        onClick={() => onFilterChange(foodTypeFilter === "NON_VEG" ? "ALL" : "NON_VEG")}
        className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all border ${
          foodTypeFilter === "NON_VEG"
            ? "bg-rose-600 text-white border-rose-600 shadow-2xs scale-[1.02]"
            : "bg-white text-rose-700 border-rose-300 hover:bg-rose-50"
        }`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        <span>Non-Veg</span>
      </button>

      <button
        type="button"
        onClick={() => onFilterChange(foodTypeFilter === "EGG" ? "ALL" : "EGG")}
        className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all border ${
          foodTypeFilter === "EGG"
            ? "bg-amber-600 text-white border-amber-600 shadow-2xs scale-[1.02]"
            : "bg-white text-amber-700 border-amber-300 hover:bg-amber-50"
        }`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        <span>Egg</span>
      </button>
    </div>
  );
}

interface ProductCardItemProps {
  readonly product: MenuProduct;
  readonly quantity: number;
  readonly showImages: boolean;
  readonly showPrices: boolean;
  readonly showVegIcon: boolean;
  readonly onSelect: (product: MenuProduct) => void;
  readonly onAdd: (product: MenuProduct, e?: React.MouseEvent) => void;
  readonly onUpdateQuantity: (productId: string, newQuantity: number, e?: React.MouseEvent) => void;
}

function ProductCardItem({
  product,
  quantity,
  showImages,
  showPrices,
  showVegIcon,
  onSelect,
  onAdd,
  onUpdateQuantity,
}: ProductCardItemProps) {
  return (
    <div
      key={product.id}
      className="bg-white rounded-3xl p-3.5 flex gap-3.5 border border-culinary-border/40 shadow-2xs hover:shadow-md hover:border-culinary-primary/30 transition-all duration-200 group relative overflow-hidden"
    >
      {/* Clickable Product Content Button */}
      <button
        type="button"
        onClick={() => onSelect(product)}
        aria-label={`View details for ${product.name}`}
        className="flex-1 flex gap-3.5 text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-culinary-primary/40 rounded-2xl min-w-0"
      >
        {/* Product Image Thumbnail */}
        {showImages && (
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shrink-0 bg-amber-50/50 relative border border-gray-100 group-hover:scale-[1.02] transition-transform duration-300">
            {product.image ? (
              <Image
                src={product.image}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 112px, 112px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-amber-700/40 gap-1">
                <UtensilsCrossed size={24} />
                <span className="text-[9px] font-bold tracking-wider uppercase opacity-60">Chef Dish</span>
              </div>
            )}
          </div>
        )}

        {/* Content Info */}
        <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
          <div>
            <div className="flex items-start gap-1.5 mb-1">
              <FoodTypeBadge foodType={product.foodType} showVegIcon={showVegIcon} />
              <h4 className="font-bold text-culinary-text text-base leading-snug truncate group-hover:text-culinary-primary transition-colors">
                {product.name}
              </h4>
            </div>

            {product.description && (
              <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                {product.description}
              </p>
            )}
          </div>

          <div className="mt-2 pt-1">
            {/* Price */}
            {showPrices && (
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-bold text-culinary-text font-cormorant">
                  ₹{Number(product.price).toFixed(2)}
                </span>
                {product.discount && product.discount > 0 ? (
                  <span className="text-[11px] text-gray-400 line-through">
                    ₹{(Number(product.price) + product.discount).toFixed(2)}
                  </span>
                ) : null}
              </div>
            )}

            {product.preparationTime ? (
              <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1 mt-0.5">
                <Clock size={10} /> {product.preparationTime} min
              </span>
            ) : null}
          </div>
        </div>
      </button>

      {/* Quick Add / Stepper Controls */}
      <div className="self-end shrink-0 relative z-10">
        {quantity > 0 ? (
          <div className="flex items-center bg-gray-900 text-white rounded-xl h-8 overflow-hidden shadow-sm border border-gray-800">
            <button
              type="button"
              onClick={(e) => onUpdateQuantity(product.id, quantity - 1, e)}
              aria-label={`Decrease quantity of ${product.name}`}
              className="w-7 h-full flex items-center justify-center font-bold hover:bg-gray-800 active:bg-gray-700 transition-colors text-white cursor-pointer"
            >
              <Minus size={13} />
            </button>
            <span className="w-6 text-center text-xs font-bold">{quantity}</span>
            <button
              type="button"
              onClick={(e) => onUpdateQuantity(product.id, quantity + 1, e)}
              aria-label={`Increase quantity of ${product.name}`}
              className="w-7 h-full flex items-center justify-center font-bold hover:bg-gray-800 active:bg-gray-700 transition-colors text-white cursor-pointer"
            >
              <Plus size={13} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={(e) => onAdd(product, e)}
            aria-label={`Add ${product.name} to cart`}
            className="px-4 py-1.5 h-8 flex items-center justify-center bg-white border-2 border-culinary-primary text-culinary-primary text-xs font-bold rounded-xl shadow-2xs hover:bg-culinary-primary hover:text-white active:scale-95 transition-all gap-1 cursor-pointer"
          >
            <Plus size={13} /> ADD
          </button>
        )}
      </div>
    </div>
  );
}

interface ProductDetailDialogProps {
  readonly product: MenuProduct | null;
  readonly quantity: number;
  readonly showImages: boolean;
  readonly showVegIcon: boolean;
  readonly onClose: () => void;
  readonly onAdd: (product: MenuProduct) => void;
  readonly onUpdateQuantity: (productId: string, newQuantity: number) => void;
}

function ProductDetailDialog({
  product,
  quantity,
  showImages,
  showVegIcon,
  onClose,
  onAdd,
  onUpdateQuantity,
}: ProductDetailDialogProps) {
  if (!product) return null;

  return (
    <Dialog open={!!product} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md rounded-3xl p-6 bg-white shadow-2xl border border-gray-100">
        <DialogHeader className="border-b border-gray-100 pb-3 text-left">
          <div className="flex items-center gap-2">
            <FoodTypeBadge foodType={product.foodType} showVegIcon={showVegIcon} />
            <DialogTitle className="text-xl font-bold font-cormorant text-gray-900">
              {product.name}
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Product Image */}
        {showImages && product.image ? (
          <div className="w-full h-48 rounded-2xl overflow-hidden relative bg-gray-100 my-2 shadow-inner">
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-full h-32 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/50 flex items-center justify-center text-culinary-primary my-2">
            <UtensilsCrossed size={40} className="opacity-40" />
          </div>
        )}

        {/* Description & Details */}
        <div className="space-y-3">
          {product.description && (
            <p className="text-xs text-gray-600 leading-relaxed">
              {product.description}
            </p>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div>
              <span className="text-xs text-gray-400 block font-medium">Price</span>
              <span className="text-2xl font-black text-culinary-primary font-cormorant">
                ₹{Number(product.price).toFixed(2)}
              </span>
            </div>

            {product.preparationTime && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-100 text-amber-800 text-xs font-semibold">
                <Clock size={13} />
                <span>{product.preparationTime} mins</span>
              </div>
            )}
          </div>
        </div>

        {/* Cart Action inside Modal */}
        <div className="pt-3">
          {quantity > 0 ? (
            <div className="flex items-center justify-between bg-gray-900 text-white rounded-2xl p-2 px-4 shadow-md">
              <span className="text-xs font-semibold">Quantity in Cart:</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(product.id, quantity - 1)}
                  className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center font-bold text-white transition-colors"
                >
                  <Minus size={15} />
                </button>
                <span className="text-sm font-bold w-4 text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(product.id, quantity + 1)}
                  className="w-8 h-8 rounded-xl bg-culinary-primary hover:bg-culinary-primary/90 flex items-center justify-center font-bold text-white transition-colors"
                >
                  <Plus size={15} />
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onAdd(product)}
              className="w-full py-3.5 bg-culinary-primary hover:bg-culinary-primary/90 text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 shadow-md shadow-culinary-primary/25 active:scale-[0.98] transition-transform"
            >
              <Plus size={16} /> Add to Order
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface PaginationControlsProps {
  readonly currentPage: number;
  readonly totalPages: number;
  readonly startProductNum: number;
  readonly endProductNum: number;
  readonly totalProducts: number;
  readonly onPageChange: (page: number) => void;
}

function PaginationControls({
  currentPage,
  totalPages,
  startProductNum,
  endProductNum,
  totalProducts,
  onPageChange,
}: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="bg-white rounded-3xl p-4 border border-gray-200/80 shadow-xs space-y-3 mt-6">
      <div className="flex items-center justify-between text-xs text-gray-500 font-medium px-1">
        <span>
          Showing <strong className="text-gray-900">{startProductNum}–{endProductNum}</strong> of{" "}
          <strong className="text-gray-900">{totalProducts}</strong> dishes
        </span>
        <span className="font-semibold text-culinary-primary bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-100">
          Page {currentPage} of {totalPages}
        </span>
      </div>

      {/* Page Navigation Buttons */}
      <div className="flex items-center justify-center gap-1.5 pt-1">
        {/* Prev Button */}
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-2xs"
        >
          <ChevronLeft size={14} />
          <span>Prev</span>
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
            const isCurrent = pageNum === currentPage;
            // Show page 1, last page, and nearby pages
            if (
              pageNum === 1 ||
              pageNum === totalPages ||
              (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
            ) {
              return (
                <button
                  type="button"
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                    isCurrent
                      ? "bg-culinary-primary text-white shadow-sm scale-105"
                      : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {pageNum}
                </button>
              );
            }
            if (
              (pageNum === 2 && currentPage > 3) ||
              (pageNum === totalPages - 1 && currentPage < totalPages - 2)
            ) {
              return (
                <span key={pageNum} className="text-xs text-gray-400 px-0.5">
                  ...
                </span>
              );
            }
            return null;
          })}
        </div>

        {/* Next Button */}
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-2xs"
        >
          <span>Next</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

export function ProductListClient({
  products,
  settings,
  dietaryCategory = "BOTH",
}: ProductListClientProps) {
  // Screen state: null = Category Selection Landing Screen, MainCategoryKey = Specific Category Screen
  const [selectedMainCategory, setSelectedMainCategory] = useState<MainCategoryKey | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [foodTypeFilter, setFoodTypeFilter] = useState<FoodTypeFilter>("ALL");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedProduct, setSelectedProduct] = useState<MenuProduct | null>(null);

  const productsTopRef = useRef<HTMLDivElement>(null);
  const { items, addItem, updateQuantity, removeItem } = useCartStore();

  const showVegIcon = settings?.showVegNonVeg !== false;
  const showPrices = settings?.qrShowPrices !== false;
  const showImages = settings?.qrShowImages !== false;

  // Group products into the 6 main categories
  const groupedProductsMap = useMemo(
    () => groupProductsByCategory(products, dietaryCategory),
    [products, dietaryCategory]
  );

  // Counts for each of the 6 cards
  const mainCategoryCounts = useMemo(
    () => computeCategoryCounts(groupedProductsMap),
    [groupedProductsMap]
  );

  // Active Category Configuration
  const currentCategoryConfig = useMemo(() => {
    if (!selectedMainCategory) return null;
    return MAIN_CATEGORY_CARDS.find((c) => c.id === selectedMainCategory) || null;
  }, [selectedMainCategory]);

  // Products belonging to the selected main category
  const activeMainCategoryProducts = useMemo(() => {
    if (!selectedMainCategory) return [];
    return groupedProductsMap[selectedMainCategory] || [];
  }, [selectedMainCategory, groupedProductsMap]);

  // Filtered products before pagination
  const allFilteredProducts = useMemo(
    () => filterProductsBySearchAndType(activeMainCategoryProducts, foodTypeFilter, searchQuery),
    [activeMainCategoryProducts, foodTypeFilter, searchQuery]
  );

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(allFilteredProducts.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedProducts = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    return allFilteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [allFilteredProducts, safeCurrentPage]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    productsTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const getProductQuantity = (productId: string) => {
    return items.find((item) => item.id === productId)?.quantity || 0;
  };

  const handleAdd = (product: MenuProduct, e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1,
      foodType: product.foodType,
    });
    toast.success(`Added ${product.name} to cart`, {
      icon: "🛒",
      style: {
        borderRadius: "14px",
        background: "#1c1917",
        color: "#fff",
        fontSize: "13px",
        fontWeight: "600",
      },
    });
  };

  const handleUpdateQuantity = (productId: string, newQuantity: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    if (newQuantity <= 0) {
      removeItem(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  const handleResetCategoryFilters = () => {
    setSearchQuery("");
    setFoodTypeFilter("ALL");
    setCurrentPage(1);
  };

  const handleSelectCategory = (categoryId: MainCategoryKey) => {
    setSelectedMainCategory(categoryId);
    handleResetCategoryFilters();
  };

  if (selectedMainCategory === null) {
    return (
      <CategoryLandingScreen
        mainCategoryCounts={mainCategoryCounts}
        onSelectCategory={handleSelectCategory}
      />
    );
  }

  const startProductNum = (safeCurrentPage - 1) * ITEMS_PER_PAGE + 1;
  const endProductNum = Math.min(safeCurrentPage * ITEMS_PER_PAGE, allFilteredProducts.length);

  return (
    <div ref={productsTopRef} className="space-y-4 animate-in fade-in-50 duration-300 pb-12">
      {/* Top Header / Back Button Bar */}
      <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-xs">
        <button
          type="button"
          onClick={() => {
            setSelectedMainCategory(null);
            handleResetCategoryFilters();
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-culinary-primary text-xs font-bold transition-all border border-amber-200 shadow-2xs active:scale-95"
        >
          <ArrowLeft size={15} />
          <span>All Categories</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-2xl">{currentCategoryConfig?.icon}</span>
          <div className="text-right">
            <h2 className="text-lg font-bold font-cormorant text-culinary-text leading-tight">
              {currentCategoryConfig?.name}
            </h2>
            <span className="text-[11px] text-gray-400 font-semibold">
              {allFilteredProducts.length} {allFilteredProducts.length === 1 ? "dish" : "dishes"}
            </span>
          </div>
        </div>
      </div>

      {/* Live Search Bar within Category */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder={`Search in ${currentCategoryConfig?.name}...`}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full pl-11 pr-10 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-culinary-primary/30 shadow-2xs transition-all placeholder:text-gray-400 text-culinary-text"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setCurrentPage(1);
            }}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Dietary Adapted Food Type Filter */}
      <FoodTypeFilterButtons
        dietaryCategory={dietaryCategory}
        foodTypeFilter={foodTypeFilter}
        filteredCount={allFilteredProducts.length}
        onFilterChange={(filter) => {
          setFoodTypeFilter(filter);
          setCurrentPage(1);
        }}
      />

      {/* Product List Content */}
      <div className="space-y-3.5 pt-1">
        {allFilteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-gray-200/80 shadow-2xs space-y-3 my-4">
            <div className="w-14 h-14 rounded-full bg-amber-50 text-culinary-primary flex items-center justify-center mx-auto text-2xl">
              🍽️
            </div>
            <h3 className="font-bold font-cormorant text-lg text-gray-800">No dishes found</h3>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">
              No items match your active filters in this category.
            </p>
            <div className="flex gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={handleResetCategoryFilters}
                className="px-3.5 py-1.5 bg-gray-100 text-gray-800 text-xs font-bold rounded-xl hover:bg-gray-200 transition-colors"
              >
                Reset Filters
              </button>
              <button
                type="button"
                onClick={() => setSelectedMainCategory(null)}
                className="px-3.5 py-1.5 bg-culinary-primary text-white text-xs font-bold rounded-xl shadow-xs hover:bg-culinary-primary/90 transition-colors"
              >
                Back to Categories
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Products of Current Page */}
            {paginatedProducts.map((product) => (
              <ProductCardItem
                key={product.id}
                product={product}
                quantity={getProductQuantity(product.id)}
                showImages={showImages}
                showPrices={showPrices}
                showVegIcon={showVegIcon}
                onSelect={setSelectedProduct}
                onAdd={handleAdd}
                onUpdateQuantity={handleUpdateQuantity}
              />
            ))}

            {/* Pagination Controls */}
            <PaginationControls
              currentPage={safeCurrentPage}
              totalPages={totalPages}
              startProductNum={startProductNum}
              endProductNum={endProductNum}
              totalProducts={allFilteredProducts.length}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>

      {/* Quick Dish Detail Modal */}
      <ProductDetailDialog
        product={selectedProduct}
        quantity={selectedProduct ? getProductQuantity(selectedProduct.id) : 0}
        showImages={showImages}
        showVegIcon={showVegIcon}
        onClose={() => setSelectedProduct(null)}
        onAdd={handleAdd}
        onUpdateQuantity={handleUpdateQuantity}
      />
    </div>
  );
}
