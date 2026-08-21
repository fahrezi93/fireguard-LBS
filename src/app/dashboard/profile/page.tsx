"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaArrowLeft,
  FaSpinner,
  FaSave,
  FaCheckCircle,
  FaExclamationCircle,
  FaCalendarAlt,
  FaShieldAlt,
} from "react-icons/fa";

interface User {
  id: number;
  name: string;
  email: string;
  phone_number?: string;
  is_verified: boolean;
  created_at: string;
}

export default function EditProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchProfile = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/profile");
      if (!response.ok) {
        router.push("/login");
        return;
      }
      const userData = await response.json();
      setUser(userData);
      setName(userData.name || "");
      setPhoneNumber(userData.phone_number || "");
    } catch {
      router.push("/login");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone_number: phoneNumber }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal menyimpan profil");
      }

      setSuccess("Profil berhasil diperbarui!");
      setUser(data.user);

      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mb-4"></div>
        <p className="text-xs uppercase tracking-widest font-bold text-gray-500">Memuat Profil</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans selection:bg-red-500/30 flex flex-col text-gray-900">
      {/* Top Sponsor Banner */}
      <div className="w-full bg-white border-b border-gray-200/80 z-30 flex justify-center items-center py-1.5 sm:py-2 shrink-0 relative">
        <div className="flex items-center gap-2.5 sm:gap-3.5 px-3">
          <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.15em] text-slate-500">
            Didanai Oleh:
          </span>
          <div className="bg-white px-2 py-0.5 rounded-md">
            <img src="/Logo_LPKM.png" alt="Sponsorship Logos" className="h-6 sm:h-7 md:h-8 object-contain" />
          </div>
        </div>
      </div>

      {/* Sticky Header */}
      <header className="h-14 sm:h-16 bg-white/90 backdrop-blur-xl border-b border-gray-200/80 sticky top-0 z-20 px-3.5 sm:px-6 lg:px-8 flex items-center justify-between shadow-2xs">
        <div className="max-w-5xl w-full mx-auto flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors uppercase tracking-wider rounded-xl hover:bg-gray-100 active:scale-95"
          >
            <FaArrowLeft className="text-xs sm:text-sm" /> <span>Dashboard</span>
          </Link>
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-gray-900">Edit Profil</h1>
          <div className="w-[60px] sm:w-[90px] invisible"></div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
          
          {/* Left Column: Identity Overview Card */}
          <div className="lg:col-span-4 space-y-4">
            <motion.div 
              initial={{ opacity: 0, y: 8 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs flex flex-col items-center text-center relative overflow-hidden"
            >
              {/* Decorative top accent */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-red-500 via-red-600 to-amber-500" />

              {/* Avatar Circle */}
              <div className="relative mt-2 mb-3.5">
                <div className="w-20 h-20 sm:w-22 sm:h-22 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold text-2xl sm:text-3xl shadow-md border-4 border-white ring-2 ring-gray-100">
                  {user?.name?.[0]?.toUpperCase() || <FaUser className="text-xl" />}
                </div>
              </div>

              <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight mb-0.5">
                {user?.name || "Pengguna"}
              </h2>
              <p className="text-xs text-gray-500 mb-3 truncate max-w-full font-medium">
                {user?.email || "-"}
              </p>

              {/* Verification Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider mb-4 border">
                {user?.is_verified ? (
                  <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border-emerald-200">
                    <FaShieldAlt className="text-emerald-500 text-xs" /> Terverifikasi
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-amber-700 bg-amber-50 border-amber-200">
                    <FaExclamationCircle className="text-amber-500 text-xs" /> Belum Verifikasi
                  </span>
                )}
              </div>

              {/* Metadata Details List */}
              <div className="w-full pt-4 border-t border-gray-100 space-y-2.5 text-left text-xs">
                <div className="flex items-center justify-between text-gray-600">
                  <span className="flex items-center gap-2 text-gray-400">
                    <FaCalendarAlt className="text-xs" /> Terdaftar:
                  </span>
                  <span className="font-semibold text-gray-800">
                    {user?.created_at ? formatDate(user.created_at) : "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-gray-600">
                  <span className="flex items-center gap-2 text-gray-400">
                    <FaPhone className="text-xs" /> WhatsApp:
                  </span>
                  <span className="font-semibold text-gray-800 truncate max-w-[140px]">
                    {user?.phone_number || "Belum diisi"}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Edit Profile Form */}
          <div className="lg:col-span-8">
            <motion.div 
              initial={{ opacity: 0, y: 8 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.05 }}
              className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-7 shadow-xs"
            >
              <div className="mb-5 sm:mb-6">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
                  Informasi Akun
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                  Perbarui identitas profil dan kontak darurat Anda
                </p>
              </div>

              {/* Feedback Alerts */}
              {success && (
                <div className="mb-5 flex items-center gap-2.5 px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs sm:text-sm font-medium animate-in fade-in">
                  <FaCheckCircle className="text-emerald-500 text-base shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              {error && (
                <div className="mb-5 flex items-center gap-2.5 px-4 py-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs sm:text-sm font-medium animate-in fade-in">
                  <FaExclamationCircle className="text-red-500 text-base shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                      <FaUser className="text-xs" />
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-50/70 border border-gray-200 text-gray-900 text-xs sm:text-sm font-medium rounded-xl pl-9 pr-3.5 py-2.5 focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all outline-none"
                      placeholder="Nama sesuai identitas"
                      required
                      minLength={2}
                      maxLength={100}
                    />
                  </div>
                </div>

                {/* Email (Readonly) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      Alamat Email
                    </label>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                      Permanen
                    </span>
                  </div>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                      <FaEnvelope className="text-xs" />
                    </div>
                    <input
                      type="email"
                      value={user?.email || ""}
                      className="w-full bg-gray-100/70 border border-gray-200 text-gray-500 text-xs sm:text-sm font-medium rounded-xl pl-9 pr-3.5 py-2.5 cursor-not-allowed select-none"
                      disabled
                      readOnly
                    />
                  </div>
                  <p className="text-[11px] text-gray-400">Email akun digunakan untuk autentikasi dan tidak dapat diubah.</p>
                </div>

                {/* Phone Number / WhatsApp */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Nomor Telepon / WhatsApp
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                      <FaPhone className="text-xs" />
                    </div>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full bg-slate-50/70 border border-gray-200 text-gray-900 text-xs sm:text-sm font-medium rounded-xl pl-9 pr-3.5 py-2.5 focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all outline-none"
                      placeholder="Contoh: 08123456789"
                    />
                  </div>
                  <p className="text-[11px] text-gray-500 flex items-center gap-1.5">
                    <FaShieldAlt className="text-gray-400 text-xs shrink-0" />
                    <span>Nomor ini digunakan untuk verifikasi respon darurat dan update penanganan.</span>
                  </p>
                </div>

                {/* Submit Action */}
                <div className="pt-4 sm:pt-5 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <Link
                    href="/dashboard"
                    className="text-center text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors py-2 px-3 order-2 sm:order-1"
                  >
                    Batal
                  </Link>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white px-6 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
                  >
                    {isSaving ? (
                      <>
                        <FaSpinner className="animate-spin text-xs" /> Menyimpan...
                      </>
                    ) : (
                      <>
                        <FaSave className="text-xs" /> Simpan Perubahan
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>

        </div>
      </main>
    </div>
  );
}
