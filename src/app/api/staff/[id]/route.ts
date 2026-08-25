import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleError } from "@/helpers/error-handler";
import { AppError, HTTP_STATUS } from "@/exceptions";
import { successResponse } from "@/lib/api-response";
import { requireRoles, getAuthenticatedRestaurantId } from "@/lib/permissions";
import bcrypt from "bcrypt";
import { Prisma } from "@prisma/client";
import { emitAppSocketEvent } from "@/lib/socket-server";

interface StaffUpdateBody {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  password?: unknown;
  role?: unknown;
  isActive?: unknown;
}

async function getStaffUser(
  id: string,
  restaurantId: string,
  isSuperAdmin = false,
  forbiddenMessage = "Forbidden"
) {
  const existingUser = await prisma.user.findUnique({ where: { id } });
  if (!existingUser) {
    throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
  }
  if (!isSuperAdmin && existingUser.restaurantId && existingUser.restaurantId !== restaurantId) {
    throw new AppError(forbiddenMessage, HTTP_STATUS.FORBIDDEN);
  }
  return existingUser;
}

async function validateEmail(
  email: unknown,
  existingEmail: string,
  userId: string
): Promise<string | undefined> {
  if (typeof email !== "string" || !email.trim()) {
    return undefined;
  }
  const trimmedEmail = email.trim().toLowerCase();
  if (trimmedEmail === existingEmail.toLowerCase()) {
    return undefined;
  }
  const duplicateEmail = await prisma.user.findUnique({
    where: { email: trimmedEmail },
    select: { id: true },
  });
  if (duplicateEmail && duplicateEmail.id !== userId) {
    throw new AppError(`Email address "${trimmedEmail}" is already used by another account.`, HTTP_STATUS.CONFLICT);
  }
  return trimmedEmail;
}

async function validatePhone(
  phone: unknown,
  existingPhone: string | null,
  userId: string
): Promise<string | null | undefined> {
  if (phone === undefined) {
    return undefined;
  }
  const trimmedPhone = typeof phone === "string" && phone.trim() !== "" ? phone.trim() : null;
  if (trimmedPhone === existingPhone) {
    return undefined;
  }
  if (trimmedPhone) {
    const duplicatePhone = await prisma.user.findUnique({
      where: { phone: trimmedPhone },
      select: { id: true },
    });
    if (duplicatePhone && duplicatePhone.id !== userId) {
      throw new AppError(`Phone number "${trimmedPhone}" is already registered to another account.`, HTTP_STATUS.CONFLICT);
    }
  }
  return trimmedPhone;
}

async function validatePassword(password: unknown): Promise<string | undefined> {
  if (typeof password !== "string" || !password.trim()) {
    return undefined;
  }
  if (password.length < 6) {
    throw new AppError("New password must be at least 6 characters long", HTTP_STATUS.BAD_REQUEST);
  }
  return bcrypt.hash(password, 10);
}

async function buildStaffUpdateData(
  body: StaffUpdateBody,
  existingUser: { id: string; email: string; phone: string | null }
): Promise<Prisma.UserUpdateInput> {
  const dataToUpdate: Prisma.UserUpdateInput = {};

  if (typeof body.isActive === "boolean") {
    dataToUpdate.isActive = body.isActive;
    if (!body.isActive) {
      dataToUpdate.lastLoginAt = null;
    }
  }

  if (typeof body.name === "string" && body.name.trim()) {
    dataToUpdate.name = body.name.trim();
  }

  const email = await validateEmail(body.email, existingUser.email, existingUser.id);
  if (email !== undefined) {
    dataToUpdate.email = email;
  }

  const phone = await validatePhone(body.phone, existingUser.phone, existingUser.id);
  if (phone !== undefined) {
    dataToUpdate.phone = phone;
  }

  if (typeof body.role === "string" && body.role) {
    dataToUpdate.role = body.role as Prisma.EnumUserRoleFieldUpdateOperationsInput["set"];
  }

  const hashedPassword = await validatePassword(body.password);
  if (hashedPassword) {
    dataToUpdate.password = hashedPassword;
  }

  return dataToUpdate;
}

function emitStaffStatus(
  restaurantId: string | null | undefined,
  userId: string,
  isActive: boolean,
  role: string
) {
  emitAppSocketEvent(
    "staff:status_changed",
    {
      userId,
      isActive,
      role,
    },
    restaurantId
  );
}

// PUT /api/staff/[id] - Update staff details
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = await requireRoles(["SUPER_ADMIN", "OWNER", "MANAGER"]);
    const isSuperAdmin = payload.role === "SUPER_ADMIN";
    const restaurantId = payload.restaurantId || (await getAuthenticatedRestaurantId(["SUPER_ADMIN", "OWNER", "MANAGER"]));
    const { id } = await params;

    const existingUser = await getStaffUser(
      id,
      restaurantId,
      isSuperAdmin,
      "Forbidden: Cannot edit users outside your restaurant"
    );

    const body: StaffUpdateBody = await request.json();
    const dataToUpdate = await buildStaffUpdateData(body, existingUser);

    const updatedUser = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        restaurantId: true,
      },
    });

    if (typeof body.isActive === "boolean") {
      emitStaffStatus(updatedUser.restaurantId || restaurantId, id, body.isActive, updatedUser.role);
    }

    return successResponse("Staff updated successfully", updatedUser);
  } catch (error) {
    return handleError(error);
  }
}

// PATCH /api/staff/[id] - Toggle staff active status
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = await requireRoles(["SUPER_ADMIN", "OWNER", "MANAGER"]);
    const isSuperAdmin = payload.role === "SUPER_ADMIN";
    const restaurantId = payload.restaurantId || (await getAuthenticatedRestaurantId(["SUPER_ADMIN", "OWNER", "MANAGER"]));
    const { id } = await params;

    await getStaffUser(id, restaurantId, isSuperAdmin);

    const body = await request.json();
    if (typeof body.isActive !== "boolean") {
      throw new AppError("isActive field must be a boolean", HTTP_STATUS.BAD_REQUEST);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        isActive: body.isActive,
        ...(body.isActive ? {} : { lastLoginAt: null }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        restaurantId: true,
      },
    });

    emitStaffStatus(updatedUser.restaurantId || restaurantId, id, body.isActive, updatedUser.role);

    return successResponse(`Staff ${body.isActive ? "activated" : "deactivated"} successfully`, updatedUser);
  } catch (error) {
    return handleError(error);
  }
}

// DELETE /api/staff/[id] - Delete staff permanently
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = await requireRoles(["SUPER_ADMIN", "OWNER", "MANAGER"]);
    const isSuperAdmin = payload.role === "SUPER_ADMIN";
    const restaurantId = payload.restaurantId || (await getAuthenticatedRestaurantId(["SUPER_ADMIN", "OWNER", "MANAGER"]));
    const { id } = await params;

    await getStaffUser(id, restaurantId, isSuperAdmin);

    const ordersCount = await prisma.order.count({
      where: {
        waiterId: id,
      },
    });

    if (ordersCount > 0) {
      throw new AppError(
        "Cannot delete staff member because they are associated with existing orders. Please deactivate their account instead.",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    await prisma.user.delete({ where: { id } });

    return successResponse("Staff deleted successfully");
  } catch (error) {
    return handleError(error);
  }
}

