import { NextRequest } from "next/server";
import { couponController } from "@/modules/coupon";
import { handleError } from "@/helpers/error-handler";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return await couponController.validateCoupon(body);
  } catch (error) {
    return handleError(error);
  }
}
