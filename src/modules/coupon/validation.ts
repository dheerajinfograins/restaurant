import * as z from "zod";

export const baseCouponSchema = z.object({
  code: z
    .string()
    .min(2, { message: "Coupon code must be at least 2 characters" })
    .max(20, { message: "Coupon code must not exceed 20 characters" })
    .transform((val) => val.trim().toUpperCase()),
  description: z.string().max(255).optional().nullable(),
  couponType: z.enum(["PRODUCT_DISCOUNT", "ORDER_DISCOUNT", "TIERED_MIN_ORDER"]),
  discountType: z.enum(["PERCENTAGE", "FLAT"]),
  discountValue: z
    .number()
    .positive({ message: "Discount value must be greater than 0" }),
  minOrderAmount: z.number().nonnegative().optional().default(0),
  maxDiscount: z.number().positive().optional().nullable(),
  productIds: z.array(z.string()).optional().default([]),
  startDate: z.string().or(z.date()).optional().nullable(),
  endDate: z.string().or(z.date()).optional().nullable(),
  usageLimit: z.number().int().positive().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export const createCouponSchema = baseCouponSchema.refine(
  (data) => {
    if (data.discountType === "PERCENTAGE" && data.discountValue > 100) {
      return false;
    }
    return true;
  },
  {
    message: "Percentage discount cannot exceed 100%",
    path: ["discountValue"],
  }
);

export const updateCouponSchema = baseCouponSchema.partial();

export const validateCouponSchema = z.object({
  code: z.string().min(1, { message: "Coupon code is required" }).transform((v) => v.trim().toUpperCase()),
  restaurantId: z.string().min(1, { message: "Restaurant ID is required" }),
  subtotal: z.number().nonnegative({ message: "Subtotal must be a positive number" }),
  items: z
    .array(
      z.object({
        id: z.string(),
        quantity: z.number().int().positive(),
        price: z.number().nonnegative(),
      })
    )
    .optional()
    .default([]),
});
