import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleError } from "@/helpers/error-handler";
import { successResponse } from "@/lib/api-response";
import { requireRoles } from "@/lib/permissions";

export async function PATCH(request: NextRequest) {
  try {
    const payload = await requireRoles(["SUPER_ADMIN", "OWNER", "MANAGER"]);
    const body = await request.json();
    const { categories } = body; // Array of { id, sortOrder }

    if (!categories || !Array.isArray(categories)) {
      throw new Error("Invalid payload: expected categories array");
    }

    // Execute all updates in a transaction
    const updatePromises = categories.map(cat => 
      prisma.category.update({
        where: { id: cat.id, restaurantId: payload.restaurantId },
        data: { sortOrder: cat.sortOrder }
      })
    );

    await prisma.$transaction(updatePromises);

    return successResponse("Category order updated successfully");
  } catch (error) {
    return handleError(error);
  }
}
