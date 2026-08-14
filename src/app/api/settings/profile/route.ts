import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleError } from "@/helpers/error-handler";
import { successResponse } from "@/lib/api-response";
import { requireRoles } from "@/lib/permissions";

export async function PATCH(request: NextRequest) {
  try {
    const payload = await requireRoles(["SUPER_ADMIN", "OWNER", "MANAGER"]);
    const body = await request.json();
    
    // Whitelist allowed fields to update on Restaurant
    const { name, phone, email, address, city, state, pincode, website, logo } = body;

    const updatedRestaurant = await prisma.restaurant.update({
      where: { id: payload.restaurantId },
      data: {
        name,
        phone,
        email,
        address,
        city,
        state,
        pincode,
        website,
        logo
      }
    });

    return successResponse("Restaurant profile updated successfully", {
      id: updatedRestaurant.id,
      name: updatedRestaurant.name,
      email: updatedRestaurant.email,
      phone: updatedRestaurant.phone,
      address: updatedRestaurant.address,
      city: updatedRestaurant.city,
      state: updatedRestaurant.state,
      pincode: updatedRestaurant.pincode,
      website: updatedRestaurant.website,
      logo: updatedRestaurant.logo,
    });
  } catch (error) {
    return handleError(error);
  }
}
