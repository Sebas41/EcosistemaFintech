import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "./client";

function mockFetch(status: number, body: unknown, headers?: Record<string, string>) {
  const responseHeaders = new Headers(headers);
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    headers: responseHeaders,
    json: () => Promise.resolve(body)
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("api client", () => {
  describe("me", () => {
    it("returns user data", async () => {
      mockFetch(200, { user: { id: "1", email: "test@test.com" } });
      const result = await api.me();
      expect(result.user.email).toBe("test@test.com");
    });
  });

  describe("register", () => {
    it("sends POST with email and password", async () => {
      mockFetch(201, { user: { id: "1", email: "a@b.com" } });

      await api.register("a@b.com", "password123!");
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/auth/register"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ email: "a@b.com", password: "password123!" })
        })
      );
    });
  });

  describe("login", () => {
    it("sends POST with email and password", async () => {
      mockFetch(200, { user: { id: "1", email: "a@b.com" } });

      await api.login("a@b.com", "secret");
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/auth/login"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ email: "a@b.com", password: "secret" })
        })
      );
    });
  });

  describe("logout", () => {
    it("sends POST and returns void on 204", async () => {
      mockFetch(204, undefined);
      const result = await api.logout();
      expect(result).toBeUndefined();
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/auth/logout"),
        expect.objectContaining({ method: "POST" })
      );
    });
  });

  describe("categories", () => {
    it("fetches categories list", async () => {
      mockFetch(200, { data: [{ id: "1", name: "Food", monthlyBudget: 500000 }] });
      const result = await api.categories();
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe("Food");
    });
  });

  describe("categoryStatus", () => {
    it("fetches categories with budget status", async () => {
      mockFetch(200, {
        data: [{ id: "1", name: "Food", monthlyBudget: 500000, spent: 100000, usagePercent: 20, status: "OK" }]
      });
      const result = await api.categoryStatus();
      expect(result.data[0].status).toBe("OK");
    });
  });

  describe("createCategory", () => {
    it("sends POST with name and budget", async () => {
      mockFetch(201, { data: { id: "1", name: "New Cat", monthlyBudget: 300000 } });
      const result = await api.createCategory({ name: "New Cat", monthlyBudget: 300000 });
      expect(result.data.name).toBe("New Cat");
    });
  });

  describe("updateCategory", () => {
    it("sends PATCH with updated fields", async () => {
      mockFetch(200, { data: { id: "1", name: "Updated", monthlyBudget: 500000 } });
      const result = await api.updateCategory("1", { name: "Updated" });
      expect(result.data.name).toBe("Updated");
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/categories/1"),
        expect.objectContaining({ method: "PATCH" })
      );
    });
  });

  describe("deleteCategory", () => {
    it("sends DELETE and returns void on 204", async () => {
      mockFetch(204, undefined);
      const result = await api.deleteCategory("1");
      expect(result).toBeUndefined();
    });
  });

  describe("summary", () => {
    it("returns balance summary", async () => {
      mockFetch(200, { data: { totalIncome: 5000, totalExpense: 3000, balance: 2000 } });
      const result = await api.summary();
      expect(result.data.balance).toBe(2000);
    });
  });

  describe("transactions", () => {
    it("fetches paginated transactions", async () => {
      mockFetch(200, {
        data: [{ id: "1", type: "EXPENSE", amount: 50000, description: "Test", categoryId: "c1", date: "2026-06-18" }],
        meta: { page: 1, pageSize: 20, total: 1 }
      });
      const result = await api.transactions("?page=1");
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe("createTransaction", () => {
    it("sends POST with transaction data and returns budgetAlert", async () => {
      mockFetch(201, {
        data: { id: "1", type: "EXPENSE", amount: 100000, description: "Test", categoryId: "c1", date: "2026-06-18" },
        budgetAlert: null
      });
      const result = await api.createTransaction({
        type: "EXPENSE", amount: 100000, description: "Test", categoryId: "c1", date: "2026-06-18"
      });
      expect(result.budgetAlert).toBeNull();
    });

    it("sends POST with income type", async () => {
      mockFetch(201, {
        data: { id: "2", type: "INCOME", amount: 2000000, description: "Salary", categoryId: "c1", date: "2026-06-01" },
        budgetAlert: null
      });
      const result = await api.createTransaction({
        type: "INCOME", amount: 2000000, description: "Salary", categoryId: "c1", date: "2026-06-01"
      });
      expect(result.data.type).toBe("INCOME");
    });
  });

  describe("updateTransaction", () => {
    it("sends PATCH with updated transaction data", async () => {
      mockFetch(200, {
        data: { id: "1", type: "EXPENSE", amount: 120000, description: "Updated", categoryId: "c1", date: "2026-06-18" },
        budgetAlert: null
      });
      const result = await api.updateTransaction("1", { amount: 120000 });
      expect(result.data.amount).toBe(120000);
    });
  });

  describe("deleteTransaction", () => {
    it("sends DELETE and returns void on 204", async () => {
      mockFetch(204, undefined);
      const result = await api.deleteTransaction("1");
      expect(result).toBeUndefined();
    });
  });

  describe("error handling", () => {
    it("throws an error when response is not ok", async () => {
      mockFetch(400, { message: "Bad request" });
      await expect(api.me()).rejects.toThrow("Bad request");
    });

    it("throws generic error when body has no message", async () => {
      mockFetch(500, {});
      await expect(api.me()).rejects.toThrow("Request failed");
    });
  });

  describe("credentials", () => {
    it("includes credentials: include in every request", async () => {
      mockFetch(200, { user: { id: "1", email: "a@b.com" } });
      await api.me();
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ credentials: "include" })
      );
    });
  });
});
