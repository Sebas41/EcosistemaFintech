import { describe, expect, it } from "vitest";
import {
  registerSchema,
  loginSchema,
  categoryCreateSchema,
  categoryUpdateSchema,
  transactionCreateSchema,
  transactionUpdateSchema,
  transactionQuerySchema,
  monthQuerySchema
} from "../src/validation.js";

describe("registerSchema", () => {
  const valid = { email: "User@Example.COM", password: "abcdefghij" };

  it("accepts valid input", () => {
    const result = registerSchema.parse(valid);
    expect(result.email).toBe("user@example.com");
    expect(result.password).toBe("abcdefghij");
  });

  it("rejects invalid email", () => {
    expect(() => registerSchema.parse({ ...valid, email: "not-an-email" })).toThrow();
  });

  it("rejects password shorter than 10", () => {
    expect(() => registerSchema.parse({ ...valid, password: "short" })).toThrow();
  });

  it("rejects password longer than 128", () => {
    expect(() => registerSchema.parse({ ...valid, password: "x".repeat(129) })).toThrow();
  });

  it("transforms email to lowercase", () => {
    const result = registerSchema.parse({ ...valid, email: "Foo.Bar@TEST.COM" });
    expect(result.email).toBe("foo.bar@test.com");
  });
});

describe("loginSchema", () => {
  it("uses the same shape as registerSchema", () => {
    const result = loginSchema.parse({ email: "a@b.com", password: "x".repeat(10) });
    expect(result.email).toBe("a@b.com");
    expect(result.password).toBe("x".repeat(10));
  });
});

describe("categoryCreateSchema", () => {
  const valid = { name: "  Alimentacion  ", monthlyBudget: "500000" };

  it("accepts valid input and trims name", () => {
    const result = categoryCreateSchema.parse(valid);
    expect(result.name).toBe("Alimentacion");
    expect(result.monthlyBudget).toBe(500000);
  });

  it("rejects name shorter than 2", () => {
    expect(() => categoryCreateSchema.parse({ ...valid, name: "X" })).toThrow();
  });

  it("rejects name longer than 80", () => {
    expect(() => categoryCreateSchema.parse({ ...valid, name: "X".repeat(81) })).toThrow();
  });

  it("rejects non-positive budget", () => {
    expect(() => categoryCreateSchema.parse({ ...valid, monthlyBudget: "0" })).toThrow();
    expect(() => categoryCreateSchema.parse({ ...valid, monthlyBudget: "-100" })).toThrow();
  });

  it("rejects budget exceeding max", () => {
    expect(() => categoryCreateSchema.parse({ ...valid, monthlyBudget: "9999999999999.99" })).toThrow();
  });

  it("coerces string budget to number", () => {
    const result = categoryCreateSchema.parse({ name: "Test", monthlyBudget: "250000" });
    expect(result.monthlyBudget).toBe(250000);
  });
});

describe("categoryUpdateSchema", () => {
  it("allows partial updates", () => {
    const nameOnly = categoryUpdateSchema.parse({ name: "New Name" });
    expect(nameOnly.name).toBe("New Name");
    expect(nameOnly.monthlyBudget).toBeUndefined();
  });

  it("rejects invalid field in partial update", () => {
    expect(() => categoryUpdateSchema.parse({ name: "" })).toThrow();
  });

  it("accepts empty object", () => {
    const result = categoryUpdateSchema.parse({});
    expect(Object.keys(result).length).toBe(0);
  });
});

