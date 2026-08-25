import couponRepository from "./repository";
import { CreateCouponDto, UpdateCouponDto, ValidateCouponDto, CouponValidationResult } from "./dto";
import { AppError, HTTP_STATUS } from "@/exceptions";

class CouponService {
  /**
   * List coupons
   */
  async getCoupons(
    filters:
      | {
          restaurantId?: string;
          isPublicOnly?: boolean;
          couponType?: string;
          search?: string;
        }
      | string = {}
  ) {
    return await couponRepository.findCoupons(filters);
  }

  /**
   * Get single coupon
   */
  async getCouponById(id: string) {
    const coupon = await couponRepository.findById(id);
    if (!coupon) {
      throw new AppError("Coupon not found", HTTP_STATUS.NOT_FOUND);
    }
    return coupon;
  }

  /**
   * Create coupon (Owner / Manager only)
   */
  async createCoupon(restaurantId: string, data: CreateCouponDto) {
    // Check if code already exists for this restaurant
    const existing = await couponRepository.findByCode(restaurantId, data.code);
    if (existing) {
      throw new AppError(`A coupon with code '${data.code.toUpperCase()}' already exists for this restaurant`, HTTP_STATUS.CONFLICT);
    }

    return await couponRepository.create(restaurantId, data);
  }

  /**
   * Update coupon (Owner / Manager only)
   */
  async updateCoupon(id: string, restaurantId: string, data: UpdateCouponDto) {
    const existing = await couponRepository.findById(id);
    if (!existing) {
      throw new AppError("Coupon not found", HTTP_STATUS.NOT_FOUND);
    }

    if (existing.restaurantId !== restaurantId) {
      throw new AppError("You can only edit coupons belonging to your restaurant", HTTP_STATUS.FORBIDDEN);
    }

    if (data.code && data.code.toUpperCase() !== existing.code) {
      const duplicate = await couponRepository.findByCode(restaurantId, data.code);
      if (duplicate && duplicate.id !== id) {
        throw new AppError(`A coupon with code '${data.code.toUpperCase()}' already exists`, HTTP_STATUS.CONFLICT);
      }
    }

    return await couponRepository.update(id, data);
  }

  /**
   * Delete coupon (Owner / Manager only)
   */
  async deleteCoupon(id: string, restaurantId: string) {
    const existing = await couponRepository.findById(id);
    if (!existing) {
      throw new AppError("Coupon not found", HTTP_STATUS.NOT_FOUND);
    }

    if (existing.restaurantId !== restaurantId) {
      throw new AppError("You can only delete coupons belonging to your restaurant", HTTP_STATUS.FORBIDDEN);
    }

    return await couponRepository.delete(id);
  }

  /**
   * Validate and calculate coupon discount for checkout/POS
   */
  async validateCoupon(data: ValidateCouponDto): Promise<CouponValidationResult> {
    const { code, restaurantId, subtotal, items } = data;

    const coupon = await couponRepository.findByCode(restaurantId, code);
    if (!coupon) {
      throw new AppError(`Invalid coupon code '${code}' for this restaurant`, HTTP_STATUS.NOT_FOUND);
    }

    this.assertCouponEligibility(coupon, subtotal);

    const { rawDiscount, appliedToProductIds } = this.calculateRawDiscount(coupon, subtotal, items);
    const finalDiscount = this.applyDiscountCaps(coupon, rawDiscount, subtotal);
    const discountSummaryMsg = this.buildDiscountSummary(coupon, finalDiscount);

    return {
      isValid: true,
      couponId: coupon.id,
      code: coupon.code,
      discountAmount: finalDiscount,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      couponType: coupon.couponType,
      message: `Coupon '${coupon.code}' applied successfully! ${discountSummaryMsg}`,
      appliedToProductIds,
    };
  }

