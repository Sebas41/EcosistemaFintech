import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BudgetBadge } from "./BudgetBadge";

describe("BudgetBadge", () => {
  it("shows OK when status is OK", () => {
    render(
      <BudgetBadge
        category={{
          id: "cat_ok",
          name: "Alimentacion",
          monthlyBudget: 100000,
          spent: 30000,
          usagePercent: 30,
          status: "OK"
        }}
      />
    );

    expect(screen.getByText("OK")).toBeInTheDocument();
  });

  it("shows 80 percent warning state", () => {
    render(
      <BudgetBadge
        category={{
          id: "cat_80",
          name: "Transporte",
          monthlyBudget: 100000,
          spent: 85000,
          usagePercent: 85,
          status: "OVER_80"
        }}
      />
    );

    expect(screen.getByText("80%+")).toBeInTheDocument();
  });

  it("shows 100 percent danger state", () => {
    render(
      <BudgetBadge
        category={{
          id: "cat_100",
          name: "Servicios",
          monthlyBudget: 100000,
          spent: 120000,
          usagePercent: 120,
          status: "OVER_100"
        }}
      />
    );

    expect(screen.getByText("100%+")).toBeInTheDocument();
  });

  it("shows OK when status is undefined", () => {
    render(
      <BudgetBadge
        category={{
          id: "cat_default",
          name: "Default",
          monthlyBudget: 100000
        }}
      />
    );

    expect(screen.getByText("OK")).toBeInTheDocument();
  });
});
