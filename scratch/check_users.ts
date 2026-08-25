import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      restaurantId: true,
      restaurant: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
  console.log("USERS IN DB:", JSON.stringify(users, null, 2));

  const tables = await prisma.restaurantTable.findMany({
    take: 3,
    select: {
      id: true,
      tableNumber: true,
      restaurantId: true,
    },
  });
  console.log("TABLES IN DB:", JSON.stringify(tables, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
