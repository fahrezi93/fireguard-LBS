"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft, FaFire, FaSpinner, FaEye, FaEyeSlash } from "react-icons/fa";
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
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: [1, 1.2, 1], opacity: 1 }}
          transition={{
            scale: { repeat: Infinity, duration: 1.5, ease: "easeInOut" },
            opacity: { duration: 0.3 }
          }}
          className="flex flex-col items-center gap-4"
        >
          <div className="p-4 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl shadow-xl shadow-red-500/20">
            <FaFire className="text-4xl text-white" />
          </div>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex bg-white text-gray-900 font-sans selection:bg-red-500/30">

      {/* Left: Form Area */}
      <div className="w-full md:w-[45%] lg:w-[40%] flex flex-col px-8 sm:px-16 md:px-20 py-12 relative z-10 overflow-y-auto">
        <Link href="/" className="absolute top-8 left-8 sm:left-16 md:left-20 flex items-center gap-3 text-gray-400 hover:text-gray-900 transition-colors">
          <FaArrowLeft className="text-sm" />
        </Link>

        <div className="mt-14 md:mt-8 pb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-10 group w-fit">
            <div className="p-2.5 bg-red-500 rounded-xl shadow-[0_0_15px_rgba(239,68,68,0.4)] group-hover:scale-105 transition-transform">
              <FaFire className="text-xl text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight">FireGuard</span>
          </Link>

          <AnimatePresence mode="wait">
            {step === "form" ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-10">
                  <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tighter mb-4 text-gray-900">
                    Buat Akun.
                  </h1>
                  <p className="text-gray-500 text-lg leading-relaxed font-light">
                    Bergabung dengan jaringan tanggap darurat Palembang.
                  </p>
                </div>

                <form onSubmit={handleSendOTP} className="space-y-4">
                  <div className="space-y-1 group">
                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest pl-1 group-focus-within:text-red-500 transition-colors">Nama Lengkap *</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ali Siregar" className="w-full bg-gray-50/50 border border-gray-200 text-gray-900 px-5 py-3.5 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium placeholder:text-gray-300 placeholder:font-normal" />
                  </div>

                  <div className="space-y-1 group">
                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest pl-1 group-focus-within:text-red-500 transition-colors">Email *</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="nama@email.com" className="w-full bg-gray-50/50 border border-gray-200 text-gray-900 px-5 py-3.5 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium placeholder:text-gray-300 placeholder:font-normal" />
                  </div>

                  <div className="space-y-1 group">
                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest pl-1 group-focus-within:text-red-500 transition-colors">No WhatsApp *</label>
                    <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required placeholder="0812..." className="w-full bg-gray-50/50 border border-gray-200 text-gray-900 px-5 py-3.5 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium placeholder:text-gray-300 placeholder:font-normal" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1 group">
                      <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest pl-1 mb-2 block group-focus-within:text-red-500 transition-colors">Password *</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          minLength={6}
                          placeholder={showPassword ? "Minimal 6 char" : "••••••••"}
                          className={`w-full bg-gray-50/50 border border-gray-200 text-gray-900 pl-5 pr-10 py-3.5 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium placeholder:text-gray-300 placeholder:font-normal ${!showPassword ? 'tracking-wider' : ''}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 transition-colors"
                        >
                          {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1 group">
                      <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest pl-1 mb-2 block group-focus-within:text-red-500 transition-colors">Konfirmasi *</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          minLength={6}
                          placeholder={showConfirmPassword ? "Ulangi kata sandi" : "••••••••"}
                          className={`w-full bg-gray-50/50 border border-gray-200 text-gray-900 pl-5 pr-10 py-3.5 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium placeholder:text-gray-300 placeholder:font-normal ${!showConfirmPassword ? 'tracking-wider' : ''}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 transition-colors"
                        >
                          {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 text-red-600 px-5 py-4 rounded-2xl text-sm font-medium border border-red-100">
                      {error}
                    </motion.div>
                  )}

                  <button type="submit" disabled={isLoading} className="w-full bg-[#111] hover:bg-[#e63946] text-white py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center shadow-lg shadow-black/5 hover:shadow-red-500/25 active:scale-[0.98] disabled:opacity-50 mt-6">
                    {isLoading ? <span className="flex items-center gap-2"><FaSpinner className="animate-spin" /> Sedang Mengirim...</span> : "Lanjut Verifikasi OTP"}
                  </button>

                  <p className="mt-8 text-center text-gray-500 font-medium">
                    Punya akun? <Link href="/login" className="text-[#e63946] hover:underline decoration-2 underline-offset-4">Masuk di sini</Link>
                  </p>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <button onClick={() => setStep("form")} className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-widest mb-10">
                  <FaArrowLeft /> Kembali
                </button>

                <div className="mb-10">
                  <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tighter mb-4 text-gray-900">
                    Cek Email.
                  </h1>
                  <p className="text-gray-500 text-lg leading-relaxed font-light">
                    Kami mengirim 6 digit kode OTP ke <b className="text-gray-900 font-semibold">{email}</b>
                  </p>
                </div>

                {message && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-blue-50 text-blue-700 px-5 py-4 rounded-2xl text-sm font-medium border border-blue-100 mb-6">
                    {message}
                  </motion.div>
                )}

                <form onSubmit={handleVerifyOTP} className="space-y-6">
                  <div className="space-y-1 group">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest pl-1 group-focus-within:text-red-500 transition-colors">Kode OTP</label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="w-full bg-gray-50/50 border border-gray-200 text-gray-900 px-4 py-4 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-bold text-center text-4xl tracking-[0.5em] placeholder:text-gray-200 placeholder:font-light"
                      placeholder="000000"
                      maxLength={6}
                      required
                      autoFocus
                    />
                  </div>

                  {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 text-red-600 px-5 py-4 rounded-2xl text-sm font-medium border border-red-100">
                      {error}
                    </motion.div>
                  )}

                  <div className="pt-2">
                    <button type="submit" disabled={isLoading || otp.length !== 6} className="w-full bg-[#111] hover:bg-[#e63946] text-white py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center shadow-lg shadow-black/5 hover:shadow-red-500/25 active:scale-[0.98] disabled:opacity-50">
                      {isLoading ? <span className="flex items-center gap-2"><FaSpinner className="animate-spin" /> Memverifikasi...</span> : "Selesaikan Pendaftaran"}
                    </button>
                  </div>

                  <button type="button" onClick={handleSendOTP} disabled={isLoading} className="w-full text-center text-sm font-semibold text-gray-400 hover:text-gray-900 transition-colors mt-4">
                    Belum menerima kode? Kirim ulang
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right: Premium Minimalist Light Area */}
      <div className="hidden md:flex flex-1 bg-[#fafafa] relative overflow-hidden flex-col items-center justify-center p-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-orange-100/40 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-red-50/50 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

        <div className="relative z-10 w-full max-w-lg border border-neutral-200/60 bg-white/80 backdrop-blur-3xl p-12 rounded-[2.5rem] shadow-[0_8px_40px_rgb(0,0,0,0.04)]">
          <h2 className="text-4xl font-semibold text-neutral-900 mb-8 leading-[1.15] tracking-tight">
            Kesiapsiagaan <br /><span className="text-red-500 font-bold">Mulai dari Anda.</span>
          </h2>
          <div className="space-y-8">
            <div className="flex gap-5">
              <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-500 font-bold shrink-0 shadow-sm text-lg">1</div>
              <p className="text-neutral-500 text-base leading-relaxed pt-3">Buat akun untuk terdaftar sebagai pelapor tervalidasi dalam radius Palembang.</p>
            </div>
            <div className="flex gap-5">
              <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-500 font-bold shrink-0 shadow-sm text-lg">2</div>
              <p className="text-neutral-500 text-base leading-relaxed pt-3">Laporkan insiden dengan satu ketukan dan lacak armada darurat secara real-time.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
