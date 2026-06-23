import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const { apiMock } = vi.hoisted(() => {
  const mockUser = { id: "u1", email: "demo@fintech.local" };

  const mockCategories = [
    { id: "c1", name: "Alimentacion", monthlyBudget: 600000, spent: 100000, usagePercent: 16.67, status: "OK" as const },
    { id: "c2", name: "Transporte", monthlyBudget: 250000, spent: 50000, usagePercent: 20, status: "OK" as const }
  ];

  const mockTransactions = [
    { id: "t1", type: "EXPENSE" as const, amount: 50000, description: "Lunch", categoryId: "c1", date: "2026-06-18" }
  ];

  const mockSummary = { totalIncome: 3000000, totalExpense: 50000, balance: 2950000 };

  const apiMock = {
    me: vi.fn().mockRejectedValue(new Error("Not authenticated")),
    login: vi.fn().mockResolvedValue({ user: mockUser }),
    register: vi.fn().mockResolvedValue({ user: mockUser }),
    logout: vi.fn().mockResolvedValue(undefined),
    categories: vi.fn().mockResolvedValue({ data: mockCategories }),
    categoryStatus: vi.fn().mockResolvedValue({ data: mockCategories }),
    createCategory: vi.fn().mockResolvedValue({ data: mockCategories[0] }),
    updateCategory: vi.fn().mockResolvedValue({ data: mockCategories[0] }),
    deleteCategory: vi.fn().mockResolvedValue(undefined),
    transactions: vi.fn().mockResolvedValue({ data: mockTransactions, meta: { page: 1, pageSize: 10, total: 1 } }),
    createTransaction: vi.fn().mockResolvedValue({ data: mockTransactions[0], budgetAlert: null }),
    updateTransaction: vi.fn().mockResolvedValue({ data: mockTransactions[0], budgetAlert: null }),
    deleteTransaction: vi.fn().mockResolvedValue(undefined),
    summary: vi.fn().mockResolvedValue({ data: mockSummary })
  };

  return { apiMock };
});

vi.mock("./api/client", () => ({
  api: apiMock
}));

import App from "./App";

const TIMEOUT = 15000;

async function login() {
  const emailInput = screen.getByPlaceholderText("nombre@ejemplo.com");
  const passwordInput = screen.getByPlaceholderText("••••••••");
  await userEvent.type(emailInput, "demo@fintech.local");
  await userEvent.type(passwordInput, "Password123!");
  await userEvent.click(screen.getByText("Iniciar sesión"));
}

describe("App", () => {
  it("renders auth form when not logged in", async () => {
    render(<App />);
    expect(screen.getByText("Fintech")).toBeInTheDocument();
    expect(screen.getByText("Iniciar sesión")).toBeInTheDocument();
  });

  it("shows error message on failed login", async () => {
    apiMock.login.mockRejectedValueOnce(new Error("Invalid credentials"));

    render(<App />);

    const emailInput = screen.getByPlaceholderText("nombre@ejemplo.com");
    const passwordInput = screen.getByPlaceholderText("••••••••");

    await userEvent.type(emailInput, "test@test.com");
    await userEvent.type(passwordInput, "wrongpass");
    await userEvent.click(screen.getByText("Iniciar sesión"));

    await waitFor(() => {
      expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    }, { timeout: TIMEOUT });
  });

  it("logs in and shows the dashboard", async () => {
    render(<App />);
    await login();

    await waitFor(() => {
      expect(screen.getByText("Fintech")).toBeInTheDocument();
    }, { timeout: TIMEOUT });
  });

  it("shows summary after login", async () => {
    render(<App />);
    await login();

    await waitFor(() => {
      expect(screen.getByText(/\$ ?2\.950\.000/)).toBeInTheDocument();
    }, { timeout: TIMEOUT });
  });

  it("shows transactions link in sidebar", async () => {
    render(<App />);
    await login();

    await waitFor(() => {
      expect(screen.getByText("Transacciones")).toBeInTheDocument();
    }, { timeout: TIMEOUT });
  });

  it("navigates to categories view", async () => {
    render(<App />);
    await login();

    await waitFor(() => {
      expect(screen.getByText("Transacciones")).toBeInTheDocument();
    }, { timeout: TIMEOUT });

    await userEvent.click(screen.getByText("Categorías"));

    await waitFor(() => {
      expect(screen.getByText("Alimentacion")).toBeInTheDocument();
    }, { timeout: TIMEOUT });
  });

  it("calls logout and returns to auth form", async () => {
    render(<App />);
    await login();

    await waitFor(() => {
      expect(screen.getByText("Transacciones")).toBeInTheDocument();
    }, { timeout: TIMEOUT });

    await userEvent.click(screen.getByText("Cerrar sesión"));

    await waitFor(() => {
      expect(screen.getByText("Fintech")).toBeInTheDocument();
    }, { timeout: TIMEOUT });

    expect(apiMock.logout).toHaveBeenCalled();
  });

  it("creates a transaction via modal", async () => {
    render(<App />);
    await login();

    await waitFor(() => {
      expect(screen.getByText("Transacciones")).toBeInTheDocument();
    }, { timeout: TIMEOUT });

    await userEvent.click(screen.getByText("Transacciones"));

    await waitFor(() => {
      expect(screen.getByText("Nueva transacción")).toBeInTheDocument();
    }, { timeout: TIMEOUT });

    await userEvent.click(screen.getByText("Nueva transacción"));

    await waitFor(() => {
      expect(screen.getByText("Guardar transacción")).toBeInTheDocument();
    }, { timeout: TIMEOUT });

    const descInput = screen.getByPlaceholderText("Descripción");
    await userEvent.clear(descInput);
    await userEvent.type(descInput, "New transaction");

    await userEvent.click(screen.getByText("Guardar transacción"));

    await waitFor(() => {
      expect(apiMock.createTransaction).toHaveBeenCalledWith(
        expect.objectContaining({ description: "New transaction" })
      );
    }, { timeout: TIMEOUT });
  });

  it("closes transaction modal", async () => {
    render(<App />);
    await login();

    await waitFor(() => {
      expect(screen.getByText("Transacciones")).toBeInTheDocument();
    }, { timeout: TIMEOUT });

    await userEvent.click(screen.getByText("Transacciones"));

    await waitFor(() => {
      expect(screen.getByText("Nueva transacción")).toBeInTheDocument();
    }, { timeout: TIMEOUT });

    await userEvent.click(screen.getByText("Nueva transacción"));
    await waitFor(() => {
      expect(screen.getByText("Guardar transacción")).toBeInTheDocument();
    }, { timeout: TIMEOUT });
    await userEvent.click(screen.getByLabelText("Cerrar"));
  });
});
