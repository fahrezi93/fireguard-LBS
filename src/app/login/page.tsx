"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FaFire,
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
          replace(data.isOperator ? "/operator/dashboard" : "/dashboard");
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
          push("/dashboard");
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
        push("/dashboard");
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
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [1, 1.2, 1], opacity: 1 }}
            transition={{
              scale: { repeat: Infinity, duration: 1.5, ease: "easeInOut" },
              opacity: { duration: 0.3 },
            }}
            className="flex flex-col items-center gap-4"
          >
            <div className="p-4 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl shadow-xl shadow-red-500/20">
              <FaFire className="text-4xl text-white" />
            </div>
          </m.div>
        </LazyMotion>
      </main>
    );
  }

  return (
    <LazyMotion features={domAnimation}>
      <main className="h-screen flex bg-white text-gray-900 font-sans selection:bg-red-500/30 overflow-hidden">
        {/* Left: Form Area */}
        <div className="w-full md:w-[55%] lg:w-[48%] h-full flex flex-col px-8 sm:px-16 lg:px-24 py-8 sm:py-12 relative z-10 justify-center bg-white">
          <Link
            href="/"
            className="absolute top-6 left-8 sm:left-16 md:left-20 flex items-center gap-3 text-gray-400 hover:text-gray-900 transition-colors"
          >
            <FaArrowLeft className="text-sm" />
          </Link>

          <div className="mt-8 md:mt-0">
            <Link
              href="/"
              className="inline-flex items-center gap-3 mb-4 group w-fit"
            >
              <div className="p-2 bg-red-500 rounded-xl shadow-[0_0_15px_rgba(159,28,25,0.4)] group-hover:scale-105 transition-transform">
                <FaFire className="text-lg text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">FireGuard</span>
            </Link>

            <div className="mb-4">
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tighter mb-3 text-gray-900">
                Selamat Datang.
              </h1>
              <p className="text-gray-600 text-base leading-relaxed font-medium">
                Masuk untuk mengakses portal darurat dan manajemen laporan
                kebakaran Anda.
              </p>
            </div>

            {/* Tab Switcher */}
            <div className="flex p-1 bg-neutral-100/80 rounded-xl mb-4 backdrop-blur-sm border border-neutral-200/50">
              <button
                type="button"
                onClick={() => {
                  setLoginMethod("email");
                  setError("");
                }}
                className={`flex-1 py-3 px-4 rounded-xl text-base font-bold transition-all duration-500 relative z-10 ${
                  loginMethod === "email"
                    ? "text-white bg-gradient-to-r from-red-500 to-orange-600 shadow-[0_0_15px_rgba(159,28,25,0.4)] shadow-red-500/20"
                    : "text-neutral-500 hover:text-neutral-900"
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
                className={`flex-1 py-3 px-4 rounded-xl text-base font-bold transition-all duration-500 relative z-10 ${
                  loginMethod === "whatsapp"
                    ? "text-white bg-gradient-to-r from-red-500 to-orange-600 shadow-[0_0_15px_rgba(159,28,25,0.4)] shadow-red-500/20"
                    : "text-neutral-500 hover:text-neutral-900"
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
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              >
                <form onSubmit={handlePasswordLogin} className="space-y-4">
                  <div className="space-y-1 group">
                    <label
                      htmlFor="email"
                      className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest pl-1 group-focus-within:text-red-500 transition-colors"
                    >
                      Alamat Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-gray-50/50 border border-gray-200 text-gray-900 px-4 py-3.5 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium placeholder:text-gray-300 placeholder:font-normal text-base"
                      placeholder="contoh@fireguard.id"
                      required
                    />
                  </div>

                  <div className="space-y-1 group">
                    <div className="flex justify-between items-center pl-1">
                      <label
                        htmlFor="password"
                        className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest group-focus-within:text-red-500 transition-colors"
                      >
                        Kata Sandi
                      </label>
                      <button
                        type="button"
                        className="text-[9px] font-bold text-red-500 hover:text-red-600 transition-colors uppercase tracking-widest"
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
                          className={`w-full bg-gray-50/50 border border-gray-200 text-gray-900 pl-4 pr-10 py-3.5 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium placeholder:text-gray-300 placeholder:font-normal text-base ${!showPassword ? 'tracking-wider' : ''}`}
                          placeholder="••••••••"
                          required
                        />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 transition-colors"
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
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-xs font-medium border border-red-100 flex items-center gap-2"
                    >
                      <div className="size-1.5 bg-red-500 rounded-full animate-pulse" />
                      {error}
                    </m.div>
                  )}

                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full bg-[#111] hover:bg-neutral-800 text-white py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 shadow-lg shadow-black/5 active:scale-[0.98] disabled:opacity-50 mt-4"
                  >
                    {isPending ? (
                      <span className="flex items-center gap-2">
                        <FaSpinner className="animate-spin text-sm" /> Autentikasi...
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
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              >
                <AnimatePresence mode="wait">
                  {waStep === "phone" ? (
                    <m.form
                      key="wa-phone-step"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      onSubmit={handleWaSendOtp}
                      className="space-y-4"
                    >
                      <div className="space-y-1 group">
                        <label
                          htmlFor="wa-phone"
                          className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest pl-1 group-focus-within:text-green-600 transition-colors"
                        >
                          Nomor WhatsApp
                        </label>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500">
                            <FaWhatsapp className="text-lg" />
                          </div>
                          <input
                            id="wa-phone"
                            type="tel"
                            value={waPhone}
                            onChange={(e) => setWaPhone(e.target.value)}
                            pattern="[0-9\-\s\+]+"
                            className="w-full bg-gray-50/50 border border-gray-200 text-gray-900 pl-12 pr-4 py-3.5 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-medium placeholder:text-gray-300 placeholder:font-normal text-base"
                            placeholder="0812..."
                            required
                          />
                        </div>
                      </div>

                      {waError && (
                        <m.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-xs font-medium border border-red-100 flex items-center gap-2"
                        >
                          <div className="size-1.5 bg-red-500 rounded-full animate-pulse" />
                          {waError}
                        </m.div>
                      )}

                      <button
                        type="submit"
                        disabled={waLoading}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-500 hover:to-emerald-600 text-white py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 shadow-lg shadow-green-500/10 active:scale-[0.98] disabled:opacity-50 mt-4"
                      >
                        {waLoading ? (
                          <span className="flex items-center gap-2">
                            <FaSpinner className="animate-spin text-sm" /> Meminta OTP...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <FaWhatsapp className="text-lg" />
                            Dapatkan Kode OTP
                          </span>
                        )}
                      </button>
                    </m.form>
                  ) : (
                    <m.form
                      key="wa-otp-step"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      onSubmit={handleWaVerifyOtp}
                      className="space-y-4"
                    >
                      <div className="mb-2">
                        <p className="text-gray-500 text-base leading-relaxed font-medium">
                          Kami telah mengirimkan kode OTP ke WhatsApp <span className="font-bold text-gray-900">{truncatedPhone}</span>
                        </p>
                      </div>
                      <div className="space-y-1">
                        <label
                          htmlFor="wa-otp"
                          className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest pl-1"
                        >
                          Kode Verifikasi OTP
                        </label>
                          <input
                            id="wa-otp"
                            type="text"
                            value={waOtp}
                            onChange={(e) =>
                              setWaOtp(e.target.value.replace(/\D/g, ""))
                            }
                            maxLength={6}
                            className="w-full bg-gray-50/50 border border-gray-200 text-gray-900 px-4 py-4 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-bold tracking-[0.5em] text-center text-xl"
                            placeholder="••••••"
                            required
                          />
                      </div>

                      {waError && (
                        <m.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-xs font-medium border border-red-100 flex items-center gap-2"
                        >
                          <div className="size-1.5 bg-red-500 rounded-full animate-pulse" />
                          {waError}
                        </m.div>
                      )}

                      <button
                        type="submit"
                        disabled={waLoading}
                        className="w-full bg-[#111] hover:bg-neutral-800 text-white py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 shadow-lg shadow-black/5 active:scale-[0.98] disabled:opacity-50 mt-4"
                      >
                        {waLoading ? (
                          <span className="flex items-center gap-2">
                            <FaSpinner className="animate-spin text-sm" /> Verifikasi...
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
            <div className="mt-4 text-center">
              <p className="text-gray-500 text-sm font-medium">
                Belum punya akun FireGuard?{" "}
                <Link
                  href="/register"
                  className="text-red-500 font-bold hover:underline"
                >
                  Buat akun sekarang
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right: Illustration/Content Area */}
      <div className="hidden md:flex md:w-[45%] lg:w-[52%] bg-neutral-50 relative items-center justify-center p-8 lg:p-12 overflow-hidden">
        {/* Grid Background */}
        <div className="absolute inset-0 z-0 opacity-[0.03]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(#000 1.5px, transparent 1.5px), linear-gradient(90deg, #000 1.5px, transparent 1.5px)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <m.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 w-full max-w-xl"
        >
          <div className="bg-white/80 backdrop-blur-xl p-10 rounded-[3rem] border border-white shadow-2xl relative">
            <div className="inline-flex p-4 bg-red-50 rounded-2xl mb-8">
              <FaFire className="text-3xl text-red-500" />
            </div>
            <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tighter text-neutral-900 mb-6 leading-[1.1]">
              Satu Laporan,
              <br />
              <span className="text-red-500">Menyelamatkan Semua.</span>
            </h2>
            <p className="text-neutral-600 text-lg leading-relaxed mb-10 max-w-md font-medium">
              Terintegrasi langsung dengan unit pemadam kebakaran di lapangan,
              memastikan lokasi terdeteksi tanpa delay respon.
            </p>

            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-neutral-100">
              <div>
                <div className="text-4xl font-extrabold text-neutral-900 mb-1">
                  4m
                </div>
                  <div className="text-xs uppercase tracking-widest font-bold text-neutral-500">
                  Estimasi Respon
                </div>
              </div>
              <div>
                <div className="text-4xl font-extrabold text-neutral-900 mb-1">
                  24/7
                </div>
                <div className="text-xs uppercase tracking-widest font-bold text-neutral-400">
                  Siaga Total
                </div>
              </div>
            </div>
          </div>
        </m.div>
      </div>
    </main>
    </LazyMotion >
  );
}
