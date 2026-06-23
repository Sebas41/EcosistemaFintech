import { useState, useMemo } from "react";
import { Search, ArrowUpDown, ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownRight, Trash2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { type Transaction, type Category } from "../../api/client";

type TransactionTableProps = {
  transactions: Transaction[];
  categories: Category[];
  onDelete: (id: string) => void;
};

const ITEMS_PER_PAGE = 8;

export function TransactionTable({ transactions, categories, onDelete }: TransactionTableProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "INCOME" | "EXPENSE">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(val);

  const filtered = useMemo(() => {
    let list = [...transactions];

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.description?.toLowerCase().includes(q) ||
          categories.find((c) => c.id === t.categoryId)?.name?.toLowerCase().includes(q)
      );
    }
    if (typeFilter !== "all") list = list.filter((t) => t.type === (typeFilter as "INCOME" | "EXPENSE"));
    if (categoryFilter !== "all") list = list.filter((t) => t.categoryId === categoryFilter);

    list.sort((a, b) => {
      const d = new Date(a.date).getTime() - new Date(b.date).getTime();
      return sortDir === "desc" ? -d : d;
    });

    return list;
  }, [transactions, search, typeFilter, categoryFilter, sortDir, categories]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paged = filtered.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="rounded-[16px] border border-indigo-100/50 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-3 border-b border-indigo-100/50 px-6 py-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar transacciones..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="h-9 w-full rounded-xl border border-indigo-100 bg-indigo-50/50 pl-9 pr-3 text-[13px] text-gray-600 placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value as any); setPage(0); }}
          className="h-9 rounded-xl border border-indigo-100 bg-indigo-50/50 px-3 text-[13px] text-gray-600 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
        >
          <option value="all">Todos</option>
          <option value="INCOME">Ingresos</option>
          <option value="EXPENSE">Gastos</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(0); }}
          className="h-9 rounded-xl border border-indigo-100 bg-indigo-50/50 px-3 text-[13px] text-gray-600 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
        >
          <option value="all">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-indigo-100/50 text-left">
              <th className="px-6 py-3 text-[12px] font-semibold uppercase tracking-wider text-gray-400">
                <button
                  onClick={() => setSortDir(sortDir === "desc" ? "asc" : "desc")}
                  className="flex items-center gap-1 hover:text-indigo-600"
                >
                  Fecha <ArrowUpDown size={13} />
                </button>
              </th>
              <th className="px-6 py-3 text-[12px] font-semibold uppercase tracking-wider text-gray-400">Descripción</th>
              <th className="px-6 py-3 text-[12px] font-semibold uppercase tracking-wider text-gray-400">Categoría</th>
              <th className="px-6 py-3 text-right text-[12px] font-semibold uppercase tracking-wider text-gray-400">Monto</th>
              <th className="px-6 py-3 text-right text-[12px] font-semibold uppercase tracking-wider text-gray-400"></th>
            </tr>
          </thead>
          <tbody>
            {paged.map((t) => {
              const cat = categories.find((c) => c.id === t.categoryId);
              return (
                <tr key={t.id} className="border-b border-indigo-50/50 transition-colors hover:bg-indigo-50/30">
                  <td className="px-6 py-4">
                    <span className="text-[13px] text-gray-500">{formatDate(t.date)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-lg",
                        t.type === "INCOME" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                      )}>
                        {t.type === "INCOME" ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      </span>
                      <span className="text-[13px] font-medium text-gray-800">{t.description || "Sin descripción"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-block rounded-lg bg-indigo-50 px-2.5 py-1 text-[12px] font-medium text-indigo-600">
                      {cat?.name || "—"}
                    </span>
                  </td>
                  <td className={cn("px-6 py-4 text-right text-[14px] font-semibold", t.type === "INCOME" ? "text-green-600" : "text-red-600")}>
                    {t.type === "INCOME" ? "+" : "-"}{formatCurrency(t.amount)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => onDelete(t.id)}
                      className="rounded-lg p-1.5 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {paged.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-[13px] text-gray-400">
                  No se encontraron transacciones
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-indigo-100/50 px-6 py-4">
          <span className="text-[12px] text-gray-400">
            Página {page + 1} de {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-100 text-gray-500 transition-colors hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-100 text-gray-500 transition-colors hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
