"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { m, LazyMotion, domAnimation, AnimatePresence } from "framer-motion";
import {
  FaChartBar,
  FaFileAlt,
  FaPlus,
  FaCog,
  FaSignOutAlt,
  FaHome,
  FaClock,
  FaCheckCircle,
  FaTruck,
  FaTimesCircle,
  FaExclamationCircle,
  FaBars,
  FaTimes,
  FaUser,
  FaEdit,
  FaChevronDown,
  FaBell, FaFire,
  FaUserCircle,
} from "react-icons/fa";

import NotificationBell from "@/components/NotificationBell";

const UserReportDetailModal = dynamic(() => import("@/components/UserReportDetailModal"), {
  ssr: false,
});

interface Report {
  id: number;
  fire_latitude: number;
  fire_longitude: number;
  reporter_latitude?: number;
  reporter_longitude?: number;
  description: string;
  status: "submitted" | "verified" | "dispatched" | "arrived" | "completed" | "false_report";
  created_at: string;
  updated_at: string;
  admin_notes?: string;
  location_name?: string;
  phone_number: string;
  media_url: string;
  notes?: string;
  contact?: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
}

type StatusType = "pending" | "submitted" | "verified" | "dispatched" | "arrived" | "completed" | "diproses" | "dikirim" | "ditangani" | "selesai" | "dibatalkan" | "false_report";

const statusConfig: Record<StatusType, { label: string; color: string; bgColor: string; icon: any }> = {
  pending: { label: "Menunggu", color: "text-amber-600", bgColor: "bg-amber-50", icon: FaClock },
  submitted: { label: "Menunggu", color: "text-amber-600", bgColor: "bg-amber-50", icon: FaClock },
  verified: { label: "Terverifikasi", color: "text-blue-600", bgColor: "bg-blue-50", icon: FaCheckCircle },
  diproses: { label: "Diproses", color: "text-blue-600", bgColor: "bg-blue-50", icon: FaCheckCircle },
  dispatched: { label: "Meluncur", color: "text-indigo-600", bgColor: "bg-indigo-50", icon: FaTruck },
  dikirim: { label: "Dikirim", color: "text-indigo-600", bgColor: "bg-indigo-50", icon: FaTruck },
  arrived: { label: "Tiba", color: "text-cyan-600", bgColor: "bg-cyan-50", icon: FaCheckCircle },
  ditangani: { label: "Ditangani", color: "text-cyan-600", bgColor: "bg-cyan-50", icon: FaCheckCircle },
  completed: { label: "Selesai", color: "text-emerald-600", bgColor: "bg-emerald-50", icon: FaCheckCircle },
  selesai: { label: "Selesai", color: "text-emerald-600", bgColor: "bg-emerald-50", icon: FaCheckCircle },
  dibatalkan: { label: "Dibatalkan", color: "text-red-600", bgColor: "bg-red-50", icon: FaTimesCircle },
  false_report: { label: "Palsu", color: "text-red-600", bgColor: "bg-red-50", icon: FaTimesCircle },
};

const defaultStatusConfig = {
  label: "Unknown",
  color: "text-neutral-600",
  bgColor: "bg-neutral-50",
  icon: FaExclamationCircle,
};

