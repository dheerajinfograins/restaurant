import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleError } from "@/helpers/error-handler";
import { successResponse } from "@/lib/api-response";
import { requireRoles } from "@/lib/permissions";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const payload = await requireRoles(["SUPER_ADMIN", "OWNER", "MANAGER"]);
    
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: payload.restaurantId }
    });

    if (!restaurant) {
      throw new Error("Restaurant not found");
    }

    return successResponse("Restaurant profile fetched successfully", restaurant);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const payload = await requireRoles(["SUPER_ADMIN", "OWNER", "MANAGER"]);
    const body = await request.json();
    
    const { 
      name, 
      phone, 
      email, 
      address, 
      city, 
      state, 
      country,
      pincode, 
      website, 
      description,
      logo,
      coverImage,
      isActive
    } = body;

    const dataToUpdate: Prisma.RestaurantUpdateInput = {};
    if (name !== undefined) dataToUpdate.name = name;
    if (phone !== undefined) dataToUpdate.phone = phone;
    if (email !== undefined) dataToUpdate.email = email;
    if (address !== undefined) dataToUpdate.address = address;
    if (city !== undefined) dataToUpdate.city = city;
    if (state !== undefined) dataToUpdate.state = state;
    if (country !== undefined) dataToUpdate.country = country;
    if (pincode !== undefined) dataToUpdate.pincode = pincode;
    if (website !== undefined) dataToUpdate.website = website;
    if (description !== undefined) dataToUpdate.description = description;
    if (logo !== undefined) dataToUpdate.logo = logo;
    if (coverImage !== undefined) dataToUpdate.coverImage = coverImage;
    if (isActive !== undefined) dataToUpdate.isActive = isActive;

    const updatedRestaurant = await prisma.restaurant.update({
      where: { id: payload.restaurantId },
      data: dataToUpdate
    });

    return successResponse("Restaurant profile updated successfully", updatedRestaurant);
  } catch (error) {
    return handleError(error);
  }
}
