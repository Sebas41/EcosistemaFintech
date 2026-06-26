import { PiggyBank, TrendingUp, WalletCards } from "lucide-react";
import type { Transaction } from "../../api/client";

type SavingsOverviewProps = {
  transactions: Transaction[];
};

const monthLabels = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function currency(value: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);
}

export function SavingsOverview({ transactions }: SavingsOverviewProps) {
  const monthly = monthLabels.map((name, index) => {
    const rows = transactions.filter((t) => new Date(t.date).getMonth() === index);
    const income = rows.filter((t) => t.type === "INCOME").reduce((sum, t) => sum + t.amount, 0);
    const expense = rows.filter((t) => t.type === "EXPENSE").reduce((sum, t) => sum + t.amount, 0);
    const saved = income - expense;
    const rate = income > 0 ? Math.round((saved / income) * 10000) / 100 : 0;
    return { name, income, expense, saved, rate };
  }).filter((row) => row.income > 0 || row.expense > 0);

  const totalIncome = monthly.reduce((sum, row) => sum + row.income, 0);
  const totalSaved = monthly.reduce((sum, row) => sum + row.saved, 0);
  const avgRate = totalIncome > 0 ? Math.round((totalSaved / totalIncome) * 10000) / 100 : 0;
  const bestMonth = monthly.reduce((best, row) => (row.saved > best.saved ? row : best), monthly[0] ?? { name: "-", saved: 0 });

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-[16px] border border-indigo-100/50 bg-white p-6 shadow-sm">
          <PiggyBank className="mb-4 text-indigo-600" size={22} />
          <p className="text-[13px] font-medium text-gray-500">Ahorro acumulado</p>
          <p className="mt-3 text-[28px] font-bold text-gray-950">{currency(totalSaved)}</p>
        </div>
        <div className="rounded-[16px] border border-indigo-100/50 bg-white p-6 shadow-sm">
          <TrendingUp className="mb-4 text-emerald-600" size={22} />
          <p className="text-[13px] font-medium text-gray-500">Tasa de ahorro</p>
          <p className="mt-3 text-[28px] font-bold text-gray-950">{avgRate.toFixed(1)}%</p>
        </div>
        <div className="rounded-[16px] border border-indigo-100/50 bg-white p-6 shadow-sm">
          <WalletCards className="mb-4 text-violet-600" size={22} />
          <p className="text-[13px] font-medium text-gray-500">Mejor mes</p>
          <p className="mt-3 text-[28px] font-bold text-gray-950">{bestMonth.name}</p>
          <p className="mt-1 text-[12px] text-gray-400">{currency(bestMonth.saved)}</p>
        </div>
      </div>

      <div className="rounded-[16px] border border-indigo-100/50 bg-white p-6 shadow-sm">
        <h3 className="mb-1 text-[15px] font-semibold text-gray-900">Ahorro mensual</h3>
        <p className="mb-5 text-[12px] text-gray-400">Ingresos menos gastos por mes</p>
        <div className="space-y-3">
          {monthly.map((row) => (
            <div key={row.name} className="grid grid-cols-[56px_1fr_auto] items-center gap-4">
              <span className="text-[13px] font-semibold text-gray-600">{row.name}</span>
              <div className="h-2 overflow-hidden rounded-full bg-indigo-50">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal-400 to-indigo-500"
                  style={{ width: `${Math.max(4, Math.min(100, row.rate))}%` }}
                />
              </div>
              <span className="text-[13px] font-semibold text-gray-900">{currency(row.saved)}</span>
            </div>
          ))}
          {monthly.length === 0 && <p className="text-[13px] text-gray-400">Aun no hay movimientos para calcular ahorro.</p>}
        </div>
      </div>
    </div>
  );
}
