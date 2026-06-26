import type { NextFunction, Request, Response } from "express";
import type { SignOptions } from "jsonwebtoken";
import jwt from "jsonwebtoken";
import { config } from "./config.js";
import { AppError } from "./errors.js";

export type AuthUser = {
  id: string;
  email: string;
};

export type AuthenticatedRequest = Request & {
  user: AuthUser;
};

type JwtPayload = {
  sub: string;
  email: string;
};

export function signSession(user: AuthUser) {
  const options: SignOptions = {
    subject: user.id,
    expiresIn: config.JWT_EXPIRES_IN as NonNullable<SignOptions["expiresIn"]>
  };

  return jwt.sign({ email: user.email }, config.JWT_SECRET, {
    ...options
  });
}

function parseExpiresIn(value: string): number {
  const match = value.match(/^(\d+)\s*(s|m|h|d)$/);
  if (!match) return 1000 * 60 * 60 * 2;
  const n = parseInt(match[1]!, 10);
  const unit = match[2]!;
  const multipliers: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return n * (multipliers[unit] ?? 3600000);
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: config.COOKIE_SECURE ? "none" as const : "lax" as const,
    secure: config.COOKIE_SECURE,
    maxAge: parseExpiresIn(config.JWT_EXPIRES_IN ?? "2h")
  };
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token =
    req.cookies?.session ??
    (typeof req.headers.authorization === "string"
      ? req.headers.authorization.replace(/^Bearer\s+/i, "")
      : undefined);

  if (!token) {
    return next(new AppError(401, "Authentication required", "UNAUTHENTICATED"));
  }

  try {
    const payload = jwt.verify(token, config.JWT_SECRET) as JwtPayload;
    if (!payload.sub || !payload.email) {
      throw new Error("Missing token claims");
    }

    (req as AuthenticatedRequest).user = {
      id: payload.sub,
      email: payload.email
    };
    return next();
  } catch {
    return next(new AppError(401, "Invalid or expired session", "INVALID_SESSION"));
  }
}
