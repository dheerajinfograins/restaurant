import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleError } from "@/helpers/error-handler";
import { successResponse } from "@/lib/api-response";
import { requireRoles } from "@/lib/permissions";
import { AppError, HTTP_STATUS } from "@/exceptions";
import { DietaryCategory } from "@prisma/client";

// GET /api/super-admin/restaurants/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRoles(["SUPER_ADMIN"]);
    const { id } = await params;

    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      include: {
        settings: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            isActive: true,
            lastLoginAt: true,
          },
        },
        _count: {
          select: {
            tables: true,
            categories: true,
            orders: true,
          },
        },
      },
    });

    if (!restaurant) {
      throw new AppError("Restaurant not found", HTTP_STATUS.NOT_FOUND);
    }

    const productCount = await prisma.product.count({
      where: { restaurantId: id },
    });

    const restaurantWithProducts = {
      ...restaurant,
      _count: {
        ...restaurant._count,
        products: productCount,
      },
    };

    return successResponse("Restaurant fetched successfully", restaurantWithProducts);
  } catch (error) {
    return handleError(error);
  }
}

const REQUIRED_FIELDS = ["name", "email", "phone", "address"] as const;
const OPTIONAL_FIELDS = [
  "city",
  "state",
  "country",
  "pincode",
  "fssaiLicense",
  "description",
  "website",
] as const;
const VALID_DIETARY_CATEGORIES = new Set<DietaryCategory>([
  "PURE_VEG",
  "PURE_NON_VEG",
  "BOTH",
]);

function extractRestaurantUpdateData(body: Record<string, unknown>) {
  const updateData: Record<string, unknown> = {};

  for (const key of REQUIRED_FIELDS) {
    const value = body[key];
    if (typeof value === "string") {
      updateData[key] = value.trim();
    }
  }

  for (const key of OPTIONAL_FIELDS) {
    const value = body[key];
    if (value !== undefined) {
      updateData[key] = typeof value === "string" ? value.trim() || null : null;
    }
  }

  if (body.isActive !== undefined) {
    updateData.isActive = Boolean(body.isActive);
  }

  if (
    typeof body.dietaryCategory === "string" &&
    VALID_DIETARY_CATEGORIES.has(body.dietaryCategory as DietaryCategory)
  ) {
    updateData.dietaryCategory = body.dietaryCategory;
  }

  return updateData;
}

function extractOwnerUpdateData(body: Record<string, unknown>) {
  const ownerUpdateData: Record<string, unknown> = {};

  if (typeof body.ownerName === "string" && body.ownerName.trim()) {
    ownerUpdateData.name = body.ownerName.trim();
  }
  if (typeof body.ownerEmail === "string" && body.ownerEmail.trim()) {
    ownerUpdateData.email = body.ownerEmail.trim().toLowerCase();
  }
  if (body.ownerPhone !== undefined) {
    ownerUpdateData.phone =
      typeof body.ownerPhone === "string" ? body.ownerPhone.trim() || null : null;
  }

  return ownerUpdateData;
}

async function updateOwnerDetails(
  ownerId: string,
  body: Record<string, unknown>
) {
  const ownerUpdateData = extractOwnerUpdateData(body);
  if (Object.keys(ownerUpdateData).length === 0) return;

  await prisma.user.update({
    where: { id: ownerId },
    data: ownerUpdateData,
  });
}

// PATCH /api/super-admin/restaurants/[id] - Update status, dietary category, details, or owner info
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRoles(["SUPER_ADMIN"]);
    const { id } = await params;

    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      include: {
        users: {
          where: { role: "OWNER" },
          take: 1,
        },
      },
    });

    if (!restaurant) {
      throw new AppError("Restaurant not found", HTTP_STATUS.NOT_FOUND);
    }

    const body = await request.json();
    const updateData = extractRestaurantUpdateData(body);

    const updated = await prisma.restaurant.update({
      where: { id },
      data: updateData,
    });

    // Update Owner details if provided
    const owner = restaurant.users[0];
    if (owner) {
      await updateOwnerDetails(owner.id, body);
    }

    return successResponse("Restaurant updated successfully", updated);
  } catch (error) {
    return handleError(error);
  }
}
