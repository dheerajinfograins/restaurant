
import { prisma } from "@/lib/prisma";
import { handleError } from "@/helpers/error-handler";
import { AppError, HTTP_STATUS } from "@/exceptions";
import { successResponse } from "@/lib/api-response";
import { requireRoles, getAuthenticatedRestaurantId } from "@/lib/permissions";
import bcrypt from "bcrypt";
import { NextRequest } from "next/server";
import { UserRole, Prisma } from "@prisma/client";

// GET /api/staff - Fetch all staff for the restaurant (or across restaurants for Super Admin)
export async function GET(request: NextRequest) {
  try {
    const payload = await requireRoles(["SUPER_ADMIN", "OWNER", "MANAGER"]);
    const isSuperAdmin = payload.role === "SUPER_ADMIN";

    const { searchParams } = new URL(request.url);
    const requestedRestId = searchParams.get("restaurantId");

    const whereClause: Prisma.UserWhereInput = {};
    let restaurantsList: Array<{ id: string; name: string; dietaryCategory: string }> = [];

    if (isSuperAdmin) {
      restaurantsList = await prisma.restaurant.findMany({
        select: { id: true, name: true, dietaryCategory: true },
        orderBy: { name: "asc" },
      });

      if (requestedRestId && requestedRestId !== "all") {
        whereClause.restaurantId = requestedRestId;
      }
    } else {
      const restaurantId = payload.restaurantId || (await getAuthenticatedRestaurantId(["OWNER", "MANAGER"]));
      whereClause.restaurantId = restaurantId;
    }

    const staff = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        restaurantId: true,
        restaurant: {
          select: { id: true, name: true, dietaryCategory: true },
        },
        _count: {
          select: { orders: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse("Staff fetched successfully", {
      staff,
      restaurants: restaurantsList,
      isSuperAdmin,
    });
  } catch (error) {
    return handleError(error);
  }
}

// POST /api/staff - Create new staff member
export async function POST(request: NextRequest) {
  try {
    const payload = await requireRoles(["SUPER_ADMIN", "OWNER", "MANAGER"]);
    const body = await request.json();
    const { name, email, phone, password, role, isActive } = body;

    let restaurantId = "";
    if (payload.role === "SUPER_ADMIN") {
      restaurantId = body.restaurantId || (await getAuthenticatedRestaurantId());
    } else {
      restaurantId = payload.restaurantId || (await getAuthenticatedRestaurantId(["OWNER", "MANAGER"]));
    }

    if (!name || typeof name !== "string" || !name.trim()) {
      throw new AppError("Staff name is required", HTTP_STATUS.BAD_REQUEST);
    }

    if (!email || typeof email !== "string" || !email.trim()) {
      throw new AppError("Valid email address is required", HTTP_STATUS.BAD_REQUEST);
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      throw new AppError("Password must be at least 6 characters long", HTTP_STATUS.BAD_REQUEST);
    }

    if (!role || !Object.values(UserRole).includes(role as UserRole)) {
      throw new AppError("Invalid role selected", HTTP_STATUS.BAD_REQUEST);
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = typeof phone === "string" && phone.trim() !== "" ? phone.trim() : null;

    // Validate email uniqueness
    const existingEmailUser = await prisma.user.findUnique({
      where: { email: trimmedEmail },
      select: { id: true, name: true, role: true },
    });

    if (existingEmailUser) {
      throw new AppError(
        `Email "${trimmedEmail}" is already used by ${existingEmailUser.name} (${existingEmailUser.role}). Please use a different email address.`,
        HTTP_STATUS.CONFLICT
      );
    }

    // Validate phone uniqueness if provided
    if (trimmedPhone) {
      const existingPhoneUser = await prisma.user.findUnique({
        where: { phone: trimmedPhone },
        select: { id: true, name: true, role: true },
      });

      if (existingPhoneUser) {
        throw new AppError(
          `Phone number "${trimmedPhone}" is already registered to ${existingPhoneUser.name} (${existingPhoneUser.role}). Please use another number or leave it blank.`,
          HTTP_STATUS.CONFLICT
        );
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: trimmedEmail,
        phone: trimmedPhone,
        password: hashedPassword,
        role: role as UserRole,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        restaurantId: restaurantId || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return successResponse("Staff member created successfully", newUser);
  } catch (error) {
    return handleError(error);
  }
}

