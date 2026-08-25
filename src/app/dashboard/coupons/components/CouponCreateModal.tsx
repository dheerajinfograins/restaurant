"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  TicketPercent,
  X,
  Plus,
  Percent,
  Banknote,
  ShoppingBag,
  Target,
  Sparkles,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export type CouponType = "PRODUCT_DISCOUNT" | "ORDER_DISCOUNT" | "TIERED_MIN_ORDER";
export type DiscountType = "PERCENTAGE" | "FLAT";

interface ProductOption {
  id: string;
  name: string;
  price: number;
  foodType?: string;
  category?: { name: string };
}

const COUPON_TYPE_DEFAULTS: Record<
  CouponType,
  {
    code: string;
    description: string;
    minOrderAmount?: number;
    maxDiscount?: number;
  }
> = {
  TIERED_MIN_ORDER: {
    code: "FEAST1200",
    description: "Special ₹300 OFF on orders above ₹1,200",
    minOrderAmount: 1200,
    maxDiscount: 300,
  },
  PRODUCT_DISCOUNT: {
    code: "DISH20",
    description: "Exclusive discount on selected specialty dishes",
  },
  ORDER_DISCOUNT: {
    code: "FLAT100",
    description: "Discount on your entire food bill",
  },
};

interface CouponCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  restaurantId?: string;
}

