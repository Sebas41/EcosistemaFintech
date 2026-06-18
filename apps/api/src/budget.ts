import type { PrismaClient } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { toMoney } from "./mappers.js";

export type BudgetAlert = {
  level: "NONE" | "OVER_80" | "OVER_100";
  message: string;
  categoryId: string;
  categoryName: string;
  monthlyBudget: number;
  spent: number;
  usagePercent: number;
};

function monthBounds(date: Date) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
  return { start, end };
}

export function boundsFromMonth(month?: string) {
  if (!month) {
    return monthBounds(new Date());
  }

  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) {
    throw new Error("Invalid month format");
  }

  const year = Number(match[1]);
  const monthNumber = Number(match[2]);
  return monthBounds(new Date(Date.UTC(year, monthNumber - 1, 1)));
}

export async function getBudgetAlert(
  prisma: PrismaClient,
  userId: string,
  categoryId: string,
  date: Date
): Promise<BudgetAlert | null> {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, userId }
  });

  if (!category || category.monthlyBudget.lte(0)) {
    return null;
  }

  const { start, end } = monthBounds(date);
  const aggregate = await prisma.transaction.aggregate({
    where: {
      userId,
      categoryId,
      type: "EXPENSE",
      date: {
        gte: start,
        lt: end
      }
    },
    _sum: {
      amount: true
    }
  });

  const spent = toMoney(aggregate._sum.amount ?? new Prisma.Decimal(0));
  const monthlyBudget = toMoney(category.monthlyBudget);
  const usagePercent = monthlyBudget > 0 ? Math.round((spent / monthlyBudget) * 10000) / 100 : 0;
  const level = usagePercent >= 100 ? "OVER_100" : usagePercent >= 80 ? "OVER_80" : "NONE";

  if (level === "NONE") {
    return null;
  }

  return {
    level,
    message:
      level === "OVER_100"
        ? "Monthly category budget exceeded"
        : "Monthly category budget usage is over 80%",
    categoryId,
    categoryName: category.name,
    monthlyBudget,
    spent,
    usagePercent
  };
}
