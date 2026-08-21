"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft, FaBell, FaSpinner, FaEye, FaEyeSlash } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

type Step = "form" | "otp";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifySession = async () => {
      try {
        const response = await fetch("/api/auth/me", { credentials: "include" });
        if (response.ok) {
          const data = await response.json();
          router.replace(data.isOperator ? "/operator/dashboard" : "/dashboard");
          return;
        }
      } catch {
      } finally {
        setIsVerifying(false);
      }
    };

    verifySession();
  }, [router]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (password.length < 6) {
        throw new Error("Password minimal 6 karakter.");
      }
      if (password !== confirmPassword) {
        throw new Error("Konfirmasi password tidak cocok.");
      }

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phoneNumber }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Gagal mengirim OTP");
      }

      setMessage(data.message);
      setStep("otp");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, name, phoneNumber, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Verifikasi gagal");
      }

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <main className="fixed inset-0 flex items-center justify-center bg-white">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: [1, 1.15, 1], opacity: 1 }}
          transition={{
            scale: { repeat: Infinity, duration: 1.2, ease: "easeInOut" },
            opacity: { duration: 0.2 }
          }}
          className="flex flex-col items-center justify-center"
        >
          <FaBell className="text-4xl text-red-600 animate-pulse" />
        </motion.div>
      </main>
    );
  }

  return (
    <main className="h-screen flex bg-white text-slate-900 font-sans selection:bg-red-500/30 overflow-hidden">

      {/* Left: Form Area */}
      <div className="w-full md:w-[55%] lg:w-[48%] h-full flex flex-col px-6 sm:px-12 lg:px-16 py-8 relative z-10 justify-center bg-white overflow-y-auto">
        <Link href="/" className="absolute top-6 left-6 sm:left-12 flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors text-xs font-bold uppercase tracking-wider">
          <FaArrowLeft className="text-xs" /> Kembali ke Beranda
        </Link>

        <div className="max-w-sm w-full mx-auto my-auto">
          <Link href="/" className="inline-flex items-center gap-2 mb-4 group w-fit">
            <FaBell className="text-2xl text-red-600 transition-transform duration-300 group-hover:scale-110" />
            <span className="text-xl font-bold tracking-tight text-slate-900">SiagaBencana</span>
          </Link>

          <AnimatePresence mode="wait">
            {step === "form" ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              >
                <div className="mb-5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-1.5 text-slate-900">
                    Buat Akun.
                  </h1>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-normal">
                    Bergabung dengan jaringan tanggap darurat Palembang.
                  </p>
                </div>

                <form onSubmit={handleSendOTP} className="space-y-3.5">
                  <div className="space-y-1 group">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Nama Lengkap *</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ali Siregar" className="w-full bg-slate-50/70 border border-slate-200/80 text-slate-900 px-3.5 py-2.5 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium placeholder:text-slate-300 text-xs sm:text-sm" />
                  </div>

                  <div className="space-y-1 group">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Email *</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="nama@email.com" className="w-full bg-slate-50/70 border border-slate-200/80 text-slate-900 px-3.5 py-2.5 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium placeholder:text-slate-300 text-xs sm:text-sm" />
                  </div>

                  <div className="space-y-1 group">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">No WhatsApp *</label>
                    <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required placeholder="0812..." className="w-full bg-slate-50/70 border border-slate-200/80 text-slate-900 px-3.5 py-2.5 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium placeholder:text-slate-300 text-xs sm:text-sm" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1 group">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Password *</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          minLength={6}
                          placeholder={showPassword ? "Min 6 char" : "••••••••"}
                          className={`w-full bg-slate-50/70 border border-slate-200/80 text-slate-900 pl-3.5 pr-9 py-2.5 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium placeholder:text-slate-300 text-xs sm:text-sm ${!showPassword ? 'tracking-wider' : ''}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 transition-colors"
                        >
                          {showPassword ? <FaEyeSlash className="text-xs" /> : <FaEye className="text-xs" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1 group">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Konfirmasi *</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          minLength={6}
                          placeholder={showConfirmPassword ? "Ulangi sandi" : "••••••••"}
                          className={`w-full bg-slate-50/70 border border-slate-200/80 text-slate-900 pl-3.5 pr-9 py-2.5 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium placeholder:text-slate-300 text-xs sm:text-sm ${!showConfirmPassword ? 'tracking-wider' : ''}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 transition-colors"
                        >
                          {showConfirmPassword ? <FaEyeSlash className="text-xs" /> : <FaEye className="text-xs" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-red-50 text-red-600 px-3.5 py-2.5 rounded-xl text-xs font-medium border border-red-100 flex items-center gap-2">
                      <div className="size-1.5 bg-red-500 rounded-full animate-pulse" />
                      {error}
                    </motion.div>
                  )}

                  <button type="submit" disabled={isLoading} className="w-full bg-slate-900 hover:bg-black text-white py-3 px-5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-2xs active:scale-[0.99] disabled:opacity-50 mt-2 flex items-center justify-center gap-2">
                    {isLoading ? <span className="flex items-center gap-2"><FaSpinner className="animate-spin text-xs" /> Sedang Mengirim...</span> : "Lanjut Verifikasi OTP"}
                  </button>

                  <p className="mt-4 text-center text-slate-500 font-normal text-xs">
                    Punya akun? <Link href="/login" className="text-red-600 font-bold hover:underline">Masuk di sini</Link>
                  </p>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="otp"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                <button onClick={() => setStep("form")} className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-wider mb-6">
                  <FaArrowLeft className="text-xs" /> Kembali
                </button>

                <div className="mb-6">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2 text-slate-900">
                    Cek WhatsApp.
                  </h1>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-normal">
                    Kami mengirim 6 digit kode OTP ke WhatsApp <b className="text-slate-900 font-bold">{phoneNumber}</b>
                  </p>
                </div>

                {message && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-blue-50 text-blue-700 px-3.5 py-3 rounded-xl text-xs font-medium border border-blue-100 mb-4">
                    {message}
                  </motion.div>
                )}

                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div className="space-y-1 group">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Kode OTP</label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="w-full bg-slate-50/70 border border-slate-200/80 text-slate-900 px-3.5 py-3 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-bold text-center text-xl tracking-[0.4em] placeholder:text-slate-200"
                      placeholder="000000"
                      maxLength={6}
                      required
                      autoFocus
                    />
                  </div>

                  {error && (
                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-red-50 text-red-600 px-3.5 py-2.5 rounded-xl text-xs font-medium border border-red-100 flex items-center gap-2">
                      <div className="size-1.5 bg-red-500 rounded-full animate-pulse" />
                      {error}
                    </motion.div>
                  )}

                  <button type="submit" disabled={isLoading || otp.length !== 6} className="w-full bg-slate-900 hover:bg-black text-white py-3 px-5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-2xs active:scale-[0.99] disabled:opacity-50 mt-2 flex items-center justify-center gap-2">
                    {isLoading ? <span className="flex items-center gap-2"><FaSpinner className="animate-spin text-xs" /> Memverifikasi...</span> : "Selesaikan Pendaftaran"}
                  </button>

                  <button type="button" onClick={handleSendOTP} disabled={isLoading} className="w-full text-center text-xs font-semibold text-slate-400 hover:text-slate-900 transition-colors mt-3">
                    Belum menerima kode? Kirim ulang
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sponsor Footer */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center gap-2 text-center">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-400">
              Didanai Oleh:
            </span>
            <img src="/Logo_LPKM.png" alt="Sponsorship Logos" className="h-6 sm:h-7 object-contain" />
          </div>
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
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-3 leading-snug tracking-tight">
              Kesiapsiagaan <br />
              <span className="text-red-600">Mulai dari Anda.</span>
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-6 font-normal">
              Bergabung dengan jaringan tanggap darurat Palembang untuk pelaporan cepat dan penanganan akurat.
            </p>

            <div className="space-y-4 pt-5 border-t border-slate-100">
              <div className="flex gap-3.5 items-start">
                <div className="w-8 h-8 rounded-xl bg-red-50 border border-red-100 text-red-600 font-bold shrink-0 shadow-2xs flex items-center justify-center text-xs">
                  1
                </div>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-normal pt-0.5">
                  Buat akun untuk terdaftar sebagai pelapor tervalidasi dalam radius Palembang.
                </p>
              </div>
              <div className="flex gap-3.5 items-start">
                <div className="w-8 h-8 rounded-xl bg-red-50 border border-red-100 text-red-600 font-bold shrink-0 shadow-2xs flex items-center justify-center text-xs">
                  2
                </div>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-normal pt-0.5">
                  Laporkan insiden dengan satu ketukan dan lacak armada darurat secara real-time.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
