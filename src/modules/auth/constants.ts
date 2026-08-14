/**
 * Authentication Messages
 */
export const AUTH_MESSAGES = {
    LOGIN_SUCCESS: "Login successful.",
    LOGOUT_SUCCESS: "Logout successful.",

    USER_CREATED: "User created successfully.",
    USER_UPDATED: "User updated successfully.",
    USER_DELETED: "User deleted successfully.",

    INVALID_CREDENTIALS: "Invalid email or password.",
    USER_NOT_FOUND: "User not found.",
    USER_ALREADY_EXISTS: "User already exists.",
    USER_INACTIVE: "User account is inactive.",

    UNAUTHORIZED: "Unauthorized access.",
    FORBIDDEN: "You do not have permission to perform this action.",

    TOKEN_EXPIRED: "Token has expired.",
    INVALID_TOKEN: "Invalid token.",
} as const;

/**
 * JWT Configuration
 */
export const JWT_CONFIG = {
    ACCESS_TOKEN_EXPIRES_IN: "7d",
    REFRESH_TOKEN_EXPIRES_IN: "30d",
} as const;

/**
 * Password Rules
 */
export const PASSWORD_RULES = {
    MIN_LENGTH: 8,
    MAX_LENGTH: 100,
} as const;

/**
 * Cookie Configuration
 */
export const COOKIE_CONFIG = {
    ACCESS_TOKEN: "restaurant_access_token",
    REFRESH_TOKEN: "restaurant_refresh_token",

    MAX_AGE: 7 * 24 * 60 * 60 * 1000, // 7 Days
} as const;