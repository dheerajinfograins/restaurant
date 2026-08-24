import { NextRequest } from "next/server";
import { getAuthenticatedRestaurantId, requireRoles } from "@/lib/permissions";
import { productController } from "@/modules/product";
import { handleError } from "@/helpers/error-handler";
import { ProductFilters } from "@/modules/product/repository";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const payload = await requireRoles(["SUPER_ADMIN", "OWNER", "MANAGER", "WAITER", "CASHIER", "KITCHEN"]).catch(() => null);
    
    // Extract filters from URL search params
    const searchParams = request.nextUrl.searchParams;
    const requestedRestId = searchParams.get("restaurantId");
    const categoryId = searchParams.get("categoryId");
    const foodType = searchParams.get("foodType") as "VEG" | "NON_VEG" | "EGG" | null;
    const isAvailableRaw = searchParams.get("isAvailable");
    const isFeaturedRaw = searchParams.get("isFeatured");
    
    let restaurantId = "";
    if (payload?.role === "SUPER_ADMIN") {
      if (requestedRestId && requestedRestId !== "all") {
        restaurantId = requestedRestId;
      } else {
        const firstRest = await prisma.restaurant.findFirst({ select: { id: true }, orderBy: { createdAt: "desc" } });
        restaurantId = firstRest?.id || "";
      }
    } else {
      restaurantId = payload?.restaurantId || (await getAuthenticatedRestaurantId());
    }

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
