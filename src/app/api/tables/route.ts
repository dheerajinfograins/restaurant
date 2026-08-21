import { NextRequest } from "next/server";
import { getAuthenticatedRestaurantId } from "@/lib/permissions";
import tableController from "@/modules/table/controller";
import { handleError } from "@/helpers/error-handler";

export async function GET() {
  try {
    const restaurantId = await getAuthenticatedRestaurantId();
    return await tableController.getTables(restaurantId);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const restaurantId = await getAuthenticatedRestaurantId();
    const body = await request.json();
    return await tableController.createTable(body, restaurantId);
  } catch (error) {
    return handleError(error);
  }
}

