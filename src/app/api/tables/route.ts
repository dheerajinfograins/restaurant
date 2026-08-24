import { NextRequest } from "next/server";
import { getAuthenticatedRestaurantId, getOptionalPayload } from "@/lib/permissions";
import tableController from "@/modules/table/controller";
import { handleError } from "@/helpers/error-handler";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedRestId = searchParams.get("restaurantId");
    const payload = await getOptionalPayload();
    const isSuperAdmin = payload?.role === "SUPER_ADMIN";

    let restaurantId = "";
    if (isSuperAdmin && requestedRestId && requestedRestId !== "all") {
      restaurantId = requestedRestId;
    } else {
      restaurantId = await getAuthenticatedRestaurantId();
    }

    return await tableController.getTables(restaurantId);
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

    return await tableController.createTable(body, restaurantId);
  } catch (error) {
    return handleError(error);
  }
}

