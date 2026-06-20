import { describe, expect, it } from "vitest";
import { boundsFromMonth } from "../src/budget.js";
import { transactionCreateSchema } from "../src/validation.js";

describe("boundsFromMonth", () => {
  it("builds UTC month bounds from YYYY-MM", () => {
    const { start, end } = boundsFromMonth("2026-06");
    expect(start.toISOString()).toBe("2026-06-01T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-07-01T00:00:00.000Z");
  });

  it("handles December to January rollover", () => {
    const { start, end } = boundsFromMonth("2026-12");
    expect(start.toISOString()).toBe("2026-12-01T00:00:00.000Z");
    expect(end.toISOString()).toBe("2027-01-01T00:00:00.000Z");
  });

  it("handles leap year February", () => {
    const { start, end } = boundsFromMonth("2024-02");
    expect(start.toISOString()).toBe("2024-02-01T00:00:00.000Z");
    expect(end.toISOString()).toBe("2024-03-01T00:00:00.000Z");
  });

  it("returns current month bounds when no argument given", () => {
    const now = new Date();
    const { start, end } = boundsFromMonth();
    expect(start.getUTCFullYear()).toBe(now.getUTCFullYear());
    expect(start.getUTCMonth()).toBe(now.getUTCMonth());
    expect(start.getUTCDate()).toBe(1);
    expect(end.getUTCDate()).toBe(1);
    expect(end.getUTCMonth()).toBe(now.getUTCMonth() + 1 > 11 ? 0 : now.getUTCMonth() + 1);
  });

  it("throws on invalid month format", () => {
    expect(() => boundsFromMonth("invalid")).toThrow("Invalid month format");
    expect(() => boundsFromMonth("2026/06")).toThrow();
  });
});

describe("transaction validation", () => {
  it("rejects negative amounts", () => {
    const result = transactionCreateSchema.safeParse({
      type: "EXPENSE",
      amount: -1,
      description: "Taxi",
      categoryId: "cat_1",
      date: "2026-06-18"
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid expense", () => {
    const result = transactionCreateSchema.safeParse({
      type: "EXPENSE",
      amount: 50000,
      description: "Taxi ride",
      categoryId: "cat_1",
      date: "2026-06-18"
    });
    expect(result.success).toBe(true);
  });

  it("rejects description too short", () => {
    const result = transactionCreateSchema.safeParse({
      type: "EXPENSE",
      amount: 10000,
      description: "X",
      categoryId: "cat_1",
      date: "2026-06-18"
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid date", () => {
    const result = transactionCreateSchema.safeParse({
      type: "EXPENSE",
      amount: 10000,
      description: "Test",
      categoryId: "cat_1",
      date: "not-a-date"
    });
    expect(result.success).toBe(false);
  });
});
