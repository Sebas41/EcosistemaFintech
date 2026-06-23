import type { Category, Prisma, Transaction } from "@prisma/client";

export function toMoney(value: Prisma.Decimal | number) {
  return Number(value);
}

export function mapCategory(category: Category) {
  return {
    id: category.id,
    name: category.name,
    monthlyBudget: toMoney(category.monthlyBudget),
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString()
  };
}

export function mapTransaction(transaction: Transaction) {
  return {
    id: transaction.id,
    type: transaction.type,
    amount: toMoney(transaction.amount),
    description: transaction.description,
    categoryId: transaction.categoryId,
    date: transaction.date.toISOString(),
    createdAt: transaction.createdAt.toISOString(),
    updatedAt: transaction.updatedAt.toISOString()
  };
}
