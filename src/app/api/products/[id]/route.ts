import { NextRequest } from "next/server";
import { getAuthenticatedRestaurantId } from "@/lib/permissions";
import { productController } from "@/modules/product";
import { handleError } from "@/helpers/error-handler";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const restaurantId = await getAuthenticatedRestaurantId();
    return await productController.getProduct(params.id, restaurantId);
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
    const restaurantId = await getAuthenticatedRestaurantId();
    const body = await request.json();
    return await productController.updateProduct(params.id, restaurantId, body);
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
    const restaurantId = await getAuthenticatedRestaurantId();
    return await productController.deleteProduct(params.id, restaurantId);
  } catch (error) {
    return handleError(error);
  }
}

