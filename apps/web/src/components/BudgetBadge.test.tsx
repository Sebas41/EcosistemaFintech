import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BudgetBadge } from "./BudgetBadge";

describe("BudgetBadge", () => {
  it("shows the 80 percent warning state", () => {
    render(
      <BudgetBadge
        category={{
          id: "cat_1",
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
});
