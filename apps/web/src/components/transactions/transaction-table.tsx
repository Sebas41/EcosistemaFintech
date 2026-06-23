import { ArrowDownRight, ArrowUpDown, ArrowUpRight, ChevronLeft, ChevronRight, Edit3, Trash2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { type Category, type Transaction } from "../../api/client";

export type TransactionFilters = {
  page: number;
  pageSize: number;
  sort: "asc" | "desc";
  type: "all" | "INCOME" | "EXPENSE";
  categoryId: string;
  from: string;
  to: string;
};

type TransactionTableProps = {
  transactions: Transaction[];
  categories: Category[];
  filters: TransactionFilters;
  total: number;
  onFiltersChange: (filters: TransactionFilters) => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
};

export function TransactionTable({
  transactions,
  categories,
  filters,
  total,
  onFiltersChange,
  onEdit,
  onDelete
}: TransactionTableProps) {
  const totalPages = Math.max(1, Math.ceil(total / filters.pageSize));
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(val);
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
  const updateFilters = (patch: Partial<TransactionFilters>) =>
    onFiltersChange({ ...filters, page: 1, ...patch });

  return (
    <div className="rounded-[16px] border border-indigo-100/50 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-3 border-b border-indigo-100/50 px-6 py-4">
        <select
          value={filters.type}
          onChange={(e) => updateFilters({ type: e.target.value as TransactionFilters["type"] })}
          className="h-9 rounded-xl border border-indigo-100 bg-indigo-50/50 px-3 text-[13px] text-gray-600 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
        >
          <option value="all">Todos</option>
          <option value="INCOME">Ingresos</option>
          <option value="EXPENSE">Gastos</option>
        </select>

        <select
          value={filters.categoryId}
          onChange={(e) => updateFilters({ categoryId: e.target.value })}
          className="h-9 rounded-xl border border-indigo-100 bg-indigo-50/50 px-3 text-[13px] text-gray-600 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
        >
          <option value="all">Todas las categorias</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <input
          type="date"
          value={filters.from}
          onChange={(e) => updateFilters({ from: e.target.value })}
          className="h-9 rounded-xl border border-indigo-100 bg-indigo-50/50 px-3 text-[13px] text-gray-600 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
        />
        <input
          type="date"
          value={filters.to}
          onChange={(e) => updateFilters({ to: e.target.value })}
          className="h-9 rounded-xl border border-indigo-100 bg-indigo-50/50 px-3 text-[13px] text-gray-600 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-indigo-100/50 text-left">
              <th className="px-6 py-3 text-[12px] font-semibold uppercase tracking-wider text-gray-400">
                <button
                  onClick={() => onFiltersChange({ ...filters, sort: filters.sort === "desc" ? "asc" : "desc", page: 1 })}
                  className="flex items-center gap-1 hover:text-indigo-600"
                >
                  Fecha <ArrowUpDown size={13} />
                </button>
              </th>
              <th className="px-6 py-3 text-[12px] font-semibold uppercase tracking-wider text-gray-400">Descripcion</th>
              <th className="px-6 py-3 text-[12px] font-semibold uppercase tracking-wider text-gray-400">Categoria</th>
              <th className="px-6 py-3 text-right text-[12px] font-semibold uppercase tracking-wider text-gray-400">Monto</th>
              <th className="px-6 py-3 text-right text-[12px] font-semibold uppercase tracking-wider text-gray-400"></th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => {
              const cat = categories.find((c) => c.id === t.categoryId);
              return (
                <tr key={t.id} className="border-b border-indigo-50/50 transition-colors hover:bg-indigo-50/30">
                  <td className="px-6 py-4"><span className="text-[13px] text-gray-500">{formatDate(t.date)}</span></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg", t.type === "INCOME" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600")}>
                        {t.type === "INCOME" ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      </span>
                      <span className="text-[13px] font-medium text-gray-800">{t.description || "Sin descripcion"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-block rounded-lg bg-indigo-50 px-2.5 py-1 text-[12px] font-medium text-indigo-600">
                      {cat?.name || "-"}
                    </span>
                  </td>
                  <td className={cn("px-6 py-4 text-right text-[14px] font-semibold", t.type === "INCOME" ? "text-green-600" : "text-red-600")}>
                    {t.type === "INCOME" ? "+" : "-"}{formatCurrency(t.amount)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button type="button" onClick={() => onEdit(t)} aria-label={`Editar ${t.description}`} className="rounded-lg p-1.5 text-gray-300 transition-colors hover:bg-indigo-50 hover:text-indigo-600">
                      <Edit3 size={14} />
                    </button>
                    <button type="button" onClick={() => onDelete(t.id)} aria-label={`Eliminar ${t.description}`} className="rounded-lg p-1.5 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-[13px] text-gray-400">
                  No se encontraron transacciones
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-indigo-100/50 px-6 py-4">
        <span className="text-[12px] text-gray-400">
          Pagina {filters.page} de {totalPages} ({total} registros)
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => onFiltersChange({ ...filters, page: Math.max(1, filters.page - 1) })}
            disabled={filters.page <= 1}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-100 text-gray-500 transition-colors hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            onClick={() => onFiltersChange({ ...filters, page: Math.min(totalPages, filters.page + 1) })}
            disabled={filters.page >= totalPages}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-100 text-gray-500 transition-colors hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
