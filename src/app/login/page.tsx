import LoginForm from "@/components/auth/login-form";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const restaurant = await prisma.restaurant.findFirst({
      select: { name: true, description: true },
    });
    const name = restaurant?.name || "The Culinary Ledger";
    return {
      title: `Super Admin Sign In | ${name}`,
      description:
        restaurant?.description ||
        `Super Admin console to register restaurants, manage branch owners, and govern multi-tenant operations.`,
    };
  } catch {
    return {
      title: "Super Admin Sign In | The Culinary Ledger",
      description: "Super Admin console to register restaurants, manage branch owners, and govern multi-tenant operations.",
    };
  }
}

export default async function LoginPage() {
  let restaurant = null;
  try {
    restaurant = await prisma.restaurant.findFirst({
      select: {
        name: true,
        logo: true,
      },
    });
  } catch (err) {
    console.error("Failed to load restaurant in LoginPage:", err);
  }

  return (
    <LoginForm
      restaurantName={restaurant?.name}
      restaurantLogo={restaurant?.logo}
    />
  );
}
