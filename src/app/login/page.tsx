"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FaBell,
  FaSpinner,
  FaArrowLeft,
  FaEye,
  FaEyeSlash,
  FaWhatsapp,
} from "react-icons/fa";
import { m, LazyMotion, domAnimation, AnimatePresence } from "framer-motion";

type LoginMethod = "email" | "whatsapp";
type WaStep = "phone" | "otp";

export default function LoginPage() {
  const { replace, push } = useRouter();

  // --- Email login state ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  // --- Session verification ---
  const [isVerifying, setIsVerifying] = useState(true);

  // --- Tab state ---
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("email");

  // --- WhatsApp login state ---
  const [waPhone, setWaPhone] = useState("");
  const [waOtp, setWaOtp] = useState("");
  const [waStep, setWaStep] = useState<WaStep>("phone");
  const [waLoading, setWaLoading] = useState(false);
  const [waError, setWaError] = useState("");
  const [waSuccess, setWaSuccess] = useState("");
  const [waCooldown, setWaCooldown] = useState(0);

  // --- Cooldown timer ---
  useEffect(() => {
    if (waCooldown <= 0) return;
    const interval = setInterval(() => {
      setWaCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [waCooldown]);

  // --- Session verification ---
  useEffect(() => {
    const verifySession = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          if (data.isOperator) replace("/operator/dashboard");
          else if (data.role === "SUPER_ADMIN") replace("/admin/dashboard");
          else if (data.role === "KELURAHAN") replace("/kelurahan/dashboard");
          else replace("/dashboard");
          return;
        }
      } catch {
      } finally {
        setIsVerifying(false);
      }
    };
    verifySession();
  }, [replace]);

  // --- Phone formatter ---
  const formatPhone = (raw: string): string => {
    const digits = raw.replace(/\D/g, "");
    if (digits.startsWith("62")) return digits;
    if (digits.startsWith("0")) return "62" + digits.slice(1);
    if (digits.startsWith("8")) return "62" + digits;
    return digits;
  };

  // --- Email login handler ---
  const handlePasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    startTransition(async () => {
      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
          if (data.user?.role === "SUPER_ADMIN") push("/admin/dashboard");
          else if (data.user?.role === "KELURAHAN") push("/kelurahan/dashboard");
          else push("/dashboard");
          return;
        }

        throw new Error(data.message || "Login gagal.");
      } catch (err: any) {
        setError(err.message);
      }
    });
  };

  // --- WhatsApp: send OTP ---
  const handleWaSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waPhone.trim()) {
      setWaError("Nomor WhatsApp tidak boleh kosong.");
      return;
    }
    setWaLoading(true);
    setWaError("");
    setWaSuccess("");

    const formattedPhone = formatPhone(waPhone);

    try {
      const response = await fetch("/api/auth/login/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: formattedPhone }),
      });

      const data = await response.json();

      if (response.ok) {
        setWaStep("otp");
        setWaCooldown(60);
        setWaSuccess(data.message || "OTP berhasil dikirim.");
      } else {
        setWaError(data.message || "Gagal mengirim OTP. Coba lagi.");
      }
    } catch {
      setWaError("Terjadi kesalahan jaringan. Coba lagi.");
    } finally {
      setWaLoading(false);
    }
  };

  // --- WhatsApp: verify OTP ---
  const handleWaVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waOtp.trim() || waOtp.length !== 6) {
      setWaError("Masukkan kode OTP 6 digit.");
      return;
    }
    setWaLoading(true);
    setWaError("");

    const formattedPhone = formatPhone(waPhone);

    try {
      const response = await fetch("/api/auth/login/whatsapp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: formattedPhone, otp: waOtp }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.user?.role === "SUPER_ADMIN") push("/admin/dashboard");
        else if (data.user?.role === "KELURAHAN") push("/kelurahan/dashboard");
        else push("/dashboard");
        return;
      }

      setWaError(data.message || "OTP tidak valid. Coba lagi.");
    } catch {
      setWaError("Terjadi kesalahan jaringan. Coba lagi.");
    } finally {
      setWaLoading(false);
    }
  };

  // --- Truncate phone for display ---
  const truncatedPhone = (() => {
    const formatted = formatPhone(waPhone);
    if (formatted.length <= 6) return "+" + formatted;
    return "+" + formatted.slice(0, 6) + "xxx...";
  })();

  // --- Loading screen ---
  if (isVerifying) {
    return (
      <main className="fixed inset-0 flex items-center justify-center bg-white">
        <LazyMotion features={domAnimation}>
          <m.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: [1, 1.15, 1], opacity: 1 }}
            transition={{
              scale: { repeat: Infinity, duration: 1.2, ease: "easeInOut" },
              opacity: { duration: 0.2 },
            }}
            className="flex flex-col items-center justify-center"
          >
            <FaBell className="text-4xl text-red-600 animate-pulse" />
          </m.div>
        </LazyMotion>
      </main>
    );
  }

  return (
    <LazyMotion features={domAnimation}>
      <main className="h-screen flex bg-white text-slate-900 font-sans selection:bg-red-500/30 overflow-hidden">
        {/* Left: Form Area */}
        <div className="w-full md:w-[55%] lg:w-[48%] h-full flex flex-col px-6 sm:px-12 lg:px-16 py-8 relative z-10 justify-center bg-white overflow-y-auto">
          <Link
            href="/"
            className="absolute top-6 left-6 sm:left-12 flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors text-xs font-bold uppercase tracking-wider"
          >
            <FaArrowLeft className="text-xs" /> Kembali ke Beranda
          </Link>

          <div className="max-w-sm w-full mx-auto">
            <Link
              href="/"
              className="inline-flex items-center gap-2 mb-4 group w-fit"
            >
              <FaBell className="text-2xl text-red-600 transition-transform duration-300 group-hover:scale-110" />
              <span className="text-xl font-bold tracking-tight text-slate-900">SiagaBencana</span>
            </Link>

            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-1.5 text-slate-900">
                Selamat Datang.
              </h1>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-normal">
                Masuk untuk mengakses portal darurat dan manajemen laporan kebakaran Anda.
              </p>
            </div>

            {/* Tab Switcher */}
            <div className="flex p-1 bg-slate-100/80 rounded-xl mb-6 border border-slate-200/50">
              <button
                type="button"
                onClick={() => {
                  setLoginMethod("email");
                  setError("");
                }}
                className={`flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all duration-200 ${
                  loginMethod === "email"
                    ? "text-slate-900 bg-white shadow-2xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Email
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMethod("whatsapp");
                  setWaError("");
                  setWaSuccess("");
                }}
                className={`flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all duration-200 ${
                  loginMethod === "whatsapp"
                    ? "text-slate-900 bg-white shadow-2xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                WhatsApp
              </button>
            </div>

            {/* Animated Form Area */}
            <AnimatePresence mode="wait">
              {loginMethod === "email" ? (
                <m.div
                  key="email-form"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                >
                  <form onSubmit={handlePasswordLogin} className="space-y-4">
                    <div className="space-y-1 group">
                      <label
                        htmlFor="email"
                        className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block"
                      >
                        Alamat Email
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-50/70 border border-slate-200/80 text-slate-900 px-3.5 py-2.5 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium placeholder:text-slate-300 text-xs sm:text-sm"
                        placeholder="contoh@siagabencana.id"
                        required
                      />
                    </div>

                    <div className="space-y-1 group">
                      <div className="flex justify-between items-center">
                        <label
                          htmlFor="password"
                          className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block"
                        >
                          Kata Sandi
                        </label>
                        <button
                          type="button"
                          onClick={() => push("/reset-password")}
                          className="text-[11px] font-bold text-red-600 hover:text-red-700 transition-colors uppercase tracking-wider cursor-pointer z-10 relative"
                        >
                          Lupa Password?
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className={`w-full bg-slate-50/70 border border-slate-200/80 text-slate-900 pl-3.5 pr-9 py-2.5 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium placeholder:text-slate-300 text-xs sm:text-sm ${!showPassword ? 'tracking-wider' : ''}`}
                          placeholder="••••••••"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 transition-colors"
                        >
                          {showPassword ? (
                            <FaEyeSlash className="text-xs" />
                          ) : (
                            <FaEye className="text-xs" />
                          )}
                        </button>
                      </div>
                    </div>

                    {error && (
                      <m.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-red-50 text-red-600 px-3.5 py-2.5 rounded-xl text-xs font-medium border border-red-100 flex items-center gap-2"
                      >
                        <div className="size-1.5 bg-red-500 rounded-full animate-pulse" />
                        {error}
                      </m.div>
                    )}

                    <button
                      type="submit"
                      disabled={isPending}
                      className="w-full bg-slate-900 hover:bg-black text-white py-3 px-5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-2xs active:scale-[0.99] disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
                    >
                      {isPending ? (
                        <span className="flex items-center gap-2">
                          <FaSpinner className="animate-spin text-xs" /> Autentikasi...
                        </span>
                      ) : (
                        "Masuk ke Dashboard"
                      )}
                    </button>
                  </form>
                </m.div>
              ) : (
                <m.div
                  key="whatsapp-form"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                >
                  <AnimatePresence mode="wait">
                    {waStep === "phone" ? (
                      <m.form
                        key="wa-phone-step"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onSubmit={handleWaSendOtp}
                        className="space-y-4"
                      >
                        <div className="space-y-1 group">
                          <label
                            htmlFor="wa-phone"
                            className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block"
                          >
                            Nomor WhatsApp
                          </label>
                          <div className="relative">
                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-green-600">
                              <FaWhatsapp className="text-base" />
                            </div>
                            <input
                              id="wa-phone"
                              type="tel"
                              value={waPhone}
                              onChange={(e) => setWaPhone(e.target.value)}
                              pattern="[0-9\-\s\+]+"
                              className="w-full bg-slate-50/70 border border-slate-200/80 text-slate-900 pl-10 pr-3.5 py-2.5 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all font-medium placeholder:text-slate-300 text-xs sm:text-sm"
                              placeholder="0812..."
                              required
                            />
                          </div>
                        </div>

                        {waError && (
                          <m.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-red-50 text-red-600 px-3.5 py-2.5 rounded-xl text-xs font-medium border border-red-100 flex items-center gap-2"
                          >
                            <div className="size-1.5 bg-red-500 rounded-full animate-pulse" />
                            {waError}
                          </m.div>
                        )}

                        <button
                          type="submit"
                          disabled={waLoading}
                          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-2xs active:scale-[0.99] disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
                        >
                          {waLoading ? (
                            <span className="flex items-center gap-2">
                              <FaSpinner className="animate-spin text-xs" /> Meminta OTP...
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <FaWhatsapp className="text-base" />
                              Dapatkan Kode OTP
                            </span>
                          )}
                        </button>
                      </m.form>
                    ) : (
                      <m.form
                        key="wa-otp-step"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onSubmit={handleWaVerifyOtp}
                        className="space-y-4"
                      >
                        <div>
                          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-normal">
                            Kode OTP telah dikirim ke WhatsApp <span className="font-bold text-slate-900">{truncatedPhone}</span>
                          </p>
                        </div>
                        <div className="space-y-1">
                          <label
                            htmlFor="wa-otp"
                            className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block"
                          >
                            Kode OTP
                          </label>
                          <input
                            id="wa-otp"
                            type="text"
                            value={waOtp}
                            onChange={(e) =>
                              setWaOtp(e.target.value.replace(/\D/g, ""))
                            }
                            maxLength={6}
                            className="w-full bg-slate-50/70 border border-slate-200/80 text-slate-900 px-3.5 py-3 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-bold tracking-[0.4em] text-center text-lg"
                            placeholder="••••••"
                            required
                          />
                        </div>

                        {waError && (
                          <m.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-red-50 text-red-600 px-3.5 py-2.5 rounded-xl text-xs font-medium border border-red-100 flex items-center gap-2"
                          >
                            <div className="size-1.5 bg-red-500 rounded-full animate-pulse" />
                            {waError}
                          </m.div>
                        )}

                        <button
                          type="submit"
                          disabled={waLoading}
                          className="w-full bg-slate-900 hover:bg-black text-white py-3 px-5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-2xs active:scale-[0.99] disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
                        >
                          {waLoading ? (
                            <span className="flex items-center gap-2">
                              <FaSpinner className="animate-spin text-xs" /> Verifikasi...
                            </span>
                          ) : (
                            "Verifikasi & Masuk"
                          )}
                        </button>
                      </m.form>
                    )}
                  </AnimatePresence>
                </m.div>
              )}
            </AnimatePresence>

            {loginMethod === "email" && (
              <div className="mt-5 text-center">
                <p className="text-slate-500 text-xs font-normal">
                  Belum punya akun SiagaBencana?{" "}
                  <Link
                    href="/register"
                    className="text-red-600 font-bold hover:underline"
                  >
                    Buat akun sekarang
                  </Link>
                </p>
              </div>
            )}

            {/* Sponsor Footer */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center gap-2 text-center">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-400">
                Didanai Oleh:
              </span>
              <img src="/Logo_LPKM.png" alt="Sponsorship Logos" className="h-6 sm:h-7 object-contain" />
            </div>
          </div>
        </div>

        {/* Right: Illustration/Content Area */}
        <div className="hidden md:flex md:w-[45%] lg:w-[52%] bg-slate-50 border-l border-slate-100 relative items-center justify-center p-8 lg:p-12 overflow-hidden">
          <m.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative z-10 w-full max-w-md"
          >
            <div className="bg-white border border-slate-200/80 p-8 rounded-2xl shadow-xs relative">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 border border-red-100/60 flex items-center justify-center mb-5">
                <FaBell className="text-lg" />
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 mb-3 leading-snug">
                Satu Laporan, <br />
                <span className="text-red-600">Menyelamatkan Semua.</span>
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-6 font-normal">
                Terintegrasi langsung dengan unit pemadam kebakaran di lapangan, memastikan lokasi terdeteksi tanpa delay respon.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-5 border-t border-slate-100">
                <div>
                  <div className="text-2xl font-extrabold text-slate-900 mb-0.5">
                    4m
                  </div>
                  <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                    Estimasi Respon
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-slate-900 mb-0.5">
                    24/7
                  </div>
                  <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                    Siaga Total
                  </div>
                </div>
              </div>
            </div>
          </m.div>
        </div>
      </main>
    </LazyMotion>
  );
}
