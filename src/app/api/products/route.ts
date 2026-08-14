import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/jwt";
import { productController } from "@/modules/product";
import { handleError } from "@/helpers/error-handler";
import { AppError, HTTP_STATUS } from "@/exceptions";
import { ProductFilters } from "@/modules/product/repository";

async function getRestaurantId() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
  
  const payload = verifyAccessToken(token);
  
  if (!payload.restaurantId && payload.role !== "SUPER_ADMIN") {
    throw new AppError("No restaurant associated with this user", HTTP_STATUS.FORBIDDEN);
  }
  
  return payload.restaurantId || "super-admin-restaurant";
}

export async function GET(request: NextRequest) {
  try {
    const restaurantId = await getRestaurantId();
    
    // Extract filters from URL search params
    const searchParams = request.nextUrl.searchParams;
    const categoryId = searchParams.get("categoryId");
    const foodType = searchParams.get("foodType") as "VEG" | "NON_VEG" | "EGG" | null;
    const isAvailableRaw = searchParams.get("isAvailable");
    const isFeaturedRaw = searchParams.get("isFeatured");
    
    const filters: ProductFilters = {};
    if (categoryId) filters.categoryId = categoryId;
    if (foodType) filters.foodType = foodType;
    if (isAvailableRaw === "true") filters.isAvailable = true;
    if (isAvailableRaw === "false") filters.isAvailable = false;
    if (isFeaturedRaw === "true") filters.isFeatured = true;
    if (isFeaturedRaw === "false") filters.isFeatured = false;

    return await productController.getProducts(restaurantId, filters);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const restaurantId = await getRestaurantId();
    const body = await request.json();
    return await productController.createProduct(restaurantId, body);
  } catch (error) {
    return handleError(error);
  }
}
