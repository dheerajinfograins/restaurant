import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { handleError } from "@/helpers/error-handler";
import { successResponse } from "@/lib/api-response";
import { requireRoles } from "@/lib/permissions";

export async function PATCH(request: NextRequest) {
  try {
    const payload = await requireRoles(["SUPER_ADMIN", "OWNER", "MANAGER"]);
    const body = await request.json();
    const { id, isAvailable, isFeatured, preparationTime, ingredients, recipeInstructions } = body;

    if (!id) {
      throw new Error("Product ID is required");
    }

    const dataToUpdate: Prisma.ProductUpdateInput = {};
    if (isAvailable !== undefined) dataToUpdate.isAvailable = isAvailable;
    if (isFeatured !== undefined) dataToUpdate.isFeatured = isFeatured;
    if (preparationTime !== undefined) dataToUpdate.preparationTime = preparationTime;
    if (ingredients !== undefined) dataToUpdate.ingredients = ingredients;
    if (recipeInstructions !== undefined) dataToUpdate.recipeInstructions = recipeInstructions;

    const updatedProduct = await prisma.product.update({
      where: { id, restaurantId: payload.restaurantId ?? undefined },
      data: dataToUpdate
    });

    return successResponse("Product updated successfully", updatedProduct);
  } catch (error) {
    return handleError(error);
  }
}
