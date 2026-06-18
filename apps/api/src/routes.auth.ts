import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma.js";
import { asyncHandler, AppError } from "./errors.js";
import { loginSchema, registerSchema } from "./validation.js";
import { requireAuth, sessionCookieOptions, signSession, type AuthenticatedRequest } from "./auth.js";

export const authRouter = Router();

authRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const data = registerSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        categories: {
          createMany: {
            data: [
              { name: "Alimentacion", monthlyBudget: 600000 },
              { name: "Transporte", monthlyBudget: 250000 },
              { name: "Servicios", monthlyBudget: 400000 }
            ]
          }
        }
      }
    });

    const token = signSession({ id: user.id, email: user.email });
    res.cookie("session", token, sessionCookieOptions());
    res.status(201).json({ user: { id: user.id, email: user.email } });
  })
);

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const data = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email } });

    if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) {
      throw new AppError(401, "Invalid email or password", "INVALID_CREDENTIALS");
    }

    const token = signSession({ id: user.id, email: user.email });
    res.cookie("session", token, sessionCookieOptions());
    res.json({ user: { id: user.id, email: user.email } });
  })
);

authRouter.post("/logout", (_req, res) => {
  res.clearCookie("session", sessionCookieOptions());
  res.status(204).send();
});

authRouter.get("/me", requireAuth, (req, res) => {
  const authReq = req as AuthenticatedRequest;
  res.json({ user: authReq.user });
});
