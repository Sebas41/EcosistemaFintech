import { Bell, Search, ChevronDown } from "lucide-react";

type NavbarProps = {
  title: string;
  userEmail: string;
};

export function Navbar({ title, userEmail }: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-indigo-100/60 bg-white/80 px-8 backdrop-blur-xl">
      <div>
        <h1 className="text-[18px] font-semibold text-gray-900">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden sm:block">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar..."
            className="h-9 w-56 rounded-xl border border-indigo-100 bg-indigo-50/50 pl-9 pr-4 text-[13px] text-gray-600 placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
          />
        </div>

        <button className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-100 bg-white text-gray-500 transition-colors hover:bg-indigo-50 hover:text-indigo-600">
          <Bell size={16} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-indigo-500 ring-2 ring-white" />
        </button>

        <button className="flex items-center gap-2.5 rounded-xl px-3 py-1.5 transition-colors hover:bg-indigo-50">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-[11px] font-bold text-white shadow-sm">
            {userEmail.charAt(0).toUpperCase()}
          </div>
          <span className="hidden text-[13px] font-medium text-gray-700 sm:block">{userEmail}</span>
          <ChevronDown size={14} className="hidden text-gray-400 sm:block" />
        </button>
      </div>
    </header>
  );
}
