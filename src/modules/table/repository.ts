import { prisma } from "@/lib/prisma";
import { RestaurantTable, Prisma } from "@prisma/client";

class TableRepository {
  async findByRestaurantId(restaurantId: string): Promise<RestaurantTable[]> {
    return prisma.restaurantTable.findMany({
      where: { restaurantId },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string, restaurantId: string): Promise<RestaurantTable | null> {
    return prisma.restaurantTable.findUnique({
      where: { id, restaurantId },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
    });
  }

  async findByTableNumber(restaurantId: string, tableNumber: string): Promise<RestaurantTable | null> {
    return prisma.restaurantTable.findUnique({
      where: { restaurantId_tableNumber: { restaurantId, tableNumber } },
    });
  }

  async create(data: Prisma.RestaurantTableUncheckedCreateInput): Promise<RestaurantTable> {
    return prisma.restaurantTable.create({ data });
  }

  async update(id: string, data: Prisma.RestaurantTableUncheckedUpdateInput): Promise<RestaurantTable> {
    return prisma.restaurantTable.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<RestaurantTable> {
    return prisma.restaurantTable.delete({
      where: { id },
    });
  }
}

const tableRepository = new TableRepository();
export default tableRepository;
