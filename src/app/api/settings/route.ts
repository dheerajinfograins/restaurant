
import { prisma } from "@/lib/prisma";
import { handleError } from "@/helpers/error-handler";
import { successResponse } from "@/lib/api-response";
import { getAuthenticatedRestaurantId, getOptionalPayload } from "@/lib/permissions";
import { AppError, HTTP_STATUS } from "@/exceptions";

export async function GET() {
  try {
    const payload = await getOptionalPayload();
    const isSuperAdmin = payload?.role === "SUPER_ADMIN";
    const restaurantId = await getAuthenticatedRestaurantId(["SUPER_ADMIN", "OWNER", "MANAGER"]);

    // Fetch Restaurant Profile
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        settings: true
      }
    });

    if (!restaurant) {
      throw new AppError("Restaurant not found", HTTP_STATUS.NOT_FOUND);
    }

    // If settings don't exist yet, create default settings
    let settings = restaurant.settings;
    settings ??= await prisma.restaurantSettings.create({
      data: {
        restaurantId: restaurant.id,
        openingHours: {
          monday: "10:00 AM - 11:00 PM",
          tuesday: "10:00 AM - 11:00 PM",
          wednesday: "10:00 AM - 11:00 PM",
          thursday: "10:00 AM - 11:00 PM",
          friday: "10:00 AM - 11:30 PM",
          saturday: "10:00 AM - 11:30 PM",
          sunday: "11:00 AM - 10:00 PM",
        }
      }
    });

    return successResponse("Settings fetched successfully", {
      isSuperAdmin,
      userRole: payload?.role,
      profile: {
        id: restaurant.id,
        name: restaurant.name,
        email: restaurant.email,
        phone: restaurant.phone,
        address: restaurant.address,
        city: restaurant.city,
        state: restaurant.state,
        pincode: restaurant.pincode,
        website: restaurant.website,
        logo: restaurant.logo,
      },
      system: settings
    });
  } catch (error) {
    return handleError(error);
  }
}
