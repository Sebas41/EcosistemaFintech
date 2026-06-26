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
        <div className="flex items-center gap-2.5 rounded-xl px-3 py-1.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-[11px] font-bold text-white shadow-sm">
            {userEmail.charAt(0).toUpperCase()}
          </div>
          <span className="hidden text-[13px] font-medium text-gray-700 sm:block">{userEmail}</span>
        </div>
      </div>
    </header>
  );
}
