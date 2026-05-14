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
    if (formatted.length <= 6) return `+${formatted}`;
    return `+${formatted.slice(0, 4)}xx...`;
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
      <main className="min-h-screen flex bg-white text-neutral-900 font-roboto selection:bg-red-500/30 selection:text-white">
        {/* Left: Form Area */}
        <div className="w-full md:w-[45%] lg:w-[40%] flex flex-col px-8 sm:px-16 md:px-20 py-12 relative z-10 justify-center">
          <Link
            href="/"
            className="absolute top-8 left-8 sm:left-16 md:left-20 flex items-center gap-3 text-neutral-400 hover:text-neutral-900 transition-colors"
          >
            <FaArrowLeft className="text-sm" />
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-3 mb-16 group w-fit mt-10 md:mt-0"
          >
            <div className="p-2.5 bg-red-500 rounded-xl shadow-[0_0_15px_rgba(239,68,68,0.4)] group-hover:scale-105 transition-transform">
              <FaFire className="text-xl text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight font-poppins">FireGuard</span>
          </Link>

          <div className="mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tighter mb-4 text-neutral-900 font-poppins">
              Selamat Datang.
            </h1>
            <p className="text-neutral-500 text-lg leading-relaxed font-light">
              Masuk untuk mengakses portal darurat dan manajemen laporan
              kebakaran Anda.
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex p-1.5 bg-neutral-100/80 rounded-2xl mb-10 backdrop-blur-sm border border-neutral-200/50">
            <button
              type="button"
              onClick={() => {
                setLoginMethod("email");
                setError("");
              }}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-500 font-poppins relative overflow-hidden ${
                loginMethod === "email"
                  ? "bg-white text-neutral-900 shadow-[0_4px_12px_rgba(0,0,0,0.05)] scale-[1.02]"
                  : "bg-transparent text-neutral-500 hover:text-neutral-800 hover:bg-white/50"
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
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-500 font-poppins relative overflow-hidden ${
                loginMethod === "whatsapp"
                  ? "bg-white text-neutral-900 shadow-[0_4px_12px_rgba(0,0,0,0.05)] scale-[1.02]"
                  : "bg-transparent text-neutral-500 hover:text-neutral-800 hover:bg-white/50"
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
                <form onSubmit={handlePasswordLogin} className="space-y-7">
                  <div className="space-y-2 group">
                    <label
                      htmlFor="email"
                      className="text-[11px] font-bold text-neutral-400 uppercase tracking-[0.15em] ml-1 group-focus-within:text-red-500 transition-colors font-poppins"
                    >
                      Alamat Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-200 text-neutral-900 px-6 py-4.5 rounded-[1.25rem] focus:bg-white focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all font-medium placeholder:text-neutral-300 font-roboto text-[15px]"
                      placeholder="contoh@fireguard.id"
                      required
                    />
                  </div>

                  <div className="space-y-2 group">
                    <div className="flex justify-between items-end ml-1 mb-1">
                      <label
                        htmlFor="password"
                        className="text-[11px] font-bold text-neutral-400 uppercase tracking-[0.15em] group-focus-within:text-red-500 transition-colors font-poppins"
                      >
                        Kata Sandi
                      </label>
                      <button
                        type="button"
                        className="text-[11px] font-bold text-red-400 hover:text-red-600 transition-colors uppercase tracking-widest font-poppins"
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
                        className={`w-full bg-neutral-50 border border-neutral-200 text-neutral-900 pl-6 pr-14 py-4.5 rounded-[1.25rem] focus:bg-white focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all font-medium placeholder:text-neutral-300 font-roboto text-[15px] ${!showPassword ? "tracking-[0.3em]" : ""}`}
                        placeholder={
                          showPassword ? "Masukkan kata sandi" : "••••••••"
                        }
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-5 top-1/2 -translate-y-1/2 text-neutral-300 hover:text-red-500 transition-colors p-1"
                      >
                        {showPassword ? (
                          <FaEyeSlash className="text-xl" />
                        ) : (
                          <FaEye className="text-xl" />
                        )}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <m.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-red-50 text-red-600 px-6 py-4 rounded-2xl text-sm font-semibold border border-red-100 flex items-center gap-3"
                    >
                      <div className="size-2 bg-red-500 rounded-full animate-pulse" />
                      {error}
                    </m.div>
                  )}

                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full bg-neutral-900 hover:bg-red-600 text-white py-4.5 rounded-[1.25rem] font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 shadow-xl shadow-black/10 hover:shadow-red-500/30 active:scale-[0.98] disabled:opacity-50 mt-6 font-poppins"
                  >
                    {isPending ? (
                      <span className="flex items-center gap-3">
                        <FaSpinner className="animate-spin text-xl" /> Autentikasi...
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
                      className="space-y-7"
                    >
                      <div className="space-y-2 group">
                        <label
                          htmlFor="wa-phone"
                          className="text-[11px] font-bold text-neutral-400 uppercase tracking-[0.15em] ml-1 group-focus-within:text-green-600 transition-colors font-poppins"
                        >
                          Nomor WhatsApp
                        </label>
                        <div className="relative">
                          <div className="absolute left-6 top-1/2 -translate-y-1/2 text-green-500">
                            <FaWhatsapp className="text-2xl" />
                          </div>
                          <input
                            id="wa-phone"
                            type="tel"
                            value={waPhone}
                            onChange={(e) => setWaPhone(e.target.value)}
                            pattern="[0-9\-\s\+]+"
                            className="w-full bg-neutral-50 border border-neutral-200 text-neutral-900 pl-14 pr-6 py-4.5 rounded-[1.25rem] focus:bg-white focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all font-medium placeholder:text-neutral-300 font-roboto text-[15px]"
                            placeholder="0812-3456-7890"
                            required
                          />
                        </div>
                        <p className="text-[11px] text-neutral-400 ml-1 font-medium">
                          Kami akan mengirimkan kode verifikasi 6-digit.
                        </p>
                      </div>

                      {waError && (
                        <m.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-red-50 text-red-600 px-6 py-4 rounded-2xl text-sm font-semibold border border-red-100 flex items-center gap-3"
                        >
                          <div className="size-2 bg-red-500 rounded-full animate-pulse" />
                          {waError}
                        </m.div>
                      )}

                      <button
                        type="submit"
                        disabled={waLoading}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-500 hover:to-emerald-600 text-white py-4.5 rounded-[1.25rem] font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 shadow-xl shadow-green-500/20 hover:shadow-green-500/40 active:scale-[0.98] disabled:opacity-50 mt-6 font-poppins"
                      >
                        {waLoading ? (
                          <span className="flex items-center gap-3">
                            <FaSpinner className="animate-spin text-xl" /> Meminta OTP...
                          </span>
                        ) : (
                          <span className="flex items-center gap-3">
                            <FaWhatsapp className="text-2xl" />
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
                      className="space-y-7"
                    >
                      {/* Phone info card */}
                      <div className="flex items-center justify-between px-6 py-5 bg-green-50/50 border border-green-100/50 rounded-2xl backdrop-blur-sm">
                        <div className="flex items-center gap-4">
                          <div className="size-10 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-green-500/20">
                            <FaWhatsapp className="text-xl" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                              Mengirim kode ke
                            </p>
                            <p className="text-[15px] font-bold text-neutral-800 mt-0.5">
                              {truncatedPhone}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setWaStep("phone");
                            setWaOtp("");
                            setWaError("");
                            setWaSuccess("");
                          }}
                          className="text-[11px] font-bold text-green-600 hover:text-green-800 uppercase tracking-widest transition-colors py-1 px-3 bg-green-100/50 rounded-lg"
                        >
                          Ganti
                        </button>
                      </div>

                      {/* OTP Input */}
                      <div className="space-y-2 group">
                        <label
                          htmlFor="wa-otp"
                          className="text-[11px] font-bold text-neutral-400 uppercase tracking-[0.15em] ml-1 group-focus-within:text-red-500 transition-colors font-poppins"
                        >
                          Verifikasi Kode
                        </label>
                        <input
                          id="wa-otp"
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={6}
                          value={waOtp}
                          onChange={(e) =>
                            setWaOtp(
                              e.target.value.replace(/\D/g, "").slice(0, 6),
                            )
                          }
                          className="w-full bg-neutral-50 border border-neutral-200 text-neutral-900 px-6 py-5 rounded-[1.25rem] focus:bg-white focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all font-bold text-center text-3xl tracking-[0.6em] placeholder:text-neutral-200 placeholder:font-normal placeholder:tracking-widest font-poppins"
                          placeholder="000000"
                          required
                          autoFocus
                        />
                      </div>

                      {waError && (
                        <m.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-red-50 text-red-600 px-6 py-4 rounded-2xl text-sm font-semibold border border-red-100 flex items-center gap-3"
                        >
                          <div className="size-2 bg-red-500 rounded-full animate-pulse" />
                          {waError}
                        </m.div>
                      )}

                      {waSuccess && !waError && (
                        <m.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-green-50 text-green-700 px-6 py-4 rounded-2xl text-sm font-semibold border border-green-100 flex items-center gap-3"
                        >
                          <div className="size-2 bg-green-500 rounded-full animate-pulse" />
                          {waSuccess}
                        </m.div>
                      )}

                      <button
                        type="submit"
                        disabled={waLoading || waOtp.length !== 6}
                        className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white py-4.5 rounded-[1.25rem] font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 shadow-xl shadow-red-500/20 hover:shadow-red-500/40 active:scale-[0.98] disabled:opacity-50 font-poppins"
                      >
                        {waLoading ? (
                          <span className="flex items-center gap-3">
                            <FaSpinner className="animate-spin text-xl" /> Verifikasi...
                          </span>
                        ) : (
                          "Konfirmasi & Masuk"
                        )}
                      </button>

                      {/* Resend OTP */}
                      <div className="text-center pt-2">
                        {waCooldown > 0 ? (
                          <p className="text-xs text-neutral-400 font-medium">
                            Kirim ulang tersedia dalam{" "}
                            <span className="font-bold text-neutral-600 tabular-nums">
                              {waCooldown}s
                            </span>
                          </p>
                        ) : (
                          <button
                            type="button"
                            disabled={waLoading}
                            onClick={async () => {
                              setWaError("");
                              setWaSuccess("");
                              setWaLoading(true);
                              const formattedPhone = formatPhone(waPhone);
                              try {
                                const response = await fetch(
                                  "/api/auth/login/whatsapp",
                                  {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      phone_number: formattedPhone,
                                    }),
                                  },
                                );
                                const data = await response.json();
                                if (response.ok) {
                                  setWaCooldown(60);
                                  setWaSuccess(
                                    data.message ||
                                      "OTP berhasil dikirim ulang.",
                                  );
                                } else {
                                  setWaError(
                                    data.message || "Gagal mengirim ulang OTP.",
                                  );
                                }
                              } catch {
                                setWaError(
                                  "Terjadi kesalahan jaringan. Coba lagi.",
                                );
                              } finally {
                                setWaLoading(false);
                              }
                            }}
                            className="text-xs font-bold text-green-600 hover:text-green-800 transition-colors disabled:opacity-50 underline underline-offset-8 decoration-2 decoration-green-200 hover:decoration-green-500 font-poppins"
                          >
                            Kirim Ulang Kode OTP
                          </button>
                        )}
                      </div>
                    </m.form>
                  )}
                </AnimatePresence>
              </m.div>
            )}
          </AnimatePresence>

          <p className="mt-12 text-neutral-500 font-medium text-center sm:text-left">
            Belum punya akun FireGuard?{" "}
            <Link
              href="/register"
              className="text-red-500 hover:text-red-700 hover:underline underline-offset-8 decoration-2 font-bold transition-all"
            >
              Buat akun sekarang
            </Link>
          </p>
        </div>

        {/* Right: Premium Minimalist Light Area */}
        <div className="hidden md:flex flex-1 bg-[#fafafa] relative overflow-hidden flex-col items-center justify-center p-20">
          {/* Subtle Ambient Shapes */}
          <div className="absolute top-[-10%] right-[-10%] size-[40rem] bg-red-100/40 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-[-10%] left-[-10%] size-[30rem] bg-orange-50/50 rounded-full blur-[80px] pointer-events-none" />

          {/* Minimalist Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

          <div className="relative z-10 w-full max-w-lg border border-neutral-200/60 bg-white/80 backdrop-blur-3xl p-12 rounded-[2.5rem] shadow-[0_8px_40px_rgb(0,0,0,0.04)]">
            <div className="size-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-10 border border-red-100 shadow-sm">
              <FaFire className="text-2xl" />
            </div>
            <h2 className="text-4xl font-bold text-neutral-900 mb-5 leading-[1.15] tracking-tight font-poppins">
              Satu Laporan,
              <br />
              Menyelamatkan Semua.
            </h2>
            <p className="text-neutral-500 text-lg font-light leading-relaxed">
              Terintegrasi langsung dengan unit pemadam kebakaran di lapangan,
              memastikan lokasi terdeteksi tanpa delay respon.
            </p>

            <div className="mt-12 flex items-center gap-8 pt-8 border-t border-neutral-100">
              <div className="flex flex-col">
                <span className="text-4xl font-bold tracking-tighter text-neutral-900 font-poppins">
                  4m
                </span>
                <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-[0.2em] mt-2">
                  Estimasi Respon
                </span>
              </div>
              <div className="w-px h-12 bg-neutral-200"></div>
              <div className="flex flex-col">
                <span className="text-4xl font-bold tracking-tighter text-neutral-900 font-poppins">
                  24/7
                </span>
                <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-[0.2em] mt-2">
                  Siaga Total
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </LazyMotion>
  );
}
