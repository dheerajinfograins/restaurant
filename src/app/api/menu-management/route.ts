
import { prisma } from "@/lib/prisma";
import { handleError } from "@/helpers/error-handler";
import { successResponse } from "@/lib/api-response";
import { requireRoles } from "@/lib/permissions";
import { AppError, HTTP_STATUS } from "@/exceptions";

export async function GET() {
  try {
    const payload = await requireRoles(["SUPER_ADMIN", "OWNER", "MANAGER"]);

    if (!payload.restaurantId) {
      throw new AppError("No restaurant associated with this user", HTTP_STATUS.BAD_REQUEST);
    }

    // Fetch Categories with products count
    const categories = await prisma.category.findMany({
      where: { restaurantId: payload.restaurantId },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { products: true } }
      }
    });

    // Fetch all products to list availability and featured status
    const products = await prisma.product.findMany({
      where: { restaurantId: payload.restaurantId },
      include: { category: { select: { name: true } } },
      orderBy: { name: 'asc' }
    });

    // Fetch menu settings
    let settings = await prisma.restaurantSettings.findUnique({
      where: { restaurantId: payload.restaurantId }
    });

    settings ??= await prisma.restaurantSettings.create({
      data: { restaurantId: payload.restaurantId }
    });

    const firstTable = await prisma.restaurantTable.findFirst({
      where: { restaurantId: payload.restaurantId },
      select: { id: true }
    });

    return successResponse("Menu data fetched", {
      categories,
      products,
      settings: {
        qrMenuStatus: settings.qrMenuStatus,
        qrShowImages: settings.qrShowImages,
        qrShowPrices: settings.qrShowPrices,
        showVegNonVeg: settings.showVegNonVeg,
        showFeaturedItems: settings.showFeaturedItems,
        allowOrdering: settings.allowOrdering,
      },
      previewTableId: firstTable?.id || null
    });
  } catch (error) {
    return handleError(error);
  }
}
