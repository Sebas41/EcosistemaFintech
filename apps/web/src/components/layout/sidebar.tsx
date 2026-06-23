import { BarChart3, CreditCard, LayoutDashboard, Wallet, PiggyBank, LogOut } from "lucide-react";
import { cn } from "../../lib/utils";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "transactions", label: "Transacciones", icon: CreditCard },
  { id: "categories", label: "Categorías", icon: Wallet },
  { id: "analytics", label: "Analíticas", icon: BarChart3 },
  { id: "savings", label: "Ahorros", icon: PiggyBank },
];

type SidebarProps = {
  active: string;
  onNavigate: (id: string) => void;
  onLogout: () => void;
};

export function Sidebar({ active, onNavigate, onLogout }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col bg-gradient-to-b from-[#0f172a] to-[#1e1b4b] text-white">
      <div className="flex items-center gap-3 px-6 py-7">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
          <Wallet size={18} className="text-white" />
        </div>
        <div>
          <span className="text-[15px] font-semibold tracking-tight">Fintech</span>
          <span className="block text-[11px] font-medium tracking-wide text-indigo-300/70">PERSONAL FINANCE</span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-[14px] font-medium transition-all duration-150",
                active === item.id
                  ? "bg-indigo-500/15 text-indigo-300 shadow-sm"
                  : "text-indigo-200/60 hover:bg-[#1e293b] hover:text-indigo-200"
              )}
            >
              <Icon size={18} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-indigo-800/30 px-3 py-4">
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-[14px] font-medium text-indigo-200/60 transition-all duration-150 hover:bg-[#1e293b] hover:text-indigo-200"
        >
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
