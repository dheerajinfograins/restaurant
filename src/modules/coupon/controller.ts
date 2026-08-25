import couponService from "./service";
import { createCouponSchema, updateCouponSchema, validateCouponSchema } from "./validation";
import { successResponse } from "@/lib/api-response";
import { HTTP_STATUS } from "@/exceptions";

class CouponController {
  async getCoupons(filters: {
    restaurantId?: string;
    isPublicOnly?: boolean;
    couponType?: string;
    search?: string;
  }) {
    const coupons = await couponService.getCoupons(filters);
    return successResponse("Coupons fetched successfully", coupons);
  }

  async getCouponById(id: string) {
    const coupon = await couponService.getCouponById(id);
    return successResponse("Coupon details fetched successfully", coupon);
  }

  async createCoupon(restaurantId: string, body: unknown) {
    const validatedData = createCouponSchema.parse(body);
    const coupon = await couponService.createCoupon(restaurantId, validatedData);
    return successResponse("Coupon created successfully", coupon, HTTP_STATUS.CREATED);
  }

  async updateCoupon(id: string, restaurantId: string, body: unknown) {
    const validatedData = updateCouponSchema.parse(body);
    const coupon = await couponService.updateCoupon(id, restaurantId, validatedData);
    return successResponse("Coupon updated successfully", coupon);
  }

  async deleteCoupon(id: string, restaurantId: string) {
    const result = await couponService.deleteCoupon(id, restaurantId);
    return successResponse("Coupon deleted successfully", result);
  }

  async validateCoupon(body: unknown) {
    const validatedData = validateCouponSchema.parse(body);
    const result = await couponService.validateCoupon(validatedData);
    return successResponse(result.message, result);
  }
}

export const couponController = new CouponController();
export default couponController;
