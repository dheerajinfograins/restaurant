
import { prisma } from "@/lib/prisma";
import { handleError } from "@/helpers/error-handler";
import { AppError, HTTP_STATUS } from "@/exceptions";
import { successResponse } from "@/lib/api-response";
import { requireRoles } from "@/lib/permissions";
import bcrypt from "bcrypt";
import { NextRequest } from "next/server";

// GET /api/staff - Fetch all staff for the restaurant
export async function GET() {
  try {
    const payload = await requireRoles(["SUPER_ADMIN", "OWNER", "MANAGER"]);
    const restaurantId = payload.restaurantId;

    if (!restaurantId && payload.role !== "SUPER_ADMIN") {
      throw new AppError("No restaurant associated with this user", HTTP_STATUS.FORBIDDEN);
    }

    const whereClause = restaurantId ? { restaurantId } : {};

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
        _count: {
          select: { orders: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return successResponse("Staff fetched successfully", staff);
  } catch (error) {
    return handleError(error);
  }
}

// POST /api/staff - Create new staff member
export async function POST(request: NextRequest) {
  try {
    const payload = await requireRoles(["SUPER_ADMIN", "OWNER", "MANAGER"]);
    const restaurantId = payload.restaurantId;

    if (!restaurantId && payload.role !== "SUPER_ADMIN") {
      throw new AppError("No restaurant associated with this user", HTTP_STATUS.FORBIDDEN);
    }

    const body = await request.json();
    const { name, email, phone, password, role, isActive } = body;

    // Validate email uniqueness
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new AppError("Email is already registered", HTTP_STATUS.CONFLICT);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        password: hashedPassword,
        role,
        isActive: isActive !== undefined ? isActive : true,
        restaurantId: restaurantId || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true
      }
    });

    return successResponse("Staff created successfully", newUser);
  } catch (error) {
    return handleError(error);
  }
}
