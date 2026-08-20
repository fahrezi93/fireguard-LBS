"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  FaMapMarkerAlt, FaFire, FaClipboardList, FaCheckCircle,
  FaTruck, FaFileAlt, FaSpinner, FaSyncAlt, FaSignOutAlt
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

// Dynamic import peta (Leaflet butuh SSR: false)
const AdminMap = dynamic(() => import("@/components/AdminMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-gray-100 flex items-center justify-center rounded-2xl">
      <FaSpinner className="animate-spin text-gray-400 text-2xl" />
    </div>
  ),
});

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  submitted:  { label: "Baru",       cls: "bg-red-50 text-red-600 border-red-200" },
  verified:   { label: "Diverifikasi", cls: "bg-yellow-50 text-yellow-600 border-yellow-200" },
  dispatched: { label: "Dikirim",    cls: "bg-blue-50 text-blue-600 border-blue-200" },
  arrived:    { label: "Tiba",       cls: "bg-indigo-50 text-indigo-600 border-indigo-200" },
  completed:  { label: "Selesai",    cls: "bg-green-50 text-green-600 border-green-200" },
  false_report:{ label: "Palsu",     cls: "bg-gray-100 text-gray-500 border-gray-200" },
  pending:    { label: "Baru",       cls: "bg-red-50 text-red-600 border-red-200" },
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
        if (data?.kelurahan_id && !kelurahanName) {
          // Nama sudah di-set dari laporan, fallback hanya jika belum ada
        }
      })
      .catch(console.error);

    fetchReports();
  }, [fetchReports]);

  // Statistik
  const totalLaporan = reports.length;
  const laporanAktif = reports.filter(r => !["completed", "false_report", "false"].includes(r.status)).length;
  const laporanSelesai = reports.filter(r => r.status === "completed").length;
  const laporanDikirim = reports.filter(r => r.status === "dispatched" || r.status === "arrived").length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between sticky top-0 z-[100] shadow-sm">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-red-50 rounded-lg md:rounded-xl flex items-center justify-center shrink-0">
            <FaMapMarkerAlt className="text-red-600 text-sm md:text-lg" />
          </div>
          <div>
            <h1 className="text-sm md:text-lg font-bold text-gray-900 leading-tight">Dashboard Kelurahan</h1>
            {kelurahanName && (
              <p className="text-[10px] md:text-xs text-gray-500 font-medium truncate max-w-[150px] md:max-w-none">{kelurahanName}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2">
          <button
            onClick={fetchReports}
            disabled={loading}
            className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg md:rounded-xl transition-colors disabled:opacity-50"
          >
            <FaSyncAlt className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 rounded-lg md:rounded-xl transition-colors"
          >
            <FaSignOutAlt />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full space-y-4 md:space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {[
            { icon: <FaClipboardList />, label: "Total Laporan", value: totalLaporan, color: "bg-gray-800" },
            { icon: <FaFire />, label: "Belum Selesai", value: laporanAktif, color: "bg-red-500" },
            { icon: <FaTruck />, label: "Petugas Dikirim", value: laporanDikirim, color: "bg-blue-500" },
            { icon: <FaCheckCircle />, label: "Selesai", value: laporanSelesai, color: "bg-green-500" },
          ].map(({ icon, label, value, color }) => (
            <div key={label} className="bg-white p-3 md:p-5 rounded-xl md:rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3 md:gap-4">
              <div className={`w-9 h-9 md:w-11 md:h-11 ${color} text-white rounded-lg md:rounded-xl flex items-center justify-center text-base md:text-lg shrink-0`}>
                {icon}
              </div>
              <div>
                <p className="text-lg md:text-2xl font-extrabold text-gray-900 leading-none">{loading ? "—" : value}</p>
                <p className="text-[10px] md:text-xs text-gray-500 font-medium mt-1 md:mt-0.5 leading-tight">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Peta */}
        <div className="bg-white rounded-xl md:rounded-2xl border border-gray-200 shadow-sm overflow-hidden relative z-0">
          <div className="px-4 py-3 md:px-5 md:py-4 border-b border-gray-100 flex items-center gap-2">
            <FaMapMarkerAlt className="text-red-500 shrink-0" />
            <h2 className="font-bold text-gray-900 text-sm md:text-base">Peta Kejadian Wilayah</h2>
            <span className="ml-auto text-[10px] md:text-xs text-gray-400 font-medium hidden sm:inline">Data difilter sesuai wilayah Anda</span>
          </div>
          <div className="h-[300px] md:h-[420px]">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <FaSpinner className="animate-spin text-gray-300 text-3xl" />
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

        {/* Tabel Laporan */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <FaFileAlt className="text-gray-400" />
            <h2 className="font-bold text-gray-900">Daftar Laporan Wilayah Ini</h2>
            <span className="ml-auto text-xs font-semibold text-gray-400">{totalLaporan} laporan</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-4 text-xs font-bold text-gray-500 uppercase">ID</th>
                  <th className="px-5 py-4 text-xs font-bold text-gray-500 uppercase">Pelapor</th>
                  <th className="px-5 py-4 text-xs font-bold text-gray-500 uppercase">Kategori</th>
                  <th className="px-5 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                  <th className="px-5 py-4 text-xs font-bold text-gray-500 uppercase">Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-12 text-gray-400">
                    <FaSpinner className="animate-spin inline mr-2" />Memuat data wilayah...
                  </td></tr>
                ) : reports.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <FaCheckCircle className="text-3xl text-green-400" />
                      <p className="font-semibold text-gray-500">Aman!</p>
                      <p className="text-sm">Tidak ada laporan kejadian di wilayah ini.</p>
                    </div>
                  </td></tr>
                ) : (
                  reports.map(r => {
                    const s = STATUS_LABEL[r.status] || { label: r.status, cls: "bg-gray-100 text-gray-600 border-gray-200" };
                    return (
                      <tr
                        key={r.id}
                        onClick={() => setSelectedReport(r)}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-5 py-4 text-sm font-bold text-gray-400">#{r.id}</td>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-gray-900 text-sm">{r.user_name || r.guest_name || "Anonim"}</p>
                          <p className="text-xs text-gray-400">{r.phone_number}</p>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-600">
                          {r.category_icon && <span className="mr-1">{r.category_icon}</span>}
                          {r.category_name || "—"}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex px-2.5 py-1 text-xs font-bold rounded-lg border ${s.cls}`}>
                            {s.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-400">
                          {new Date(r.created_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
