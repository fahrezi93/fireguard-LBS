"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  FaMapMarkerAlt, FaFire, FaClipboardList, FaCheckCircle,
  FaTruck, FaFileAlt, FaSpinner, FaSyncAlt, FaSignOutAlt,
  FaPhone, FaCalendarAlt, FaChevronRight, FaInfoCircle
} from "react-icons/fa";

interface Report {
  id: number;
  user_name?: string;
  guest_name?: string;
  phone_number: string;
  fire_latitude: number;
  fire_longitude: number;
  reporter_latitude?: number;
  reporter_longitude?: number;
  status: string;
  created_at: string;
  media_url: string;
  notes?: string;
  contact?: string;
  description?: string;
  address?: string;
  category_id?: number;
  category_name?: string;
  category_icon?: string;
  category_color?: string;
  kelurahan_id?: number;
  kelurahan_name?: string;
  acknowledged?: boolean;
  assigned_petugas_id?: number | null;
  needs_backup?: number | boolean;
  category?: { id: number; name: string; icon: string };
  kelurahan?: { id: number; name: string };
}

// Dynamic import peta & modal
const AdminMap = dynamic(() => import("@/components/AdminMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-gray-100 flex items-center justify-center rounded-2xl">
      <FaSpinner className="animate-spin text-gray-400 text-2xl" />
    </div>
  ),
});

const UserReportDetailModal = dynamic(() => import("@/components/UserReportDetailModal"), {
  ssr: false,
});

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  submitted:   { label: "Baru",         cls: "bg-red-50 text-red-600 border-red-200" },
  verified:    { label: "Diverifikasi", cls: "bg-amber-50 text-amber-600 border-amber-200" },
  dispatched:  { label: "Dikirim",      cls: "bg-blue-50 text-blue-600 border-blue-200" },
  arrived:     { label: "Tiba",         cls: "bg-indigo-50 text-indigo-600 border-indigo-200" },
  completed:   { label: "Selesai",      cls: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  false_report:{ label: "Palsu",        cls: "bg-gray-100 text-gray-500 border-gray-200" },
  pending:     { label: "Baru",         cls: "bg-red-50 text-red-600 border-red-200" },
};

