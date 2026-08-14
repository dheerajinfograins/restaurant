import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/jwt";
import tableController from "@/modules/table/controller";
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
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const restaurantId = await getRestaurantId();
    return await tableController.getTable(params.id, restaurantId);
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const restaurantId = await getRestaurantId();
    const body = await request.json();
    return await tableController.updateTable(params.id, restaurantId, body);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const restaurantId = await getRestaurantId();
    return await tableController.deleteTable(params.id, restaurantId);
  } catch (error) {
    return handleError(error);
  }
}
