"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  TicketPercent,
  X,
  Percent,
  Banknote,
  ShoppingBag,
  Target,
  Loader2,
  CheckCircle2,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { CouponType, DiscountType } from "./CouponCreateModal";

interface ProductOption {
  id: string;
  name: string;
  price: number;
  foodType?: string;
  category?: { name: string };
}

export interface CouponItem {
  id: string;
  code: string;
  description: string | null;
  couponType: CouponType;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount: number | null;
  maxDiscount: number | null;
  productIds: string[];
  startDate: string | null;
  endDate: string | null;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
  restaurantId: string;
  restaurant?: {
    id: string;
    name: string;
    logo?: string | null;
    dietaryCategory?: string;
  };
  _count?: {
    orders: number;
  };
}

interface CouponEditModalProps {
  coupon: CouponItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CouponEditModal({
  coupon,
  isOpen,
  onClose,
  onSuccess,
}: Readonly<CouponEditModalProps>) {
  if (!isOpen || !coupon) return null;

  return (
    <CouponEditModalContent
      key={coupon.id}
      coupon={coupon}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}

interface CouponEditModalContentProps {
  coupon: CouponItem;
  onClose: () => void;
  onSuccess: () => void;
}

function CouponEditModalContent({
  coupon,
  onClose,
  onSuccess,
}: Readonly<CouponEditModalContentProps>) {
  const [code, setCode] = useState(coupon.code);
  const [description, setDescription] = useState(coupon.description || "");
  const [couponType, setCouponType] = useState<CouponType>(coupon.couponType);
  const [discountType, setDiscountType] = useState<DiscountType>(coupon.discountType);
  const [discountValue, setDiscountValue] = useState<number | "">(coupon.discountValue);
  const [minOrderAmount, setMinOrderAmount] = useState<number | "">(coupon.minOrderAmount ?? 0);
  const [maxDiscount, setMaxDiscount] = useState<number | "">(coupon.maxDiscount ?? "");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(coupon.productIds || []);
  const [startDate, setStartDate] = useState(coupon.startDate ? coupon.startDate.slice(0, 10) : "");
  const [endDate, setEndDate] = useState(coupon.endDate ? coupon.endDate.slice(0, 10) : "");
  const [usageLimit, setUsageLimit] = useState<number | "">(coupon.usageLimit ?? "");
  const [isActive, setIsActive] = useState(coupon.isActive);

  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch products for this restaurant
  useEffect(() => {
    let isMounted = true;
    const url = coupon.restaurantId
      ? `/api/products?restaurantId=${coupon.restaurantId}`
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
          console.error("Failed to load products for edit coupon:", err);
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
  }, [coupon.restaurantId]);

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
      toast.error("Please enter a valid discount value");
      return;
    }

    if (discountType === "PERCENTAGE" && Number(discountValue) > 100) {
      toast.error("Percentage discount cannot exceed 100%");
      return;
    }

    if (couponType === "PRODUCT_DISCOUNT" && selectedProductIds.length === 0) {
      toast.error("Please select at least one menu item");
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

      await axios.put(`/api/coupons/${coupon.id}`, payload);
      toast.success(`Coupon '${code.toUpperCase()}' updated successfully! ✨`);
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to update coupon.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-stone-900 via-stone-800 to-amber-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <TicketPercent size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold font-cormorant tracking-tight text-white">
                Edit Coupon: {coupon.code}
              </h2>
              <p className="text-xs text-amber-200/80">
                Update discount rules, minimum order limits, or active validity.
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Coupon Scope / Type */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-700 block">
              Coupon Scope & Type
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setCouponType("PRODUCT_DISCOUNT")}
                className={`p-3.5 rounded-2xl border text-left transition-all ${couponType === "PRODUCT_DISCOUNT"
                  ? "bg-amber-50/80 border-amber-600 shadow-sm ring-1 ring-amber-600"
                  : "bg-white border-stone-200 hover:bg-stone-50"
                  }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <ShoppingBag size={14} className="text-amber-800" />
                  <span className="text-xs font-bold text-stone-900">Product Specific</span>
                </div>
                <p className="text-[11px] text-stone-500">Selected menu items</p>
              </button>

              <button
                type="button"
                onClick={() => setCouponType("ORDER_DISCOUNT")}
                className={`p-3.5 rounded-2xl border text-left transition-all ${couponType === "ORDER_DISCOUNT"
                  ? "bg-amber-50/80 border-amber-600 shadow-sm ring-1 ring-amber-600"
                  : "bg-white border-stone-200 hover:bg-stone-50"
                  }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Banknote size={14} className="text-emerald-800" />
                  <span className="text-xs font-bold text-stone-900">Total Bill Discount</span>
                </div>
                <p className="text-[11px] text-stone-500">Full cart discount</p>
              </button>

              <button
                type="button"
                onClick={() => setCouponType("TIERED_MIN_ORDER")}
                className={`p-3.5 rounded-2xl border text-left transition-all ${couponType === "TIERED_MIN_ORDER"
                  ? "bg-amber-50/80 border-amber-600 shadow-sm ring-1 ring-amber-600"
                  : "bg-white border-stone-200 hover:bg-stone-50"
                  }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Target size={14} className="text-purple-800" />
                  <span className="text-xs font-bold text-stone-900">Tiered (Min ₹1200+)</span>
                </div>
                <p className="text-[11px] text-stone-500">Threshold based</p>
              </button>
            </div>
          </div>

          {/* Code & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-coupon-code" className="text-xs font-bold text-stone-700 mb-1.5 block">
                Coupon Code <span className="text-rose-600">*</span>
              </label>
              <Input
                id="edit-coupon-code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="font-mono uppercase tracking-wider font-bold h-11 bg-stone-50 border-stone-200 text-amber-950"
                required
              />
            </div>

            <div>
              <label htmlFor="edit-coupon-description" className="text-xs font-bold text-stone-700 mb-1.5 block">
                Offer Title / Description
              </label>
              <Input
                id="edit-coupon-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-11 bg-stone-50 border-stone-200 text-xs"
              />
            </div>
          </div>

          {/* Values & Limits */}
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-4">
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
                      : "bg-white text-stone-700 border-stone-200"
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
                      : "bg-white text-stone-700 border-stone-200"
                      }`}
                  >
                    <Banknote size={13} />
                    <span>Flat (₹)</span>
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="edit-discount-value" className="text-xs font-semibold text-stone-600 mb-1.5 block">
                  Discount Value {discountType === "PERCENTAGE" ? "(%)" : "(₹)"}
                </label>
                <Input
                  id="edit-discount-value"
                  type="number"
                  min="1"
                  max={discountType === "PERCENTAGE" ? 100 : undefined}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value === "" ? "" : Number(e.target.value))}
                  className="h-10 bg-white border-stone-200 font-bold"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label htmlFor="edit-min-order-amount" className="text-xs font-semibold text-stone-600 mb-1.5 block">
                  Minimum Order Value (₹)
                </label>
                <Input
                  id="edit-min-order-amount"
                  type="number"
                  min="0"
                  value={minOrderAmount}
                  onChange={(e) => setMinOrderAmount(e.target.value === "" ? "" : Number(e.target.value))}
                  className="h-10 bg-white border-stone-200"
                />
              </div>

