import { NextRequest } from "next/server";
import { getAuthenticatedRestaurantId, requireRoles } from "@/lib/permissions";
import { couponController } from "@/modules/coupon";
import { handleError } from "@/helpers/error-handler";
import { AppError, HTTP_STATUS } from "@/exceptions";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireRoles(["SUPER_ADMIN", "OWNER", "MANAGER", "WAITER", "CASHIER"]);
    const { id } = await params;
    return await couponController.getCouponById(id);
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const payload = await requireRoles(["SUPER_ADMIN", "OWNER", "MANAGER"]);

    // Strict Super Admin Read-Only Guard
    if (payload.role === "SUPER_ADMIN") {
      throw new AppError(
        "Super Admin has read-only audit access to coupons. Only restaurant owners can modify promotional coupons.",
        HTTP_STATUS.FORBIDDEN
      );
    }

    const { id } = await params;
    const restaurantId = payload.restaurantId || (await getAuthenticatedRestaurantId(["OWNER", "MANAGER"]));
    const body = await request.json();

    return await couponController.updateCoupon(id, restaurantId, body);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const payload = await requireRoles(["SUPER_ADMIN", "OWNER", "MANAGER"]);

    // Strict Super Admin Read-Only Guard
    if (payload.role === "SUPER_ADMIN") {
      throw new AppError(
        "Super Admin has read-only audit access to coupons. Only restaurant owners can delete promotional coupons.",
        HTTP_STATUS.FORBIDDEN
      );
    }

    const { id } = await params;
    const restaurantId = payload.restaurantId || (await getAuthenticatedRestaurantId(["OWNER", "MANAGER"]));

    return await couponController.deleteCoupon(id, restaurantId);
  } catch (error) {
    return handleError(error);
  }
}