describe("transactionCreateSchema", () => {
  const valid = {
    type: "EXPENSE",
    amount: "150000",
    description: "  Compra mercado  ",
    categoryId: "cat_123",
    date: "2026-06-18"
  };

  it("accepts valid input and trims description", () => {
    const result = transactionCreateSchema.parse(valid);
    expect(result.type).toBe("EXPENSE");
    expect(result.amount).toBe(150000);
    expect(result.description).toBe("Compra mercado");
    expect(result.categoryId).toBe("cat_123");
    expect(result.date).toBeInstanceOf(Date);
  });

  it("accepts ISO datetime string", () => {
    const result = transactionCreateSchema.parse({
      ...valid,
      date: "2026-06-18T12:00:00.000Z"
    });
    expect(result.date).toBeInstanceOf(Date);
  });

  it("rejects invalid type", () => {
    expect(() =>
      transactionCreateSchema.parse({ ...valid, type: "SAVING" })
    ).toThrow();
  });

  it("rejects negative amount", () => {
    expect(() =>
      transactionCreateSchema.parse({ ...valid, amount: "-1" })
    ).toThrow();
  });

  it("rejects zero amount", () => {
    expect(() =>
      transactionCreateSchema.parse({ ...valid, amount: "0" })
    ).toThrow();
  });

  it("rejects description shorter than 2", () => {
    expect(() =>
      transactionCreateSchema.parse({ ...valid, description: "A" })
    ).toThrow();
  });

  it("rejects description longer than 240", () => {
    expect(() =>
      transactionCreateSchema.parse({ ...valid, description: "A".repeat(241) })
    ).toThrow();
  });

  it("rejects empty categoryId", () => {
    expect(() =>
      transactionCreateSchema.parse({ ...valid, categoryId: "" })
    ).toThrow();
  });

  it("rejects invalid date string", () => {
    expect(() =>
      transactionCreateSchema.parse({ ...valid, date: "not-a-date" })
    ).toThrow();
  });

  it("accepts INCOME type", () => {
    const result = transactionCreateSchema.parse({ ...valid, type: "INCOME" });
    expect(result.type).toBe("INCOME");
  });
});

describe("transactionUpdateSchema", () => {
  it("allows partial updates", () => {
    const descOnly = transactionUpdateSchema.parse({ description: "Updated" });
    expect(descOnly.description).toBe("Updated");
    expect(descOnly.amount).toBeUndefined();
  });

  it("rejects invalid field in partial update", () => {
    expect(() => transactionUpdateSchema.parse({ type: "SAVING" })).toThrow();
  });
});

describe("transactionQuerySchema", () => {
  it("provides defaults", () => {
    const result = transactionQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
    expect(result.sort).toBe("desc");
  });

  it("coerces string numbers", () => {
    const result = transactionQuerySchema.parse({ page: "3", pageSize: "10" });
    expect(result.page).toBe(3);
    expect(result.pageSize).toBe(10);
  });

  it("rejects pageSize over 100", () => {
    expect(() => transactionQuerySchema.parse({ pageSize: "200" })).toThrow();
  });

  it("accepts optional filters", () => {
    const result = transactionQuerySchema.parse({
      type: "INCOME",
      categoryId: "cat_1",
      from: "2026-01-01",
      to: "2026-12-31"
    });
    expect(result.type).toBe("INCOME");
    expect(result.categoryId).toBe("cat_1");
    expect(result.from).toBeInstanceOf(Date);
    expect(result.to).toBeInstanceOf(Date);
  });

  it("transforms from/to to Date when present", () => {
    const withoutRange = transactionQuerySchema.parse({});
    expect(withoutRange.from).toBeUndefined();
    expect(withoutRange.to).toBeUndefined();
  });

  it("accepts asc sort", () => {
    const result = transactionQuerySchema.parse({ sort: "asc" });
    expect(result.sort).toBe("asc");
  });

  it("rejects invalid sort value", () => {
    expect(() => transactionQuerySchema.parse({ sort: "invalid" })).toThrow();
  });
});

describe("monthQuerySchema", () => {
  it("accepts valid YYYY-MM format", () => {
    const result = monthQuerySchema.parse({ month: "2026-06" });
    expect(result.month).toBe("2026-06");
  });

  it("accepts empty query", () => {
    const result = monthQuerySchema.parse({});
    expect(result.month).toBeUndefined();
  });

  it("rejects invalid format", () => {
    expect(() => monthQuerySchema.parse({ month: "2026/06" })).toThrow();
    expect(() => monthQuerySchema.parse({ month: "2026-1" })).toThrow();
    expect(() => monthQuerySchema.parse({ month: "abc" })).toThrow();
  });
});
