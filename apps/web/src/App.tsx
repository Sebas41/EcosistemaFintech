import { FormEvent, useEffect, useMemo, useState } from "react";
import { Edit2, LogOut, Plus, RefreshCw, Save, Trash2, X } from "lucide-react";
import { api, type BudgetAlert, type Category, type Summary, type Transaction, type User } from "./api/client";
import { BudgetBadge } from "./components/BudgetBadge";
import "./styles.css";

const money = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0
});

function today() {
  return new Date().toISOString().slice(0, 10);
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("demo@fintech.local");
  const [password, setPassword] = useState("Password123!");
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary>({ totalIncome: 0, totalExpense: 0, balance: 0 });
  const [message, setMessage] = useState("");
  const [alert, setAlert] = useState<BudgetAlert | null>(null);
  const [page, setPage] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [filters, setFilters] = useState({ type: "", categoryId: "", from: "", to: "", sort: "desc" });
  const [categoryForm, setCategoryForm] = useState({ name: "", monthlyBudget: 100000 });
  const [transactionForm, setTransactionForm] = useState({
    type: "EXPENSE" as Transaction["type"],
    amount: 50000,
    description: "",
    categoryId: "",
    date: today()
  });

  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories]
  );

  async function loadData() {
    const params = new URLSearchParams();
    if (filters.type) params.set("type", filters.type);
    if (filters.categoryId) params.set("categoryId", filters.categoryId);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    params.set("sort", filters.sort);
    params.set("page", String(page));
    params.set("pageSize", "10");

    const [categoryResponse, transactionResponse, summaryResponse] = await Promise.all([
      api.categoryStatus(),
      api.transactions(`?${params.toString()}`),
      api.summary()
    ]);

    setCategories(categoryResponse.data);
    setTransactions(transactionResponse.data);
    setTotalTransactions(transactionResponse.meta.total);
    setSummary(summaryResponse.data);

    if (!transactionForm.categoryId && categoryResponse.data[0]) {
      setTransactionForm((current) => ({ ...current, categoryId: categoryResponse.data[0].id }));
    }
  }

  useEffect(() => {
    api
      .me()
      .then(({ user: currentUser }) => setUser(currentUser))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (user) {
      loadData().catch((error: Error) => setMessage(error.message));
    }
  }, [user, filters, page]);

  async function handleAuth(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    const response =
      authMode === "login" ? await api.login(email, password) : await api.register(email, password);
    setUser(response.user);
  }

  async function handleLogout() {
    await api.logout();
    setUser(null);
    setTransactions([]);
    setCategories([]);
  }

  async function createCategory(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    if (editingCategoryId) {
      await api.updateCategory(editingCategoryId, categoryForm);
    } else {
      await api.createCategory(categoryForm);
    }
    setEditingCategoryId(null);
    setCategoryForm({ name: "", monthlyBudget: 100000 });
    await loadData();
  }

  async function createTransaction(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    setAlert(null);
    const response = editingTransactionId
      ? await api.updateTransaction(editingTransactionId, transactionForm)
      : await api.createTransaction(transactionForm);
    setAlert(response.budgetAlert);
    setEditingTransactionId(null);
    setTransactionForm((current) => ({ ...current, description: "", amount: 50000 }));
    await loadData();
  }

  function editCategory(category: Category) {
    setEditingCategoryId(category.id);
    setCategoryForm({ name: category.name, monthlyBudget: category.monthlyBudget });
  }

  function cancelCategoryEdit() {
    setEditingCategoryId(null);
    setCategoryForm({ name: "", monthlyBudget: 100000 });
  }

  function editTransaction(transaction: Transaction) {
    setEditingTransactionId(transaction.id);
    setTransactionForm({
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
      categoryId: transaction.categoryId,
      date: transaction.date.slice(0, 10)
    });
  }

  function cancelTransactionEdit() {
    setEditingTransactionId(null);
    setTransactionForm((current) => ({
      ...current,
      type: "EXPENSE",
      amount: 50000,
      description: "",
      date: today()
    }));
  }

  async function removeTransaction(id: string) {
    await api.deleteTransaction(id);
    await loadData();
  }

  async function removeCategory(id: string) {
    await api.deleteCategory(id);
    await loadData();
  }

  if (!user) {
    return (
      <main className="auth-shell">
        <form className="auth-panel" onSubmit={handleAuth}>
          <h1>Finanzas personales</h1>
          <p>Acceso seguro al módulo de movimientos y presupuestos.</p>
          <label>
            Correo
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" />
          </label>
          <label>
            Contraseña
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              minLength={10}
            />
          </label>
          <button type="submit">{authMode === "login" ? "Iniciar sesión" : "Crear cuenta"}</button>
          <button
            className="link-button"
            type="button"
            onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}
          >
            {authMode === "login" ? "Registrar nuevo usuario" : "Usar una cuenta existente"}
          </button>
          {message && <p className="error">{message}</p>}
        </form>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <h1>Movimientos financieros</h1>
          <span>{user.email}</span>
        </div>
        <button className="icon-button" type="button" onClick={handleLogout} title="Cerrar sesión">
          <LogOut size={18} />
        </button>
      </header>

      <section className="summary-grid">
        <div>
          <span>Ingresos</span>
          <strong>{money.format(summary.totalIncome)}</strong>
        </div>
        <div>
          <span>Egresos</span>
          <strong>{money.format(summary.totalExpense)}</strong>
        </div>
        <div>
          <span>Balance</span>
          <strong>{money.format(summary.balance)}</strong>
        </div>
      </section>

      {alert && (
        <section className={`alert ${alert.level === "OVER_100" ? "danger" : "warning"}`}>
          {alert.categoryName}: {alert.usagePercent}% usado ({money.format(alert.spent)} de{" "}
          {money.format(alert.monthlyBudget)})
        </section>
      )}

      <section className="workbench">
        <form className="panel" onSubmit={createTransaction}>
          <div className="section-title">
            <h2>{editingTransactionId ? "Editar movimiento" : "Nuevo movimiento"}</h2>
            {editingTransactionId && (
              <button className="icon-button" type="button" onClick={cancelTransactionEdit} title="Cancelar edición">
                <X size={16} />
              </button>
            )}
          </div>
          <div className="two-columns">
            <label>
              Tipo
              <select
                value={transactionForm.type}
                onChange={(event) =>
                  setTransactionForm((current) => ({
                    ...current,
                    type: event.target.value as Transaction["type"]
                  }))
                }
              >
                <option value="EXPENSE">Egreso</option>
                <option value="INCOME">Ingreso</option>
              </select>
            </label>
            <label>
              Valor
              <input
                type="number"
                min="1"
                value={transactionForm.amount}
                onChange={(event) =>
                  setTransactionForm((current) => ({ ...current, amount: Number(event.target.value) }))
                }
              />
            </label>
          </div>
          <label>
            Categoría
            <select
              value={transactionForm.categoryId}
              onChange={(event) =>
                setTransactionForm((current) => ({ ...current, categoryId: event.target.value }))
              }
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Descripción
            <input
              value={transactionForm.description}
              onChange={(event) =>
                setTransactionForm((current) => ({ ...current, description: event.target.value }))
              }
            />
          </label>
          <label>
            Fecha
            <input
              type="date"
              value={transactionForm.date}
              onChange={(event) =>
                setTransactionForm((current) => ({ ...current, date: event.target.value }))
              }
            />
          </label>
          <button type="submit">
            {editingTransactionId ? <Save size={16} /> : <Plus size={16} />}
            {editingTransactionId ? "Actualizar" : "Guardar"}
          </button>
        </form>

        <form className="panel" onSubmit={createCategory}>
          <div className="section-title">
            <h2>{editingCategoryId ? "Editar categoría" : "Categorías"}</h2>
            {editingCategoryId && (
              <button className="icon-button" type="button" onClick={cancelCategoryEdit} title="Cancelar edición">
                <X size={16} />
              </button>
            )}
          </div>
          <div className="two-columns">
            <label>
              Nombre
              <input
                value={categoryForm.name}
                onChange={(event) => setCategoryForm((current) => ({ ...current, name: event.target.value }))}
              />
            </label>
            <label>
              Presupuesto
              <input
                type="number"
                min="1"
                value={categoryForm.monthlyBudget}
                onChange={(event) =>
                  setCategoryForm((current) => ({
                    ...current,
                    monthlyBudget: Number(event.target.value)
                  }))
                }
              />
            </label>
          </div>
          <button type="submit">
            {editingCategoryId ? <Save size={16} /> : <Plus size={16} />}
            {editingCategoryId ? "Actualizar categoría" : "Crear categoría"}
          </button>
          <div className="category-list">
            {categories.map((category) => (
              <div key={category.id} className="category-row">
                <div>
                  <strong>{category.name}</strong>
                  <span>
                    {money.format(category.spent ?? 0)} / {money.format(category.monthlyBudget)}
                  </span>
                </div>
                <BudgetBadge category={category} />
                <button
                  className="icon-button"
                  type="button"
                  onClick={() => editCategory(category)}
                  title="Editar categoría"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  className="icon-button"
                  type="button"
                  onClick={() => removeCategory(category.id)}
                  title="Eliminar categoría"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </form>
      </section>

      <section className="panel transactions-panel">
        <div className="section-title">
          <h2>Historial</h2>
          <button className="icon-button" type="button" onClick={loadData} title="Actualizar">
            <RefreshCw size={16} />
          </button>
        </div>
        <div className="filters">
          <select
            value={filters.type}
            onChange={(event) => {
              setPage(1);
              setFilters((current) => ({ ...current, type: event.target.value }));
            }}
          >
            <option value="">Todos</option>
            <option value="EXPENSE">Egresos</option>
            <option value="INCOME">Ingresos</option>
          </select>
          <select
            value={filters.categoryId}
            onChange={(event) => {
              setPage(1);
              setFilters((current) => ({ ...current, categoryId: event.target.value }));
            }}
          >
            <option value="">Todas las categorías</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={filters.from}
            onChange={(event) => {
              setPage(1);
              setFilters((current) => ({ ...current, from: event.target.value }));
            }}
          />
          <input
            type="date"
            value={filters.to}
            onChange={(event) => {
              setPage(1);
              setFilters((current) => ({ ...current, to: event.target.value }));
            }}
          />
          <select
            value={filters.sort}
            onChange={(event) => {
              setPage(1);
              setFilters((current) => ({ ...current, sort: event.target.value }));
            }}
          >
            <option value="desc">Más recientes</option>
            <option value="asc">Más antiguos</option>
          </select>
        </div>
        <div className="table">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="transaction-row">
              <span>{new Date(transaction.date).toLocaleDateString("es-CO")}</span>
              <strong>{transaction.description}</strong>
              <span>{categoryById.get(transaction.categoryId)?.name ?? "Sin categoría"}</span>
              <span className={transaction.type === "INCOME" ? "income" : "expense"}>
                {transaction.type === "INCOME" ? "+" : "-"}
                {money.format(transaction.amount)}
              </span>
              <button
                className="icon-button"
                type="button"
                onClick={() => editTransaction(transaction)}
                title="Editar movimiento"
              >
                <Edit2 size={16} />
              </button>
              <button
                className="icon-button"
                type="button"
                onClick={() => removeTransaction(transaction.id)}
                title="Eliminar movimiento"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {transactions.length === 0 && <p className="empty">No hay movimientos para los filtros actuales.</p>}
        </div>
        <div className="pagination">
          <button type="button" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>
            Anterior
          </button>
          <span>
            Página {page} de {Math.max(1, Math.ceil(totalTransactions / 10))}
          </span>
          <button
            type="button"
            disabled={page >= Math.ceil(totalTransactions / 10)}
            onClick={() => setPage((current) => current + 1)}
          >
            Siguiente
          </button>
        </div>
      </section>
    </main>
  );
}

export default App;
