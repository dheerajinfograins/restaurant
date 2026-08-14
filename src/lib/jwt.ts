import jwt from "jsonwebtoken";
import { JwtPayload } from "@/modules/auth/types";

const JWT_SECRET = process.env.JWT_SECRET!;

/**
 * Generate Access Token
 */
export function generateAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as jwt.SignOptions["expiresIn"],
    });
}

/**
 * Verify Access Token
 */
export function verifyAccessToken(token: string): JwtPayload {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
}