import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleError } from "@/helpers/error-handler";
import { successResponse } from "@/lib/api-response";
import { requireRoles } from "@/lib/permissions";

export async function PATCH(request: NextRequest) {
  try {
    const payload = await requireRoles(["SUPER_ADMIN", "OWNER", "MANAGER"]);
    const body = await request.json();
    
    // Whitelist
    const { 
      qrMenuStatus,
      qrShowImages,
      qrShowPrices,
      showVegNonVeg,
      showFeaturedItems,
      allowOrdering
    } = body;

    const dataToUpdate: {
      qrMenuStatus?: boolean;
      qrShowImages?: boolean;
      qrShowPrices?: boolean;
      showVegNonVeg?: boolean;
      showFeaturedItems?: boolean;
      allowOrdering?: boolean;
    } = {};
    if (qrMenuStatus !== undefined) dataToUpdate.qrMenuStatus = qrMenuStatus;
    if (qrShowImages !== undefined) dataToUpdate.qrShowImages = qrShowImages;
    if (qrShowPrices !== undefined) dataToUpdate.qrShowPrices = qrShowPrices;
    if (showVegNonVeg !== undefined) dataToUpdate.showVegNonVeg = showVegNonVeg;
    if (showFeaturedItems !== undefined) dataToUpdate.showFeaturedItems = showFeaturedItems;
    if (allowOrdering !== undefined) dataToUpdate.allowOrdering = allowOrdering;

    const updatedSettings = await prisma.restaurantSettings.update({
      where: { restaurantId: payload.restaurantId },
      data: dataToUpdate
    });

    return successResponse("Menu settings updated", updatedSettings);
  } catch (error) {
    return handleError(error);
  }
}
