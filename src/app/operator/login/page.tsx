"use client";

import { useReducer } from "react";
import { useRouter } from "next/navigation";
import { FaArrowLeft, FaEye, FaEyeSlash, FaUserShield, FaSpinner, FaBell } from "react-icons/fa";
import { motion } from "framer-motion";
import Link from "next/link";

type LoginState = {
  username: string;
  password: string;
  showPassword: boolean;
  isLoading: boolean;
  error: string;
};

type LoginAction =
  | { type: "field"; field: "username" | "password"; value: string }
  | { type: "togglePassword" }
  | { type: "submit" }
  | { type: "error"; message: string }
  | { type: "done" };

const initialState: LoginState = {
  username: "",
  password: "",
  showPassword: false,
  isLoading: false,
  error: "",
};

function loginReducer(state: LoginState, action: LoginAction): LoginState {
  switch (action.type) {
    case "field":
      return { ...state, [action.field]: action.value };
    case "togglePassword":
      return { ...state, showPassword: !state.showPassword };
    case "submit":
      return { ...state, isLoading: true, error: "" };
    case "error":
      return { ...state, isLoading: false, error: action.message };
    case "done":
      return { ...state, isLoading: false };
    default:
      return state;
  }
}

export default function OperatorLoginPage() {
  const [{ username, password, showPassword, isLoading, error }, dispatch] = useReducer(loginReducer, initialState);
  const { replace } = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: "submit" });

    try {
      const response = await fetch("/api/operator/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal login.");
      }

      replace("/operator/dashboard");
    } catch (err: unknown) {
      dispatch({ type: "error", message: err instanceof Error ? err.message : "Gagal login." });
    } finally {
      dispatch({ type: "done" });
    }
  };

  return (
    <main className="h-screen flex bg-white text-slate-900 font-sans selection:bg-red-500/30 overflow-hidden">
      {/* Left: Form Area */}
      <div className="w-full md:w-[55%] lg:w-[48%] h-full flex flex-col px-6 sm:px-12 lg:px-16 py-8 relative z-10 justify-center bg-white overflow-y-auto">
        <Link
          href="/"
          className="absolute top-6 left-6 sm:left-12 flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors text-xs font-bold uppercase tracking-wider"
        >
          <FaArrowLeft className="text-xs" /> Kembali ke Beranda
        </Link>

        {/* Constrained Max Width Container */}
        <div className="max-w-sm w-full mx-auto">
          {/* Logo */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 mb-6 group w-fit"
          >
            <FaBell className="text-2xl text-red-600 transition-transform duration-300 group-hover:scale-110" />
            <span className="text-xl font-bold tracking-tight text-slate-900">
              SiagaBencana <span className="text-red-600">Ops</span>
            </span>
          </Link>

          {/* Heading */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-1.5 text-slate-900">
              Portal Operator.
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-normal">
              Masuk dengan kredensial instansi untuk mengelola laporan dan komando darurat.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1 group">
              <label
                htmlFor="operator-username"
                className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block"
              >
                Username ID
              </label>
              <input
                id="operator-username"
                type="text"
                value={username}
                onChange={(e) => dispatch({ type: "field", field: "username", value: e.target.value })}
                className="w-full bg-slate-50/70 border border-slate-200/80 text-slate-900 px-3.5 py-2.5 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium placeholder:text-slate-300 text-xs sm:text-sm"
                placeholder="Masukkan Username Operator..."
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-1 group">
              <div className="flex justify-between items-center">
                <label
                  htmlFor="operator-password"
                  className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block"
                >
                  Akses Kunci
                </label>
              </div>
              <div className="relative">
                <input
                  id="operator-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => dispatch({ type: "field", field: "password", value: e.target.value })}
                  className={`w-full bg-slate-50/70 border border-slate-200/80 text-slate-900 pl-3.5 pr-9 py-2.5 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium placeholder:text-slate-300 text-xs sm:text-sm ${!showPassword ? 'tracking-wider' : ''}`}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => dispatch({ type: "togglePassword" })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 transition-colors"
                  aria-label={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
                >
                  {showPassword ? <FaEyeSlash className="text-xs" /> : <FaEye className="text-xs" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-50 text-red-600 px-3.5 py-2.5 rounded-xl text-xs font-medium border border-red-100 flex items-center gap-2"
              >
                <div className="size-1.5 bg-red-500 rounded-full animate-pulse" />
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-900 hover:bg-black text-white py-3 px-5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-2xs active:scale-[0.99] disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <FaSpinner className="animate-spin text-xs" /> Autentikasi...
                </span>
              ) : (
                "Buka Konsol Komando"
              )}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-slate-500 text-xs font-normal">
              Bukan operator?{" "}
              <Link href="/login" className="text-red-600 font-bold hover:underline">
                Masuk sebagai Warga
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Content Area */}
      <div className="hidden md:flex md:w-[45%] lg:w-[52%] bg-slate-50 border-l border-slate-100 relative items-center justify-center p-8 lg:p-12 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative z-10 w-full max-w-md"
        >
          <div className="bg-white border border-slate-200/80 p-8 rounded-2xl shadow-xs relative">
            <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 border border-red-100/60 flex items-center justify-center mb-5">
              <FaUserShield className="text-lg" />
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 mb-3 leading-snug">
              Pusat Komando & <br />
              <span className="text-red-600">Kontrol Darurat.</span>
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-6 font-normal">
              Monitor peta lokasi real-time, validasi laporan masyarakat, dan koordinasikan penugasan pos pemadam terdekat.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-5 border-t border-slate-100">
              <div>
                <div className="text-2xl font-extrabold text-slate-900 mb-0.5">
                  Real-Time
                </div>
                <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                  Monitoring Pos
                </div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-slate-900 mb-0.5">
                  24/7
                </div>
                <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                  Siaga Komando
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
