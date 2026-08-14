import { LoginDto, CreateUserDto } from "./dto";
import authService from "./service";
import { loginSchema, createUserSchema } from "./validation";
import { successResponse } from "@/lib/api-response";
import { AUTH_MESSAGES } from "./constants";

class AuthController {
    /**
     * Login
     */
    async login(body: LoginDto) {
        // Validate Request
        const validatedData = loginSchema.parse(body);

        // Business Logic
        const result = await authService.login(validatedData);

        return result;
    }

    /**
     * Create User
     */
    async createUser(body: CreateUserDto) {
        // Validate Request
        const validatedData = createUserSchema.parse(body);

        // Business Logic
        const result = await authService.createUser(validatedData);

        return successResponse(
            AUTH_MESSAGES.USER_CREATED,
            result
        );
    }
}

const authController = new AuthController();
export default authController;
