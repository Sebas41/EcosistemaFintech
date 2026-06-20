import type { Express } from "express";
import { PrismaClient } from "@prisma/client";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import {
  cleanDatabase,
  createPrisma,
  createTestCategory,
  createTestUser,
  TEST_EMAIL,
  TEST_PASSWORD
} from "./setup.js";

describe("Transactions routes — integration", () => {
  let app: Express;
  let prisma: PrismaClient;
  let cookie: string;

  beforeAll(async () => {
    app = createApp();
    prisma = createPrisma();
    await cleanDatabase(prisma);
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await prisma.$disconnect();
  });

  async function seedBase() {
    await cleanDatabase(prisma);
    const user = await createTestUser(prisma);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });
    cookie = res.headers["set-cookie"][0];

    const cat1 = await createTestCategory(prisma, user.id, { name: "Food", monthlyBudget: 500000 });
    const cat2 = await createTestCategory(prisma, user.id, { name: "Transport", monthlyBudget: 300000 });
    return { userId: user.id, categoryId: cat1.id, categoryId2: cat2.id };
  }

  describe("POST /api/transactions", () => {
    let userId: string;
    let categoryId: string;

    beforeEach(async () => {
      const data = await seedBase();
      userId = data.userId;
      categoryId = data.categoryId;
    });

    it("creates an expense transaction", async () => {
      const res = await request(app)
        .post("/api/transactions")
        .set("Cookie", cookie)
        .send({
          type: "EXPENSE",
          amount: 150000,
          description: "Supermarket",
          categoryId,
          date: "2026-06-18"
        });

      expect(res.status).toBe(201);
      expect(res.body.data.type).toBe("EXPENSE");
      expect(res.body.data.amount).toBe(150000);
      expect(res.body.data.description).toBe("Supermarket");
      expect(res.body.data.categoryId).toBe(categoryId);
    });

    it("creates an income transaction", async () => {
      const res = await request(app)
        .post("/api/transactions")
        .set("Cookie", cookie)
        .send({
          type: "INCOME",
          amount: 2000000,
          description: "Salary",
          categoryId,
          date: "2026-06-01"
        });

      expect(res.status).toBe(201);
      expect(res.body.data.type).toBe("INCOME");
      expect(res.body.data.amount).toBe(2000000);
    });

    it("returns budget alert when expense exceeds 80% of budget", async () => {
      const cat = await createTestCategory(prisma, userId, { name: "LowBudget", monthlyBudget: 10000 });

      const res = await request(app)
        .post("/api/transactions")
        .set("Cookie", cookie)
        .send({
          type: "EXPENSE",
          amount: 9000,
          description: "Expensive coffee",
          categoryId: cat.id,
          date: "2026-06-18"
        });

      expect(res.status).toBe(201);
      expect(res.body.budgetAlert).not.toBeNull();
      expect(res.body.budgetAlert.level).toBe("OVER_80");
    });

    it("returns 400 when category belongs to another user", async () => {
      await cleanDatabase(prisma);
      const otherUser = await createTestUser(prisma, "other-category@fintech.local");
      const otherCat = await createTestCategory(prisma, otherUser.id, { name: "OtherCat" });
      await createTestUser(prisma);
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD });
      cookie = loginRes.headers["set-cookie"][0];

      const res = await request(app)
        .post("/api/transactions")
        .set("Cookie", cookie)
        .send({
          type: "EXPENSE",
          amount: 10000,
          description: "Test",
          categoryId: otherCat.id,
          date: "2026-06-18"
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("INVALID_CATEGORY");
    });
  });

  describe("GET /api/transactions", () => {
    let categoryId: string;
    let categoryId2: string;

    beforeEach(async () => {
      const data = await seedBase();
      categoryId = data.categoryId;
      categoryId2 = data.categoryId2;

      await prisma.transaction.createMany({
        data: [
          { userId: data.userId, categoryId, type: "EXPENSE", amount: 50000, description: "Lunch", date: new Date("2026-06-10") },
          { userId: data.userId, categoryId, type: "EXPENSE", amount: 20000, description: "Coffee", date: new Date("2026-06-11") },
          { userId: data.userId, categoryId: categoryId2, type: "INCOME", amount: 3000000, description: "Salary", date: new Date("2026-06-01") }
        ]
      });
    });

    it("lists transactions with pagination defaults", async () => {
      const res = await request(app)
        .get("/api/transactions")
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(3);
      expect(res.body.meta.page).toBe(1);
      expect(res.body.meta.pageSize).toBe(20);
      expect(res.body.meta.total).toBe(3);
    });

    it("filters by type", async () => {
      const res = await request(app)
        .get("/api/transactions?type=INCOME")
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].type).toBe("INCOME");
    });

    it("filters by category", async () => {
      const res = await request(app)
        .get(`/api/transactions?categoryId=${categoryId}`)
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it("filters by date range", async () => {
      const res = await request(app)
        .get("/api/transactions?from=2026-06-10&to=2026-06-11")
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
    });

    it("sorts ascending by date", async () => {
      const res = await request(app)
        .get("/api/transactions?sort=asc")
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      const dates = res.body.data.map((t: { date: string }) => t.date);
      expect(new Date(dates[0]).getTime()).toBeLessThan(new Date(dates[1]).getTime());
    });

    it("paginates correctly", async () => {
      const res = await request(app)
        .get("/api/transactions?page=1&pageSize=2")
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.meta.totalPages).toBe(2);
    });
  });

  describe("GET /api/transactions/summary", () => {
    let userId: string;
    let categoryId: string;

    beforeEach(async () => {
      const data = await seedBase();
      userId = data.userId;
      categoryId = data.categoryId;
    });

    it("returns zero balance when no transactions exist", async () => {
      const res = await request(app)
        .get("/api/transactions/summary")
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body.data.totalIncome).toBe(0);
      expect(res.body.data.totalExpense).toBe(0);
      expect(res.body.data.balance).toBe(0);
    });

    it("calculates balance correctly", async () => {
      await prisma.transaction.createMany({
        data: [
          { userId, categoryId, type: "INCOME", amount: 3000000, description: "Salary", date: new Date("2026-06-01") },
          { userId, categoryId, type: "EXPENSE", amount: 500000, description: "Rent", date: new Date("2026-06-05") }
        ]
      });

      const res = await request(app)
        .get("/api/transactions/summary")
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body.data.totalIncome).toBe(3000000);
      expect(res.body.data.totalExpense).toBe(500000);
      expect(res.body.data.balance).toBe(2500000);
    });
  });

  describe("PATCH /api/transactions/:id", () => {
    let transactionId: string;
    let userId: string;
    let categoryId: string;

    beforeEach(async () => {
      const data = await seedBase();
      userId = data.userId;
      categoryId = data.categoryId;

      const txn = await prisma.transaction.create({
        data: {
          userId, categoryId, type: "EXPENSE", amount: 100000,
          description: "Original", date: new Date("2026-06-15")
        }
      });
      transactionId = txn.id;
    });

    it("updates a transaction", async () => {
      const res = await request(app)
        .patch(`/api/transactions/${transactionId}`)
        .set("Cookie", cookie)
        .send({ amount: 120000, description: "Updated" });

      expect(res.status).toBe(200);
      expect(res.body.data.amount).toBe(120000);
      expect(res.body.data.description).toBe("Updated");
    });

    it("returns 404 for non-existent transaction", async () => {
      const res = await request(app)
        .patch("/api/transactions/nonexistent")
        .set("Cookie", cookie)
        .send({ amount: 50000 });

      expect(res.status).toBe(404);
    });

    it("returns 404 for another user's transaction", async () => {
      const otherUser = await createTestUser(prisma, "other-patch@fintech.local");
      const otherCat = await createTestCategory(prisma, otherUser.id, { name: "OtherCategory" });
      const otherTxn = await prisma.transaction.create({
        data: {
          userId: otherUser.id, categoryId: otherCat.id, type: "EXPENSE",
          amount: 50000, description: "Other", date: new Date("2026-06-01")
        }
      });

      const res = await request(app)
        .patch(`/api/transactions/${otherTxn.id}`)
        .set("Cookie", cookie)
        .send({ amount: 60000 });

      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/transactions/:id", () => {
    let transactionId: string;
    let userId: string;
    let categoryId: string;

    beforeEach(async () => {
      const data = await seedBase();
      userId = data.userId;
      categoryId = data.categoryId;

      const txn = await prisma.transaction.create({
        data: {
          userId, categoryId, type: "EXPENSE", amount: 50000,
          description: "To delete", date: new Date("2026-06-20")
        }
      });
      transactionId = txn.id;
    });

    it("deletes own transaction", async () => {
      const res = await request(app)
        .delete(`/api/transactions/${transactionId}`)
        .set("Cookie", cookie);

      expect(res.status).toBe(204);
    });

    it("returns 404 for another user's transaction", async () => {
      const otherUser = await createTestUser(prisma, "other-delete@fintech.local");
      const otherCat = await createTestCategory(prisma, otherUser.id, { name: "OtherCategory2" });
      const otherTxn = await prisma.transaction.create({
        data: {
          userId: otherUser.id, categoryId: otherCat.id, type: "EXPENSE",
          amount: 50000, description: "Other", date: new Date("2026-06-01")
        }
      });

      const res = await request(app)
        .delete(`/api/transactions/${otherTxn.id}`)
        .set("Cookie", cookie);

      expect(res.status).toBe(404);
    });
  });

  describe("Authorization", () => {
    it("returns 401 without authentication", async () => {
      const res = await request(app).get("/api/transactions");
      expect(res.status).toBe(401);
    });
  });
});
