import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code = "APP_ERROR"
  ) {
    super(message);
  }
}

export function notFound(message = "Resource not found") {
  return new AppError(404, message, "NOT_FOUND");
}

export function asyncHandler<T extends Request>(
  handler: (req: T, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: T, res: Response, next: NextFunction) => {
    handler(req, res, next).catch(next);
  };
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.code, message: err.message });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "VALIDATION_ERROR",
      message: "Invalid request data",
      details: err.flatten()
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return res.status(409).json({
        error: "CONFLICT",
        message: "A record with the same unique value already exists"
      });
    }

    if (err.code === "P2003" || err.code === "P2014") {
      return res.status(409).json({
        error: "CONSTRAINT_ERROR",
        message: "The operation violates a database relationship constraint"
      });
    }
  }

  console.error(err);
  return res.status(500).json({
    error: "INTERNAL_SERVER_ERROR",
    message: "Unexpected server error"
  });
}
