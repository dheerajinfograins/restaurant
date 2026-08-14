import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/jwt";
import categoryController from "@/modules/category/controller";
import { handleError } from "@/helpers/error-handler";
import { AppError, HTTP_STATUS } from "@/exceptions";

async function getRestaurantId() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
  
  const payload = verifyAccessToken(token);
  
  if (!payload.restaurantId && payload.role !== "SUPER_ADMIN") {
    throw new AppError("No restaurant associated with this user", HTTP_STATUS.FORBIDDEN);
  }
  
  return payload.restaurantId || "super-admin-restaurant";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const restaurantId = await getRestaurantId();
    const { id } = await params;
    return await categoryController.getCategory(id, restaurantId);
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const restaurantId = await getRestaurantId();
    const { id } = await params;
    const body = await request.json();
    return await categoryController.updateCategory(id, restaurantId, body);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const restaurantId = await getRestaurantId();
    const { id } = await params;
    return await categoryController.deleteCategory(id, restaurantId);
  } catch (error) {
    return handleError(error);
  }
}
