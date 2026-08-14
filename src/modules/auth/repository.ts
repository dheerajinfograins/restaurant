
import { Prisma, User } from "@prisma/client";
import { prisma } from "@/lib/prisma";

class AuthRepository {
    /**
     * Find user by email
     */
    async findUserByEmail(email: string): Promise<User | null> {
        return prisma.user.findUnique({
            where: {
                email,
            },
        });
    }

    /**
     * Find user by ID
     */
    async findUserById(id: string): Promise<User | null> {
        return prisma.user.findUnique({
            where: {
                id,
            },
        });
    }

    /**
     * Create new user
     */
    async createUser(data: Prisma.UserCreateInput): Promise<User> {
        return prisma.user.create({
            data,
        });
    }

    /**
     * Update user
     */
    async updateUser(
        id: string,
        data: Prisma.UserUpdateInput
    ): Promise<User> {
        return prisma.user.update({
            where: {
                id,
            },
            data,
        });
    }

    /**
     * Delete user
     */
    async deleteUser(id: string): Promise<User> {
        return prisma.user.delete({
            where: {
                id,
            },
        });
    }
}

const authRepository = new AuthRepository();
export default authRepository;