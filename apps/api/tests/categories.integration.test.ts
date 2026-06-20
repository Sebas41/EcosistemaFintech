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

describe("Categories routes — integration", () => {
  let app: Express;
  let prisma: PrismaClient;

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
    const cookie = res.headers["set-cookie"]?.[0];

    return { userId: user.id, cookie };
  }

  describe("POST /api/categories", () => {
    let userId: string;
    let cookie: string;

    beforeEach(async () => {
      const data = await seedBase();
      userId = data.userId;
      cookie = data.cookie;
    });

    it("creates a category", async () => {
      const res = await request(app)
        .post("/api/categories")
        .set("Cookie", cookie)
        .send({ name: "Shopping", monthlyBudget: 200000 });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe("Shopping");
      expect(res.body.data.monthlyBudget).toBe(200000);
    });

    it("rejects duplicate name for same user", async () => {
      await createTestCategory(prisma, userId, { name: "Shopping" });

      const res = await request(app)
        .post("/api/categories")
        .set("Cookie", cookie)
        .send({ name: "Shopping", monthlyBudget: 100000 });

      expect(res.status).toBe(409);
    });

    it("allows same name for different users", async () => {
      const otherUser = await prisma.user.create({
        data: { email: "other@fintech.local", passwordHash: "$2a$04$dummy" }
      });
      await createTestCategory(prisma, otherUser.id, { name: "Shopping" });

      const res = await request(app)
        .post("/api/categories")
        .set("Cookie", cookie)
        .send({ name: "Shopping", monthlyBudget: 200000 });

      expect(res.status).toBe(201);
    });

    it("rejects invalid data", async () => {
      const res = await request(app)
        .post("/api/categories")
        .set("Cookie", cookie)
        .send({ name: "A", monthlyBudget: -1 });

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/categories", () => {
    let userId: string;
    let cookie: string;

    beforeEach(async () => {
      const data = await seedBase();
      userId = data.userId;
      cookie = data.cookie;
    });

    it("returns categories ordered by name", async () => {
      await createTestCategory(prisma, userId, { name: "Zebra" });
      await createTestCategory(prisma, userId, { name: "Alpha" });

      const res = await request(app)
        .get("/api/categories")
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].name).toBe("Alpha");
      expect(res.body.data[1].name).toBe("Zebra");
    });

    it("returns empty array when no categories", async () => {
      const res = await request(app)
        .get("/api/categories")
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it("does not include other user's categories", async () => {
      const otherUser = await prisma.user.create({
        data: { email: "other2@fintech.local", passwordHash: "$2a$04$dummy" }
      });
      await createTestCategory(prisma, otherUser.id, { name: "Hidden" });
      await createTestCategory(prisma, userId, { name: "Visible" });

      const res = await request(app)
        .get("/api/categories")
        .set("Cookie", cookie);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe("Visible");
    });
  });

  describe("PATCH /api/categories/:id", () => {
    let userId: string;
    let cookie: string;
    let categoryId: string;

    beforeEach(async () => {
      const data = await seedBase();
      userId = data.userId;
      cookie = data.cookie;
      const cat = await createTestCategory(prisma, userId, { name: "Editable", monthlyBudget: 100000 });
      categoryId = cat.id;
    });

    it("updates category name and budget", async () => {
      const res = await request(app)
        .patch(`/api/categories/${categoryId}`)
        .set("Cookie", cookie)
        .send({ name: "Updated", monthlyBudget: 999999 });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe("Updated");
      expect(res.body.data.monthlyBudget).toBe(999999);
    });

    it("returns 404 for non-existent category", async () => {
      const res = await request(app)
        .patch("/api/categories/nonexistent")
        .set("Cookie", cookie)
        .send({ name: "Ghost" });

      expect(res.status).toBe(404);
    });

    it("returns 404 for another user's category", async () => {
      const otherUser = await prisma.user.create({
        data: { email: "other3@fintech.local", passwordHash: "$2a$04$dummy" }
      });
      const otherCat = await createTestCategory(prisma, otherUser.id, { name: "Other" });

      const res = await request(app)
        .patch(`/api/categories/${otherCat.id}`)
        .set("Cookie", cookie)
        .send({ name: "Hacked" });

      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/categories/:id", () => {
    let userId: string;
    let cookie: string;
    let categoryId: string;

    beforeEach(async () => {
      const data = await seedBase();
      userId = data.userId;
      cookie = data.cookie;
      const cat = await createTestCategory(prisma, userId, { name: "Deletable" });
      categoryId = cat.id;
    });

    it("deletes own category", async () => {
      const res = await request(app)
        .delete(`/api/categories/${categoryId}`)
        .set("Cookie", cookie);

      expect(res.status).toBe(204);
    });

    it("returns 409 when category has transactions", async () => {
      await prisma.transaction.create({
        data: {
          userId, categoryId, type: "EXPENSE", amount: 10000,
          description: "Test", date: new Date()
        }
      });

      const res = await request(app)
        .delete(`/api/categories/${categoryId}`)
        .set("Cookie", cookie);

      expect(res.status).toBe(409);
    });
  });

  describe("GET /api/categories/status", () => {
    let userId: string;
    let cookie: string;

    beforeEach(async () => {
      const data = await seedBase();
      userId = data.userId;
      cookie = data.cookie;
    });

    it("returns status with zero spent when no transactions", async () => {
      const cat = await createTestCategory(prisma, userId, { name: "Empty", monthlyBudget: 500000 });

      const res = await request(app)
        .get("/api/categories/status")
        .set("Cookie", cookie);

      const category = res.body.data.find((c: { id: string }) => c.id === cat.id);
      expect(category).toBeDefined();
      expect(category.spent).toBe(0);
      expect(category.usagePercent).toBe(0);
      expect(category.status).toBe("OK");
    });

    it("shows OVER_80 when spending exceeds 80%", async () => {
      const cat = await createTestCategory(prisma, userId, { name: "Tight", monthlyBudget: 100000 });
      await prisma.transaction.create({
        data: {
          userId, categoryId: cat.id, type: "EXPENSE", amount: 85000,
          description: "Almost there", date: new Date()
        }
      });

      const res = await request(app)
        .get("/api/categories/status")
        .set("Cookie", cookie);

      const category = res.body.data.find((c: { id: string }) => c.id === cat.id);
      expect(category.status).toBe("OVER_80");
      expect(category.usagePercent).toBeGreaterThanOrEqual(85);
    });

    it("shows OVER_100 when spending exceeds 100%", async () => {
      const cat = await createTestCategory(prisma, userId, { name: "Overspent", monthlyBudget: 50000 });
      await prisma.transaction.create({
        data: {
          userId, categoryId: cat.id, type: "EXPENSE", amount: 75000,
          description: "Over budget", date: new Date()
        }
      });

      const res = await request(app)
        .get("/api/categories/status")
        .set("Cookie", cookie);

      const category = res.body.data.find((c: { id: string }) => c.id === cat.id);
      expect(category.status).toBe("OVER_100");
      expect(category.usagePercent).toBeGreaterThanOrEqual(150);
    });

    it("supports month filter", async () => {
      const cat = await createTestCategory(prisma, userId, { name: "Monthly", monthlyBudget: 100000 });
      await prisma.transaction.create({
        data: {
          userId, categoryId: cat.id, type: "EXPENSE", amount: 90000,
          description: "This month", date: new Date("2026-06-15")
        }
      });
      await prisma.transaction.create({
        data: {
          userId, categoryId: cat.id, type: "EXPENSE", amount: 50000,
          description: "Next month", date: new Date("2026-07-15")
        }
      });

      const res = await request(app)
        .get("/api/categories/status?month=2026-06")
        .set("Cookie", cookie);

      const category = res.body.data.find((c: { id: string }) => c.id === cat.id);
      expect(category.spent).toBe(90000);
    });

    it("returns 401 without authentication", async () => {
      const res = await request(app).get("/api/categories/status");
      expect(res.status).toBe(401);
    });
  });
});