  /**
   * Validate coupon active status, date range, usage limits, and minimum order threshold
   */
  private assertCouponEligibility(
    coupon: NonNullable<Awaited<ReturnType<typeof couponRepository.findByCode>>>,
    subtotal: number
  ): void {
    if (!coupon.isActive) {
      throw new AppError(`Coupon '${coupon.code}' is currently inactive`, HTTP_STATUS.BAD_REQUEST);
    }

    const now = new Date();

    if (coupon.startDate && new Date(coupon.startDate) > now) {
      throw new AppError(`Coupon '${coupon.code}' is not active yet`, HTTP_STATUS.BAD_REQUEST);
    }

    if (coupon.endDate && new Date(coupon.endDate) < now) {
      throw new AppError(`Coupon '${coupon.code}' has expired`, HTTP_STATUS.BAD_REQUEST);
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      throw new AppError(`Coupon '${coupon.code}' redemption limit has been reached`, HTTP_STATUS.BAD_REQUEST);
    }

    const minOrder = coupon.minOrderAmount || 0;
    if (minOrder > 0 && subtotal < minOrder) {
      const shortfall = (minOrder - subtotal).toFixed(2);
      throw new AppError(
        `Minimum order value of ₹${minOrder.toFixed(2)} required for coupon '${coupon.code}'. Add ₹${shortfall} more to apply!`,
        HTTP_STATUS.BAD_REQUEST
      );
    }
  }

  /**
   * Compute initial discount and applicable products based on coupon type
   */
  private calculateRawDiscount(
    coupon: NonNullable<Awaited<ReturnType<typeof couponRepository.findByCode>>>,
    subtotal: number,
    items: ValidateCouponDto["items"]
  ): { rawDiscount: number; appliedToProductIds: string[] } {
    if (coupon.couponType === "PRODUCT_DISCOUNT") {
      return this.calculateProductDiscount(coupon, items);
    }

    const rawDiscount =
      coupon.discountType === "PERCENTAGE"
        ? (subtotal * coupon.discountValue) / 100
        : coupon.discountValue;

    return { rawDiscount, appliedToProductIds: [] };
  }

  /**
   * Compute product-specific discount for matching cart items
   */
  private calculateProductDiscount(
    coupon: NonNullable<Awaited<ReturnType<typeof couponRepository.findByCode>>>,
    items: ValidateCouponDto["items"]
  ): { rawDiscount: number; appliedToProductIds: string[] } {
    const targetProductIds = new Set(coupon.productIds || []);
    const isApplyAllProducts = targetProductIds.size === 0;

    const matchingItems = isApplyAllProducts
      ? items
      : items.filter((item) => targetProductIds.has(item.id));

    if (matchingItems.length === 0) {
      throw new AppError(
        `Coupon '${coupon.code}' is only applicable to specific menu items. None found in your cart.`,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    const matchingItemsTotal = matchingItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const baseDiscount =
      coupon.discountType === "PERCENTAGE"
        ? (matchingItemsTotal * coupon.discountValue) / 100
        : coupon.discountValue;

    return {
      rawDiscount: Math.min(baseDiscount, matchingItemsTotal),
      appliedToProductIds: matchingItems.map((i) => i.id),
    };
  }

  /**
   * Enforce maximum discount caps and order subtotal limits
   */
  private applyDiscountCaps(
    coupon: NonNullable<Awaited<ReturnType<typeof couponRepository.findByCode>>>,
    rawDiscount: number,
    subtotal: number
  ): number {
    let cappedDiscount = rawDiscount;

    if (coupon.maxDiscount && coupon.maxDiscount > 0 && cappedDiscount > coupon.maxDiscount) {
      cappedDiscount = coupon.maxDiscount;
    }

    if (cappedDiscount > subtotal) {
      cappedDiscount = subtotal;
    }

    return Math.round(cappedDiscount * 100) / 100;
  }

  /**
   * Build user-friendly discount summary text
   */
  private buildDiscountSummary(
    coupon: NonNullable<Awaited<ReturnType<typeof couponRepository.findByCode>>>,
    discountAmount: number
  ): string {
    if (coupon.discountType === "PERCENTAGE") {
      return `${coupon.discountValue}% OFF (Saved ₹${discountAmount.toFixed(2)})`;
    }
    return `Flat ₹${discountAmount.toFixed(2)} OFF`;
  }
}

export const couponService = new CouponService();
export default couponService;
