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
  FaPowerOff,
} from "react-icons/fa";

import NotificationBell from "@/components/NotificationBell";
import ActiveTask from "./ActiveTask";

// Removed UserReportDetailModal import as it's modified for Petugas

interface ReportHistory {
  id: number;
  categoryName: string;
  address: string;
  statusPetugas: "completed" | "false_report" | "dibatalkan";
  createdAt: string;
  acceptedAt: string;
  arrivedAt: string;
  completedAt: string;
  photoUrl: string;
  durationSeconds: number;
  responseTimeSeconds: number;
  contact?: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
}

type StatusType = "completed" | "false_report" | "dibatalkan";

const statusConfig: Record<StatusType, { label: string; color: string; bgColor: string; icon: any }> = {
  completed: { label: "Selesai", color: "text-emerald-600", bgColor: "bg-emerald-50", icon: FaCheckCircle },
  dibatalkan: { label: "Dibatalkan", color: "text-red-600", bgColor: "bg-red-50", icon: FaTimesCircle },
  false_report: { label: "Laporan Palsu", color: "text-red-600", bgColor: "bg-red-50", icon: FaTimesCircle },
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
      className="bg-white p-3.5 sm:p-5 md:p-6 rounded-2xl border border-neutral-100/90 flex flex-col justify-between relative group shadow-2xs hover:shadow-xs transition-all duration-300 overflow-hidden"
    >
      <div className={`absolute -right-4 -top-4 w-24 h-24 ${theme.blur} opacity-[0.08] bg-current rounded-full blur-2xl pointer-events-none group-hover:scale-150 group-hover:opacity-[0.12] transition-all duration-500`} />

      <div className="flex items-start justify-between mb-2 sm:mb-4 z-10 relative">
        <div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center ${theme.iconBg} shrink-0`}>
          <Icon className={`text-xs sm:text-base md:text-lg ${theme.iconColor}`} />
        </div>
        <p className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-neutral-800">{value}</p>
      </div>

      <p className="text-[10px] sm:text-[11px] md:text-xs font-bold text-neutral-500 uppercase tracking-wider relative z-10 truncate">{title}</p>
    </m.div>
  );
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [reports, setReports] = useState<ReportHistory[]>([]);
  const [stats, setStats] = useState<{ totalCompleted: number, avgResponseTimeSeconds: number }>({ totalCompleted: 0, avgResponseTimeSeconds: 0 });
  const [activeTask, setActiveTask] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"tugas" | "riwayat">("tugas");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [pendingTasks, setPendingTasks] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportHistory | null>(null);
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
    fetchActiveTask();
  }, [checkAuth]);

  const fetchActiveTask = async () => {
    try {
      const res = await fetch("/api/petugas/active-tasks");
      if (res.ok) {
        const data = await res.json();
        setActiveTask(data.active_task || data.report || null);
        setPendingTasks(data.pending_tasks || []);
      }
    } catch (e) {
      console.error("Failed to fetch active task", e);
    }
  };

  const toggleOnDutyStatus = async () => {
    if (!user) return;
    setIsUpdatingStatus(true);
    try {
      const newStatus = !(user as any).is_on_duty;
      const res = await fetch("/api/petugas/status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_on_duty: newStatus })
      });
      if (res.ok) {
        setUser({ ...user, is_on_duty: newStatus } as any);
      } else {
        alert("Gagal memperbarui status");
      }
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan jaringan");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Polling setiap 10 detik jika user is_on_duty
  useEffect(() => {
    if (user && (user as any).is_on_duty) {
      const interval = setInterval(() => {
        fetchActiveTask();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleStatusUpdate = (taskId: number) => async (status: string, notes?: string, photoBase64?: string) => {
    try {
      let res;
      if (status === "accepted" || status === "refresh") {
        // Sudah di-handle oleh ActiveTask.tsx secara internal, cukup refresh data saja.
        fetchActiveTask();
        fetchReports();
        return;
      } else {
        if (photoBase64 && photoBase64.startsWith('data:image')) {
          // Manual Base64 to Blob conversion (menghindari TypeError: Failed to fetch pada data: URI)
          const [header, base64Data] = photoBase64.split(',');
          const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
          const byteString = atob(base64Data);
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          const blob = new Blob([ab], { type: mimeType });
          
          const formData = new FormData();
          formData.append("reportId", taskId.toString());
          formData.append("status", status);
          if (notes) formData.append("notes", notes);
          formData.append("file", blob, "completion_photo.jpg");

          res = await fetch("/api/petugas/update-status", {
            method: "POST",
            body: formData
          });
        } else {
          res = await fetch("/api/petugas/update-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              reportId: taskId, 
              status, 
              notes
            })
          });
        }
      }
      
      if (res.ok) {
        fetchActiveTask();
        fetchReports();
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.message || "Gagal memperbarui status laporan");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // WebSocket untuk update status real-time
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "STATUS_UPDATE" && data.payload) {
            const { reportId, newStatus } = data.payload;
            setReports((prevReports) =>
              prevReports.map((r) =>
                r.id === reportId ? { ...r, statusPetugas: newStatus } : r
              )
            );
            setSelectedReport((prev) =>
              prev && prev.id === reportId ? { ...prev, statusPetugas: newStatus } : prev
            );
            // Cek apakah update ini untuk active task saat ini
            setActiveTask((prev: any) => {
               if (prev && prev.id === reportId) {
                  if (newStatus === 'completed' || newStatus === 'dibatalkan' || newStatus === 'false_report') {
                     return null; // Task is no longer active
                  }
                  return { ...prev, status_petugas: newStatus };
               }
               return prev;
            });
          } else if (data.type === "NEW_ASSIGNMENT") {
             // Fetch ulang active task karena ada assignment baru
             fetchActiveTask();
          }
        } catch (e) {
          console.error("Error parsing WS message", e);
        }
      };

      ws.onclose = () => {
        reconnectTimeout = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
  }, []);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/petugas/history");
      if (!response.ok) throw new Error("Gagal mengambil data laporan");
      const data = await response.json();
      setReports(data.history || []);
      setStats(data.stats || { totalCompleted: 0, avgResponseTimeSeconds: 0 });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
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
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="bg-white rounded-2xl p-6 max-w-lg w-full">
                <h3 className="text-lg font-bold mb-4">Detail Laporan Selesai</h3>
                <div className="space-y-3 text-sm">
                  <p><strong>ID Laporan:</strong> #{selectedReport.id}</p>
                  <p><strong>Kategori:</strong> {selectedReport.categoryName}</p>
                  <p><strong>Alamat:</strong> {selectedReport.address}</p>
                  <p><strong>Diselesaikan Pada:</strong> {formatDate(selectedReport.completedAt)}</p>
                  <p><strong>Waktu Penanganan:</strong> {Math.floor((selectedReport.durationSeconds || 0) / 60)} menit</p>
                  {selectedReport.photoUrl && (
                    <div className="mt-4">
                      <p className="font-semibold mb-2">Foto Penanganan:</p>
                      <img src={selectedReport.photoUrl} alt="Foto penanganan" className="rounded-lg max-h-64 object-cover" />
                    </div>
                  )}
                </div>
                <div className="mt-6 flex justify-end">
                  <button onClick={() => setSelectedReport(null)} className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg font-medium">
                    Tutup
                  </button>
                </div>
              </div>
            </div>
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
          <div className="h-16 lg:h-20 flex items-center justify-between px-5 lg:px-6 border-b border-neutral-100 shrink-0">
            <Link href="/" className="flex items-center gap-3">
              <div className="p-2 bg-red-500 rounded-xl shadow-xs">
                <FaBell className="text-white text-base" />
              </div>
              <span className="text-base lg:text-lg font-bold tracking-tight text-neutral-900">SiagaBencana</span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors" aria-label="Tutup menu">
              <FaTimes className="text-sm" />
            </button>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            <Link href="/" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 rounded-xl transition-all">
              <FaHome className="text-base text-neutral-400" />
              <span>Beranda</span>
            </Link>

            <button onClick={() => setActiveTab("tugas")} className={`w-full flex items-center gap-3 px-3 py-2.5 relative rounded-xl transition-all ${activeTab === "tugas" ? "bg-red-50/50" : "hover:bg-neutral-50"}`}>
              <FaFire className={`text-base relative z-10 ${activeTab === "tugas" ? "text-red-500" : "text-neutral-400"}`} />
              <span className={`text-sm font-semibold relative z-10 ${activeTab === "tugas" ? "text-red-600" : "text-neutral-600"}`}>Tugas Aktif</span>
              {activeTab === "tugas" && <div className="absolute inset-0 border border-red-100 rounded-xl pointer-events-none" />}
            </button>

            <button onClick={() => setActiveTab("riwayat")} className={`w-full flex items-center gap-3 px-3 py-2.5 relative rounded-xl transition-all ${activeTab === "riwayat" ? "bg-red-50/50" : "hover:bg-neutral-50"}`}>
              <FaChartBar className={`text-base relative z-10 ${activeTab === "riwayat" ? "text-red-500" : "text-neutral-400"}`} />
              <span className={`text-sm font-semibold relative z-10 ${activeTab === "riwayat" ? "text-red-600" : "text-neutral-600"}`}>Riwayat Laporan</span>
              {activeTab === "riwayat" && <div className="absolute inset-0 border border-red-100 rounded-xl pointer-events-none" />}
            </button>

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
        <div className="flex-1 lg:pl-64 flex flex-col min-w-0 min-h-screen">
          {/* Top Sponsor Banner */}
          <div className="w-full bg-white border-b border-gray-200/80 z-30 flex justify-center items-center py-1.5 sm:py-2 shrink-0 relative">
            <div className="flex items-center gap-2.5 sm:gap-3.5 px-3">
              <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.15em] text-slate-500">
                Didanai Oleh:
              </span>
              <div className="bg-white px-2 py-0.5 rounded-md">
                <img src="/Logo_LPKM.webp" alt="Sponsorship Logos" className="h-6 sm:h-7 md:h-8 object-contain" />
              </div>
            </div>
          </div>

          {/* Header */}
          <header className="h-14 sm:h-16 lg:h-18 px-3.5 sm:px-6 md:px-8 flex items-center justify-between sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b border-neutral-100/80 shadow-2xs">
            <div className="flex items-center gap-2.5 sm:gap-4">
              <button 
                onClick={() => setSidebarOpen(true)} 
                className="lg:hidden p-2 sm:p-2.5 bg-white border border-neutral-200 rounded-xl text-neutral-600 hover:bg-neutral-50 active:scale-95 transition-all"
                aria-label="Buka menu"
              >
                <FaBars className="text-sm" />
              </button>
              <div>
                <h1 className="text-base sm:text-xl md:text-2xl font-bold tracking-tight text-neutral-900 leading-none">Beranda.</h1>
                <p className="text-[11px] sm:text-xs font-medium text-neutral-500 mt-0.5 tracking-wide hidden xs:block">Tinjauan area pelaporan darurat</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <NotificationBell onViewReport={(reportId) => {
                const rep = reports.find((r) => r.id === reportId);
                if (rep) setSelectedReport(rep);
              }} />

              <div className="relative" ref={profileDropdownRef}>
                <button onClick={() => setProfileDropdownOpen(!profileDropdownOpen)} className="flex items-center gap-2 p-1 sm:p-1.5 sm:pr-4 bg-white border border-neutral-200/80 rounded-full hover:shadow-xs hover:border-neutral-300 transition-all active:scale-95">
                  <div className="w-7 h-7 sm:w-9 sm:h-9 bg-neutral-900 rounded-full flex items-center justify-center text-white font-medium text-xs sm:text-sm">
                    {user?.name?.[0]?.toUpperCase() || <FaUserCircle />}
                  </div>
                  <div className="hidden sm:flex flex-col text-left justify-center">
                    <p className="text-sm font-semibold text-neutral-900 leading-tight max-w-[100px] truncate">{user?.name || "Pengguna"}</p>
                  </div>
                  <FaChevronDown className={`hidden sm:block text-neutral-400 text-[10px] ml-1 transition-transform ${profileDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {profileDropdownOpen && (
                    <m.div initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 5, scale: 0.98 }} transition={{ duration: 0.15 }} className="absolute right-0 top-full mt-3 w-60 sm:w-64 bg-white rounded-2xl shadow-lg shadow-black/[0.05] border border-neutral-100 overflow-hidden z-50">
                      <div className="px-4 py-3 sm:px-5 sm:py-4 bg-neutral-50/50 border-b border-neutral-100">
                        <p className="font-semibold text-neutral-900 text-sm truncate">{user?.name || "Pengguna"}</p>
                        <p className="text-xs text-neutral-500 truncate mt-0.5">{user?.email || "-"}</p>
                      </div>
                      <div className="p-2">
                        <button 
                          onClick={() => { setProfileDropdownOpen(false); toggleOnDutyStatus(); }} 
                          disabled={isUpdatingStatus}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-xs sm:text-sm font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50 rounded-xl transition-colors"
                        >
                          <FaPowerOff className={(user as any)?.is_on_duty ? "text-green-500" : "text-neutral-400"} /> 
                          {(user as any)?.is_on_duty ? "Sedang Bertugas (On Duty)" : "Sedang Istirahat (Off Duty)"}
                        </button>
                        <button onClick={() => { setProfileDropdownOpen(false); router.push('/dashboard/profile'); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-xs sm:text-sm font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50 rounded-xl transition-colors">
                          <FaEdit className="text-neutral-400" /> Edit Profil
                        </button>
                        <button onClick={() => { setProfileDropdownOpen(false); router.push('/dashboard/settings'); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-xs sm:text-sm font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50 rounded-xl transition-colors">
                          <FaCog className="text-neutral-400" /> Pengaturan
                        </button>
                        <div className="h-px bg-neutral-100 my-1 mx-2" />
                        <button onClick={() => { setProfileDropdownOpen(false); handleLogout(); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-xs sm:text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors">
                          <FaSignOutAlt className="text-red-400" /> Keluar
                        </button>
                      </div>
                    </m.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </header>

          <main className="flex-1 px-3.5 sm:px-6 md:px-8 py-5 sm:py-8 mx-auto w-full max-w-6xl">

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-2 gap-2.5 sm:gap-4 md:gap-5 mb-6 sm:mb-8 md:mb-10">
              <StatCard
                title="Laporan Diselesaikan" value={stats.totalCompleted} icon={FaCheckCircle}
                theme={{ blur: "text-emerald-500", iconBg: "bg-emerald-50/50 text-emerald-600", iconColor: "text-emerald-500" }}
              />
              <StatCard
                title="Rata-rata Waktu Respon" value={stats.avgResponseTimeSeconds > 0 ? `${Math.floor(stats.avgResponseTimeSeconds / 60)} m` : "-"} icon={FaClock}
                theme={{ blur: "text-blue-500", iconBg: "bg-blue-50/50 text-blue-600", iconColor: "text-blue-600" }}
              />
            </div>

            {/* Tab Switcher (Main Content Area) */}
            <div className="flex bg-neutral-100 p-1.5 rounded-xl w-full sm:w-fit mb-6 sm:mb-8">
              <button 
                onClick={() => setActiveTab("tugas")} 
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === "tugas" ? "bg-white text-red-600 shadow-sm" : "text-neutral-500 hover:text-neutral-700"}`}
              >
                <FaFire className={activeTab === "tugas" ? "text-red-500" : "text-neutral-400"} />
                Tugas Aktif
              </button>
              <button 
                onClick={() => setActiveTab("riwayat")} 
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === "riwayat" ? "bg-white text-red-600 shadow-sm" : "text-neutral-500 hover:text-neutral-700"}`}
              >
                <FaChartBar className={activeTab === "riwayat" ? "text-red-500" : "text-neutral-400"} />
                Riwayat Laporan
              </button>
            </div>

            {/* Tabs Content */}
            {activeTab === "tugas" ? (
               <div className="flex flex-col">
                  <div className="flex justify-between items-center mb-4 sm:mb-6">
                    <div>
                      <h2 className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-neutral-900">Tugas Saat Ini</h2>
                      <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">Segera tindak lanjuti laporan yang ditugaskan kepada Anda</p>
                    </div>
                    {/* Status Toggle Indicator */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-neutral-500">Status Anda:</span>
                      <button 
                        onClick={toggleOnDutyStatus}
                        disabled={isUpdatingStatus}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isUpdatingStatus ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${(user as any)?.is_on_duty ? 'bg-green-500' : 'bg-neutral-300'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${(user as any)?.is_on_duty ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  </div>
                  
                  {activeTask ? (
                     <ActiveTask 
                        task={activeTask} 
                        onStatusUpdate={handleStatusUpdate(activeTask.id)} 
                     />
                  ) : pendingTasks.length > 0 ? (
                     <div className="space-y-4">
                        <h3 className="text-lg font-bold text-red-600 mb-2">Laporan Darurat Baru!</h3>
                        {pendingTasks.map(task => (
                           <ActiveTask 
                              key={task.id}
                              task={task} 
                              onStatusUpdate={handleStatusUpdate(task.id)} 
                           />
                        ))}
                     </div>
                  ) : (
                     <div className="bg-neutral-50 rounded-2xl border border-neutral-100 p-8 sm:p-12 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                           <FaCheckCircle className="text-2xl sm:text-3xl" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-neutral-900 mb-2">Tidak Ada Tugas Aktif</h3>
                        <p className="text-sm sm:text-base text-neutral-500 max-w-sm">Anda saat ini tidak sedang menangani insiden apapun. Tetap siaga untuk tugas selanjutnya.</p>
                     </div>
                  )}
               </div>
            ) : (
            <div className="flex flex-col">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div>
                  <h2 className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-neutral-900">Riwayat Penanganan Laporan</h2>
                  <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">Daftar laporan insiden yang telah Anda selesaikan</p>
                </div>
              </div>

              <div className="space-y-2.5 sm:space-y-3">
                {isLoading ? (
                  <div className="py-12 sm:py-16 flex flex-col items-center justify-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-50 rounded-xl flex items-center justify-center mb-3 sm:mb-4 animate-pulse">
                      <FaFire className="text-red-400 text-lg sm:text-xl" />
                    </div>
                    <p className="text-neutral-400 font-medium text-xs sm:text-sm">Memuat data...</p>
                  </div>
                ) : error ? (
                  <div className="bg-white border border-red-100 p-6 sm:p-8 rounded-2xl text-center shadow-xs">
                    <FaExclamationCircle className="mx-auto text-red-500 text-xl sm:text-2xl mb-2 sm:mb-3" />
                    <p className="text-neutral-900 font-semibold text-sm sm:text-base mb-1">Gagal Memuat</p>
                    <p className="text-xs sm:text-sm text-neutral-500">{error}</p>
                  </div>
                ) : reports.length === 0 ? (
                  <div className="bg-white border border-neutral-100/90 p-8 sm:p-12 md:p-16 rounded-2xl text-center shadow-2xs">
                    <div className="inline-flex items-center justify-center w-14 h-14 sm:w-20 sm:h-20 bg-neutral-50 rounded-full border border-neutral-100 mb-4 sm:mb-5">
                      <FaChartBar className="text-neutral-400 text-xl sm:text-2xl" />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight mb-1.5 sm:mb-2">Belum Ada Riwayat Tugas</h3>
                    <p className="text-neutral-500 text-xs sm:text-sm max-w-sm mx-auto leading-relaxed">Anda belum memiliki riwayat tugas. Laporan yang telah Anda tangani akan muncul di sini.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2.5 sm:gap-3">
                    {reports.map((report) => {
                      const statusInfo = statusConfig[report.statusPetugas as StatusType] || defaultStatusConfig;
                      const StatusIcon = statusInfo.icon;

                      return (
                        <m.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          key={report.id}
                          onClick={() => setSelectedReport(report)}
                          className="group bg-white p-3.5 sm:p-4 md:p-5 rounded-2xl border border-neutral-100/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 cursor-pointer hover:shadow-xs hover:border-neutral-200 transition-all duration-200"
                        >
                          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                            <div className={`w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 shrink-0 rounded-xl flex items-center justify-center ${statusInfo.bgColor} transition-colors`}>
                              <StatusIcon className={`text-sm sm:text-base md:text-lg ${statusInfo.color}`} />
                            </div>
                            <div className="min-w-0 pr-2 sm:pr-4">
                              <h3 className="text-sm sm:text-base font-semibold text-neutral-900 truncate mb-0.5 sm:mb-1">
                                {report.categoryName} di {report.address || "Lokasi tidak diketahui"}
                              </h3>
                              <p className="text-neutral-500 text-xs sm:text-sm truncate">
                                Waktu pengerjaan: {Math.floor((report.durationSeconds || 0) / 60)} menit
                              </p>
                            </div>
                          </div>

                          <div className="flex sm:flex-col items-center sm:items-end justify-between shrink-0 ml-12 sm:ml-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-50">
                            <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${statusInfo.bgColor} ${statusInfo.color} mb-0 sm:mb-1.5`}>
                              {statusInfo.label}
                            </span>
                            <span className="text-neutral-400 text-[10px] sm:text-[11px] font-medium">
                              {formatDate(report.completedAt)}
                            </span>
                          </div>
                        </m.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            )}
          </main>
        </div>
      </LazyMotion>
    </div>
  );
}
