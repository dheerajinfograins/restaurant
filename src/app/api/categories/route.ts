import { NextRequest } from "next/server";
import { getAuthenticatedRestaurantId } from "@/lib/permissions";
import categoryController from "@/modules/category/controller";
import { handleError } from "@/helpers/error-handler";

export async function GET() {
  try {
    const restaurantId = await getAuthenticatedRestaurantId();
    return await categoryController.getCategories(restaurantId);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const restaurantId = await getAuthenticatedRestaurantId();
    const body = await request.json();
    return await categoryController.createCategory(restaurantId, body);
  } catch (error) {
    return handleError(error);
  }
}

