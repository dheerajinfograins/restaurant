import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleError } from "@/helpers/error-handler";
import { successResponse } from "@/lib/api-response";
import { requireRoles } from "@/lib/permissions";
import { AppError, HTTP_STATUS } from "@/exceptions";
import { hashPassword } from "@/lib/bcrypt";
import { DietaryCategory, UserRole } from "@prisma/client";
import { emitAppSocketEvent } from "@/lib/socket-server";

// GET /api/super-admin/restaurants - Fetch all restaurants with stats & owner info
export async function GET() {
  try {
    await requireRoles(["SUPER_ADMIN"]);

    const restaurants = await prisma.restaurant.findMany({
      include: {
        users: {
          where: { role: "OWNER" },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            isActive: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            tables: true,
            categories: true,
            users: true,
            orders: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const restaurantsWithProducts = await Promise.all(
      restaurants.map(async (r) => {
        const productCount = await prisma.product.count({
          where: { restaurantId: r.id },
        });
        return {
          ...r,
          _count: {
            ...r._count,
            products: productCount,
          },
        };
      })
    );

    return successResponse("Restaurants fetched successfully", restaurantsWithProducts);
  } catch (error) {
    return handleError(error);
  }
}

const VALID_DIETARY_CATEGORIES = new Set<DietaryCategory>([
  "PURE_VEG",
  "PURE_NON_VEG",
  "BOTH",
]);

// POST /api/super-admin/restaurants - Register a new restaurant with owner & default settings
export async function POST(request: NextRequest) {
  try {
    await requireRoles(["SUPER_ADMIN"]);

    const body = await request.json();
    const {
      name,
      email,
      phone,
      address,
      city,
      state,
      country,
      pincode,
      fssaiLicense,
      website,
      description,
      dietaryCategory = "BOTH",
      ownerName,
      ownerEmail,
      ownerPassword,
      ownerPhone,
    } = body;

    // 1. Validation for Restaurant
    if (!name?.trim()) {
      throw new AppError("Restaurant name is required", HTTP_STATUS.BAD_REQUEST);
    }
    if (!email?.trim()) {
      throw new AppError("Restaurant email is required", HTTP_STATUS.BAD_REQUEST);
    }
    if (!phone?.trim()) {
      throw new AppError("Restaurant phone number is required", HTTP_STATUS.BAD_REQUEST);
    }
    if (!address?.trim()) {
      throw new AppError("Restaurant address is required", HTTP_STATUS.BAD_REQUEST);
    }

    // Check valid dietary category
    const resolvedCategory: DietaryCategory = VALID_DIETARY_CATEGORIES.has(
      dietaryCategory as DietaryCategory
    )
      ? (dietaryCategory as DietaryCategory)
      : "BOTH";

    // 2. Validation for Owner
    if (!ownerName?.trim()) {
      throw new AppError("Owner name is required", HTTP_STATUS.BAD_REQUEST);
    }
    if (!ownerEmail?.trim()) {
      throw new AppError("Owner email is required", HTTP_STATUS.BAD_REQUEST);
    }
    if (!ownerPassword || typeof ownerPassword !== "string" || ownerPassword.length < 6) {
      throw new AppError("Owner password must be at least 6 characters", HTTP_STATUS.BAD_REQUEST);
    }

    // Check unique constraints for restaurant
    const existingRestByEmail = await prisma.restaurant.findUnique({ where: { email: email.trim() } });
    if (existingRestByEmail) {
      throw new AppError("A restaurant with this email already exists", HTTP_STATUS.CONFLICT);
    }

    const existingRestByPhone = await prisma.restaurant.findUnique({ where: { phone: phone.trim() } });
    if (existingRestByPhone) {
      throw new AppError("A restaurant with this phone already exists", HTTP_STATUS.CONFLICT);
    }

    // Check unique constraints for owner user
    const existingUser = await prisma.user.findUnique({ where: { email: ownerEmail.trim() } });
    if (existingUser) {
      throw new AppError("A user with this owner email already exists", HTTP_STATUS.CONFLICT);
    }

    const hashedPassword = await hashPassword(ownerPassword);

    // 3. Database Transaction: Create Restaurant + Owner + Settings + Seed Categories
    const result = await prisma.$transaction(async (tx) => {
      // Create Restaurant
      const restaurant = await tx.restaurant.create({
        data: {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          address: address.trim(),
          city: city?.trim() || null,
          state: state?.trim() || null,
          country: country?.trim() || "India",
          pincode: pincode?.trim() || null,
          fssaiLicense: fssaiLicense?.trim() || null,
          website: website?.trim() || null,
          description: description?.trim() || null,
          dietaryCategory: resolvedCategory,
          isActive: true,
        },
      });

      // Create Owner User
      const owner = await tx.user.create({
        data: {
          name: ownerName.trim(),
          email: ownerEmail.trim(),
          phone: ownerPhone?.trim() || phone.trim(),
          password: hashedPassword,
          role: "OWNER" as UserRole,
          isActive: true,
          restaurantId: restaurant.id,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
        },
      });

      // Create Restaurant Settings
      await tx.restaurantSettings.create({
        data: {
          restaurantId: restaurant.id,
          currency: "INR",
          taxPercentage: 5,
          serviceCharge: 0,
          invoicePrefix: `${name.slice(0, 3).toUpperCase()}-`,
          qrMenuStatus: true,
          showVegNonVeg: true,
          allowOrdering: true,
          isRestaurantOpen: true,
        },
      });

      // Seed Starter Categories based on Dietary Category
      let starterCategories = [
        { name: "Starters & Appetizers", slug: `starters-${restaurant.id.slice(-5)}`, sortOrder: 1 },
        { name: "Main Course", slug: `main-course-${restaurant.id.slice(-5)}`, sortOrder: 2 },
        { name: "Beverages & Drinks", slug: `beverages-${restaurant.id.slice(-5)}`, sortOrder: 3 },
        { name: "Desserts", slug: `desserts-${restaurant.id.slice(-5)}`, sortOrder: 4 },
      ];

      if (resolvedCategory === "PURE_VEG") {
        starterCategories = [
          { name: "Pure Veg Starters", slug: `veg-starters-${restaurant.id.slice(-5)}`, sortOrder: 1 },
          { name: "Veg Main Course & Thalis", slug: `veg-main-${restaurant.id.slice(-5)}`, sortOrder: 2 },
          { name: "Shakes & Beverages", slug: `drinks-${restaurant.id.slice(-5)}`, sortOrder: 3 },
          { name: "Sweets & Desserts", slug: `desserts-${restaurant.id.slice(-5)}`, sortOrder: 4 },
        ];
      } else if (resolvedCategory === "PURE_NON_VEG") {
        starterCategories = [
          { name: "Non-Veg Starters & Kebabs", slug: `nv-starters-${restaurant.id.slice(-5)}`, sortOrder: 1 },
          { name: "Non-Veg Main Course & Biryanis", slug: `nv-main-${restaurant.id.slice(-5)}`, sortOrder: 2 },
          { name: "Beverages & Refreshers", slug: `drinks-${restaurant.id.slice(-5)}`, sortOrder: 3 },
          { name: "Desserts", slug: `desserts-${restaurant.id.slice(-5)}`, sortOrder: 4 },
        ];
      }

      await tx.category.createMany({
        data: starterCategories.map((cat) => ({
          name: cat.name,
          slug: cat.slug,
          sortOrder: cat.sortOrder,
          restaurantId: restaurant.id,
        })),
      });

      return { restaurant, owner };
    });

    emitAppSocketEvent("restaurant:registered", {
      id: result.restaurant.id,
      name: result.restaurant.name,
      email: result.restaurant.email,
      phone: result.restaurant.phone,
      dietaryCategory: result.restaurant.dietaryCategory,
      city: result.restaurant.city,
      ownerName: result.owner.name,
      ownerEmail: result.owner.email,
      createdAt: result.restaurant.createdAt,
    });

    return successResponse("Restaurant registered successfully", result, HTTP_STATUS.CREATED);
  } catch (error) {
    return handleError(error);
  }
}
