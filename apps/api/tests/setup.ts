import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

export const TEST_EMAIL = "test@fintech.local";
export const TEST_PASSWORD = "TestPass123!";

export function createPrisma() {
  return new PrismaClient();
}

export async function cleanDatabase(prisma: PrismaClient) {
  await prisma.transaction.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
}

export async function createTestUser(prisma: PrismaClient, email?: string) {
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 4);
  const user = await prisma.user.create({
    data: { email: email ?? TEST_EMAIL, passwordHash }
  });
  return user;
}

export async function createTestCategory(
  prisma: PrismaClient,
  userId: string,
  overrides: Partial<{ name: string; monthlyBudget: number }> = {}
) {
  return prisma.category.create({
    data: {
      userId,
      name: overrides.name ?? "Test Category",
      monthlyBudget: overrides.monthlyBudget ?? 500000
    }
  });
}
