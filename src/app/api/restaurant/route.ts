import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleError } from "@/helpers/error-handler";
import { successResponse } from "@/lib/api-response";
import { getAuthenticatedRestaurantId } from "@/lib/permissions";
import { AppError, HTTP_STATUS } from "@/exceptions";
import { DietaryCategory, Prisma } from "@prisma/client";
import { deleteImageFromCloudinary, uploadImageToCloudinary } from "@/lib/cloudinary";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedRestId = searchParams.get("restaurantId");

    let restaurantId = "";
    if (requestedRestId && requestedRestId !== "all") {
      restaurantId = requestedRestId;
    } else {
      restaurantId = await getAuthenticatedRestaurantId(["SUPER_ADMIN", "OWNER", "MANAGER"]);
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId }
    });

    if (!restaurant) {
      throw new AppError("Restaurant not found", HTTP_STATUS.NOT_FOUND);
    }

    return successResponse("Restaurant profile fetched successfully", restaurant);
  } catch (error) {
    return handleError(error);
  }
}

const TEXT_FIELDS = [
  "name",
  "phone",
  "email",
  "address",
  "city",
  "state",
  "country",
  "pincode",
  "fssaiLicense",
  "website",
  "description",
] as const;

function extractUpdateFields(body: Record<string, unknown>): Prisma.RestaurantUpdateInput {
  const data: Prisma.RestaurantUpdateInput = {};
  for (const field of TEXT_FIELDS) {
    if (body[field] !== undefined) {
      data[field] = body[field] as string;
    }
  }
  if (body.isActive !== undefined) {
    data.isActive = body.isActive as boolean;
  }
  if (body.dietaryCategory !== undefined) {
    const valid: readonly DietaryCategory[] = ["PURE_VEG", "PURE_NON_VEG", "BOTH"];
    if (valid.includes(body.dietaryCategory as DietaryCategory)) {
      data.dietaryCategory = body.dietaryCategory as DietaryCategory;
    }
  }
  return data;
}

async function processImage(
  newImage: string | null | undefined,
  currentImage: string | null | undefined,
  folder: string
): Promise<string | null | undefined> {
  if (newImage === undefined) {
    return undefined;
  }

  let finalUrl = newImage;
  if (finalUrl?.startsWith("data:image")) {
    try {
      const uploadRes = await uploadImageToCloudinary(finalUrl, folder);
      finalUrl = uploadRes.url;
    } catch (err) {
      console.error(`Failed to upload image to ${folder}:`, err);
    }
  }

  if (currentImage !== finalUrl && currentImage?.includes("res.cloudinary.com")) {
    void deleteImageFromCloudinary(currentImage);
  }

  return finalUrl;
}

export async function PATCH(request: NextRequest) {
  try {
    const restaurantId = await getAuthenticatedRestaurantId(["SUPER_ADMIN", "OWNER", "MANAGER"]);

    const currentRestaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId }
    });

    if (!currentRestaurant) {
      throw new AppError("Restaurant not found", HTTP_STATUS.NOT_FOUND);
    }

    const body = await request.json();
    const dataToUpdate = extractUpdateFields(body);

    const logo = await processImage(body.logo, currentRestaurant.logo, "restaurant/logos");
    if (logo !== undefined) {
      dataToUpdate.logo = logo;
    }

    const coverImage = await processImage(body.coverImage, currentRestaurant.coverImage, "restaurant/covers");
    if (coverImage !== undefined) {
      dataToUpdate.coverImage = coverImage;
    }

    const updatedRestaurant = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: dataToUpdate
    });

    return successResponse("Restaurant profile updated successfully", updatedRestaurant);
  } catch (error) {
    return handleError(error);
  }
}
