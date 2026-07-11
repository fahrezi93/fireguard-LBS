"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  FaBell, FaFire,
  FaTruck,
  FaClock,
  FaBuilding,
  FaSyncAlt,
  FaSignOutAlt,
  FaUserShield,
  FaTrash,
  FaFileAlt,
  FaCheck,
  FaCheckCircle,
  FaTimesCircle,
  FaQuestionCircle,
  FaPhone,
  FaTags,
  FaChartBar,
  FaBullhorn,
  FaTimes,
  FaPaperPlane,
} from "react-icons/fa";
import ReportDetailModal from "@/components/ReportDetailModal";
import { useToast } from "@/hooks/useToast";
import Toast from "@/components/Toast";

// Tipe data untuk laporan
interface Report {
  id: number;
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
  kecamatan?: string;
  kota?: string;
  acknowledged?: boolean;
  assigned_petugas_id?: number | null;
  assigned_petugas_name?: string | null;
  dispatched_at?: string | null;
  accepted_at?: string | null;
  arrived_at?: string | null;
  completed_at?: string | null;
  response_time_seconds?: number | null;
  status_petugas?: string | null;
  completion_photo_url?: string | null;
  needs_backup?: number | boolean;
  petugas_notes?: string | null;
  category?: {
    id: number;
    name: string;
    icon: string;
  };
  kelurahan?: {
    id: number;
    name: string;
  };
}

// Dynamic import untuk AdminMap agar tidak ada masalah SSR dengan Leaflet
const AdminMap = dynamic(() => import("@/components/AdminMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-gray-700 flex items-center -z-10 justify-center">
      <p>Memuat Peta...</p>
    </div>
  ),
});

