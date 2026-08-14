import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleError } from "@/helpers/error-handler";
import { AppError, HTTP_STATUS } from "@/exceptions";
import { successResponse } from "@/lib/api-response";
import { requireRoles } from "@/lib/permissions";
import bcrypt from "bcrypt";
import { Prisma } from "@prisma/client";

// PUT /api/staff/[id] - Update staff details
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = await requireRoles(["SUPER_ADMIN", "OWNER", "MANAGER"]);
    const { id } = await params;
    
    // Check if the user exists and belongs to the same restaurant
    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
    }
    if (payload.role !== "SUPER_ADMIN" && existingUser.restaurantId !== payload.restaurantId) {
      throw new AppError("Forbidden: Cannot edit users outside your restaurant", HTTP_STATUS.FORBIDDEN);
    }

    const body = await request.json();
    const { name, email, phone, password, role } = body;

    const dataToUpdate: Prisma.UserUpdateInput = { name, email, phone, role };

    if (password && password.trim() !== "") {
      dataToUpdate.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true
      }
    });

    return successResponse("Staff updated successfully", updatedUser);
  } catch (error) {
    return handleError(error);
  }
}

// PATCH /api/staff/[id] - Toggle staff active status
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = await requireRoles(["SUPER_ADMIN", "OWNER", "MANAGER"]);
    const { id } = await params;
    
    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
    }
    if (payload.role !== "SUPER_ADMIN" && existingUser.restaurantId !== payload.restaurantId) {
      throw new AppError("Forbidden", HTTP_STATUS.FORBIDDEN);
    }

    const body = await request.json();
    if (typeof body.isActive !== 'boolean') {
      throw new AppError("isActive field must be a boolean", HTTP_STATUS.BAD_REQUEST);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: body.isActive },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true
      }
    });

    return successResponse(`Staff ${body.isActive ? 'activated' : 'deactivated'} successfully`, updatedUser);
  } catch (error) {
    return handleError(error);
  }
}

// DELETE /api/staff/[id] - Delete staff permanently
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = await requireRoles(["SUPER_ADMIN", "OWNER", "MANAGER"]);
    const { id } = await params;
    
    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
    }
    if (payload.role !== "SUPER_ADMIN" && existingUser.restaurantId !== payload.restaurantId) {
      throw new AppError("Forbidden", HTTP_STATUS.FORBIDDEN);
    }

    await prisma.user.delete({ where: { id } });

    return successResponse("Staff deleted successfully");
  } catch (error) {
    return handleError(error);
  }
}
