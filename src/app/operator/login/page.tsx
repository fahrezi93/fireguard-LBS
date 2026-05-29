"use client";

import { useReducer } from "react";
import { useRouter } from "next/navigation";
import { FaArrowLeft, FaEye, FaEyeSlash, FaUserShield } from "react-icons/fa";
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
    <main className="flex min-h-dvh bg-white text-neutral-900 font-sans">
      <div className="relative z-10 flex w-full flex-col justify-center px-8 py-12 sm:px-16 md:w-[45%] md:px-20 lg:w-[40%]">
        <Link
          href="/"
          className="absolute left-8 top-8 flex items-center gap-3 text-neutral-400 transition-colors hover:text-neutral-900 sm:left-16 md:left-20"
          aria-label="Kembali ke beranda"
        >
          <FaArrowLeft className="text-sm" />
        </Link>

        <div className="group mb-16 mt-10 inline-flex w-fit items-center gap-3 md:mt-0">
          <div className="rounded-xl bg-neutral-900 p-2.5 shadow-md transition-transform group-hover:scale-105">
            <FaUserShield className="text-xl text-white" />
          </div>
          <span className="text-2xl font-bold">
            FireGuard <span className="text-red-500">Ops</span>
          </span>
        </div>

        <div className="mb-10">
          <h1 className="mb-4 text-balance text-4xl font-semibold text-neutral-900 sm:text-5xl">
            Portal Operator.
          </h1>
          <p className="text-pretty text-lg font-light leading-relaxed text-neutral-500">
            Masuk dengan kredensial instansi untuk mengelola laporan dan komando darurat.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="group space-y-1">
            <label
              htmlFor="operator-username"
              className="pl-1 text-xs font-semibold uppercase text-neutral-500 transition-colors group-focus-within:text-red-500"
            >
              Username ID
            </label>
            <input
              id="operator-username"
              type="text"
              value={username}
              onChange={(e) => dispatch({ type: "field", field: "username", value: e.target.value })}
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50/50 px-5 py-4 font-medium text-neutral-900 transition-all placeholder:text-neutral-300 placeholder:font-normal focus:border-red-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20"
              placeholder="admin_plaju"
              required
              disabled={isLoading}
            />
          </div>

          <div className="group space-y-1">
            <div className="mb-2 flex items-end justify-between pl-1">
              <label
                htmlFor="operator-password"
                className="text-xs font-semibold uppercase text-neutral-500 transition-colors group-focus-within:text-red-500"
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
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50/50 py-4 pl-5 pr-12 font-medium text-neutral-900 transition-all placeholder:text-neutral-300 placeholder:font-normal focus:border-red-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20"
                placeholder="Masukkan sandi"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => dispatch({ type: "togglePassword" })}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-900"
                disabled={isLoading}
                aria-label={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
              >
                {showPassword ? <FaEyeSlash className="text-lg" /> : <FaEye className="text-lg" />}
              </button>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-medium text-red-600"
            >
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-8 flex w-full items-center justify-center rounded-2xl bg-[#111] py-4 text-lg font-bold text-white shadow-lg shadow-black/5 transition-all hover:bg-[#9F1C19] hover:shadow-red-500/25 active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Autentikasi&hellip;
              </span>
            ) : (
              "Buka Konsol Komando"
            )}
          </button>
        </form>

        <p className="mt-12 text-pretty text-sm font-medium text-neutral-400">
          Akses terbatas. Otoritas Dinas Pemadam Kebakaran.
        </p>
      </div>

      <div className="relative hidden flex-1 flex-col items-center justify-center overflow-hidden bg-[#050505] p-20 md:flex">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />

        <div className="relative z-10 w-full max-w-lg rounded-[2rem] border border-white/10 bg-white/5 p-12 shadow-2xl">
          <div className="mb-8 flex size-12 items-center justify-center rounded-full border border-white/10 bg-white/10">
            <FaUserShield className="text-xl text-white" />
          </div>
          <h2 className="mb-4 text-balance text-3xl font-semibold leading-tight text-white">
            Pusat Komando & Kontrol.
          </h2>
          <p className="text-pretty text-lg font-light leading-relaxed text-neutral-400">
            Monitor peta langsung, kelola pelaporan kebakaran dari masyarakat, dan koordinasikan unit respons secepat mungkin.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4">
            <div className="flex flex-col rounded-2xl border border-white/5 bg-white/5 p-5">
              <span className="text-2xl font-extrabold text-white">Intel</span>
              <span className="mt-1 text-[10px] uppercase text-neutral-500">Area Mapping</span>
            </div>
            <div className="flex flex-col rounded-2xl border border-white/5 bg-white/5 p-5">
              <span className="text-2xl font-extrabold text-white">Sistem</span>
              <span className="mt-1 text-[10px] uppercase text-neutral-500">Real-time Ops</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
