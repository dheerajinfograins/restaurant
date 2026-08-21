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
      title: `Sign In | ${name}`,
      description:
        restaurant?.description ||
        `Sign in to manage ${name} operations, kitchen, and waitstaff.`,
    };
  } catch {
    return {
      title: "Sign In | The Culinary Ledger",
      description: "Sign in to manage your restaurant operations, kitchen, and waitstaff.",
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
