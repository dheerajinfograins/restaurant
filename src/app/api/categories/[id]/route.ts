import { NextRequest } from "next/server";
import { getAuthenticatedRestaurantId } from "@/lib/permissions";
import categoryController from "@/modules/category/controller";
import { handleError } from "@/helpers/error-handler";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const restaurantId = await getAuthenticatedRestaurantId();
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
    const restaurantId = await getAuthenticatedRestaurantId();
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
    const restaurantId = await getAuthenticatedRestaurantId();
    const { id } = await params;
    return await categoryController.deleteCategory(id, restaurantId);
  } catch (error) {
    return handleError(error);
  }
}

