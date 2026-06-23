import { Edit3, Trash2 } from "lucide-react";
import { cn } from "../../lib/utils";
import type { Category, Transaction } from "../../api/client";

type CategoryCardsProps = {
  categories: Category[];
  transactions: Transaction[];
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
};

export function CategoryCards({ categories, transactions, onEdit, onDelete }: CategoryCardsProps) {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(val);

  const getStatus = (pct: number) => {
    if (pct >= 100) return { label: "Excedido", color: "bg-red-500", textColor: "text-red-600", bgColor: "bg-red-50" };
    if (pct >= 80) return { label: "Critico", color: "bg-amber-500", textColor: "text-amber-600", bgColor: "bg-amber-50" };
    if (pct >= 50) return { label: "En uso", color: "bg-blue-500", textColor: "text-blue-600", bgColor: "bg-blue-50" };
    return { label: "Saludable", color: "bg-indigo-500", textColor: "text-indigo-600", bgColor: "bg-indigo-50" };
  };

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((cat) => {
        const spent = cat.spent ?? transactions
          .filter((t) => t.type === "EXPENSE" && t.categoryId === cat.id)
          .reduce((s, t) => s + t.amount, 0);
        const limit = cat.monthlyBudget ?? 0;
        const pct = cat.usagePercent ?? (limit > 0 ? Math.min((spent / limit) * 100, 100) : 0);
        const status = getStatus(pct);

        return (
          <div key={cat.id} className="rounded-[16px] border border-indigo-100/50 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:shadow-indigo-500/5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-[15px] font-semibold text-gray-900">{cat.name}</h3>
                <p className="text-[12px] text-gray-400">
                  {cat.status === "OVER_100" ? "Excedido" : cat.status === "OVER_80" ? "Critico" : "Saludable"}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onEdit(cat)}
                  aria-label={`Editar ${cat.name}`}
                  className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                >
                  <Edit3 size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(cat.id)}
                  aria-label={`Eliminar ${cat.name}`}
                  className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <span className={cn("mb-4 inline-block rounded-lg px-2.5 py-1 text-[11px] font-semibold", status.bgColor, status.textColor)}>
              {status.label}
            </span>

            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-[22px] font-bold tracking-tight text-gray-900">{formatCurrency(spent)}</span>
              <span className="text-[12px] text-gray-400">/ {formatCurrency(limit)}</span>
            </div>

            <div className="relative h-2 w-full overflow-hidden rounded-full bg-indigo-100/50">
              <div className={cn("h-full rounded-full transition-all duration-500", status.color)} style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className="text-[12px] text-gray-400">{pct.toFixed(0)}% utilizado</span>
              <span className="text-[12px] font-medium text-gray-500">
                {formatCurrency(Math.max(limit - spent, 0))} restantes
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
