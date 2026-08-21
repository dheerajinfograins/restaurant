import { NextResponse } from "next/server";
import { ZodError, flattenError } from "zod";
import { AppError } from "@/exceptions";
import { Prisma } from "@prisma/client";

function getDuplicateFieldName(metaTarget?: unknown): string {
  let rawTarget = "field";

  if (Array.isArray(metaTarget)) {
    rawTarget = metaTarget.join(", ");
  } else if (typeof metaTarget === "string") {
    rawTarget = metaTarget;
  }

  const lowerTarget = rawTarget.toLowerCase();
  if (lowerTarget.includes("email")) return "Email address";
  if (lowerTarget.includes("phone")) return "Phone number";
  if (lowerTarget.includes("table")) return "Table number";
  if (lowerTarget.includes("name")) return "Name";

  return rawTarget;
}

function handlePrismaKnownRequestError(error: Prisma.PrismaClientKnownRequestError): NextResponse {
  console.error("Prisma Known Request Error:", error.code, error.message);

  if (error.code === "P2002") {
    const fieldName = getDuplicateFieldName(error.meta?.target);
    return NextResponse.json(
      {
        success: false,
        message: `This ${fieldName} is already registered with another account. Please use a different value.`,
      },
      { status: 409 }
    );
  }

  if (error.code === "P2025") {
    return NextResponse.json(
      {
        success: false,
        message: "The requested record was not found.",
      },
      { status: 404 }
    );
  }

  const isForeignKeyViolation =
    error.code === "P2003" ||
    error.code === "P2039" ||
    error.message.includes("violates RESTRICT") ||
    error.message.includes("foreign key constraint");

  if (isForeignKeyViolation) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Cannot delete or modify this item because it is referenced by existing order history or other records. Consider deactivating or marking it inactive instead.",
      },
      { status: 400 }
    );
  }

  return NextResponse.json(
    {
      success: false,
      message: "A database error occurred. Please try again.",
    },
    { status: 400 }
  );
}

function getUnhandledErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Internal Server Error";
  }

  const isDevSchemaError =
    error.message.includes("Invalid `") ||
    error.message.includes("invocation in") ||
    error.message.includes("__TURBOPACK__");

  if (isDevSchemaError) {
    return "Database update error. Please restart your dev server to apply latest schema changes.";
  }

  return error.message;
}

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

  // Prisma Database Errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaKnownRequestError(error);
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    console.error("Prisma Initialization Error (DB unreachable):", error.message);
    return NextResponse.json(
      {
        success: false,
        message: "Database connection failed. Please ensure PostgreSQL is running.",
      },
      { status: 503 }
    );
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    console.error("Prisma Validation Error:", error.message);
    return NextResponse.json(
      {
        success: false,
        message: "Database schema validation error. If you updated the schema, please restart your development server.",
      },
      { status: 400 }
    );
  }

  console.error("Unhandled API Error:", error);

  return NextResponse.json(
    {
      success: false,
      message: getUnhandledErrorMessage(error),
    },
    {
      status: 500,
    }
  );
}


