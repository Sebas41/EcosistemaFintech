import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { Navbar } from "./navbar";

type DashboardLayoutProps = {
  children: ReactNode;
  active: string;
  title: string;
  userEmail: string;
  onNavigate: (id: string) => void;
  onLogout: () => void;
};

export function DashboardLayout({ children, active, title, userEmail, onNavigate, onLogout }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar active={active} onNavigate={onNavigate} onLogout={onLogout} />
      <div className="pl-64">
        <Navbar title={title} userEmail={userEmail} />
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
