import AuthLayout from "@/components/auth/auth-layout";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function LoginLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  let restaurant = null;
  try {
    restaurant = await prisma.restaurant.findFirst({
      select: {
        id: true,
        name: true,
        logo: true,
        description: true,
        coverImage: true,
      },
    });
  } catch (err) {
    console.error("Failed to load dynamic restaurant for login:", err);
  }

  return (
    <AuthLayout
      restaurantName={restaurant?.name}
      restaurantLogo={restaurant?.logo}
      restaurantDescription={restaurant?.description}
      restaurantCover={restaurant?.coverImage}
    >
      {children}
    </AuthLayout>
  );
}
