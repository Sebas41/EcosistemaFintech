import { z } from "zod";

const dateString = z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/));

export const registerSchema = z.object({
  email: z.string().email().transform((email) => email.toLowerCase()),
  password: z.string().min(10).max(128)
});

export const loginSchema = registerSchema;

export const categoryCreateSchema = z.object({
  name: z.string().trim().min(2).max(80),
  monthlyBudget: z.coerce.number().positive().max(999999999999.99)
});

export const categoryUpdateSchema = categoryCreateSchema.partial();

export const transactionCreateSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z.coerce.number().positive().max(999999999999.99),
  description: z.string().trim().min(2).max(240),
  categoryId: z.string().min(1),
  date: dateString.transform((value) => new Date(value))
});

export const transactionUpdateSchema = transactionCreateSchema.partial();

export const transactionQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  sort: z.enum(["asc", "desc"]).default("desc"),
  type: z.enum(["INCOME", "EXPENSE"]).optional(),
  categoryId: z.string().optional(),
  from: dateString.optional().transform((value) => (value ? new Date(value) : undefined)),
  to: dateString.optional().transform((value) => (value ? new Date(value) : undefined))
});

export const monthQuerySchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .optional()
});
