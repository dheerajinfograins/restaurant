import { CouponType, DiscountType } from "@prisma/client";

export type DateInput = string | Date | null;

export interface CreateCouponDto {
  code: string;
  description?: string | null;
  couponType: CouponType;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount?: number;
  maxDiscount?: number | null;
  productIds?: string[];
  startDate?: DateInput;
  endDate?: DateInput;
  usageLimit?: number | null;
  isActive?: boolean;
}

export interface UpdateCouponDto {
  code?: string;
  description?: string | null;
  couponType?: CouponType;
  discountType?: DiscountType;
  discountValue?: number;
  minOrderAmount?: number;
  maxDiscount?: number | null;
  productIds?: string[];
  startDate?: DateInput;
  endDate?: DateInput;
  usageLimit?: number | null;
  isActive?: boolean;
}

export interface ValidateCouponItemDto {
  id: string; // product id
  quantity: number;
  price: number;
}

export interface ValidateCouponDto {
  code: string;
  restaurantId: string;
  subtotal: number;
  items: ValidateCouponItemDto[];
}

export interface CouponValidationResult {
  isValid: boolean;
  couponId?: string;
  code: string;
  discountAmount: number;
  discountType: DiscountType;
  discountValue: number;
  couponType: CouponType;
  message: string;
  appliedToProductIds?: string[];
}
