import { Router } from "express";
import { Prisma } from "@prisma/client";
import { requireAuth, type AuthenticatedRequest } from "./auth.js";
import { asyncHandler, notFound } from "./errors.js";
import { mapCategory, toMoney } from "./mappers.js";
import { prisma } from "./prisma.js";
import { boundsFromMonth } from "./budget.js";
import { categoryCreateSchema, categoryUpdateSchema, monthQuerySchema } from "./validation.js";

export const categoriesRouter = Router();

categoriesRouter.use(requireAuth);

function routeId(value: unknown) {
  if (typeof value !== "string") {
    throw notFound();
  }

  return value;
}

categoriesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const categories = await prisma.category.findMany({
      where: { userId: authReq.user.id },
      orderBy: { name: "asc" }
    });
    res.json({ data: categories.map(mapCategory) });
  })
);

categoriesRouter.get(
  "/status",
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const query = monthQuerySchema.parse(req.query);
    const { start, end } = boundsFromMonth(query.month);

    const categories = await prisma.category.findMany({
      where: { userId: authReq.user.id },
      orderBy: { name: "asc" }
    });

    const spentByCategory = await prisma.transaction.groupBy({
      by: ["categoryId"],
      where: {
        userId: authReq.user.id,
        type: "EXPENSE",
        date: { gte: start, lt: end }
      },
      _sum: {
        amount: true
      }
    });

    const spentMap = new Map(
      spentByCategory.map((row) => [
        row.categoryId,
        toMoney(row._sum.amount ?? new Prisma.Decimal(0))
      ])
    );

    const data = categories.map((category) => {
      const monthlyBudget = toMoney(category.monthlyBudget);
      const spent = spentMap.get(category.id) ?? 0;
      const usagePercent =
        monthlyBudget > 0 ? Math.round((spent / monthlyBudget) * 10000) / 100 : 0;
      const status = usagePercent >= 100 ? "OVER_100" : usagePercent >= 80 ? "OVER_80" : "OK";

      return {
        ...mapCategory(category),
        spent,
        usagePercent,
        status
      };
    });

    res.json({ data });
  })
);

categoriesRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const data = categoryCreateSchema.parse(req.body);
    const category = await prisma.category.create({
      data: {
        userId: authReq.user.id,
        name: data.name,
        monthlyBudget: data.monthlyBudget
      }
    });

    res.status(201).json({ data: mapCategory(category) });
  })
);

categoriesRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const data = categoryUpdateSchema.parse(req.body);
    const id = routeId(req.params.id);
    const existing = await prisma.category.findFirst({
      where: { id, userId: authReq.user.id }
    });

    if (!existing) {
      throw notFound("Category not found");
    }

    const updateData: Prisma.CategoryUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.monthlyBudget !== undefined) updateData.monthlyBudget = data.monthlyBudget;

    const category = await prisma.category.update({
      where: { id: existing.id },
      data: updateData
    });

    res.json({ data: mapCategory(category) });
  })
);

categoriesRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const id = routeId(req.params.id);
    const existing = await prisma.category.findFirst({
      where: { id, userId: authReq.user.id }
    });

    if (!existing) {
      throw notFound("Category not found");
    }

    await prisma.category.delete({ where: { id: existing.id } });
    res.status(204).send();
  })
);
