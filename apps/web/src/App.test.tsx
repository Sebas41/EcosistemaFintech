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

describe("App", () => {
  it("renders auth form when not logged in", async () => {
    render(<App />);

    expect(screen.getByText("Finanzas personales")).toBeInTheDocument();
    expect(screen.getByText("Iniciar sesión")).toBeInTheDocument();
  });

  it("switches to register form", async () => {
    render(<App />);

    await userEvent.click(screen.getByText("Registrar nuevo usuario"));

    expect(screen.getByText("Crear cuenta")).toBeInTheDocument();
    expect(screen.queryByText("Iniciar sesión")).not.toBeInTheDocument();
  });

  it("logs in and shows the dashboard", async () => {
    render(<App />);

    await userEvent.click(screen.getByText("Iniciar sesión"));

    await waitFor(() => {
      expect(screen.getByText("demo@fintech.local")).toBeInTheDocument();
    });

    expect(screen.getByText("Movimientos financieros")).toBeInTheDocument();
  });

  it("shows summary after login", async () => {
    render(<App />);

    await userEvent.click(screen.getByText("Iniciar sesión"));

    await waitFor(() => {
      expect(screen.getByText(/\$ ?2\.950\.000/)).toBeInTheDocument();
    });
  });

  it("shows transaction list after login", async () => {
    render(<App />);

    await userEvent.click(screen.getByText("Iniciar sesión"));

    await waitFor(() => {
      expect(screen.getByText("Lunch")).toBeInTheDocument();
    });
  });

  it("shows categories after login", async () => {
    render(<App />);

    await userEvent.click(screen.getByText("Iniciar sesión"));

    await waitFor(() => {
      const categoryHeading = screen.getByText("Categorías");
      expect(categoryHeading).toBeInTheDocument();
    });
  });

  it("calls logout and returns to auth form", async () => {
    render(<App />);

    await userEvent.click(screen.getByText("Iniciar sesión"));
    await waitFor(() => {
      expect(screen.getByText("demo@fintech.local")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTitle("Cerrar sesión"));

    await waitFor(() => {
      expect(screen.getByText("Finanzas personales")).toBeInTheDocument();
    });

    expect(apiMock.logout).toHaveBeenCalled();
  });

  it("creates a transaction", async () => {
    render(<App />);

    await userEvent.click(screen.getByText("Iniciar sesión"));
    await waitFor(() => {
      expect(screen.getByText("Lunch")).toBeInTheDocument();
    });

    const descInput = screen.getByLabelText("Descripción");
    await userEvent.clear(descInput);
    await userEvent.type(descInput, "New transaction");

    await userEvent.click(screen.getByText("Guardar"));

    await waitFor(() => {
      expect(apiMock.createTransaction).toHaveBeenCalledWith(
        expect.objectContaining({ description: "New transaction" })
      );
    });
  });

  it("shows pagination when enough transactions exist", async () => {
    apiMock.transactions.mockResolvedValueOnce({
      data: [
        { id: "t1", type: "EXPENSE" as const, amount: 50000, description: "Lunch", categoryId: "c1", date: "2026-06-18" }
      ],
      meta: { page: 1, pageSize: 10, total: 15 }
    });

    render(<App />);

    await userEvent.click(screen.getByText("Iniciar sesión"));

    await waitFor(() => {
      expect(screen.getByText(/Página 1 de 2/)).toBeInTheDocument();
    });
  });

  it("enables next page button when not on last page", async () => {
    apiMock.transactions.mockResolvedValueOnce({
      data: [
        { id: "t1", type: "EXPENSE" as const, amount: 50000, description: "Lunch", categoryId: "c1", date: "2026-06-18" }
      ],
      meta: { page: 1, pageSize: 10, total: 15 }
    });

    render(<App />);

    await userEvent.click(screen.getByText("Iniciar sesión"));

    await waitFor(() => {
      expect(screen.getByText("Siguiente")).not.toBeDisabled();
    });
  });

  it("disables previous page button on first page", async () => {
    apiMock.transactions.mockResolvedValueOnce({
      data: [
        { id: "t1", type: "EXPENSE" as const, amount: 50000, description: "Lunch", categoryId: "c1", date: "2026-06-18" }
      ],
      meta: { page: 1, pageSize: 10, total: 15 }
    });

    render(<App />);

    await userEvent.click(screen.getByText("Iniciar sesión"));

    await waitFor(() => {
      expect(screen.getByText("Anterior")).toBeDisabled();
    });
  });

  it("shows budget alert when returned from create transaction", async () => {
    apiMock.createTransaction.mockResolvedValue({
      data: {
        id: "t1", type: "EXPENSE" as const, amount: 50000, description: "Test", categoryId: "c1", date: "2026-06-18"
      },
      budgetAlert: {
        level: "OVER_80",
        message: "",
        categoryName: "Alimentacion",
        monthlyBudget: 600000,
        spent: 500000,
        usagePercent: 83.33
      }
    });

    render(<App />);

    await userEvent.click(screen.getByText("Iniciar sesión"));
    await waitFor(() => {
      expect(screen.getByText("Guardar")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText("Guardar"));

    await waitFor(() => {
      expect(screen.getByText(/83\.33% usado/)).toBeInTheDocument();
    });
  });

  it("creates a category", async () => {
    render(<App />);

    await userEvent.click(screen.getByText("Iniciar sesión"));
    await waitFor(() => {
      expect(screen.getByText("Categorías")).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText("Nombre");
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "New Category");

    await userEvent.click(screen.getByText("Crear categoría"));

    await waitFor(() => {
      expect(apiMock.createCategory).toHaveBeenCalledWith(
        expect.objectContaining({ name: "New Category" })
      );
    });
  });

  it("edits a transaction inline", async () => {
    render(<App />);

    await userEvent.click(screen.getByText("Iniciar sesión"));
    await waitFor(() => {
      expect(screen.getByTitle("Editar movimiento")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTitle("Editar movimiento"));

    await waitFor(() => {
      expect(screen.getByText("Editar movimiento")).toBeInTheDocument();
      expect(screen.getByText("Actualizar")).toBeInTheDocument();
    });
  });

  it("cancels transaction edit", async () => {
    render(<App />);

    await userEvent.click(screen.getByText("Iniciar sesión"));
    await waitFor(() => {
      expect(screen.getByTitle("Editar movimiento")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTitle("Editar movimiento"));
    await waitFor(() => {
      expect(screen.getByTitle("Cancelar edición")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTitle("Cancelar edición"));
    expect(screen.queryByTitle("Cancelar edición")).not.toBeInTheDocument();
  });

  it("deletes a transaction", async () => {
    render(<App />);

    await userEvent.click(screen.getByText("Iniciar sesión"));
    await waitFor(() => {
      expect(screen.getByTitle("Eliminar movimiento")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTitle("Eliminar movimiento"));

    await waitFor(() => {
      expect(apiMock.deleteTransaction).toHaveBeenCalled();
    });
  });

  it("renders the login form after switching back from register", async () => {
    render(<App />);

    await userEvent.click(screen.getByText("Registrar nuevo usuario"));
    await userEvent.click(screen.getByText("Usar una cuenta existente"));

    expect(screen.getByText("Iniciar sesión")).toBeInTheDocument();
  });
});
