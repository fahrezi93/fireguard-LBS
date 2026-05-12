"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaFire, FaUser, FaLock, FaUserShield, FaArrowLeft, FaEye, FaEyeSlash } from "react-icons/fa";
import { hasCompletedOnboarding } from "@/lib/onboarding";
import { motion } from "framer-motion";
import Link from "next/link";

export default function OperatorLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const verifySession = async () => {
      if (!hasCompletedOnboarding()) {
        router.replace("/onboarding");
        return;
      }

      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          if (data.isOperator) {
            router.replace("/operator/dashboard");
          } else {
            setIsVerifying(false);
          }
        } else {
          setIsVerifying(false);
        }
      } catch (error) {
        setIsVerifying(false);
      }
    };
    verifySession();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

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

      router.replace("/operator/dashboard");

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
          <FaFire className="text-4xl text-red-500" />
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex bg-white text-gray-900 font-sans selection:bg-red-500/30">

      {/* Left: Form Area */}
      <div className="w-full md:w-[45%] lg:w-[40%] flex flex-col px-8 sm:px-16 md:px-20 py-12 relative z-10 justify-center">
        <Link href="/" className="absolute top-8 left-8 sm:left-16 md:left-20 flex items-center gap-3 text-gray-400 hover:text-gray-900 transition-colors">
          <FaArrowLeft className="text-sm" />
        </Link>

        <div className="inline-flex items-center gap-3 mb-16 group w-fit mt-10 md:mt-0">
          <div className="p-2.5 bg-gray-900 rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.2)] group-hover:scale-105 transition-transform">
            <FaUserShield className="text-xl text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight">FireGuard <span className="text-red-500">Ops</span></span>
        </div>

        <div className="mb-10">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tighter mb-4 text-gray-900">
            Portal Operator.
          </h1>
          <p className="text-gray-500 text-lg leading-relaxed font-light">
            Masuk dengan kredensial instansi untuk mengelola laporan dan komando darurat.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1 group">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest pl-1 group-focus-within:text-red-500 transition-colors">Username ID</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-gray-50/50 border border-gray-200 text-gray-900 px-5 py-4 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium placeholder:text-gray-300 placeholder:font-normal"
              placeholder="admin_plaju"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-1 group">
            <div className="flex justify-between items-end pl-1 mb-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest group-focus-within:text-red-500 transition-colors">Akses Kunci</label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full bg-gray-50/50 border border-gray-200 text-gray-900 pl-5 pr-12 py-4 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium placeholder:text-gray-300 placeholder:font-normal ${!showPassword ? 'tracking-[0.2em]' : ''}`}
                placeholder={showPassword ? "Masukkan sandi" : "••••••••••"}
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 p-1"
                disabled={isLoading}
              >
                {showPassword ? <FaEyeSlash className="text-lg" /> : <FaEye className="text-lg" />}
              </button>
            </div>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 text-red-600 px-5 py-4 rounded-2xl text-sm font-medium border border-red-100 mt-2">
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#111] hover:bg-[#e63946] text-white py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center shadow-lg shadow-black/5 hover:shadow-red-500/25 active:scale-[0.98] disabled:opacity-50 mt-8"
          >
            {isLoading ? (
              <span className="flex items-center gap-2"><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div> Autentikasi...</span>
            ) : "Buka Konsol Komando"}
          </button>
        </form>

        <p className="mt-12 text-gray-400 font-medium text-sm">
          Akses terbatas. Otoritas Dinas Pemadam Kebakaran.
        </p>
      </div>

      {/* Right: Dark Cinematic Area */}
      <div className="hidden md:flex flex-1 bg-[#050505] relative overflow-hidden flex-col items-center justify-center p-20">
        <div className="absolute top-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[30rem] h-[30rem] bg-teal-500/10 rounded-full blur-[80px] pointer-events-none mix-blend-screen" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>

        <div className="relative z-10 w-full max-w-lg border border-white/10 bg-white/5 backdrop-blur-3xl p-12 rounded-[2rem] shadow-2xl">
          <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-8 border border-white/10">
            <FaUserShield className="text-white text-xl" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4 leading-tight tracking-tight">Pusat Komando & Kontrol.</h2>
          <p className="text-gray-400 text-lg font-light leading-relaxed">
            Monitor peta langsung, kelola pelaporan kebakaran dari masyarakat, dan koordinasikan unit respons secepat mungkin.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4">
            <div className="p-5 bg-white/5 rounded-2xl border border-white/5 flex flex-col">
              <span className="text-2xl font-extrabold text-white">Intel</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Area Mapping</span>
            </div>
            <div className="p-5 bg-white/5 rounded-2xl border border-white/5 flex flex-col">
              <span className="text-2xl font-extrabold text-white">Sistem</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Real-time Ops</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
