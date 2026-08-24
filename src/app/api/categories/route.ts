import { NextRequest } from "next/server";
import { getAuthenticatedRestaurantId, getOptionalPayload } from "@/lib/permissions";
import categoryController from "@/modules/category/controller";
import { handleError } from "@/helpers/error-handler";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedRestId = searchParams.get("restaurantId");

    let restaurantId = "";
    if (requestedRestId && requestedRestId !== "all") {
      restaurantId = requestedRestId;
    } else {
      restaurantId = await getAuthenticatedRestaurantId();
    }
    return await categoryController.getCategories(restaurantId);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = await getOptionalPayload();
    const isSuperAdmin = payload?.role === "SUPER_ADMIN";

    let restaurantId = "";
    if (isSuperAdmin && body.restaurantId) {
      restaurantId = body.restaurantId;
    } else {
      restaurantId = await getAuthenticatedRestaurantId();
    }

    return await categoryController.createCategory(restaurantId, body);
  } catch (error) {
    return handleError(error);
  }
}

