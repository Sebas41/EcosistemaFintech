import { FormEvent, useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { api, type Category, type Summary, type Transaction, type User } from "./api/client";
import { LoginForm } from "./components/auth/login-form";
import { DashboardLayout } from "./components/layout/dashboard-layout";
import { KpiCards } from "./components/dashboard/kpi-cards";
import { AnalyticsSection } from "./components/dashboard/analytics-section";
import { TransactionTable } from "./components/transactions/transaction-table";
import { CategoryCards } from "./components/categories/category-cards";
import "./index.css";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary>({ totalIncome: 0, totalExpense: 0, balance: 0 });
  const [activeView, setActiveView] = useState("dashboard");
  const [message, setMessage] = useState("");

  const [showTxModal, setShowTxModal] = useState(false);
  const [txForm, setTxForm] = useState({
    type: "EXPENSE" as "INCOME" | "EXPENSE",
    amount: 50000,
    description: "",
    categoryId: "",
    date: today(),
  });

  const [showCatModal, setShowCatModal] = useState(false);
  const [catForm, setCatForm] = useState({ name: "", monthlyBudget: 100000 });
  const [editingCatId, setEditingCatId] = useState<string | null>(null);

  async function loadData() {
    const [catRes, txRes, sumRes] = await Promise.all([
      api.categoryStatus(),
      api.transactions("?sort=desc&pageSize=50"),
      api.summary(),
    ]);
    setCategories(catRes.data);
    setTransactions(txRes.data);
    setSummary(sumRes.data);
    if (!txForm.categoryId && catRes.data[0]) {
      setTxForm((prev) => ({ ...prev, categoryId: catRes.data[0].id }));
    }
  }

  useEffect(() => {
    api
      .me()
      .then(({ user: u }) => setUser(u))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (user) loadData().catch((err: Error) => setMessage(err.message));
  }, [user]);

  async function handleLogin(email: string, password: string) {
    setAuthError(null);
    try {
      const { user: u } = await api.login(email, password);
      setUser(u);
    } catch (err: any) {
      setAuthError(err.message);
    }
  }

  async function handleLogout() {
    await api.logout();
    setUser(null);
    setCategories([]);
    setTransactions([]);
  }

  async function handleCreateTransaction(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    await api.createTransaction(txForm);
    setShowTxModal(false);
    setTxForm((prev) => ({ ...prev, description: "", amount: 50000 }));
    await loadData();
  }

  async function handleDeleteTransaction(id: string) {
    await api.deleteTransaction(id);
    await loadData();
  }

  async function handleCreateCategory(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    if (editingCatId) {
      await api.updateCategory(editingCatId, catForm);
    } else {
      await api.createCategory(catForm);
    }
    setShowCatModal(false);
    setEditingCatId(null);
    setCatForm({ name: "", monthlyBudget: 100000 });
    await loadData();
  }

  function openEditCategory(cat: Category) {
    setEditingCatId(cat.id);
    setCatForm({ name: cat.name, monthlyBudget: cat.monthlyBudget });
    setShowCatModal(true);
  }

  function openNewCategory() {
    setEditingCatId(null);
    setCatForm({ name: "", monthlyBudget: 100000 });
    setShowCatModal(true);
  }

  function openNewTransaction() {
    setTxForm({
      type: "EXPENSE" as "INCOME" | "EXPENSE",
      amount: 50000,
      description: "",
      categoryId: categories[0]?.id ?? "",
      date: today(),
    });
    setShowTxModal(true);
  }

  function viewTitle() {
    const titles: Record<string, string> = {
      dashboard: "Dashboard",
      transactions: "Transacciones",
      categories: "Categorías",
      analytics: "Analíticas",
      savings: "Ahorros",
    };
    return titles[activeView] ?? "Dashboard";
  }

  if (!user) {
    return <LoginForm onLogin={handleLogin} error={authError} />;
  }

  return (
    <DashboardLayout
      active={activeView}
      title={viewTitle()}
      userEmail={user.email}
      onNavigate={setActiveView}
      onLogout={handleLogout}
    >
      {message && (
        <div className="mb-6 rounded-xl bg-amber-50 px-5 py-3 text-[13px] font-medium text-amber-700">{message}</div>
      )}

      {activeView === "dashboard" && (
        <div className="space-y-8">
          <KpiCards summary={summary} />
          <AnalyticsSection transactions={transactions} categories={categories} />
        </div>
      )}

      {activeView === "transactions" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-[14px] text-gray-500">{transactions.length} transacciones registradas</p>
            <button
              onClick={openNewTransaction}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-[13px] font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-150 hover:from-indigo-500 hover:to-purple-500"
            >
              <Plus size={16} />
              Nueva transacción
            </button>
          </div>
          <TransactionTable
            transactions={transactions}
            categories={categories}
            onDelete={handleDeleteTransaction}
          />
        </div>
      )}

      {activeView === "categories" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-[14px] text-gray-500">{categories.length} categorías configuradas</p>
            <button
              onClick={openNewCategory}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-[13px] font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-150 hover:from-indigo-500 hover:to-purple-500"
            >
              <Plus size={16} />
              Nueva categoría
            </button>
          </div>
          <CategoryCards categories={categories} transactions={transactions} />
        </div>
      )}

      {activeView === "analytics" && (
        <AnalyticsSection transactions={transactions} categories={categories} />
      )}

      {activeView === "savings" && (
        <div className="flex h-64 items-center justify-center rounded-[16px] border border-indigo-100/50 bg-white shadow-sm">
          <p className="text-[15px] text-gray-400">Próximamente: sección de ahorros</p>
        </div>
      )}

      {showTxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-indigo-900/40 backdrop-blur-sm" onClick={() => setShowTxModal(false)}>
          <div className="w-full max-w-md rounded-[16px] border border-indigo-100/60 bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-[17px] font-semibold text-gray-900">Nueva transacción</h2>
              <button onClick={() => setShowTxModal(false)} aria-label="Cerrar" className="rounded-lg p-1.5 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateTransaction} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-[12px] font-medium text-gray-600">Tipo</label>
                  <select
                    value={txForm.type}
                    onChange={(e) => setTxForm((prev) => ({ ...prev, type: e.target.value as "INCOME" | "EXPENSE" }))}
                    className="h-10 w-full rounded-xl border border-indigo-100 bg-indigo-50/50 px-3 text-[13px] text-gray-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
                  >
                    <option value="EXPENSE">Gasto</option>
                    <option value="INCOME">Ingreso</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-[12px] font-medium text-gray-600">Valor</label>
                  <input
                    type="number"
                    min="1"
                    value={txForm.amount}
                    onChange={(e) => setTxForm((prev) => ({ ...prev, amount: Number(e.target.value) }))}
                    className="h-10 w-full rounded-xl border border-indigo-100 bg-indigo-50/50 px-3 text-[13px] text-gray-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-gray-600">Categoría</label>
                <select
                  value={txForm.categoryId}
                  onChange={(e) => setTxForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-indigo-100 bg-indigo-50/50 px-3 text-[13px] text-gray-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-gray-600">Descripción</label>
                <input
                  value={txForm.description}
                  onChange={(e) => setTxForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Descripción"
                  className="h-10 w-full rounded-xl border border-indigo-100 bg-indigo-50/50 px-3 text-[13px] text-gray-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-gray-600">Fecha</label>
                <input
                  type="date"
                  value={txForm.date}
                  onChange={(e) => setTxForm((prev) => ({ ...prev, date: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-indigo-100 bg-indigo-50/50 px-3 text-[13px] text-gray-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
                />
              </div>
              <button
                type="submit"
                className="flex h-10 w-full items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-[13px] font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-150 hover:from-indigo-500 hover:to-purple-500"
              >
                Guardar transacción
              </button>
            </form>
          </div>
        </div>
      )}

      {showCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-indigo-900/40 backdrop-blur-sm" onClick={() => { setShowCatModal(false); setEditingCatId(null); }}>
          <div className="w-full max-w-md rounded-[16px] border border-indigo-100/60 bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-[17px] font-semibold text-gray-900">{editingCatId ? "Editar categoría" : "Nueva categoría"}</h2>
              <button onClick={() => { setShowCatModal(false); setEditingCatId(null); }} className="rounded-lg p-1.5 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-gray-600">Nombre</label>
                <input
                  value={catForm.name}
                  onChange={(e) => setCatForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                  className="h-10 w-full rounded-xl border border-indigo-100 bg-indigo-50/50 px-3 text-[13px] text-gray-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-gray-600">Presupuesto mensual</label>
                <input
                  type="number"
                  min="1"
                  value={catForm.monthlyBudget}
                  onChange={(e) => setCatForm((prev) => ({ ...prev, monthlyBudget: Number(e.target.value) }))}
                  className="h-10 w-full rounded-xl border border-indigo-100 bg-indigo-50/50 px-3 text-[13px] text-gray-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
                />
              </div>
              <button
                type="submit"
                className="flex h-10 w-full items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-[13px] font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-150 hover:from-indigo-500 hover:to-purple-500"
              >
                {editingCatId ? "Actualizar categoría" : "Crear categoría"}
              </button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default App;