export default function CouponCreateModal({
  isOpen,
  onClose,
  onSuccess,
  restaurantId,
}: Readonly<CouponCreateModalProps>) {
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [couponType, setCouponType] = useState<CouponType>("ORDER_DISCOUNT");
  const [discountType, setDiscountType] = useState<DiscountType>("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState<number | "">(20);
  const [minOrderAmount, setMinOrderAmount] = useState<number | "">(0);
  const [maxDiscount, setMaxDiscount] = useState<number | "">("");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState("");
  const [usageLimit, setUsageLimit] = useState<number | "">("");
  const [isActive, setIsActive] = useState(true);

  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch products for product-specific selection
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    const url = restaurantId
      ? `/api/products?restaurantId=${restaurantId}`
      : `/api/products`;
    axios
      .get(url)
      .then((res) => {
        if (isMounted) {
          setProducts(res.data?.data || res.data || []);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Failed to load products for coupon modal:", err);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoadingProducts(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, restaurantId]);

  // Adjust defaults when changing coupon type
  const handleTypeChange = (type: CouponType) => {
    setCouponType(type);
    const defaults = COUPON_TYPE_DEFAULTS[type];

    if (!code) setCode(defaults.code);
    if (!description) setDescription(defaults.description);
    if (defaults.minOrderAmount) {
      setMinOrderAmount((prev) => (Number(prev) > 0 ? prev : defaults.minOrderAmount!));
    }
    if (defaults.maxDiscount && !maxDiscount) {
      setMaxDiscount(defaults.maxDiscount);
    }
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAllProducts = () => {
    if (selectedProductIds.length === products.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(products.map((p) => p.id));
    }
  };

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!code.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }

    if (discountValue === "" || Number(discountValue) <= 0) {
      toast.error("Please enter a valid discount value greater than 0");
      return;
    }

    if (discountType === "PERCENTAGE" && Number(discountValue) > 100) {
      toast.error("Percentage discount cannot exceed 100%");
      return;
    }

    if (couponType === "PRODUCT_DISCOUNT" && selectedProductIds.length === 0) {
      toast.error("Please select at least one menu item for Product-Specific coupon");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        code: code.trim().toUpperCase(),
        description: description.trim() || undefined,
        couponType,
        discountType,
        discountValue: Number(discountValue),
        minOrderAmount: minOrderAmount !== "" ? Number(minOrderAmount) : 0,
        maxDiscount: maxDiscount !== "" ? Number(maxDiscount) : undefined,
        productIds: couponType === "PRODUCT_DISCOUNT" ? selectedProductIds : [],
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        usageLimit: usageLimit !== "" ? Number(usageLimit) : undefined,
        isActive,
      };

      await axios.post("/api/coupons", payload);
      toast.success(`Coupon '${code.toUpperCase()}' created successfully! 🎉`);
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to create coupon. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderProductList = () => {
    if (loadingProducts) {
      return (
        <div className="py-8 flex items-center justify-center gap-2 text-xs text-stone-500">
          <Loader2 className="animate-spin" size={16} />
          <span>Loading restaurant menu dishes...</span>
        </div>
      );
    }

    if (products.length === 0) {
      return (
        <p className="text-xs text-stone-400 py-4 text-center">
          No products found for this restaurant. Please create menu items first.
        </p>
      );
    }

    return (
      <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
        {products.map((prod) => {
          const isSelected = selectedProductIds.includes(prod.id);
          return (
            <button
              key={prod.id}
              type="button"
              onClick={() => toggleProductSelection(prod.id)}
              className={`w-full text-left p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${isSelected
                ? "bg-white border-amber-500 shadow-2xs text-amber-950"
                : "bg-white/80 border-stone-200 text-stone-700 hover:bg-white"
                }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${isSelected ? "bg-amber-600 border-amber-600 text-white" : "border-stone-300 bg-white"
                    }`}
                >
                  {isSelected && <CheckCircle2 size={12} />}
                </div>
                <span className="text-xs font-semibold truncate">{prod.name}</span>
                {prod.category?.name && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-500 shrink-0">
                    {prod.category.name}
                  </span>
                )}
              </div>
              <span className="text-xs font-mono font-bold text-stone-900 shrink-0 ml-2">
                ₹{prod.price.toFixed(2)}
              </span>
            </button>
          );
        })}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-stone-900 via-stone-800 to-amber-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <TicketPercent size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold font-cormorant tracking-tight text-white">
                Create Promotional Coupon
              </h2>
              <p className="text-xs text-amber-200/80">
                Configure promotional discounts for menu items or total order checkout.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Step 1: Select Coupon Scope / Type (3 distinct types) */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-700 block">
              1. Select Coupon Scope & Type
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Type 1: Product Specific */}
              <button
                type="button"
                onClick={() => handleTypeChange("PRODUCT_DISCOUNT")}
                className={`p-3.5 rounded-2xl border text-left transition-all relative ${couponType === "PRODUCT_DISCOUNT"
                  ? "bg-amber-50/80 border-amber-600 shadow-sm ring-1 ring-amber-600"
                  : "bg-white border-stone-200 hover:bg-stone-50"
                  }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
                    <ShoppingBag size={15} />
                  </div>
                  <span className="text-xs font-bold text-stone-900">Product Specific</span>
                </div>
                <p className="text-[11px] text-stone-500 leading-snug">
                  Apply discount to selected individual dishes or items.
                </p>
              </button>

              {/* Type 2: Total Bill Discount */}
              <button
                type="button"
                onClick={() => handleTypeChange("ORDER_DISCOUNT")}
                className={`p-3.5 rounded-2xl border text-left transition-all relative ${couponType === "ORDER_DISCOUNT"
                  ? "bg-amber-50/80 border-amber-600 shadow-sm ring-1 ring-amber-600"
                  : "bg-white border-stone-200 hover:bg-stone-50"
                  }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                    <Banknote size={15} />
                  </div>
                  <span className="text-xs font-bold text-stone-900">Total Bill % / Flat</span>
                </div>
                <p className="text-[11px] text-stone-500 leading-snug">
                  Discount on the total order value without restrictions.
                </p>
              </button>

              {/* Type 3: Tiered Min Order Criteria */}
              <button
                type="button"
                onClick={() => handleTypeChange("TIERED_MIN_ORDER")}
                className={`p-3.5 rounded-2xl border text-left transition-all relative ${couponType === "TIERED_MIN_ORDER"
                  ? "bg-amber-50/80 border-amber-600 shadow-sm ring-1 ring-amber-600"
                  : "bg-white border-stone-200 hover:bg-stone-50"
                  }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="p-1.5 rounded-lg bg-purple-100 text-purple-800">
                    <Target size={15} />
                  </div>
                  <span className="text-xs font-bold text-stone-900">Tiered (Min ₹1200+)</span>
                </div>
                <p className="text-[11px] text-stone-500 leading-snug">
                  Unlocks only above min order (e.g. ₹1,200) with max cap.
                </p>
              </button>
            </div>
          </div>

          {/* Step 2: Code & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="create-coupon-code" className="text-xs font-bold text-stone-700 mb-1.5 block">
                Coupon Code <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <Input
                  id="create-coupon-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. FEAST1200, BURGER20"
                  className="font-mono uppercase tracking-wider font-bold h-11 bg-stone-50 border-stone-200 text-amber-950"
                  required
                />
              </div>
              <p className="text-[10px] text-stone-400 mt-1">
                Customers enter this code at checkout.
              </p>
            </div>

            <div>
              <label htmlFor="create-coupon-description" className="text-xs font-bold text-stone-700 mb-1.5 block">
                Offer Title / Description
              </label>
              <Input
                id="create-coupon-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Get ₹300 OFF on orders above ₹1,200"
                className="h-11 bg-stone-50 border-stone-200 text-xs"
              />
            </div>
          </div>

          {/* Step 3: Discount Calculation Rules */}
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-4">
            <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-600" />
              Discount Values & Limits
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-semibold text-stone-600 mb-1.5 block">
                  Discount Type
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDiscountType("PERCENTAGE")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${discountType === "PERCENTAGE"
                      ? "bg-amber-600 text-white border-amber-600 shadow-2xs"
                      : "bg-white text-stone-700 border-stone-200 hover:bg-stone-100"
                      }`}
                  >
                    <Percent size={13} />
                    <span>Percentage (%)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType("FLAT")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${discountType === "FLAT"
                      ? "bg-amber-600 text-white border-amber-600 shadow-2xs"
                      : "bg-white text-stone-700 border-stone-200 hover:bg-stone-100"
                      }`}
                  >
                    <Banknote size={13} />
                    <span>Flat Amount (₹)</span>
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="create-discount-value" className="text-xs font-semibold text-stone-600 mb-1.5 block">
                  Discount Value {discountType === "PERCENTAGE" ? "(%)" : "(₹)"} <span className="text-rose-600">*</span>
                </label>
                <Input
                  id="create-discount-value"
                  type="number"
                  min="1"
                  max={discountType === "PERCENTAGE" ? 100 : undefined}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder={discountType === "PERCENTAGE" ? "20" : "150"}
                  className="h-10 bg-white border-stone-200 font-bold"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label htmlFor="create-min-order-amount" className="text-xs font-semibold text-stone-600 mb-1.5 flex items-center justify-between">
                  <span>Minimum Order Value (₹)</span>
                  {couponType === "TIERED_MIN_ORDER" && (
                    <span className="text-[10px] text-amber-700 font-bold">Min ₹1,200 Recommended</span>
                  )}
                </label>
                <Input
                  id="create-min-order-amount"
                  type="number"
                  min="0"
                  value={minOrderAmount}
                  onChange={(e) => setMinOrderAmount(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="e.g. 1200"
                  className="h-10 bg-white border-stone-200"
                />
                <p className="text-[10px] text-stone-400 mt-1">
                  Leave 0 for no minimum cart requirement.
                </p>
              </div>

              <div>
                <label htmlFor="create-max-discount" className="text-xs font-semibold text-stone-600 mb-1.5 block">
                  Max Discount Cap (₹)
                </label>
                <Input
                  id="create-max-discount"
                  type="number"
                  min="1"
                  value={maxDiscount}
                  onChange={(e) => setMaxDiscount(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="e.g. 300 (Optional)"
                  className="h-10 bg-white border-stone-200"
                />
                <p className="text-[10px] text-stone-400 mt-1">
                  Maximum savings cap for percentage discounts.
                </p>
              </div>
            </div>
          </div>

          {/* Step 4: Product-Specific Dish Selector (Only visible for PRODUCT_DISCOUNT) */}
          {couponType === "PRODUCT_DISCOUNT" && (
            <div className="space-y-3 p-4 bg-amber-50/60 rounded-2xl border border-amber-200/80 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                    Select Applicable Dishes ({selectedProductIds.length} selected)
                  </h4>
                  <p className="text-[11px] text-amber-800/80">
                    This discount will only apply to the dishes you select below.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllProducts}
                  className="text-[11px] h-7 px-2.5 rounded-lg border-amber-300 text-amber-900 hover:bg-amber-100"
                >
                  {selectedProductIds.length === products.length ? "Deselect All" : "Select All Dishes"}
                </Button>
              </div>

              {renderProductList()}
            </div>
          )}

          {/* Step 5: Validity Dates & Usage Limits */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="create-start-date" className="text-xs font-semibold text-stone-600 mb-1.5 block">
                Start Date
              </label>
              <Input
                id="create-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-10 bg-stone-50 border-stone-200 text-xs"
              />
            </div>

            <div>
              <label htmlFor="create-end-date" className="text-xs font-semibold text-stone-600 mb-1.5 block">
                Expiry Date (Optional)
              </label>
              <Input
                id="create-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-10 bg-stone-50 border-stone-200 text-xs"
              />
            </div>

            <div>
              <label htmlFor="create-usage-limit" className="text-xs font-semibold text-stone-600 mb-1.5 block">
                Usage Limit (Total)
              </label>
              <Input
                id="create-usage-limit"
                type="number"
                min="1"
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="e.g. 500 (Optional)"
                className="h-10 bg-stone-50 border-stone-200 text-xs"
              />
            </div>
          </div>

          {/* Step 6: Active Status Switch */}
          <div className="flex items-center justify-between p-3.5 bg-stone-50 rounded-2xl border border-stone-200">
            <div>
              <p className="text-xs font-bold text-stone-800">Coupon Active Status</p>
              <p className="text-[11px] text-stone-500">
                Enable or disable this coupon immediately for customer ordering.
              </p>
            </div>
            <Switch
              checked={isActive}
              onCheckedChange={setIsActive}
              className="data-[state=checked]:bg-amber-600"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-stone-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-11 px-5 rounded-xl text-xs font-semibold border-stone-200 text-stone-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-11 px-6 rounded-xl bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 hover:from-amber-600 hover:to-amber-800 text-white font-bold text-xs shadow-md shadow-amber-900/20 gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={15} />
                  <span>Saving Coupon...</span>
                </>
              ) : (
                <>
                  <Plus size={16} />
                  <span>Create & Launch Coupon</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
