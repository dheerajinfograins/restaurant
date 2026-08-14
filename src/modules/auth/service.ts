import { LoginDto, CreateUserDto } from "./dto";
import { AppError, HTTP_STATUS } from "@/exceptions";
import authRepository from "./repository";
import { comparePassword, hashPassword } from "@/lib/bcrypt";
import { generateAccessToken } from "@/lib/jwt";

class AuthService {
    /**
     * Login User
     */
    async login(data: LoginDto) {
        const user = await authRepository.findUserByEmail(data.email);

        if (!user) {
            throw new AppError(
                "Invalid email or password.",
                HTTP_STATUS.UNAUTHORIZED
            );
        }

        const isPasswordValid = await comparePassword(
            data.password,
            user.password
        );

        if (!isPasswordValid) {
            throw new AppError(
                "Invalid email or password.",
                HTTP_STATUS.UNAUTHORIZED
            );
        }

        const accessToken = generateAccessToken({
            id: user.id,
            email: user.email,
            role: user.role,
            restaurantId: user.restaurantId,
        });

        return {
            user,
            accessToken,
        };
    }

    /**
     * Create Staff User
     */
    async createUser(data: CreateUserDto) {
        /**
         * Check existing user
         */
        const existingUser = await authRepository.findUserByEmail(data.email);

        if (existingUser) {
            throw new AppError(
                "User already exists.",
                HTTP_STATUS.CONFLICT
            );
        }

        const hashedPassword = await hashPassword(data.password);

        const user = await authRepository.createUser({
            ...data,
            password: hashedPassword,
        });

        return user;
    }
}

const authService = new AuthService();
export default authService;