              <div>
                <label htmlFor="edit-max-discount" className="text-xs font-semibold text-stone-600 mb-1.5 block">
                  Max Discount Cap (₹)
                </label>
                <Input
                  id="edit-max-discount"
                  type="number"
                  min="1"
                  value={maxDiscount}
                  onChange={(e) => setMaxDiscount(e.target.value === "" ? "" : Number(e.target.value))}
                  className="h-10 bg-white border-stone-200"
                />
              </div>
            </div>
          </div>

          {/* Applicable Dishes for PRODUCT_DISCOUNT */}
          {couponType === "PRODUCT_DISCOUNT" && (
            <div className="space-y-3 p-4 bg-amber-50/60 rounded-2xl border border-amber-200/80">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                    Select Applicable Dishes ({selectedProductIds.length} selected)
                  </h4>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllProducts}
                  className="text-[11px] h-7 px-2.5 rounded-lg border-amber-300 text-amber-900"
                >
                  {selectedProductIds.length === products.length ? "Deselect All" : "Select All Dishes"}
                </Button>
              </div>

              {loadingProducts ? (
                <div className="py-6 flex items-center justify-center gap-2 text-xs text-stone-500">
                  <Loader2 className="animate-spin" size={16} />
                  <span>Loading menu items...</span>
                </div>
              ) : (
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
                            className={`w-4 h-4 rounded-md border flex items-center justify-center ${isSelected ? "bg-amber-600 border-amber-600 text-white" : "border-stone-300 bg-white"
                              }`}
                          >
                            {isSelected && <CheckCircle2 size={12} />}
                          </div>
                          <span className="text-xs font-semibold truncate">{prod.name}</span>
                        </div>
                        <span className="text-xs font-mono font-bold text-stone-900 shrink-0">
                          ₹{prod.price.toFixed(2)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Dates & Limits */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="edit-start-date" className="text-xs font-semibold text-stone-600 mb-1.5 block">
                Start Date
              </label>
              <Input
                id="edit-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-10 bg-stone-50 border-stone-200 text-xs"
              />
            </div>

            <div>
              <label htmlFor="edit-end-date" className="text-xs font-semibold text-stone-600 mb-1.5 block">
                Expiry Date
              </label>
              <Input
                id="edit-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-10 bg-stone-50 border-stone-200 text-xs"
              />
            </div>

            <div>
              <label htmlFor="edit-usage-limit" className="text-xs font-semibold text-stone-600 mb-1.5 block">
                Usage Limit
              </label>
              <Input
                id="edit-usage-limit"
                type="number"
                min="1"
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value === "" ? "" : Number(e.target.value))}
                className="h-10 bg-stone-50 border-stone-200 text-xs"
              />
            </div>
          </div>

          {/* Active Switch */}
          <div className="flex items-center justify-between p-3.5 bg-stone-50 rounded-2xl border border-stone-200">
            <div>
              <p className="text-xs font-bold text-stone-800">Coupon Active Status</p>
              <p className="text-[11px] text-stone-500">Toggle whether this coupon can be redeemed by customers.</p>
            </div>
            <Switch
              checked={isActive}
              onCheckedChange={setIsActive}
              className="data-[state=checked]:bg-amber-600"
            />
          </div>

          {/* Footer Actions */}
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
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Save Changes</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
