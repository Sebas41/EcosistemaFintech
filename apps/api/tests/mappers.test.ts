import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { mapCategory, mapTransaction, toMoney } from "../src/mappers.js";

describe("toMoney", () => {
  it("converts Decimal to number", () => {
    const decimal = new Prisma.Decimal("150000.50");
    expect(toMoney(decimal)).toBe(150000.5);
  });

  it("passes through a plain number", () => {
    expect(toMoney(42000)).toBe(42000);
  });

  it("handles zero", () => {
    expect(toMoney(new Prisma.Decimal(0))).toBe(0);
  });
});

describe("mapCategory", () => {
  const base = {
    id: "cat_1",
    name: "Alimentacion",
    monthlyBudget: new Prisma.Decimal("500000"),
    createdAt: new Date("2026-01-15T10:00:00Z"),
    updatedAt: new Date("2026-06-20T12:00:00Z")
  };

  it("returns correct shape with number budget", () => {
    const result = mapCategory(base);
    expect(result).toEqual({
      id: "cat_1",
      name: "Alimentacion",
      monthlyBudget: 500000,
      createdAt: "2026-01-15T10:00:00.000Z",
      updatedAt: "2026-06-20T12:00:00.000Z"
    });
  });

  it("handles zero budget", () => {
    const result = mapCategory({ ...base, monthlyBudget: new Prisma.Decimal(0) });
    expect(result.monthlyBudget).toBe(0);
  });
});

describe("mapTransaction", () => {
  const base = {
    id: "txn_1",
    type: "EXPENSE" as const,
    amount: new Prisma.Decimal("120000"),
    description: "Supermarket",
    categoryId: "cat_1",
    date: new Date("2026-06-18"),
    createdAt: new Date("2026-06-18T14:30:00Z"),
    updatedAt: new Date("2026-06-18T14:30:00Z"),
    userId: "user_1"
  };

  it("returns correct shape with all fields", () => {
    const result = mapTransaction(base);
    expect(result).toEqual({
      id: "txn_1",
      type: "EXPENSE",
      amount: 120000,
      description: "Supermarket",
      categoryId: "cat_1",
      date: "2026-06-18T00:00:00.000Z",
      createdAt: "2026-06-18T14:30:00.000Z",
      updatedAt: "2026-06-18T14:30:00.000Z"
    });
  });

  it("handles INCOME type", () => {
    const result = mapTransaction({ ...base, type: "INCOME", amount: new Prisma.Decimal("2000000") });
    expect(result.type).toBe("INCOME");
    expect(result.amount).toBe(2000000);
  });

  it("handles decimal amounts correctly", () => {
    const result = mapTransaction({ ...base, amount: new Prisma.Decimal("99.99") });
    expect(result.amount).toBe(99.99);
  });
});
