import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleError } from "@/helpers/error-handler";
import { successResponse } from "@/lib/api-response";
import { requireRoles } from "@/lib/permissions";
import { Prisma } from "@prisma/client";
import { AppError, HTTP_STATUS } from "@/exceptions";

export async function PATCH(request: NextRequest) {
  try {
    const payload = await requireRoles(["SUPER_ADMIN", "OWNER", "MANAGER"]);

    if (!payload.restaurantId) {
      throw new AppError("Restaurant ID is required", HTTP_STATUS.BAD_REQUEST);
    }

    const body = await request.json();

    // Check if settings exist, if not create them
    const settings = await prisma.restaurantSettings.findUnique({
      where: { restaurantId: payload.restaurantId }
    });

    if (!settings) {
      await prisma.restaurantSettings.create({
        data: {
          restaurantId: payload.restaurantId
        }
      });
    }

    // Whitelist allowed fields to update on RestaurantSettings
    const allowedFields: (keyof Prisma.RestaurantSettingsUpdateInput)[] = [
      "taxPercentage",
      "serviceCharge",
      "currency",
      "gstNumber",
      "invoicePrefix",
      "openingHours",
      "isRestaurantOpen",
      "acceptOnlineOrders",
      "autoAcceptOrders",
      "allowCustomerNotes",
      "allowItemQuantity",
      "maxOrderAmount",
      "qrMenuStatus",
      "qrShowLogo",
      "qrShowImages",
      "qrShowRatings",
      "qrShowPrices"
    ];

    const dataToUpdate: Prisma.RestaurantSettingsUpdateInput = {};

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {

        dataToUpdate[field] = body[field];
      }
    });
    const updatedSettings = await prisma.restaurantSettings.update({
      where: { restaurantId: payload.restaurantId },
      data: dataToUpdate
    });

    return successResponse("System settings updated successfully", updatedSettings);
  } catch (error) {
    return handleError(error);
  }
}
