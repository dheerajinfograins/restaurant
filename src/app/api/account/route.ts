import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleError } from "@/helpers/error-handler";
import { successResponse } from "@/lib/api-response";
import { getOptionalPayload } from "@/lib/permissions";
import bcrypt from "bcrypt";
import { AppError, HTTP_STATUS } from "@/exceptions";

export async function PATCH(request: NextRequest) {
  try {
    const payload = await getOptionalPayload();
    if (!payload?.id) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const body = await request.json();
    const { name, email, phone, currentPassword, newPassword } = body;

    const user = await prisma.user.findUnique({
      where: { id: payload.id }
    });

    if (!user) {
      throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
    }

    const dataToUpdate: { name?: string; email?: string; phone?: string; password?: string } = {};
    if (name) dataToUpdate.name = name;
    if (email) dataToUpdate.email = email;
    if (phone !== undefined) dataToUpdate.phone = phone;

    // Handle password change
    if (newPassword) {
      if (!currentPassword) {
        throw new AppError("Current password is required to set a new password", HTTP_STATUS.BAD_REQUEST);
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        throw new AppError("Incorrect current password", HTTP_STATUS.BAD_REQUEST);
      }

      dataToUpdate.password = await bcrypt.hash(newPassword, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: payload.id },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true
      }
    });

    return successResponse("Account updated successfully", updatedUser);
  } catch (error) {
    return handleError(error);
  }
}
