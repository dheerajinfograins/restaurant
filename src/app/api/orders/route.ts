import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedRestaurantId, getOptionalPayload } from "@/lib/permissions";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedRestId = searchParams.get("restaurantId");
    const payload = await getOptionalPayload();
    const isSuperAdmin = payload?.role === "SUPER_ADMIN";

    let restaurantId: string | undefined = undefined;
    if (isSuperAdmin) {
      restaurantId = requestedRestId && requestedRestId !== "all" ? requestedRestId : undefined;
    } else {
      restaurantId = await getAuthenticatedRestaurantId([
        "OWNER",
        "MANAGER",
        "WAITER",
        "CASHIER",
        "KITCHEN",
      ]);
    }

    const whereClause: Prisma.OrderWhereInput = {};
    if (restaurantId) {
      whereClause.restaurantId = restaurantId;
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      take: 100,
      include: {
        items: {
          include: { product: true },
        },
        table: true,
        restaurant: {
          select: {
            id: true,
            name: true,
            dietaryCategory: true,
          },
        },
        waiter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
