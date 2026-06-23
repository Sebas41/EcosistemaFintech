import { Router } from "express";
import type { Prisma } from "@prisma/client";
import { requireAuth, type AuthenticatedRequest } from "./auth.js";
import { getBudgetAlert } from "./budget.js";
import { asyncHandler, AppError, notFound } from "./errors.js";
import { mapTransaction, toMoney } from "./mappers.js";
import { prisma } from "./prisma.js";
import { transactionCreateSchema, transactionQuerySchema, transactionUpdateSchema } from "./validation.js";

export const transactionsRouter = Router();

transactionsRouter.use(requireAuth);

function routeId(value: unknown) {
  if (typeof value !== "string") {
    throw notFound();
  }

  return value;
}

transactionsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const query = transactionQuerySchema.parse(req.query);
    const where: Prisma.TransactionWhereInput = {
      userId: authReq.user.id,
      ...(query.type ? { type: query.type } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...((query.from || query.to)
        ? {
            date: {
              ...(query.from ? { gte: query.from } : {}),
              ...(query.to ? { lte: query.to } : {})
            }
          }
        : {})
    };

    const [items, total] = await prisma.$transaction([
      prisma.transaction.findMany({
        where,
        orderBy: { date: query.sort },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize
      }),
      prisma.transaction.count({ where })
    ]);

    res.json({
      data: items.map(mapTransaction),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize)
      }
    });
  })
);

transactionsRouter.get(
  "/summary",
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const grouped = await prisma.transaction.groupBy({
      by: ["type"],
      where: { userId: authReq.user.id },
      _sum: { amount: true }
    });

    const totals = {
      income: 0,
      expense: 0
    };

    for (const row of grouped) {
      if (row.type === "INCOME") {
        totals.income = toMoney(row._sum.amount ?? 0);
      } else {
        totals.expense = toMoney(row._sum.amount ?? 0);
      }
    }

    res.json({
      data: {
        totalIncome: totals.income,
        totalExpense: totals.expense,
        balance: totals.income - totals.expense
      }
    });
  })
);

transactionsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const data = transactionCreateSchema.parse(req.body);
    const category = await prisma.category.findFirst({
      where: { id: data.categoryId, userId: authReq.user.id }
    });

    if (!category) {
      throw new AppError(400, "Category does not belong to the current user", "INVALID_CATEGORY");
    }

    const transaction = await prisma.transaction.create({
      data: {
        ...data,
        userId: authReq.user.id
      }
    });

    const budgetAlert =
      transaction.type === "EXPENSE"
        ? await getBudgetAlert(prisma, authReq.user.id, transaction.categoryId, transaction.date)
        : null;

    res.status(201).json({
      data: mapTransaction(transaction),
      budgetAlert
    });
  })
);

transactionsRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const data = transactionUpdateSchema.parse(req.body);
    const id = routeId(req.params.id);
    const existing = await prisma.transaction.findFirst({
      where: { id, userId: authReq.user.id }
    });

    if (!existing) {
      throw notFound("Transaction not found");
    }

    if (data.categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: data.categoryId, userId: authReq.user.id }
      });
      if (!category) {
        throw new AppError(400, "Category does not belong to the current user", "INVALID_CATEGORY");
      }
    }

    const updateData: Prisma.TransactionUncheckedUpdateInput = {};
    if (data.type !== undefined) updateData.type = data.type;
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.date !== undefined) updateData.date = data.date;

    const transaction = await prisma.transaction.update({
      where: { id: existing.id },
      data: updateData
    });

    const budgetAlert =
      transaction.type === "EXPENSE"
        ? await getBudgetAlert(prisma, authReq.user.id, transaction.categoryId, transaction.date)
        : null;

    res.json({
      data: mapTransaction(transaction),
      budgetAlert
    });
  })
);

transactionsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const id = routeId(req.params.id);
    const existing = await prisma.transaction.findFirst({
      where: { id, userId: authReq.user.id }
    });

    if (!existing) {
      throw notFound("Transaction not found");
    }

    await prisma.transaction.delete({ where: { id: existing.id } });
    res.status(204).send();
  })
);
