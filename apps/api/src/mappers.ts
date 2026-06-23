import type { Category, Transaction } from "@prisma/client";

export function toMoney(value: number | { toNumber: () => number }) {
  return typeof value === "number" ? value : value.toNumber();
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
