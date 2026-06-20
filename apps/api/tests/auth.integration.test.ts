import type { Express } from "express";
import { PrismaClient } from "@prisma/client";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { cleanDatabase, createPrisma, TEST_EMAIL, TEST_PASSWORD } from "./setup.js";

describe("Auth routes — integration", () => {
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

  beforeEach(async () => {
    await cleanDatabase(prisma);
  });

  describe("POST /api/auth/register", () => {
    it("registers a new user and returns cookie + user", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

      expect(res.status).toBe(201);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(TEST_EMAIL);
      expect(res.body.user.id).toBeDefined();
      expect(res.headers["set-cookie"]).toBeDefined();
      expect(res.headers["set-cookie"][0]).toContain("session");
    });

    it("rejects duplicate email with 409", async () => {
      await request(app)
        .post("/api/auth/register")
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

      const res = await request(app)
        .post("/api/auth/register")
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

      expect(res.status).toBe(409);
    });

    it("rejects invalid email format", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ email: "not-an-email", password: TEST_PASSWORD });

      expect(res.status).toBe(400);
    });

    it("rejects password shorter than 10 characters", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ email: TEST_EMAIL, password: "short" });

      expect(res.status).toBe(400);
    });

    it("creates default categories on registration", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

      expect(res.status).toBe(201);

      const cookie = res.headers["set-cookie"][0];
      const catRes = await request(app)
        .get("/api/categories")
        .set("Cookie", cookie);

      expect(catRes.status).toBe(200);
      expect(catRes.body.data.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("POST /api/auth/login", () => {
    it("logs in with valid credentials and returns cookie", async () => {
      await request(app)
        .post("/api/auth/register")
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(TEST_EMAIL);
      expect(res.headers["set-cookie"]).toBeDefined();
    });

    it("rejects wrong password with 401", async () => {
      await request(app)
        .post("/api/auth/register")
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: TEST_EMAIL, password: "WrongPassword123!" });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("INVALID_CREDENTIALS");
    });

    it("rejects non-existent email with 401", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "nonexistent@fintech.local", password: TEST_PASSWORD });

      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/auth/logout", () => {
    it("clears session cookie and returns 204", async () => {
      const regRes = await request(app)
        .post("/api/auth/register")
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

      const cookie = regRes.headers["set-cookie"][0];

      const res = await request(app)
        .post("/api/auth/logout")
        .set("Cookie", cookie);

      expect(res.status).toBe(204);
    });
  });

  describe("GET /api/auth/me", () => {
    it("returns the authenticated user", async () => {
      const regRes = await request(app)
        .post("/api/auth/register")
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

      const cookie = regRes.headers["set-cookie"][0];

      const res = await request(app)
        .get("/api/auth/me")
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(TEST_EMAIL);
    });

    it("returns 401 without cookie", async () => {
      const res = await request(app).get("/api/auth/me");
      expect(res.status).toBe(401);
    });

    it("returns 401 with invalid cookie", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Cookie", "session=invalid-token");

      expect(res.status).toBe(401);
    });

    it("works with Authorization Bearer header", async () => {
      const regRes = await request(app)
        .post("/api/auth/register")
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

      const cookie = regRes.headers["set-cookie"][0];
      const token = cookie.split(";")[0].split("=")[1];

      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(TEST_EMAIL);
    });
  });
});
