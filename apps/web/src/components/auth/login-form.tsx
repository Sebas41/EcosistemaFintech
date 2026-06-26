import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { BrandLogo } from "../brand/brand-logo";

type LoginFormProps = {
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (email: string, password: string) => Promise<void>;
  error: string | null;
};

export function LoginForm({ onLogin, onRegister, error }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        await onLogin(email, password);
      } else {
        await onRegister(email, password);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <div className="w-full max-w-[420px]">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg shadow-indigo-500/25">
            <BrandLogo size={56} />
          </div>
          <h1 className="text-[22px] font-bold tracking-tight text-gray-900">Saldo Vivo</h1>
          <p className="mt-1 text-[14px] text-gray-500">
            {mode === "login" ? "Accede a tu panel financiero" : "Crea tu cuenta financiera"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-[16px] border border-indigo-100/60 bg-white p-8 shadow-lg shadow-indigo-500/5">
          {error && (
            <div className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-[13px] font-medium text-red-600">
              {error}
            </div>
          )}

          <div className="mb-5">
            <label className="mb-1.5 block text-[13px] font-medium text-gray-700">Correo electronico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@ejemplo.com"
              required
              className="h-11 w-full rounded-xl border border-indigo-100 bg-indigo-50/50 px-4 text-[14px] text-gray-700 placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
            />
          </div>

          <div className="mb-6">
            <label className="mb-1.5 block text-[13px] font-medium text-gray-700">Contrasena</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password123!"
                required
                className="h-11 w-full rounded-xl border border-indigo-100 bg-indigo-50/50 pl-4 pr-11 text-[14px] text-gray-700 placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={cn(
              "flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-[14px] font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-150 hover:from-indigo-500 hover:to-purple-500",
              loading && "cursor-not-allowed opacity-70"
            )}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : mode === "login" ? "Iniciar sesion" : "Crear cuenta"}
          </button>

          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            className="mt-4 w-full text-center text-[13px] font-medium text-indigo-600 hover:text-indigo-500"
          >
            {mode === "login" ? "Crear una cuenta" : "Ya tengo cuenta"}
          </button>
        </form>

        <p className="mt-6 text-center text-[12px] text-gray-400">
          Demo: demo@fintech.local / Password123!
        </p>
      </div>
    </div>
  );
}
