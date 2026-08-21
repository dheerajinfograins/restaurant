import { NextRequest } from "next/server";
import { getAuthenticatedRestaurantId } from "@/lib/permissions";
import { productController } from "@/modules/product";
import { handleError } from "@/helpers/error-handler";
import { ProductFilters } from "@/modules/product/repository";

export async function GET(request: NextRequest) {
  try {
    const restaurantId = await getAuthenticatedRestaurantId();
    
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
    const restaurantId = await getAuthenticatedRestaurantId();
    const body = await request.json();
    return await productController.createProduct(restaurantId, body);
  } catch (error) {
    return handleError(error);
  }
}
