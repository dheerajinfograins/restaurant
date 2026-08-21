import { NextRequest } from "next/server";
import { requireRoles } from "@/lib/permissions";
import { uploadImageToCloudinary, deleteImageFromCloudinary } from "@/lib/cloudinary";
import { successResponse } from "@/lib/api-response";
import { handleError } from "@/helpers/error-handler";
import { AppError, HTTP_STATUS } from "@/exceptions";

export async function POST(request: NextRequest) {
  try {
    // Ensure the user is authenticated to upload images
    await requireRoles(["SUPER_ADMIN", "OWNER", "MANAGER", "WAITER", "KITCHEN", "CASHIER"]);

    const searchParams = request.nextUrl.searchParams;
    const queryFolder = searchParams.get("folder") || "general";

    const contentType = request.headers.get("content-type") || "";

    let fileData: string | Buffer | null = null;
    let folder = queryFolder;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const formFolder = formData.get("folder") as string | null;

      if (formFolder) folder = formFolder;

      if (!file) {
        throw new AppError("No file uploaded in form data", HTTP_STATUS.BAD_REQUEST);
      }

      // Convert Web File to Buffer
      const arrayBuffer = await file.arrayBuffer();
      fileData = Buffer.from(arrayBuffer);
    } else if (contentType.includes("application/json")) {
      const body = await request.json();
      const base64OrUrl = body.file || body.image;
      if (body.folder) folder = body.folder;

      if (!base64OrUrl) {
        throw new AppError("Image payload ('file' or 'image') is required", HTTP_STATUS.BAD_REQUEST);
      }

      fileData = base64OrUrl;
    } else {
      throw new AppError(
        "Unsupported Content-Type. Please use multipart/form-data or application/json",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    if (!fileData) {
      throw new AppError("No valid image data provided for upload", HTTP_STATUS.BAD_REQUEST);
    }

    const result = await uploadImageToCloudinary(fileData, folder);

    return successResponse("Image uploaded successfully to Cloudinary", {
      url: result.url,
      publicId: result.publicId,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("403")) {
      return handleError(
        new AppError(
          "Cloudinary authentication failed (403 Forbidden). Please verify your Cloudinary credentials (API Key & Secret) in .env and restart the dev server.",
          HTTP_STATUS.BAD_REQUEST
        )
      );
    }
    return handleError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireRoles(["SUPER_ADMIN", "OWNER", "MANAGER", "WAITER", "KITCHEN", "CASHIER"]);

    const searchParams = request.nextUrl.searchParams;
    const queryUrl = searchParams.get("url");
    const queryPublicId = searchParams.get("publicId");

    let target = queryUrl || queryPublicId;

    if (!target && request.headers.get("content-type")?.includes("application/json")) {
      const body = await request.json().catch(() => ({}));
      target = body.url || body.publicId;
    }

    if (!target) {
      throw new AppError("Target 'url' or 'publicId' is required to delete image", HTTP_STATUS.BAD_REQUEST);
    }

    const deleted = await deleteImageFromCloudinary(target);

    return successResponse("Image deletion processed", {
      deleted,
      target,
    });
  } catch (error) {
    return handleError(error);
  }
}
