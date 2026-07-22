"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FaBell,
  FaSpinner,
  FaArrowLeft,
  FaEye,
  FaEyeSlash,
  FaCheckCircle,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

type Step = "email" | "otp" | "password";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // --- Step 1: Send OTP to WhatsApp ---
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Email wajib diisi.");
      return;
    }
    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/auth/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || "Kode OTP telah dikirim ke WhatsApp Anda.");
        setStep("otp");
      } else {
        setError(data.message || "Gagal meminta kode OTP. Coba lagi.");
      }
    } catch {
      setError("Terjadi kesalahan jaringan. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Step 2: Verify OTP Server-Side & Advance ---
  const handleVerifyOTPStep = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!otp.trim() || otp.length !== 6) {
      setError("Masukkan 6 digit kode OTP yang valid.");
      return;
    }
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/password/reset", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp: otp.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setStep("password");
      } else {
        setError(data.message || "Kode OTP salah atau sudah kedaluwarsa.");
      }
    } catch {
      setError("Terjadi kesalahan jaringan saat verifikasi OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Step 3: Change Password ---
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || otp.length !== 6) {
      setError("Kode OTP tidak valid. Silakan ulangi.");
      setStep("otp");
      return;
    }
    if (password.length < 6) {
      setError("Kata sandi minimal 6 karakter.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/password/reset", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          otp: otp.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        setError(data.message || "Gagal mengubah kata sandi.");
        if (data.message && data.message.toLowerCase().includes("otp")) {
          setStep("otp");
        }
      }
    } catch {
      setError("Terjadi kesalahan jaringan. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="h-screen flex bg-white text-slate-900 font-sans selection:bg-red-500/30 overflow-hidden">
      {/* Left: Form Area */}
      <div className="w-full md:w-[55%] lg:w-[48%] h-full flex flex-col px-6 sm:px-12 lg:px-16 py-8 relative z-10 justify-center bg-white overflow-y-auto">
        <Link
          href="/login"
          className="absolute top-6 left-6 sm:left-12 flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors text-xs font-bold uppercase tracking-wider"
        >
          <FaArrowLeft className="text-xs" /> Kembali ke Login
        </Link>

        <div className="max-w-sm w-full mx-auto my-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 mb-6 group w-fit"
          >
            <FaBell className="text-2xl text-red-600 transition-transform duration-300 group-hover:scale-110" />
            <span className="text-xl font-bold tracking-tight text-slate-900">
              SiagaBencana
            </span>
          </Link>

          <AnimatePresence mode="wait">
            {isSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl border border-green-100 flex items-center justify-center mx-auto mb-4">
                  <FaCheckCircle className="text-2xl" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">
                  Kata Sandi Berhasil Diubah!
                </h2>
                <p className="text-xs text-slate-600 font-normal leading-relaxed mb-4">
                  Mengalihkan Anda ke halaman login...
                </p>
                <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto" />
              </motion.div>
            ) : step === "email" ? (
              <motion.div
                key="email-step"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                <div className="mb-5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-1.5 text-slate-900">
                    Lupa Password?
                  </h1>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-normal">
                    Masukkan email terdaftar Anda. Kami akan mengirimkan kode OTP reset ke alamat email akun Anda.
                  </p>
                </div>

                <form onSubmit={handleRequestOTP} className="space-y-4">
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
                        <FaSpinner className="animate-spin text-xs" /> Mengirim Kode...
                      </span>
                    ) : (
                      "Kirim Kode Reset OTP"
                    )}
                  </button>

                  <p className="mt-4 text-center text-slate-500 font-normal text-xs">
                    Sudah ingat kata sandi?{" "}
                    <Link
                      href="/login"
                      className="text-red-600 font-bold hover:underline"
                    >
                      Masuk ke sini
                    </Link>
                  </p>
                </form>
              </motion.div>
            ) : step === "otp" ? (
              <motion.div
                key="otp-step"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-wider mb-5"
                >
                  <FaArrowLeft className="text-xs" /> Ubah Email
                </button>

                <div className="mb-5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-1.5 text-slate-900">
                    Cek Email.
                  </h1>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-normal">
                    {message || "Kode OTP reset 6-digit telah dikirim ke alamat email terdaftar Anda."}
                  </p>
                </div>

                <form onSubmit={handleVerifyOTPStep} className="space-y-4">
                  <div className="space-y-1">
                    <label
                      htmlFor="otp"
                      className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block"
                    >
                      Kode OTP (6 Digit)
                    </label>
                    <input
                      id="otp"
                      type="text"
                      value={otp}
                      onChange={(e) =>
                        setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      maxLength={6}
                      className="w-full bg-slate-50/70 border border-slate-200/80 text-slate-900 px-3.5 py-3 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-bold tracking-[0.4em] text-center text-xl"
                      placeholder="••••••"
                      required
                      autoFocus
                    />
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
                    disabled={isLoading || otp.length !== 6}
                    className="w-full bg-slate-900 hover:bg-black text-white py-3 px-5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-2xs active:scale-[0.99] disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <FaSpinner className="animate-spin text-xs" /> Verifikasi Kode...
                      </span>
                    ) : (
                      "Verifikasi Kode OTP"
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleRequestOTP}
                    disabled={isLoading}
                    className="w-full text-center text-xs font-semibold text-slate-400 hover:text-slate-900 transition-colors mt-3"
                  >
                    Belum menerima kode? Kirim ulang
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="password-step"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                <button
                  type="button"
                  onClick={() => setStep("otp")}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-wider mb-5"
                >
                  <FaArrowLeft className="text-xs" /> Kembali ke Kode OTP
                </button>

                <div className="mb-5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-1.5 text-slate-900">
                    Kata Sandi Baru.
                  </h1>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-normal">
                    Buat kata sandi baru yang kuat untuk akun Anda.
                  </p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-3.5">
                  <div className="space-y-1">
                    <label
                      htmlFor="new-password"
                      className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block"
                    >
                      Kata Sandi Baru *
                    </label>
                    <div className="relative">
                      <input
                        id="new-password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        placeholder={showPassword ? "Min 6 char" : "••••••••"}
                        className={`w-full bg-slate-50/70 border border-slate-200/80 text-slate-900 pl-3.5 pr-9 py-2.5 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium placeholder:text-slate-300 text-xs sm:text-sm ${!showPassword ? "tracking-wider" : ""}`}
                        autoFocus
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

                  <div className="space-y-1">
                    <label
                      htmlFor="confirm-password"
                      className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block"
                    >
                      Konfirmasi Kata Sandi *
                    </label>
                    <div className="relative">
                      <input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                        placeholder={showConfirmPassword ? "Ulangi sandi" : "••••••••"}
                        className={`w-full bg-slate-50/70 border border-slate-200/80 text-slate-900 pl-3.5 pr-9 py-2.5 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium placeholder:text-slate-300 text-xs sm:text-sm ${!showConfirmPassword ? "tracking-wider" : ""}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 transition-colors"
                      >
                        {showConfirmPassword ? (
                          <FaEyeSlash className="text-xs" />
                        ) : (
                          <FaEye className="text-xs" />
                        )}
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
                        <FaSpinner className="animate-spin text-xs" /> Memproses...
                      </span>
                    ) : (
                      "Simpan Kata Sandi Baru"
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right: Premium Minimalist Area */}
      <div className="hidden md:flex md:w-[45%] lg:w-[52%] bg-slate-50 border-l border-slate-100 relative items-center justify-center p-8 lg:p-12 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative z-10 w-full max-w-md"
        >
          <div className="bg-white border border-slate-200/80 p-8 rounded-2xl shadow-xs relative">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 border border-red-100/60 flex items-center justify-center mb-5">
              <FaBell className="text-lg" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 leading-snug tracking-tight">
              Akses Portal <br />
              <span className="text-red-600 font-extrabold">SiagaBencana.</span>
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-normal">
              Reset kata sandi secara aman melalui verifikasi Email OTP dua langkah untuk melindungi privasi akun Anda.
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
