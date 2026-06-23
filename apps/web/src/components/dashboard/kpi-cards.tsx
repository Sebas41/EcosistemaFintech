import { TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "../../lib/utils";
import type { Summary } from "../../api/client";

type KpiCardsProps = {
  summary: Summary;
};

type KpiCardProps = {
  title: string;
  value: string;
  trend: number;
  icon: React.ReactNode;
  variant: "green" | "red" | "indigo";
};

const styles = {
  green: "bg-green-50 text-green-600",
  red: "bg-red-50 text-red-600",
  indigo: "bg-indigo-50 text-indigo-600",
};

function KpiCard({ title, value, trend, icon, variant }: KpiCardProps) {
  const isPositive = trend >= 0;
  return (
    <div className="flex flex-col gap-4 rounded-[16px] border border-indigo-100/50 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:shadow-indigo-500/5">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-gray-500">{title}</span>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", styles[variant])}>
          {icon}
        </div>
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-[28px] font-bold tracking-tight text-gray-900">{value}</span>
        <span
          className={cn(
            "flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-semibold",
            isPositive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          )}
        >
          {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {Math.abs(trend)}%
        </span>
      </div>
      <span className="text-[12px] text-gray-400">vs. mes anterior</span>
    </div>
  );
}

export function KpiCards({ summary }: KpiCardsProps) {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(val);

  const incomeTrend = summary.totalIncome > 0 ? 12 : 0;
  const expenseTrend = summary.totalExpense > 0 ? -8 : 0;
  const balanceTrend = summary.balance > 0 ? 18 : 0;

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <KpiCard
        title="Ingresos del Mes"
        value={formatCurrency(summary.totalIncome)}
        trend={incomeTrend}
        icon={<TrendingUp size={20} />}
        variant="green"
      />
      <KpiCard
        title="Gastos del Mes"
        value={formatCurrency(summary.totalExpense)}
        trend={expenseTrend}
        icon={<TrendingDown size={20} />}
        variant="red"
      />
      <KpiCard
        title="Balance Actual"
        value={formatCurrency(summary.balance)}
        trend={balanceTrend}
        icon={<DollarSign size={20} />}
        variant="indigo"
      />
    </div>
  );
}
