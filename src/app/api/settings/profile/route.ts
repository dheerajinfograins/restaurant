import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleError } from "@/helpers/error-handler";
import { successResponse } from "@/lib/api-response";
import { requireRoles } from "@/lib/permissions";
import { AppError, HTTP_STATUS } from "@/exceptions";
import { deleteImageFromCloudinary, uploadImageToCloudinary } from "@/lib/cloudinary";

export async function PATCH(request: NextRequest) {
  try {
    const payload = await requireRoles(["SUPER_ADMIN", "OWNER", "MANAGER"]);
    
    if (!payload.restaurantId) {
      throw new AppError("Restaurant ID is required", HTTP_STATUS.BAD_REQUEST);
    }

    const currentRestaurant = await prisma.restaurant.findUnique({
      where: { id: payload.restaurantId }
    });

    if (!currentRestaurant) {
      throw new AppError("Restaurant not found", HTTP_STATUS.NOT_FOUND);
    }

    const body = await request.json();
    
    // Whitelist allowed fields to update on Restaurant
    const { name, phone, email, address, city, state, pincode, website, logo } = body;

    let finalLogo = logo;
    if (finalLogo?.startsWith("data:image")) {
      try {
        const uploadRes = await uploadImageToCloudinary(finalLogo, "restaurant/logos");
        finalLogo = uploadRes.url;
      } catch (err) {
        console.error("Failed to upload restaurant logo to Cloudinary:", err);
      }
    }

    if (logo !== undefined && currentRestaurant.logo && currentRestaurant.logo !== finalLogo && currentRestaurant.logo.includes("res.cloudinary.com")) {
      void deleteImageFromCloudinary(currentRestaurant.logo);
    }

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
        logo: finalLogo !== undefined ? finalLogo : currentRestaurant.logo,
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
