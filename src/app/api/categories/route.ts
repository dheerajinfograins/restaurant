import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/jwt";
import categoryController from "@/modules/category/controller";
import { handleError } from "@/helpers/error-handler";
import { AppError, HTTP_STATUS } from "@/exceptions";

async function getRestaurantId() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
  
  const payload = verifyAccessToken(token);
  
  // For super admin without a restaurant, we might need a fallback or throw error.
  // We'll use a dummy ID or throw an error.
  if (!payload.restaurantId && payload.role !== "SUPER_ADMIN") {
    throw new AppError("No restaurant associated with this user", HTTP_STATUS.FORBIDDEN);
  }
  
  // Return the restaurant ID or a fallback for Super Admin for testing purposes
  return payload.restaurantId || "super-admin-restaurant";
}

export async function GET() {
  try {
    const restaurantId = await getRestaurantId();
    return await categoryController.getCategories(restaurantId);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const restaurantId = await getRestaurantId();
    const body = await request.json();
    return await categoryController.createCategory(restaurantId, body);
  } catch (error) {
    return handleError(error);
  }
}
