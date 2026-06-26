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
    transactions: vi.fn().mockResolvedValue({ data: mockTransactions, meta: { page: 1, pageSize: 8, total: 1 } }),
    createTransaction: vi.fn().mockResolvedValue({ data: mockTransactions[0], budgetAlert: null }),
    updateTransaction: vi.fn().mockResolvedValue({ data: mockTransactions[0], budgetAlert: null }),
    deleteTransaction: vi.fn().mockResolvedValue(undefined),
    summary: vi.fn().mockResolvedValue({ data: mockSummary })
  };
  return { apiMock };
});

vi.mock("./api/client", () => ({ api: apiMock }));

import App from "./App";

const TIMEOUT = 15000;

async function login() {
  await userEvent.type(screen.getByPlaceholderText("nombre@ejemplo.com"), "demo@fintech.local");
  await userEvent.type(screen.getByPlaceholderText("Password123!"), "Password123!");
  await userEvent.click(screen.getByText("Iniciar sesion"));
}

describe("App", () => {
  it("renders auth form when not logged in", () => {
    render(<App />);
    expect(screen.getByText("Saldo Vivo")).toBeInTheDocument();
    expect(screen.getByText("Iniciar sesion")).toBeInTheDocument();
    expect(screen.getByText("Crear una cuenta")).toBeInTheDocument();
  });

  it("registers a new user", async () => {
    render(<App />);
    await userEvent.click(screen.getByText("Crear una cuenta"));
    await userEvent.type(screen.getByPlaceholderText("nombre@ejemplo.com"), "new@fintech.local");
    await userEvent.type(screen.getByPlaceholderText("Password123!"), "Password123!");
    await userEvent.click(screen.getByText("Crear cuenta"));
    await waitFor(() => expect(apiMock.register).toHaveBeenCalledWith("new@fintech.local", "Password123!"), { timeout: TIMEOUT });
  });

  it("shows error message on failed login", async () => {
    apiMock.login.mockRejectedValueOnce(new Error("Invalid credentials"));
    render(<App />);
    await userEvent.type(screen.getByPlaceholderText("nombre@ejemplo.com"), "test@test.com");
    await userEvent.type(screen.getByPlaceholderText("Password123!"), "wrongpass");
    await userEvent.click(screen.getByText("Iniciar sesion"));
    await waitFor(() => expect(screen.getByText("Invalid credentials")).toBeInTheDocument(), { timeout: TIMEOUT });
  });

  it("logs in and shows summary", async () => {
    render(<App />);
    await login();
    await waitFor(() => expect(screen.getByText(/\$ ?2\.950\.000/)).toBeInTheDocument(), { timeout: TIMEOUT });
  });

  it("creates a transaction via modal", async () => {
    render(<App />);
    await login();
    await waitFor(() => expect(screen.getByText("Transacciones")).toBeInTheDocument(), { timeout: TIMEOUT });
    await userEvent.click(screen.getByText("Transacciones"));
    await userEvent.click(await screen.findByText("Nueva transaccion"));
    await userEvent.clear(screen.getByPlaceholderText("Descripcion"));
    await userEvent.type(screen.getByPlaceholderText("Descripcion"), "New transaction");
    await userEvent.click(screen.getByText("Guardar transaccion"));
    await waitFor(() => expect(apiMock.createTransaction).toHaveBeenCalledWith(expect.objectContaining({ description: "New transaction" })), { timeout: TIMEOUT });
  });

  it("edits a transaction", async () => {
    render(<App />);
    await login();
    await userEvent.click(await screen.findByText("Transacciones"));
    await userEvent.click(await screen.findByLabelText("Editar Lunch"));
    await userEvent.clear(screen.getByPlaceholderText("Descripcion"));
    await userEvent.type(screen.getByPlaceholderText("Descripcion"), "Updated lunch");
    await userEvent.click(screen.getByText("Actualizar transaccion"));
    await waitFor(() => expect(apiMock.updateTransaction).toHaveBeenCalledWith("t1", expect.objectContaining({ description: "Updated lunch" })), { timeout: TIMEOUT });
  });

  it("uses API filters for transactions", async () => {
    render(<App />);
    await login();
    await userEvent.click(await screen.findByText("Transacciones"));
    await userEvent.selectOptions(screen.getByDisplayValue("Todos"), "EXPENSE");
    await waitFor(() => expect(apiMock.transactions).toHaveBeenCalledWith(expect.stringContaining("type=EXPENSE")), { timeout: TIMEOUT });
  });

  it("edits and deletes categories", async () => {
    render(<App />);
    await login();
    await userEvent.click(await screen.findByText("Categorias"));
    await userEvent.click(await screen.findByLabelText("Editar Alimentacion"));
    await userEvent.click(screen.getByText("Actualizar categoria"));
    await waitFor(() => expect(apiMock.updateCategory).toHaveBeenCalled(), { timeout: TIMEOUT });
    await userEvent.click(await screen.findByLabelText("Eliminar Alimentacion"));
    await waitFor(() => expect(apiMock.deleteCategory).toHaveBeenCalledWith("c1"), { timeout: TIMEOUT });
  });

  it("calls logout and returns to auth form", async () => {
    render(<App />);
    await login();
    await userEvent.click(await screen.findByText("Cerrar sesion"));
    await waitFor(() => expect(screen.getByText("Iniciar sesion")).toBeInTheDocument(), { timeout: TIMEOUT });
    expect(apiMock.logout).toHaveBeenCalled();
  });
});
