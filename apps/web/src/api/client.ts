export type User = {
  id: string;
  email: string;
};

export type Category = {
  id: string;
  name: string;
  monthlyBudget: number;
  spent?: number;
  usagePercent?: number;
  status?: "OK" | "OVER_80" | "OVER_100";
};

export type Transaction = {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  description: string;
  categoryId: string;
  date: string;
};

export type BudgetAlert = {
  level: "OVER_80" | "OVER_100";
  message: string;
  categoryName: string;
  monthlyBudget: number;
  spent: number;
  usagePercent: number;
};

export type Summary = {
  totalIncome: number;
  totalExpense: number;
  balance: number;
};

const baseUrl = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, "")}/api`
  : "/api";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers
    }
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message ?? "Request failed");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  me: () => request<{ user: User }>("/auth/me"),
  register: (email: string, password: string) =>
    request<{ user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password })
    }),
  login: (email: string, password: string) =>
    request<{ user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    }),
  logout: () => request<void>("/auth/logout", { method: "POST" }),
  categories: () => request<{ data: Category[] }>("/categories"),
  categoryStatus: () => request<{ data: Category[] }>("/categories/status"),
  createCategory: (payload: { name: string; monthlyBudget: number }) =>
    request<{ data: Category }>("/categories", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  updateCategory: (id: string, payload: { name?: string; monthlyBudget?: number }) =>
    request<{ data: Category }>(`/categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    }),
  deleteCategory: (id: string) => request<void>(`/categories/${id}`, { method: "DELETE" }),
  summary: () => request<{ data: Summary }>("/transactions/summary"),
  transactions: (params = "") =>
    request<{ data: Transaction[]; meta: { page: number; pageSize: number; total: number } }>(
      `/transactions${params}`
    ),
  createTransaction: (payload: {
    type: Transaction["type"];
    amount: number;
    description: string;
    categoryId: string;
    date: string;
  }) =>
    request<{ data: Transaction; budgetAlert: BudgetAlert | null }>("/transactions", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  updateTransaction: (
    id: string,
    payload: {
      type?: Transaction["type"];
      amount?: number;
      description?: string;
      categoryId?: string;
      date?: string;
    }
  ) =>
    request<{ data: Transaction; budgetAlert: BudgetAlert | null }>(`/transactions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    }),
  deleteTransaction: (id: string) => request<void>(`/transactions/${id}`, { method: "DELETE" })
};