const StatCard = ({
  icon,
  title,
  value,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  color: string;
}) => (
  <div className={`bg-white rounded-xl p-3 md:p-5 flex flex-col md:flex-row items-center md:gap-4 gap-2 border border-gray-200/60 shadow-sm hover:shadow-md transition-all duration-200`}>
    <div
      className={`w-10 h-10 md:w-11 md:h-11 rounded-lg flex items-center justify-center text-white text-base md:text-lg ${color} shadow-sm`}
    >
      {icon}
    </div>
    <div className="text-center md:text-left">
      <h3 className="text-xl md:text-2xl font-semibold text-gray-900">{value}</h3>
      <p className="text-xs text-gray-500 mt-0.5">{title}</p>
    </div>
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const statusConfig: {
    [key: string]: { icon: React.ReactNode; text: string; className: string };
  } = {
    submitted: {
      icon: <FaFileAlt />,
      text: "Baru",
      className: "bg-red-50 text-red-600 border-red-200",
    },
    verified: {
      icon: <FaCheck />,
      text: "Diverifikasi",
      className: "bg-yellow-50 text-yellow-600 border-yellow-200",
    },
    dispatched: {
      icon: <FaTruck />,
      text: "Dikirim",
      className: "bg-blue-50 text-blue-600 border-blue-200",
    },
    arrived: {
      icon: <FaBuilding />,
      text: "Tiba",
      className: "bg-indigo-50 text-indigo-600 border-indigo-200",
    },
    completed: {
      icon: <FaCheckCircle />,
      text: "Selesai",
      className: "bg-green-50 text-green-600 border-green-200",
    },
    false: {
      icon: <FaTimesCircle />,
      text: "Palsu",
      className: "bg-gray-50 text-gray-600 border-gray-200",
    },
    false_report: {
      icon: <FaTimesCircle />,
      text: "Palsu",
      className: "bg-gray-50 text-gray-600 border-gray-200",
    },
    pending: {
      icon: <FaFileAlt />,
      text: "Baru",
      className: "bg-red-50 text-red-600 border-red-200",
    },
    in_progress: {
      icon: <FaTruck />,
      text: "Ditangani",
      className: "bg-cyan-50 text-cyan-600 border-cyan-200",
    },
    dibatalkan: {
      icon: <FaTimesCircle />,
      text: "Dibatalkan",
      className: "bg-gray-50 text-gray-500 border-gray-200",
    },
  };

  const config = statusConfig[status] || {
    icon: <FaQuestionCircle />,
    text: status,
    className: "bg-gray-50 text-gray-600 border-gray-200",
  };

  return (
    <div
      className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border ${config.className}`}
    >
      {config.icon}
      <span>{config.text}</span>
    </div>
  );
};

const ReportListItem = ({
  report,
  onSelect,
}: {
  report: Report;
  onSelect: (report: Report) => void;
}) => (
  <div
    onClick={() => onSelect(report)}
    className={`bg-white hover:bg-gray-50 p-4 rounded-xl cursor-pointer transition-all duration-200 border border-gray-200/60 hover:border-gray-300 hover:shadow-sm ${!report.acknowledged
      ? "ring-2 ring-yellow-400 ring-offset-2 animate-pulse-new"
      : ""
      }`}
  >
    <div className="flex justify-between items-start gap-3">
      <div className="flex-1">
        <span className="font-semibold text-sm text-gray-900">
          Laporan #{report.id}
        </span>
        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
          <FaPhone className="text-[10px]" /> {report.phone_number}
        </p>
      </div>
      <StatusBadge status={report.status} />
    </div>
    <p className="text-xs text-gray-400 mt-2.5">
      {new Date(report.created_at).toLocaleString("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Jakarta",
      })} WIB
    </p>
  </div>
);

// Fungsi suara notifikasi
let audioContext: AudioContext | null = null;
function playWarningSound() {
  if (typeof window === "undefined") return;
  if (!audioContext)
    audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
  if (audioContext.state === "suspended") audioContext.resume();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.type = "sawtooth";
  gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
  oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
  oscillator.frequency.linearRampToValueAtTime(
    1000,
    audioContext.currentTime + 0.25
  );
  oscillator.frequency.linearRampToValueAtTime(
    400,
    audioContext.currentTime + 0.5
  );
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
}

const BROADCAST_TEMPLATES = [
  { title: "⚠️ Peringatan Kebakaran Hutan", message: "Titik api terdeteksi di area sekitar Anda. Harap waspada dan hindari aktivitas di luar ruangan." },
  { title: "📢 Info Pemeliharaan Sistem", message: "Sistem SiagaBencana akan mengalami pemeliharaan rutin pada pukul 00:00 - 02:00 WIB. Layanan mungkin akan terganggu sementara." },
  { title: "🚨 Status Siaga Darurat", message: "Status Siaga Darurat diberlakukan untuk wilayah Anda. Segera amankan barang berharga dan bersiap untuk evakuasi jika diinstruksikan." },
  { title: "✅ Penanganan Selesai", message: "Insiden di wilayah Anda telah berhasil ditangani oleh tim pemadam. Kondisi saat ini sudah aman terkendali." },
  { title: "🌤️ Info Cuaca Ekstrem", message: "Peringatan cuaca ekstrem: Suhu sangat tinggi berpotensi memicu kebakaran. Hindari membakar sampah atau lahan." },
  { title: "🚒 Bantuan Sedang Meluncur", message: "Tim pemadam kebakaran sedang meluncur ke lokasi laporan di area Anda. Harap beri jalan untuk armada darurat." },
  { title: "🌫️ Peringatan Asap Tebal", message: "Terpantau asap tebal di wilayah Anda. Gunakan masker saat beraktivitas di luar ruangan untuk kesehatan pernapasan." },
  { title: "📢 Sosialisasi Pencegahan", message: "Mari cegah kebakaran dengan tidak membuang puntung rokok sembarangan dan mematikan peralatan listrik yang tidak digunakan." },
  { title: "🚧 Penutupan Jalan Akses", message: "Beberapa jalan di sekitar lokasi insiden ditutup sementara untuk proses pemadaman. Harap gunakan jalur alternatif." },
  { title: "ℹ️ Update Nomor Darurat", message: "Simpan nomor darurat Posko Utama SiagaBencana: 113. Segera laporkan jika melihat potensi bahaya." },
];

export default function OperatorDashboard() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState("all");
  const [isMonitorMode, setIsMonitorMode] = useState(false);
  const [wsStatus, setWsStatus] = useState("Connecting");
  const alarmIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ws = useRef<WebSocket | null>(null);

  const stopAlarm = useCallback(() => {
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
  }, []);

  const startAlarm = useCallback(() => {
    stopAlarm();
    playWarningSound();
    alarmIntervalRef.current = setInterval(playWarningSound, 500);
  }, [stopAlarm]);

  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const { toast, success, error, hideToast } = useToast();

  // ── Broadcast state ──────────────────────────────────────────────────────
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const idx = parseInt(e.target.value);
    if (!isNaN(idx) && BROADCAST_TEMPLATES[idx]) {
      setBroadcastTitle(BROADCAST_TEMPLATES[idx].title);
      setBroadcastMessage(BROADCAST_TEMPLATES[idx].message);
    }
  };

  const handleSelectReport = (report: Report) => {
    setSelectedReport(report);
  };

  const handleCloseModal = () => {
    setSelectedReport(null);
  };

  const handleUpdateStatus = async (reportId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/operator/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Gagal update status");

      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId ? { ...r, status: newStatus } : r
        )
      );

      if (selectedReport && selectedReport.id === reportId) {
        setSelectedReport({ ...selectedReport, status: newStatus });
      }

      success("Status laporan berhasil diperbarui!");
    } catch (err) {
      error("Gagal memperbarui status laporan.");
    }
  };

  const handleDeleteReport = async (reportId: number) => {
    try {
      const response = await fetch(`/api/operator/reports/${reportId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Gagal menghapus laporan");
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      success("Laporan berhasil dihapus.");
    } catch (err) {
      error("Gagal menghapus laporan.");
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      error("Judul dan pesan wajib diisi.");
      return;
    }
    if (
      !window.confirm(
        `Kirim broadcast ke SEMUA pengguna?\n\nJudul: ${broadcastTitle}\nPesan: ${broadcastMessage}`
      )
    )
      return;

    setIsSendingBroadcast(true);
    try {
      const response = await fetch("/api/operator/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: broadcastTitle, message: broadcastMessage }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? "Gagal mengirim broadcast");

      success(
        `✅ Broadcast terkirim! ${data.summary.success}/${data.summary.total_tokens} device berhasil.`
      );
      setBroadcastTitle("");
      setBroadcastMessage("");
      setShowBroadcastModal(false);
    } catch (err: any) {
      error(err?.message ?? "Gagal mengirim broadcast.");
    } finally {
      setIsSendingBroadcast(false);
    }
  };

  const handleDispatchToPetugas = async (reportId: number) => {
    try {
      const response = await fetch("/api/operator/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? "Gagal mengirim tugas ke petugas");

      success(`Tugas berhasil di-broadcast ke ${data.petugasCount} petugas aktif.`);
      // Update status menjadi dispatched (dikirim)
      handleUpdateStatus(reportId, "dispatched");
    } catch (err: any) {
      error(err?.message ?? "Gagal mengirim tugas.");
    }
  };

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/operator/reports");
      if (!response.ok) throw new Error("Gagal memuat laporan");
      const data = await response.json();
      
      const transformedReports = data.map((r: any) => ({
        ...r,
        acknowledged: true,
        category: r.category_id ? {
          id: r.category_id,
          name: r.category_name || 'Kebakaran',
          icon: r.category_icon || '??',
        } : undefined,
        kelurahan: r.kelurahan_id ? {
          id: r.kelurahan_id,
          name: r.kelurahan_name || 'Tidak tersedia',
        } : undefined,
      }));
      setReports(transformedReports);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    const hasUnacknowledged = reports.some((r) => !r.acknowledged);
    if (isMonitorMode && hasUnacknowledged) {
      startAlarm();
    } else {
      stopAlarm();
    }
    return stopAlarm;
  }, [reports, isMonitorMode, startAlarm, stopAlarm]);

  useEffect(() => {
    let reconnectionTimer: ReturnType<typeof setTimeout>;

    const connect = () => {
      const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      const wsProtocol = (window.location.protocol === "https:" || !isLocal) ? "wss" : "ws";
      const wsUrl = `${wsProtocol}://${window.location.host}/ws`;
      const socket = new WebSocket(wsUrl);
      ws.current = socket;

      socket.onopen = () => {
        setWsStatus("Connected");
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === "NEW_REPORT") {
          const r = message.payload;
          const transformed = {
            ...r,
            acknowledged: false,
            category: r.category_id ? {
              id: r.category_id,
              name: r.category_name || 'Kebakaran',
              icon: r.category_icon || '🔥',
            } : undefined,
            kelurahan: r.kelurahan_id ? {
              id: r.kelurahan_id,
              name: r.kelurahan_name || 'Tidak tersedia',
            } : undefined,
          };
          setReports((prev) => {
            if (prev.some((item) => item.id === transformed.id)) {
              return prev;
            }
            return [transformed, ...prev];
          });
        } else if (message.type === "STATUS_UPDATE") {
          setReports((prev) =>
            prev.map((r) =>
              r.id === message.payload.reportId
                ? { ...r, status: message.payload.newStatus }
                : r
            )
          );
        } else if (message.type === "REPORT_DELETED") {
          setReports((prev) =>
            prev.filter((r) => r.id !== message.payload.reportId)
          );
        } else if (message.type === "BACKUP_REQUEST") {
          error(`[SOS] Petugas ${message.payload.petugasName || ''} meminta bantuan armada untuk laporan #${message.payload.reportId}!`);
          setReports((prev) =>
            prev.map((r) =>
              r.id === message.payload.reportId
                ? { ...r, needs_backup: 1 }
                : r
            )
          );
          setSelectedReport((prev) => 
            prev && prev.id === message.payload.reportId 
              ? { ...prev, needs_backup: 1 }
              : prev
          );
        }
        } catch (parseErr) {
          console.error('[WebSocket] Failed to parse message:', parseErr);
        }
      };

      socket.onclose = (event) => {
        setWsStatus(`Closed (${event.code})`);
        reconnectionTimer = setTimeout(() => {
          connect();
        }, 5000);
      };

      socket.onerror = (error) => {
        setWsStatus("Error");
        socket.close(); 
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectionTimer);
      if (ws.current) {
        ws.current.onclose = null;
        ws.current.onerror = null;
        ws.current.close();
      }
    };
  }, []);

  const handleLogout = async () => {
    try {
      stopAlarm();
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      window.location.href = "/operator/login";
    } catch (error) {
      console.error("Logout error:", error);
      window.location.href = "/operator/login";
    }
  };

  const handleDeleteAllReports = async () => {
    if (
      window.confirm(
        "Apakah Anda yakin ingin menghapus SEMUA laporan? Tindakan ini tidak dapat diurungkan."
      )
    ) {
      try {
        const response = await fetch("/api/operator/reports", {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("Gagal menghapus laporan.");
        setReports([]);
        success("Semua laporan berhasil dihapus.");
      } catch (err) {
        error("Gagal menghapus semua laporan.");
      }
    }
  };

  const filteredReports = reports.filter(
    (report) => statusFilter === "all" || report.status === statusFilter
  );
  const activeReportsCount = reports.filter(
    (r) => !["completed", "false_report", "false", "dibatalkan", "selesai"].includes(r.status)
  ).length;
  const dispatchedCount = reports.filter(
    (r) => r.status === "dispatched" || r.status === "arrived"
  ).length;

  return (
    <>
      {toast.show && <Toast {...toast} onClose={hideToast} />}

      {/* ── Broadcast Modal ─────────────────────────────────────────────── */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !isSendingBroadcast && setShowBroadcastModal(false)}
          />
          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-modal-in">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center shadow-md">
                  <FaBullhorn className="text-white text-base" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Kirim Broadcast</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Notifikasi akan dikirim ke semua pengguna</p>
                </div>
              </div>
              <button
                onClick={() => setShowBroadcastModal(false)}
                disabled={isSendingBroadcast}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40"
              >
                <FaTimes />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Template Broadcast
                </label>
                <select
                  onChange={handleTemplateChange}
                  defaultValue=""
                  disabled={isSendingBroadcast}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all disabled:opacity-60 disabled:bg-gray-50"
                >
                  <option value="" disabled>Pilih Template...</option>
                  {BROADCAST_TEMPLATES.map((template, idx) => (
                    <option key={idx} value={idx}>{template.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Judul Notifikasi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="contoh: ⚠️ Info Penting dari SiagaBencana"
                  maxLength={200}
                  disabled={isSendingBroadcast}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all disabled:opacity-60 disabled:bg-gray-50"
                />
                <p className="text-xs text-gray-400 mt-1 text-right">{broadcastTitle.length}/200</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Isi Pesan <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Tulis pesan yang akan diterima semua pengguna..."
                  maxLength={1000}
                  rows={4}
                  disabled={isSendingBroadcast}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all resize-none disabled:opacity-60 disabled:bg-gray-50"
                />
                <p className="text-xs text-gray-400 mt-1 text-right">{broadcastMessage.length}/1000</p>
              </div>

              <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                <FaBullhorn className="text-blue-500 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-800 leading-relaxed">
                  Broadcast ini akan dikirim ke <strong>semua pengguna terdaftar</strong> melalui push notification. Pastikan pesan sudah benar sebelum mengirim.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
              <button
                onClick={() => setShowBroadcastModal(false)}
                disabled={isSendingBroadcast}
                className="px-5 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-40"
              >
                Batal
              </button>
              <button
                onClick={handleSendBroadcast}
                disabled={isSendingBroadcast || !broadcastTitle.trim() || !broadcastMessage.trim()}
                className="px-5 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white text-sm font-semibold rounded-xl transition-all flex items-center gap-2 shadow-sm disabled:cursor-not-allowed"
              >
                {isSendingBroadcast ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <FaPaperPlane className="text-sm" />
                    Kirim Broadcast
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          onClose={handleCloseModal}
          onUpdateStatus={handleUpdateStatus}
          onDispatchToPetugas={handleDispatchToPetugas}
          onDelete={handleDeleteReport}
        />
      )}

      <div className="min-h-screen bg-[#FAFAFA] text-gray-900 font-sans selection:bg-red-500/30 flex flex-col">
        {/* Top Navigation */}
        <header className="bg-white border-b border-gray-200/70 sticky top-0 z-40">
          <div className="max-w-[1600px] mx-auto px-6 h-20 flex justify-between items-center">
            
            {/* Brand & Connection Status */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center shadow-md">
                  <FaBell className="text-white text-lg" />
                </div>
                <div>
                  <h1 className="text-lg font-bold tracking-tight text-gray-900">SiagaBencana <span className="text-red-500">Ops</span></h1>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-widest">Dashboard Operator</p>
                </div>
              </div>
              
              <div className="hidden md:flex items-center gap-2 pl-6 border-l border-gray-200">
                <div className="relative flex h-2.5 w-2.5">
                  {wsStatus === "Connected" && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${wsStatus === "Connected" ? "bg-emerald-500" : wsStatus === "Connecting" ? "bg-amber-500" : "bg-red-500"}`}></span>
                </div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{wsStatus === "Connected" ? 'System Online' : wsStatus}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/operator/statistics')}
                className="px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
              >
                <FaChartBar className="text-gray-500" />
                <span className="hidden lg:inline text-sm font-semibold text-gray-700">Statistik</span>
              </button>
              
              <button
                onClick={() => router.push('/operator/management')}
                className="px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
              >
                <FaTags className="text-gray-500" />
                <span className="hidden lg:inline text-sm font-semibold text-gray-700">Manajemen</span>
              </button>

              <button
                onClick={() => setShowBroadcastModal(true)}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300 rounded-lg transition-all flex items-center gap-2 group"
                title="Kirim Notifikasi Broadcast"
              >
                <FaBullhorn className="text-red-500 group-hover:scale-110 transition-transform" />
                <span className="hidden lg:inline text-sm font-semibold text-red-600">Broadcast</span>
              </button>

              <div className="h-8 w-px bg-gray-200 mx-2 hidden sm:block"></div>

              <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200/60">
                <span className="text-sm font-semibold text-gray-700">Auto-Alarm</span>
                <button
                  onClick={() => setIsMonitorMode(!isMonitorMode)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${isMonitorMode ? "bg-red-500" : "bg-gray-300"}`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${isMonitorMode ? "translate-x-4" : "translate-x-1"}`}
                  />
                </button>
              </div>

              <div className="hidden lg:flex items-center gap-2 px-4 py-2">
                <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
                  <FaUserShield className="text-gray-500 text-sm" />
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Logout System"
              >
                <FaSignOutAlt className="text-lg" />
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-[1600px] w-full mx-auto p-4 sm:p-6 lg:p-8 flex-grow flex flex-col gap-6">
          
          {/* Top Stats Row */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<FaFire className="text-white" />}
              title="Laporan Aktif"
              value={activeReportsCount.toString()}
              color="bg-red-500"
            />
            <StatCard
              icon={<FaTruck className="text-white" />}
              title="Unit Di Lapangan"
              value={dispatchedCount.toString()}
              color="bg-blue-500"
            />
            <StatCard
              icon={<FaClock className="text-white" />}
              title="Rata-rata Respons"
              value="< 5 min"
              color="bg-amber-500"
            />
            <StatCard
              icon={<FaBuilding className="text-white" />}
              title="Total Posko"
              value="8 Aktif"
              color="bg-emerald-500"
            />
          </section>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow h-[calc(100vh-16rem)] min-h-[600px]">
            
            {/* Left Queue Panel */}
            <section className="lg:col-span-4 xl:col-span-3 bg-white border border-gray-200/80 rounded-2xl shadow-sm flex flex-col overflow-hidden h-full max-h-[800px]">
              <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
                <div>
                  <h2 className="text-base font-bold text-gray-900 tracking-tight">Antrean Darurat</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Laporan masuk real-time</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={fetchReports} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all" title="Segarkan">
                    <FaSyncAlt className="text-sm" />
                  </button>
                  <button onClick={handleDeleteAllReports} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Kosongkan Semua">
                    <FaTrash className="text-sm" />
                  </button>
                </div>
              </div>
              
              <div className="px-6 py-3 border-b border-gray-100 bg-gray-50/50 shrink-0">
                <select
                  onChange={(e) => setStatusFilter(e.target.value)}
                  value={statusFilter}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all appearance-none cursor-pointer"
                >
                  <option value="all">Semua Status Laporan</option>
                  <option value="submitted">Menunggu Verifikasi</option>
                  <option value="verified">Tervalidasi</option>
                  <option value="dispatched">Unit Meluncur</option>
                  <option value="arrived">Unit Tiba</option>
                  <option value="completed">Insiden Selesai</option>
                  <option value="false">Laporan Palsu</option>
                </select>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30 custom-scrollbar relative">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-40 gap-3 text-gray-400">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-red-500"></div>
                    <span className="text-sm font-medium">Sinkronisasi data...</span>
                  </div>
                ) : filteredReports.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 gap-2 text-gray-400">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-1">
                       <FaCheck className="text-gray-300 text-xl" />
                    </div>
                    <span className="text-sm font-medium">Antrean bersih</span>
                  </div>
                ) : (
                  filteredReports.map((report) => (
                    <ReportListItem
                      key={report.id}
                      report={report}
                      onSelect={handleSelectReport}
                    />
                  ))
                )}
              </div>
            </section>

            {/* Right Map Panel */}
            <section className="lg:col-span-8 xl:col-span-9 bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full relative min-h-[500px]">
              <div className="absolute top-4 left-4 z-[400] bg-white/90 backdrop-blur px-4 py-2.5 rounded-xl shadow-lg border border-gray-200/50 pointer-events-none">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                  <span className="text-sm font-bold tracking-tight text-gray-900">Live Command Map</span>
                </div>
              </div>
              <div className="flex-grow w-full h-full bg-gray-100 rounded-xl overflow-hidden shadow-inner">
                <AdminMap reports={reports} onReportClick={handleSelectReport} selectedReport={selectedReport} />
              </div>
            </section>

          </div>
        </main>
      </div>
    </>
  );
}
