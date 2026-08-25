import { prisma } from "@/lib/prisma";
import { CreateCouponDto, UpdateCouponDto, DateInput } from "./dto";
import { Prisma } from "@prisma/client";

function parseOptionalDate(value?: DateInput): Date | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  return value ? new Date(value) : null;
}

class CouponRepository {
  /**
   * Find all coupons with optional restaurant filter and public active filter
   */
  async findCoupons(
    filters: {
      restaurantId?: string;
      isPublicOnly?: boolean;
      couponType?: string;
      search?: string;
    } | string = {}
  ) {
    const filterObj = typeof filters === "string" ? { restaurantId: filters } : (filters || {});
    const where: Prisma.CouponWhereInput = {};

    if (filterObj.restaurantId) {
      where.restaurantId = filterObj.restaurantId;
    }

    if (filterObj.isPublicOnly) {
      where.isActive = true;
      where.OR = [
        { endDate: null },
        { endDate: { gte: new Date() } },
      ];
    }

    if (filterObj.couponType) {
      // @ts-expect-error - enum match
      where.couponType = filterObj.couponType;
    }

    if (typeof filterObj.search === "string" && filterObj.search.trim()) {
      const q = filterObj.search.trim();
      where.OR = [
        { code: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }

    return await prisma.coupon.findMany({
      where,
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            logo: true,
            dietaryCategory: true,
          },
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find single coupon by ID
   */
  async findById(id: string) {
    return await prisma.coupon.findUnique({
      where: { id },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Find coupon by Restaurant ID & Code (Exact Match)
   */
  async findByCode(restaurantId: string, code: string) {
    return await prisma.coupon.findUnique({
      where: {
        restaurantId_code: {
          restaurantId,
          code: code.trim().toUpperCase(),
        },
      },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Create a new coupon
   */
  async create(restaurantId: string, data: CreateCouponDto) {
    return await prisma.coupon.create({
      data: {
        code: data.code.trim().toUpperCase(),
        description: data.description || null,
        couponType: data.couponType,
        discountType: data.discountType,
        discountValue: data.discountValue,
        minOrderAmount: data.minOrderAmount ?? 0,
        maxDiscount: data.maxDiscount || null,
        productIds: data.productIds || [],
        startDate: data.startDate ? new Date(data.startDate) : new Date(),
        endDate: data.endDate ? new Date(data.endDate) : null,
        usageLimit: data.usageLimit || null,
        isActive: data.isActive ?? true,
        restaurantId,
      },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Update existing coupon
   */
  async update(id: string, data: UpdateCouponDto) {
    const updateData: Prisma.CouponUpdateInput = {
      code: data.code?.trim().toUpperCase(),
      description: data.description,
      couponType: data.couponType,
      discountType: data.discountType,
      discountValue: data.discountValue,
      minOrderAmount: data.minOrderAmount,
      maxDiscount: data.maxDiscount,
      productIds: data.productIds,
      startDate: parseOptionalDate(data.startDate),
      endDate: parseOptionalDate(data.endDate),
      usageLimit: data.usageLimit,
      isActive: data.isActive,
    };

    return await prisma.coupon.update({
      where: { id },
      data: updateData,
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Delete coupon
   */
  async delete(id: string) {
    return await prisma.coupon.delete({
      where: { id },
    });
  }

  /**
   * Increment usage counter
   */
  async incrementUsedCount(id: string) {
    return await prisma.coupon.update({
      where: { id },
      data: {
        usedCount: { increment: 1 },
      },
    });
  }
}

export const couponRepository = new CouponRepository();
export default couponRepository;
