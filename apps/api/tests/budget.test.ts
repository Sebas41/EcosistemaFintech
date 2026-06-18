import { describe, expect, it } from "vitest";
import { boundsFromMonth } from "../src/budget.js";
import { transactionCreateSchema } from "../src/validation.js";

describe("budget helpers", () => {
  it("builds UTC month bounds from YYYY-MM", () => {
    const { start, end } = boundsFromMonth("2026-06");

    expect(start.toISOString()).toBe("2026-06-01T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-07-01T00:00:00.000Z");
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
});
