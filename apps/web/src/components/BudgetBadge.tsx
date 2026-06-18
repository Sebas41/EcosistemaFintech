import { AlertTriangle, CheckCircle2 } from "lucide-react";
import type { Category } from "../api/client";

export function BudgetBadge({ category }: { category: Category }) {
  if (category.status === "OVER_100") {
    return (
      <span className="badge danger">
        <AlertTriangle size={14} />
        100%+
      </span>
    );
  }

  if (category.status === "OVER_80") {
    return (
      <span className="badge warning">
        <AlertTriangle size={14} />
        80%+
      </span>
    );
  }

  return (
    <span className="badge ok">
      <CheckCircle2 size={14} />
      OK
    </span>
  );
}
