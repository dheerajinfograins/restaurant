import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleError } from "@/helpers/error-handler";
import { successResponse } from "@/lib/api-response";
import { getOptionalPayload } from "@/lib/permissions";
import { deleteImageFromCloudinary, uploadImageToCloudinary } from "@/lib/cloudinary";
import bcrypt from "bcrypt";
import { AppError, HTTP_STATUS } from "@/exceptions";

const userResponseSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  image: true,
  isActive: true,
  createdAt: true,
  lastLoginAt: true,
  restaurant: {
    select: {
      id: true,
      name: true,
      logo: true,
      email: true,
      phone: true,
      address: true,
    },
  },
};

function cleanupOldCloudinaryImage(oldImage: string | null, newImage?: string | null) {
  if (oldImage && oldImage !== newImage && oldImage.includes("res.cloudinary.com")) {
    void deleteImageFromCloudinary(oldImage);
  }
}

async function uploadAvatarImage(dataUri: string): Promise<string> {
  try {
    const uploadResult = await uploadImageToCloudinary(dataUri, "avatars");
    return uploadResult.url;
  } catch (err) {
    console.error("Failed to upload avatar to Cloudinary:", err);
    throw new AppError("Failed to process profile image upload", HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

async function resolveUpdatedEmail(
  email: unknown,
  currentUser: { id: string; email: string }
): Promise<string | undefined> {
  if (!email || typeof email !== "string") {
    return undefined;
  }

  const trimmedEmail = email.trim().toLowerCase();
  if (trimmedEmail === currentUser.email.toLowerCase()) {
    return undefined;
  }

  const existingEmail = await prisma.user.findUnique({
    where: { email: trimmedEmail },
  });

  if (existingEmail && existingEmail.id !== currentUser.id) {
    throw new AppError("Email address is already used by another account", HTTP_STATUS.BAD_REQUEST);
  }

  return trimmedEmail;
}

async function resolveUpdatedPhone(
  phone: unknown,
  currentUser: { id: string; phone: string | null }
): Promise<string | null | undefined> {
  if (phone === undefined) {
    return undefined;
  }

  const trimmedPhone = typeof phone === "string" ? phone.trim() : null;
  if (!trimmedPhone) {
    return null;
  }

  if (trimmedPhone === currentUser.phone) {
    return undefined;
  }

  const existingPhone = await prisma.user.findUnique({
    where: { phone: trimmedPhone },
  });

  if (existingPhone && existingPhone.id !== currentUser.id) {
    throw new AppError("Phone number is already used by another account", HTTP_STATUS.BAD_REQUEST);
  }

  return trimmedPhone;
}

async function resolveUpdatedImage(
  image: unknown,
  currentImage: string | null
): Promise<string | null | undefined> {
  if (image === undefined) {
    return undefined;
  }

  if (image === null || image === "") {
    cleanupOldCloudinaryImage(currentImage, null);
    return null;
  }

  if (typeof image !== "string") {
    return undefined;
  }

  const finalImageUrl = image.startsWith("data:image")
    ? await uploadAvatarImage(image)
    : image;

  cleanupOldCloudinaryImage(currentImage, finalImageUrl);
  return finalImageUrl;
}

async function resolveUpdatedPassword(
  newPassword: unknown,
  currentPassword: unknown,
  passwordHash: string
): Promise<string | undefined> {
  if (!newPassword) {
    return undefined;
  }

  if (!currentPassword || typeof currentPassword !== "string") {
    throw new AppError("Current password is required to set a new password", HTTP_STATUS.BAD_REQUEST);
  }

  const isPasswordValid = await bcrypt.compare(currentPassword, passwordHash);
  if (!isPasswordValid) {
    throw new AppError("Incorrect current password", HTTP_STATUS.BAD_REQUEST);
  }

  if (typeof newPassword !== "string" || newPassword.length < 6) {
    throw new AppError("New password must be at least 6 characters long", HTTP_STATUS.BAD_REQUEST);
  }

  return bcrypt.hash(newPassword, 10);
}

export async function GET() {
  try {
    const payload = await getOptionalPayload();
    if (!payload?.id) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: userResponseSelect,
    });

    if (!user) {
      throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
    }

    return successResponse("User profile retrieved successfully", user);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const payload = await getOptionalPayload();
    if (!payload?.id) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
    });

    if (!user) {
      throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
    }

    const body = await request.json();
    const dataToUpdate: {
      name?: string;
      email?: string;
      phone?: string | null;
      image?: string | null;
      password?: string;
    } = {};

    if (typeof body.name === "string" && body.name.trim()) {
      dataToUpdate.name = body.name.trim();
    }

    const email = await resolveUpdatedEmail(body.email, user);
    if (email !== undefined) {
      dataToUpdate.email = email;
    }

    const phone = await resolveUpdatedPhone(body.phone, user);
    if (phone !== undefined) {
      dataToUpdate.phone = phone;
    }

    const image = await resolveUpdatedImage(body.image, user.image);
    if (image !== undefined) {
      dataToUpdate.image = image;
    }

    const password = await resolveUpdatedPassword(body.newPassword, body.currentPassword, user.password);
    if (password !== undefined) {
      dataToUpdate.password = password;
    }

    const updatedUser = await prisma.user.update({
      where: { id: payload.id },
      data: dataToUpdate,
      select: userResponseSelect,
    });

    return successResponse("Account profile updated successfully", updatedUser);
  } catch (error) {
    return handleError(error);
  }
}
