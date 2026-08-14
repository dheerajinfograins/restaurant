import { NextResponse } from "next/server";
import { ZodError, flattenError } from "zod";
import { AppError } from "@/exceptions";

export function handleError(error: unknown) {
  // Custom Application Error
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
        errors: error.errors ?? null,
      },
      {
        status: error.statusCode,
      }
    );
  }

  // Zod Validation Error
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        message: "Validation failed.",
        errors: flattenError(error).fieldErrors,
      },
      {
        status: 400,
      }
    );
  }

  console.error(error);

  return NextResponse.json(
    {
      success: false,
      message: "Internal Server Error",
    },
    {
      status: 500,
    }
  );
}
