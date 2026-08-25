import { NextRequest } from "next/server";
import { getAuthenticatedRestaurantId, requireRoles } from "@/lib/permissions";
import { couponController } from "@/modules/coupon";
import { handleError } from "@/helpers/error-handler";
import { AppError, HTTP_STATUS } from "@/exceptions";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const requestedRestId = searchParams.get("restaurantId");
    const isPublicParam = searchParams.get("public") === "true";
    const couponType = searchParams.get("couponType") || undefined;
    const search = searchParams.get("search") || undefined;

    // 1. If public customer menu request
    if (isPublicParam && requestedRestId) {
      return await couponController.getCoupons({
        restaurantId: requestedRestId,
        isPublicOnly: true,
        couponType,
        search,
      });
    }

    // 2. Authenticated Dashboard request
    const payload = await requireRoles(["SUPER_ADMIN", "OWNER", "MANAGER", "WAITER", "CASHIER"]);

    let restaurantId: string | undefined = undefined;

    if (payload.role === "SUPER_ADMIN") {
      // Super Admin can view all coupons or filter by specific restaurant
      restaurantId = requestedRestId && requestedRestId !== "all" ? requestedRestId : undefined;
    } else {
      restaurantId = payload.restaurantId || (await getAuthenticatedRestaurantId());
    }

    return await couponController.getCoupons({
      restaurantId,
      isPublicOnly: false,
      couponType,
      search,
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await requireRoles(["SUPER_ADMIN", "OWNER", "MANAGER"]);

    // Strict Super Admin Read-Only Guard:
    if (payload.role === "SUPER_ADMIN") {
      throw new AppError(
        "Super Admin has read-only audit access to coupons. Only restaurant owners can configure promotional coupons.",
        HTTP_STATUS.FORBIDDEN
      );
    }

    const restaurantId = payload.restaurantId || (await getAuthenticatedRestaurantId(["OWNER", "MANAGER"]));
    const body = await request.json();

    return await couponController.createCoupon(restaurantId, body);
  } catch (error) {
    return handleError(error);
  }
}
