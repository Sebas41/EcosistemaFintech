import { Prisma } from "@prisma/client";
import type { Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { ZodError, z } from "zod";
import { AppError, asyncHandler, errorHandler, notFound } from "../src/errors.js";

describe("AppError", () => {
  it("creates error with status, message and default code", () => {
    const error = new AppError(400, "Bad request");
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe("Bad request");
    expect(error.code).toBe("APP_ERROR");
  });

  it("accepts custom code", () => {
    const error = new AppError(401, "Unauthorized", "INVALID_CREDENTIALS");
    expect(error.code).toBe("INVALID_CREDENTIALS");
  });

  it("is instance of AppError and Error", () => {
    const error = new AppError(500, "Server error");
    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(Error);
  });
});

describe("notFound", () => {
  it("returns AppError with 404 and default message", () => {
    const error = notFound();
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe("Resource not found");
    expect(error.code).toBe("NOT_FOUND");
  });

  it("accepts custom message", () => {
    const error = notFound("Transaction not found");
    expect(error.message).toBe("Transaction not found");
  });
});

describe("asyncHandler", () => {
  it("calls next with error when handler rejects", async () => {
    const handler = asyncHandler(async () => {
      throw new AppError(403, "Forbidden", "FORBIDDEN");
    });

    const next = vi.fn();
    const req = {} as Request;
    const res = {} as Response;

    await handler(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(AppError));
  });

  it("calls next with error when handler throws sync", async () => {
    const handler = asyncHandler(async () => {
      throw new Error("Sync error");
    });

    const next = vi.fn();
    await handler({} as Request, {} as Response, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe("errorHandler", () => {
  function buildRes() {
    const json = vi.fn().mockReturnThis();
    const status = vi.fn().mockReturnValue({ json });
    return { status, json } as unknown as Response;
  }

  it("handles AppError with correct status and code", () => {
    const res = buildRes();
    errorHandler(new AppError(401, "Bad credentials", "INVALID_CREDENTIALS"), {} as Request, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(401);
    expect((res.status as ReturnType<typeof vi.fn>).mock.results[0].value.json).toHaveBeenCalledWith({
      error: "INVALID_CREDENTIALS",
      message: "Bad credentials"
    });
  });

  it("handles ZodError with 400 and validation details", () => {
    const schema = z.object({ name: z.string().min(1) });
    let zodError: ZodError;
    try {
      schema.parse({ name: "" });
    } catch (e) {
      zodError = e as ZodError;
    }

    const res = buildRes();
    errorHandler(zodError!, {} as Request, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    const callArg = (res.status as ReturnType<typeof vi.fn>).mock.results[0].value.json.mock.calls[0][0];
    expect(callArg.error).toBe("VALIDATION_ERROR");
  });

  it("handles Prisma P2002 unique constraint with 409", () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError("Unique constraint", {
      code: "P2002",
      clientVersion: "6.9.0"
    });

    const res = buildRes();
    errorHandler(prismaError, {} as Request, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it("handles Prisma P2003 foreign key with 409", () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError("Foreign key constraint", {
      code: "P2003",
      clientVersion: "6.9.0"
    });

    const res = buildRes();
    errorHandler(prismaError, {} as Request, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it("handles unknown error with 500", () => {
    const res = buildRes();
    errorHandler(new Error("Something went wrong"), {} as Request, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
