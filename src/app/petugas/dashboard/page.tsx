"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { m, LazyMotion, domAnimation, AnimatePresence } from "framer-motion";
import {
  FaChartBar,
  FaCog,
  FaSignOutAlt,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationCircle,
  FaUser,
  FaEdit,
  FaChevronDown,
  FaBell, 
  FaFire,
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
      className="bg-white p-3.5 sm:p-5 rounded-2xl border border-neutral-200/70 flex flex-col justify-between relative group shadow-xs hover:shadow-sm transition-all duration-300 overflow-hidden"
    >
      <div className={`absolute -right-4 -top-4 w-24 h-24 ${theme.blur} opacity-[0.08] bg-current rounded-full blur-2xl pointer-events-none group-hover:scale-150 group-hover:opacity-[0.12] transition-all duration-500`} />

      <div className="flex items-center justify-between mb-2 z-10 relative">
        <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center ${theme.iconBg} shrink-0 shadow-2xs`}>
          <Icon className={`text-xs sm:text-sm ${theme.iconColor}`} />
        </div>
        <p className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-900 tabular-nums">{value}</p>
      </div>

      <p className="text-[11px] sm:text-xs font-bold text-neutral-500 uppercase tracking-wider relative z-10 leading-tight">{title}</p>
    </m.div>
  );
};

export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [reports, setReports] = useState<ReportHistory[]>([]);
  const [stats, setStats] = useState<{ totalCompleted: number, avgResponseTimeSeconds: number }>({ totalCompleted: 0, avgResponseTimeSeconds: 0 });
  const [activeTask, setActiveTask] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"tugas" | "riwayat">("tugas");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [pendingTasks, setPendingTasks] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [selectedReport, setSelectedReport] = useState<ReportHistory | null>(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen">
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
          <header className="h-14 sm:h-16 px-4 sm:px-6 md:px-8 flex items-center justify-between sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-neutral-100/90 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-xs">
                  <FaFire className="text-sm" />
                </div>
                <div>
                  <h1 className="text-base sm:text-lg font-bold tracking-tight text-neutral-900 leading-none">Siaga Petugas</h1>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`w-2 h-2 rounded-full ${(user as any)?.is_on_duty ? "bg-emerald-500 animate-pulse" : "bg-neutral-300"}`} />
                    <p className="text-[11px] font-medium text-neutral-500">
                      {(user as any)?.is_on_duty ? "Siaga Terhubung" : "Sedang Istirahat"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <NotificationBell onViewReport={(reportId) => {
                const rep = reports.find((r) => r.id === reportId);
                if (rep) setSelectedReport(rep);
              }} />

              <div className="relative" ref={profileDropdownRef}>
                <button 
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)} 
                  className="flex items-center gap-2 p-1 sm:p-1.5 sm:pr-3.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/80 rounded-full transition-all active:scale-95"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-neutral-900 rounded-full flex items-center justify-center text-white font-semibold text-xs shadow-xs">
                    {user?.name?.[0]?.toUpperCase() || <FaUserCircle />}
                  </div>
                  <div className="hidden sm:flex flex-col text-left justify-center">
                    <p className="text-xs font-semibold text-neutral-800 leading-tight max-w-[100px] truncate">{user?.name || "Petugas"}</p>
                  </div>
                  <FaChevronDown className={`hidden sm:block text-neutral-400 text-[10px] transition-transform duration-200 ${profileDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {profileDropdownOpen && (
                    <m.div 
                      initial={{ opacity: 0, y: 8, scale: 0.96 }} 
                      animate={{ opacity: 1, y: 0, scale: 1 }} 
                      exit={{ opacity: 0, y: 4, scale: 0.96 }} 
                      transition={{ duration: 0.15 }} 
                      className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-neutral-100 overflow-hidden z-50"
                    >
                      <div className="px-4 py-3.5 bg-neutral-50/70 border-b border-neutral-100">
                        <p className="font-bold text-neutral-900 text-sm truncate">{user?.name || "Petugas Lapangan"}</p>
                        <p className="text-xs text-neutral-500 truncate mt-0.5">{user?.email || "-"}</p>
                      </div>
                      <div className="p-1.5 space-y-0.5">
                        <button 
                          onClick={() => { setProfileDropdownOpen(false); toggleOnDutyStatus(); }} 
                          disabled={isUpdatingStatus}
                          className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50 rounded-xl transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <FaPowerOff className={(user as any)?.is_on_duty ? "text-emerald-500" : "text-neutral-400"} /> 
                            <span>{(user as any)?.is_on_duty ? "Status: Siaga" : "Status: Istirahat"}</span>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${(user as any)?.is_on_duty ? "bg-emerald-50 text-emerald-600" : "bg-neutral-100 text-neutral-500"}`}>
                            {(user as any)?.is_on_duty ? "ON" : "OFF"}
                          </span>
                        </button>
                        <button onClick={() => { setProfileDropdownOpen(false); router.push('/dashboard/profile'); }} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50 rounded-xl transition-colors">
                          <FaEdit className="text-neutral-400 text-sm" /> Edit Profil
                        </button>
                        <button onClick={() => { setProfileDropdownOpen(false); router.push('/dashboard/settings'); }} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50 rounded-xl transition-colors">
                          <FaCog className="text-neutral-400 text-sm" /> Pengaturan
                        </button>
                        <div className="h-px bg-neutral-100 my-1 mx-2" />
                        <button onClick={() => { setProfileDropdownOpen(false); handleLogout(); }} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                          <FaSignOutAlt className="text-red-500 text-sm" /> Keluar
                        </button>
                      </div>
                    </m.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </header>

          <main className="flex-1 px-3.5 sm:px-6 md:px-8 py-4 sm:py-6 mx-auto w-full max-w-5xl pb-24 lg:pb-8">

            {/* Duty Status Hero Card */}
            <div className={`mb-4 sm:mb-6 rounded-2xl p-4 sm:p-5 border transition-all duration-300 shadow-xs ${
              (user as any)?.is_on_duty
                ? "bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-emerald-500/10 border-emerald-200/80"
                : "bg-gradient-to-r from-neutral-100/90 to-neutral-50 border-neutral-200/80"
            }`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                    (user as any)?.is_on_duty ? "bg-emerald-500 text-white" : "bg-neutral-300 text-neutral-600"
                  }`}>
                    <FaPowerOff className={`text-base ${(user as any)?.is_on_duty ? "animate-pulse" : ""}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider ${
                        (user as any)?.is_on_duty
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-neutral-200 text-neutral-700"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${(user as any)?.is_on_duty ? "bg-emerald-600" : "bg-neutral-500"}`} />
                        {(user as any)?.is_on_duty ? "Siaga Bertugas (On Duty)" : "Sedang Istirahat (Off Duty)"}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-600 mt-1 truncate">
                      {(user as any)?.is_on_duty
                        ? "Siaga menerima & merespons tugas darurat"
                        : "Aktifkan sakelar untuk mulai menerima tugas"}
                    </p>
                  </div>
                </div>

                {/* Duty Toggle Button */}
                <button 
                  onClick={toggleOnDutyStatus}
                  disabled={isUpdatingStatus}
                  className={`relative shrink-0 inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                    isUpdatingStatus ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  } ${(user as any)?.is_on_duty ? 'bg-emerald-600' : 'bg-neutral-300'}`}
                  aria-label="Ubah status tugas"
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out ${
                    (user as any)?.is_on_duty ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <StatCard
                title="Laporan Selesai" 
                value={stats.totalCompleted} 
                icon={FaCheckCircle}
                theme={{ blur: "text-emerald-500", iconBg: "bg-emerald-50 text-emerald-600", iconColor: "text-emerald-500" }}
              />
              <StatCard
                title="Rata-rata Respon" 
                value={stats.avgResponseTimeSeconds > 0 ? `${Math.floor(stats.avgResponseTimeSeconds / 60)} mnt` : "-"} 
                icon={FaClock}
                theme={{ blur: "text-blue-500", iconBg: "bg-blue-50 text-blue-600", iconColor: "text-blue-600" }}
              />
            </div>

            {/* Tab Switcher (Modern Segmented Control) */}
            <div className="bg-neutral-200/60 p-1 rounded-2xl flex items-center mb-4 sm:mb-6">
              <button 
                onClick={() => setActiveTab("tugas")} 
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
                  activeTab === "tugas" 
                    ? "bg-white text-red-600 shadow-xs" 
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                <FaFire className={activeTab === "tugas" ? "text-red-500" : "text-neutral-400"} />
                <span>Tugas Aktif</span>
                {(activeTask || pendingTasks.length > 0) && (
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                )}
              </button>
              <button 
                onClick={() => setActiveTab("riwayat")} 
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
                  activeTab === "riwayat" 
                    ? "bg-white text-red-600 shadow-xs" 
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                <FaChartBar className={activeTab === "riwayat" ? "text-red-500" : "text-neutral-400"} />
                <span>Riwayat Laporan</span>
                {reports.length > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${activeTab === "riwayat" ? "bg-red-50 text-red-600" : "bg-neutral-300 text-neutral-600"}`}>
                    {reports.length}
                  </span>
                )}
              </button>
            </div>

            {/* Tabs Content */}
            {activeTab === "tugas" ? (
               <div className="flex flex-col">
                  <div className="mb-3 sm:mb-4">
                    <h2 className="text-base sm:text-lg font-bold tracking-tight text-neutral-900">Tugas Saat Ini</h2>
                    <p className="text-xs text-neutral-500 mt-0.5">Pantau dan segera tindak lanjuti laporan yang ditugaskan</p>
                  </div>
                  
                  {activeTask ? (
                     <ActiveTask 
                        task={activeTask} 
                        onStatusUpdate={handleStatusUpdate(activeTask.id)} 
                     />
                  ) : pendingTasks.length > 0 ? (
                     <div className="space-y-4">
                        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold animate-pulse">
                          <FaFire className="text-red-500" />
                          <span>Ada {pendingTasks.length} panggilan darurat baru menunggu konfirmasi!</span>
                        </div>
                        {pendingTasks.map(task => (
                           <ActiveTask 
                              key={task.id}
                              task={task} 
                              onStatusUpdate={handleStatusUpdate(task.id)} 
                           />
                        ))}
                     </div>
                  ) : (
                     <div className="bg-white rounded-3xl border border-neutral-100/90 p-6 sm:p-10 flex flex-col items-center justify-center text-center shadow-xs">
                        <div className="relative mb-4">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 relative z-10 shadow-xs">
                            <FaCheckCircle className="text-3xl sm:text-4xl" />
                          </div>
                          <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping" />
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-neutral-900 mb-1.5">Tidak Ada Tugas Aktif</h3>
                        <p className="text-xs sm:text-sm text-neutral-500 max-w-sm leading-relaxed mb-4">
                          Anda sedang dalam posisi siaga. Sistem akan berdering dan memperbarui tugas otomatis ketika ada insiden baru.
                        </p>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-50 border border-neutral-200/80 text-[11px] font-semibold text-neutral-600">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          Sistem Pemantauan Siaga Aktif
                        </div>
                     </div>
                  )}
               </div>
            ) : (
            <div className="flex flex-col">
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <div>
                  <h2 className="text-base sm:text-lg font-bold tracking-tight text-neutral-900">Riwayat Penanganan</h2>
                  <p className="text-xs text-neutral-500 mt-0.5">Daftar laporan darurat yang telah Anda tangani</p>
                </div>
              </div>

              <div className="space-y-2.5 sm:space-y-3">
                {isLoading ? (
                  <div className="py-12 flex flex-col items-center justify-center">
                    <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center mb-3 animate-pulse">
                      <FaFire className="text-red-500 text-lg" />
                    </div>
                    <p className="text-neutral-400 font-medium text-xs">Memuat riwayat laporan...</p>
                  </div>
                ) : error ? (
                  <div className="bg-white border border-red-100 p-6 rounded-2xl text-center shadow-xs">
                    <FaExclamationCircle className="mx-auto text-red-500 text-xl mb-2" />
                    <p className="text-neutral-900 font-bold text-sm mb-1">Gagal Memuat Data</p>
                    <p className="text-xs text-neutral-500">{error}</p>
                  </div>
                ) : reports.length === 0 ? (
                  <div className="bg-white border border-neutral-100 p-8 sm:p-12 rounded-3xl text-center shadow-xs">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-neutral-50 rounded-full border border-neutral-100 mb-3 text-neutral-400">
                      <FaChartBar className="text-xl" />
                    </div>
                    <h3 className="text-base font-bold text-neutral-900 mb-1">Belum Ada Riwayat</h3>
                    <p className="text-neutral-500 text-xs max-w-sm mx-auto leading-relaxed">
                      Laporan yang telah Anda selesaikan atau tangani akan otomatis tersimpan di sini.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2.5 sm:gap-3">
                    {reports.map((report) => {
                      const statusInfo = statusConfig[report.statusPetugas as StatusType] || defaultStatusConfig;
                      const StatusIcon = statusInfo.icon;

                      return (
                        <m.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          key={report.id}
                          onClick={() => setSelectedReport(report)}
                          className="group bg-white p-3.5 sm:p-4 rounded-2xl border border-neutral-100/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:shadow-xs hover:border-neutral-200 transition-all duration-200"
                        >
                          <div className="flex items-start sm:items-center gap-3 min-w-0">
                            <div className={`w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-xl flex items-center justify-center ${statusInfo.bgColor} transition-colors mt-0.5 sm:mt-0`}>
                              <StatusIcon className={`text-sm sm:text-base ${statusInfo.color}`} />
                            </div>
                            <div className="min-w-0 pr-1">
                              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                <h3 className="text-sm font-bold text-neutral-900 truncate">
                                  {report.categoryName}
                                </h3>
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${statusInfo.bgColor} ${statusInfo.color}`}>
                                  {statusInfo.label}
                                </span>
                              </div>
                              <p className="text-neutral-600 text-xs truncate mb-1">
                                {report.address || "Lokasi tidak diketahui"}
                              </p>
                              <div className="flex items-center gap-3 text-[11px] text-neutral-400">
                                <span className="flex items-center gap-1 font-medium text-neutral-500">
                                  <FaClock className="text-[10px]" />
                                  {Math.floor((report.durationSeconds || 0) / 60)} menit
                                </span>
                                <span>•</span>
                                <span>{formatDate(report.completedAt)}</span>
                              </div>
                            </div>
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

          {/* Mobile Bottom Navigation Bar */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-neutral-200/80 px-6 py-2 shadow-lg">
            <div className="flex items-center justify-around max-w-md mx-auto">
              <button 
                onClick={() => setActiveTab("tugas")}
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
                  activeTab === "tugas" ? "text-red-600 font-bold scale-105" : "text-neutral-500 font-medium"
                }`}
              >
                <div className="relative">
                  <FaFire className="text-lg" />
                  {(activeTask || pendingTasks.length > 0) && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500" />
                  )}
                </div>
                <span className="text-[10px]">Tugas</span>
              </button>

              <button 
                onClick={() => setActiveTab("riwayat")}
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
                  activeTab === "riwayat" ? "text-red-600 font-bold scale-105" : "text-neutral-500 font-medium"
                }`}
              >
                <FaChartBar className="text-lg" />
                <span className="text-[10px]">Riwayat</span>
              </button>

              <button 
                onClick={() => setProfileDropdownOpen((prev) => !prev)}
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
                  profileDropdownOpen ? "text-red-600 font-bold scale-105" : "text-neutral-500 font-medium"
                }`}
              >
                <FaUser className="text-lg" />
                <span className="text-[10px]">Akun</span>
              </button>
            </div>
          </div>
        </div>
      </LazyMotion>
    </div>
  );
}