const StatCard = ({ title, value, icon: Icon, theme }: any) => {
  return (
    <m.div
      whileHover={{ y: -2 }}
      className="bg-white p-5 md:p-6 rounded-2xl border border-neutral-100 flex flex-col justify-between relative group shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
    >
      <div className={`absolute -right-4 -top-4 w-24 h-24 ${theme.blur} opacity-[0.08] bg-current rounded-full blur-2xl pointer-events-none group-hover:scale-150 group-hover:opacity-[0.12] transition-all duration-500`} />

      <div className="flex items-start justify-between mb-4 z-10 relative">
        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center ${theme.iconBg}`}>
          <Icon className={`text-base md:text-lg ${theme.iconColor}`} />
        </div>
        <p className="text-3xl md:text-4xl font-bold tracking-tight text-neutral-800">{value}</p>
      </div>

      <p className="text-[11px] md:text-xs font-semibold text-neutral-500 uppercase tracking-wider relative z-10">{title}</p>
    </m.div>
  );
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me");
      if (!response.ok) {
        router.push("/login");
        return;
      }
      const userData = await response.json();
      setUser(userData);
    } catch {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    checkAuth();
    fetchReports();
  }, [checkAuth]);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/reports/my-reports");
      if (!response.ok) throw new Error("Gagal mengambil data laporan");
      const data = await response.json();
      setReports(data.reports || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const handleLogout = async () => {
    const redirectTarget = "/";
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      window.location.href = redirectTarget;
    } catch (error) {
      console.error("Logout error:", error);
      window.location.href = redirectTarget;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8F9FA] font-sans text-neutral-900 selection:bg-red-500/30 selection:text-white">
      <LazyMotion features={domAnimation}>
        <AnimatePresence>
          {selectedReport && (
            <UserReportDetailModal report={selectedReport} onClose={() => setSelectedReport(null)} />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {sidebarOpen && (
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-neutral-900/20 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Sidebar - Proportions scaled down */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-neutral-100 flex flex-col transform transition-transform duration-300 ease-out lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
        >
          <div className="h-20 flex items-center justify-between px-6 border-b border-transparent">
            <Link href="/" className="flex items-center gap-3">
              <div className="p-2 bg-red-500 rounded-xl shadow-sm">
                <FaBell className="text-white text-base" />
              </div>
              <span className="text-lg font-bold tracking-tight text-neutral-900">SiagaBencana</span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 text-neutral-400 hover:text-neutral-900 transition-colors">
              <FaTimes />
            </button>
          </div>

          <nav className="flex-1 px-4 mt-4 space-y-1">
            <Link href="/" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 rounded-xl transition-all">
              <FaHome className="text-base text-neutral-400" />
              <span>Beranda</span>
            </Link>

            <div className="flex items-center gap-3 px-3 py-2.5 relative bg-red-50/50 rounded-xl">
              <FaChartBar className="text-base text-red-500 relative z-10" />
              <span className="text-sm font-semibold text-red-600 relative z-10">Dashboard</span>
              <div className="absolute inset-0 border border-red-100 rounded-xl pointer-events-none" />
            </div>

            <Link href="/report/new" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 rounded-xl transition-all">
              <FaPlus className="text-base text-neutral-400" />
              <span>Lapor Baru</span>
            </Link>

            <div className="pt-6 pb-2">
              <p className="px-3 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Akun</p>
            </div>

            <Link href="/dashboard/profile" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 rounded-xl transition-all">
              <FaUser className="text-base text-neutral-400" />
              <span>Edit Profil</span>
            </Link>
            <Link href="/dashboard/settings" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 rounded-xl transition-all">
              <FaCog className="text-base text-neutral-400" />
              <span>Pengaturan</span>
            </Link>
          </nav>

          <div className="p-4 border-t border-neutral-50">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-neutral-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
              <FaSignOutAlt className="text-base" />
              <span>Keluar</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 lg:pl-64 flex flex-col min-w-0">

          {/* Header - scaled down */}
          <header className="h-20 px-6 md:px-8 flex items-center justify-between sticky top-0 z-30 bg-[#F8F9FA]/80 backdrop-blur-xl border-b border-neutral-100/50">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2.5 bg-white border border-neutral-200 rounded-lg text-neutral-600 hover:bg-neutral-50 transition-colors">
                <FaBars className="text-sm" />
              </button>
              <div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-neutral-900 leading-none">Beranda.</h1>
                <p className="text-xs font-medium text-neutral-500 mt-1 tracking-wide">Tinjauan area pelaporan darurat</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <NotificationBell onViewReport={(reportId) => {
                const rep = reports.find((r) => r.id === reportId);
                if (rep) setSelectedReport(rep);
              }} />

              <div className="relative" ref={profileDropdownRef}>
                <button onClick={() => setProfileDropdownOpen(!profileDropdownOpen)} className="flex items-center gap-2.5 p-1.5 pr-4 bg-white border border-neutral-200/80 rounded-full hover:shadow-sm hover:border-neutral-300 transition-all">
                  <div className="w-9 h-9 bg-neutral-900 rounded-full flex items-center justify-center text-white font-medium text-sm">
                    {user?.name?.[0]?.toUpperCase() || <FaUserCircle />}
                  </div>
                  <div className="hidden sm:flex flex-col text-left justify-center">
                    <p className="text-sm font-semibold text-neutral-900 leading-tight max-w-[100px] truncate">{user?.name || "Pengguna"}</p>
                  </div>
                  <FaChevronDown className={`hidden sm:block text-neutral-400 text-[10px] ml-1 transition-transform ${profileDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {profileDropdownOpen && (
                    <m.div initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 5, scale: 0.98 }} transition={{ duration: 0.15 }} className="absolute right-0 top-full mt-3 w-64 bg-white rounded-2xl shadow-lg shadow-black/[0.05] border border-neutral-100 overflow-hidden z-50">
                      <div className="px-5 py-4 bg-neutral-50/50 border-b border-neutral-100">
                        <p className="font-semibold text-neutral-900 text-sm truncate">{user?.name || "Pengguna"}</p>
                        <p className="text-xs text-neutral-500 truncate mt-0.5">{user?.email || "-"}</p>
                      </div>
                      <div className="p-2">
                        <button onClick={() => { setProfileDropdownOpen(false); router.push('/dashboard/profile'); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50 rounded-xl transition-colors">
                          <FaEdit className="text-neutral-400" /> Edit Profil
                        </button>
                        <button onClick={() => { setProfileDropdownOpen(false); router.push('/dashboard/settings'); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50 rounded-xl transition-colors">
                          <FaCog className="text-neutral-400" /> Pengaturan
                        </button>
                        <div className="h-px bg-neutral-100 my-1 mx-2" />
                        <button onClick={() => { setProfileDropdownOpen(false); handleLogout(); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors">
                          <FaSignOutAlt className="text-red-400" /> Keluar
                        </button>
                      </div>
                    </m.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </header>

          <main className="flex-1 px-6 md:px-8 py-8 mx-auto w-full max-w-6xl">

            {/* Stats Grid - Standard proportions */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-10">
              <StatCard
                title="Semua Lap." value={reports.length} icon={FaFileAlt}
                theme={{ blur: "text-blue-500", iconBg: "bg-blue-50/50 text-blue-600", iconColor: "text-blue-600" }}
              />
              <StatCard
                title="Menunggu" value={reports.filter((r) => ["submitted", "pending"].includes(r.status)).length} icon={FaClock}
                theme={{ blur: "text-amber-500", iconBg: "bg-amber-50/50 text-amber-600", iconColor: "text-amber-500" }}
              />
              <StatCard
                title="Dlm Proses" value={reports.filter((r) => ["verified", "dispatched", "arrived", "diproses", "dikirim", "ditangani"].includes(r.status)).length} icon={FaTruck}
                theme={{ blur: "text-indigo-500", iconBg: "bg-indigo-50/50 text-indigo-600", iconColor: "text-indigo-500" }}
              />
              <StatCard
                title="Selesai" value={reports.filter((r) => ["completed", "selesai"].includes(r.status)).length} icon={FaCheckCircle}
                theme={{ blur: "text-emerald-500", iconBg: "bg-emerald-50/50 text-emerald-600", iconColor: "text-emerald-500" }}
              />
            </div>

            <div className="flex flex-col">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-lg md:text-xl font-bold tracking-tight text-neutral-900">Riwayat Laporan</h2>
                  <p className="text-sm text-neutral-500 mt-0.5">Daftar insiden yang Anda laporkan</p>
                </div>
                <Link href="/report/new" className="inline-flex items-center gap-2 bg-neutral-900 hover:bg-black text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm active:scale-95 shrink-0">
                  <FaPlus className="text-xs" /> Lapor Baru
                </Link>
              </div>

              <div className="space-y-3">
                {isLoading ? (
                  <div className="py-16 flex flex-col items-center justify-center">
                    <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mb-4 animate-pulse">
                      <FaFire className="text-red-400 text-xl" />
                    </div>
                    <p className="text-neutral-400 font-medium text-sm">Memuat data...</p>
                  </div>
                ) : error ? (
                  <div className="bg-white border border-red-100 p-8 rounded-2xl text-center shadow-sm">
                    <FaExclamationCircle className="mx-auto text-red-500 text-2xl mb-3" />
                    <p className="text-neutral-900 font-semibold text-base mb-1">Gagal Memuat</p>
                    <p className="text-sm text-neutral-500">{error}</p>
                  </div>
                ) : reports.length === 0 ? (
                  <div className="bg-white border border-neutral-100 p-12 md:p-16 rounded-2xl text-center shadow-sm">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-neutral-50 rounded-full border border-neutral-100 mb-5">
                      <FaChartBar className="text-neutral-400 text-2xl" />
                    </div>
                    <h3 className="text-lg font-bold text-neutral-900 tracking-tight mb-2">Belum Ada Laporan</h3>
                    <p className="text-neutral-500 text-sm max-w-sm mx-auto leading-relaxed">Anda belum memiliki riwayat pelaporan. Laporan yang Anda buat akan muncul di sini.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {reports.map((report) => {
                      const statusInfo = statusConfig[report.status as StatusType] || defaultStatusConfig;
                      const StatusIcon = statusInfo.icon;

                      return (
                        <m.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          key={report.id}
                          onClick={() => setSelectedReport(report)}
                          className="group bg-white p-4 md:p-5 rounded-2xl border border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:shadow-sm hover:border-neutral-200 transition-all duration-200"
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <div className={`w-10 h-10 md:w-12 md:h-12 shrink-0 rounded-xl flex items-center justify-center ${statusInfo.bgColor} transition-colors`}>
                              <StatusIcon className={`text-base md:text-lg ${statusInfo.color}`} />
                            </div>
                            <div className="min-w-0 pr-4">
                              <h3 className="text-base font-semibold text-neutral-900 truncate mb-1">
                                Laporan #{report.id}
                              </h3>
                              <p className="text-neutral-500 text-xs md:text-sm truncate">
                                {report.description || "Tanpa deskripsi"}
                              </p>
                            </div>
                          </div>

                          <div className="flex sm:flex-col items-center sm:items-end justify-between shrink-0 ml-14 sm:ml-0">
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${statusInfo.bgColor} ${statusInfo.color} mb-0 sm:mb-1.5`}>
                              {statusInfo.label}
                            </span>
                            <span className="text-neutral-400 text-[11px] font-medium">
                              {formatDate(report.updated_at)}
                            </span>
                          </div>
                        </m.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </LazyMotion>
    </div>
  );
}
