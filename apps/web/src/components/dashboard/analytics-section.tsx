import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { Category, Transaction } from "../../api/client";

const COLORS = ["#6366f1", "#3b82f6", "#8b5cf6", "#06b6d4", "#14b8a6", "#f59e0b", "#ef4444", "#a855f7"];

type AnalyticsSectionProps = {
  transactions: Transaction[];
  categories: Category[];
};

export function AnalyticsSection({ transactions, categories }: AnalyticsSectionProps) {
  const monthlyData = useMemo(() => {
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const month = new Date().getMonth();
    const data: { name: string; ingresos: number; gastos: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const idx = (month - i + 12) % 12;
      data.push({ name: months[idx], ingresos: 0, gastos: 0 });
    }
    transactions.forEach((t) => {
      const d = new Date(t.date);
      const tMonth = d.getMonth();
      const diff = (month - tMonth + 12) % 12;
      if (diff >= 0 && diff < 6) {
        const idx = 5 - diff;
        if (t.type === "INCOME") {
          data[idx].ingresos += t.amount;
        } else {
          data[idx].gastos += t.amount;
        }
      }
    });
    return data;
  }, [transactions]);

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    transactions
      .filter((t) => t.type === "EXPENSE")
      .forEach((t) => {
        const name = categories.find((c) => c.id === t.categoryId)?.name || "Sin categoría";
        map[name] = (map[name] || 0) + t.amount;
      });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [transactions, categories]);

  const budgetData = useMemo(() => {
    return categories
      .map((c) => {
        const spent = transactions
          .filter((t) => t.type === "EXPENSE" && t.categoryId === c.id)
          .reduce((s, t) => s + t.amount, 0);
        const limit = c.monthlyBudget;
        return {
          name: c.name,
          spent,
          limit,
          pct: limit > 0 ? Math.min((spent / limit) * 100, 100) : 0,
        };
      })
      .filter((c) => c.limit > 0);
  }, [categories, transactions]);

  type TooltipPayload = {
    color?: string;
    name?: string;
    value: number;
  };

  type TooltipProps = {
    active?: boolean;
    payload?: TooltipPayload[];
    label?: string;
  };

  const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload?.length) {
      return (
        <div className="rounded-xl border border-indigo-100 bg-white px-4 py-3 shadow-lg">
          <p className="mb-1 text-[12px] font-medium text-gray-500">{label}</p>
          {payload.map((p, i) => (
            <p key={i} className="text-[13px] font-semibold" style={{ color: p.color }}>
              {p.name}: {new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(p.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid gap-6">
      <div className="rounded-[16px] border border-indigo-100/50 bg-white p-6 shadow-sm">
        <h3 className="mb-1 text-[15px] font-semibold text-gray-900">Flujo de Caja Mensual</h3>
        <p className="mb-6 text-[12px] text-gray-400">Ingresos vs gastos de los últimos 6 meses</p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} barGap={4} barCategoryGap="20%">
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="ingresos" fill="#6366f1" radius={[6, 6, 0, 0]} name="Ingresos" />
              <Bar dataKey="gastos" fill="#ef4444" radius={[6, 6, 0, 0]} name="Gastos" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[16px] border border-indigo-100/50 bg-white p-6 shadow-sm">
          <h3 className="mb-1 text-[15px] font-semibold text-gray-900">Gastos por Categoría</h3>
          <p className="mb-6 text-[12px] text-gray-400">Distribución de gastos del mes</p>
          <div className="flex h-64 items-center justify-center">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" nameKey="name">
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-[13px] text-gray-400">No hay datos de gastos</span>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            {categoryData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-[12px] text-gray-500">{d.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[16px] border border-indigo-100/50 bg-white p-6 shadow-sm">
          <h3 className="mb-1 text-[15px] font-semibold text-gray-900">Uso de Presupuesto</h3>
          <p className="mb-6 text-[12px] text-gray-400">Porcentaje utilizado por categoría</p>
          <div className="h-64">
            {budgetData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgetData} layout="vertical" barGap={8} barCategoryGap="20%">
                  <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#475569" }} width={90} />
                  <Tooltip
                    content={({ active, payload }) =>
                      active && payload?.length ? (
                        <div className="rounded-xl border border-indigo-100 bg-white px-4 py-3 shadow-lg">
                          <p className="text-[13px] font-semibold text-gray-900">
                            {payload[0].payload.name}: {Number(payload[0].value).toFixed(0)}%
                          </p>
                        </div>
                      ) : null
                    }
                  />
                  <Bar dataKey="pct" radius={[0, 6, 6, 0]}>
                    {budgetData.map((entry, i) => (
                      <Cell key={i} fill={entry.pct > 80 ? "#ef4444" : entry.pct > 50 ? "#f59e0b" : "#6366f1"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center">
                <span className="text-[13px] text-gray-400">No hay presupuestos definidos</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