export default function KelurahanDashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [kelurahanName, setKelurahanName] = useState<string>("");

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
      window.location.href = "/login";
    }
  };

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/operator/reports");
      if (!res.ok) throw new Error("Gagal memuat data");
      const data = await res.json();

      const transformed = (Array.isArray(data) ? data : (data.data ?? [])).map((r: any) => ({
        ...r,
        acknowledged: true,
        category: r.category_id ? { id: r.category_id, name: r.category_name || "Bencana", icon: r.category_icon || "🔥" } : undefined,
        kelurahan: r.kelurahan_id ? { id: r.kelurahan_id, name: r.kelurahan_name || "" } : undefined,
      }));

      setReports(transformed);

      // Ambil nama kelurahan dari laporan pertama yg ada kelurahan
      const withKel = transformed.find((r: Report) => r.kelurahan_name);
      if (withKel) setKelurahanName(withKel.kelurahan_name || "");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Juga ambil info profil untuk nama kelurahan user
  useEffect(() => {
    fetch("/api/auth/profile")
      .then(res => res.json())
      .then(data => {
        if (data?.kelurahan_name && !kelurahanName) {
          setKelurahanName(data.kelurahan_name);
        }
      })
      .catch(console.error);

    fetchReports();
  }, [fetchReports, kelurahanName]);

  // Statistik
  const totalLaporan = reports.length;
  const laporanAktif = reports.filter(r => !["completed", "false_report", "false"].includes(r.status)).length;
  const laporanSelesai = reports.filter(r => r.status === "completed").length;
  const laporanDikirim = reports.filter(r => r.status === "dispatched" || r.status === "arrived").length;

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-gray-900 selection:bg-red-500/30 flex flex-col">
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
      <header className="bg-white/90 backdrop-blur-xl border-b border-gray-200/80 px-3.5 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-red-50 text-red-600 rounded-xl flex items-center justify-center shrink-0 border border-red-100">
            <FaMapMarkerAlt className="text-sm sm:text-base" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-gray-900 leading-tight truncate">
              Dashboard Kelurahan
            </h1>
            <p className="text-[10px] sm:text-xs text-gray-500 font-semibold truncate">
              {kelurahanName ? `Wilayah: ${kelurahanName}` : "Portal Pemantauan Wilayah"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchReports}
            disabled={loading}
            className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all active:scale-95 disabled:opacity-50"
            title="Muat Ulang Data"
          >
            <FaSyncAlt className={`text-xs ${loading ? "animate-spin text-red-500" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-all active:scale-95"
            title="Keluar Akun"
          >
            <FaSignOutAlt className="text-xs" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-3 sm:p-5 lg:p-6 max-w-7xl mx-auto w-full space-y-4 sm:space-y-6">
        
        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {[
            { icon: <FaClipboardList />, label: "Total Laporan", value: totalLaporan, color: "bg-slate-900 text-white" },
            { icon: <FaFire />, label: "Belum Selesai", value: laporanAktif, color: "bg-red-500 text-white" },
            { icon: <FaTruck />, label: "Petugas Dikirim", value: laporanDikirim, color: "bg-blue-600 text-white" },
            { icon: <FaCheckCircle />, label: "Selesai Ditangani", value: laporanSelesai, color: "bg-emerald-600 text-white" },
          ].map(({ icon, label, value, color }) => (
            <div key={label} className="bg-white p-3 sm:p-4 md:p-5 rounded-2xl border border-gray-200/80 shadow-2xs flex items-center gap-2.5 sm:gap-4">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 ${color} rounded-xl flex items-center justify-center text-xs sm:text-base md:text-lg shrink-0 shadow-xs`}>
                {icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-lg sm:text-2xl font-extrabold text-gray-900 leading-tight">{loading ? "—" : value}</p>
                <p className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-wider mt-0.5 truncate">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Peta Kejadian Wilayah */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden relative z-0">
          <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-gray-100 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-ping"></div>
              <h2 className="font-bold text-gray-900 text-xs sm:text-sm md:text-base">Peta Kejadian Wilayah</h2>
            </div>
            <span className="text-[10px] sm:text-xs text-gray-500 font-semibold bg-gray-100 px-2.5 py-0.5 rounded-md">
              {kelurahanName || "Radius Wilayah"}
            </span>
          </div>
          
          <div className="h-[280px] sm:h-[380px] md:h-[440px] relative bg-gray-50">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center gap-2 text-gray-400">
                <FaSpinner className="animate-spin text-red-500 text-2xl" />
                <p className="text-xs font-semibold">Memuat Peta Wilayah...</p>
              </div>
            ) : (
              <AdminMap
                reports={reports}
                onReportClick={setSelectedReport}
                selectedReport={selectedReport}
              />
            )}
          </div>
        </div>

        {/* Daftar Laporan Wilayah */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
          <div className="px-4 py-3.5 sm:px-5 sm:py-4 border-b border-gray-100 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FaFileAlt className="text-gray-400 text-sm" />
              <h2 className="font-bold text-gray-900 text-xs sm:text-sm md:text-base">Daftar Laporan Wilayah Ini</h2>
            </div>
            <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-lg">
              {totalLaporan} Laporan
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
              <FaSpinner className="animate-spin text-red-500 text-xl" />
              <p className="text-xs font-semibold">Memuat data wilayah...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full mb-3">
                <FaCheckCircle className="text-2xl" />
              </div>
              <p className="font-bold text-gray-900 text-sm mb-0.5">Wilayah Aman!</p>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">Tidak ada laporan kejadian bencana aktif di wilayah ini saat ini.</p>
            </div>
          ) : (
            <>
              {/* TAMPILAN MOBILE: Card List (block sm:hidden) */}
              <div className="block sm:hidden divide-y divide-gray-100 p-2 space-y-2">
                {reports.map((r) => {
                  const s = STATUS_LABEL[r.status] || { label: r.status, cls: "bg-gray-100 text-gray-600 border-gray-200" };
                  return (
                    <div
                      key={r.id}
                      onClick={() => setSelectedReport(r)}
                      className="bg-white border border-gray-200/80 rounded-xl p-3 shadow-2xs hover:border-gray-300 active:scale-[0.99] transition-all cursor-pointer space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-extrabold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md">
                            #{r.id}
                          </span>
                          <span className="text-xs font-semibold text-gray-700 flex items-center gap-1 truncate max-w-[140px]">
                            {r.category_icon || "🔥"} {r.category_name || "Bencana"}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border shrink-0 ${s.cls}`}>
                          {s.label}
                        </span>
                      </div>

                      <div className="text-xs space-y-1">
                        <p className="font-bold text-gray-900">
                          {r.user_name || r.guest_name || "Pelapor Anonim"}
                        </p>
                        {r.address && (
                          <p className="text-gray-500 text-[11px] truncate flex items-center gap-1">
                            <FaMapMarkerAlt className="text-gray-400 text-[10px] shrink-0" />
                            <span>{r.address}</span>
                          </p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400 font-medium">
                        <span className="flex items-center gap-1">
                          <FaCalendarAlt className="text-[10px]" />
                          {new Date(r.created_at).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}
                        </span>
                        <span className="text-red-600 font-bold flex items-center gap-0.5">
                          Detail <FaChevronRight className="text-[8px]" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* TAMPILAN DESKTOP: Table (hidden sm:block) */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50/80 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Pelapor</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Jenis Insiden</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Waktu Laporan</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
                    {reports.map((r) => {
                      const s = STATUS_LABEL[r.status] || { label: r.status, cls: "bg-gray-100 text-gray-600 border-gray-200" };
                      return (
                        <tr
                          key={r.id}
                          onClick={() => setSelectedReport(r)}
                          className="hover:bg-gray-50/80 cursor-pointer transition-colors"
                        >
                          <td className="px-4 py-3.5 font-bold text-gray-400">#{r.id}</td>
                          <td className="px-4 py-3.5">
                            <p className="font-bold text-gray-900">{r.user_name || r.guest_name || "Anonim"}</p>
                            <p className="text-[11px] text-gray-500 flex items-center gap-1">
                              <FaPhone className="text-[9px] text-gray-400" /> {r.phone_number || "—"}
                            </p>
                          </td>
                          <td className="px-4 py-3.5 text-gray-700 font-medium">
                            <span className="inline-flex items-center gap-1.5">
                              <span>{r.category_icon || "🔥"}</span>
                              <span>{r.category_name || "—"}</span>
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`inline-flex px-2.5 py-1 text-xs font-bold rounded-lg border ${s.cls}`}>
                              {s.label}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-gray-500 text-xs">
                            {new Date(r.created_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <button className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-colors">
                              Lihat
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Detail Modal saat laporan diklik */}
      {selectedReport && (
        <UserReportDetailModal
          report={{
            ...selectedReport,
            assigned_petugas_id: selectedReport.assigned_petugas_id ?? undefined,
          }}
          onClose={() => setSelectedReport(null)}
        />
      )}
    </div>
  );
}
