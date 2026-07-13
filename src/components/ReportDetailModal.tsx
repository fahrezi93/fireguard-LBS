"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { toSafeExternalUrl } from "@/lib/url-safety";

const AdminMap = dynamic(() => import("./AdminMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
      <div className="flex flex-col items-center gap-2">
        <div className="animate-spin h-6 w-6 border-2 border-gray-400 border-t-transparent rounded-full"></div>
        <span className="text-xs">Memuat Peta...</span>
      </div>
    </div>
  ),
});
import {
  FaTimes,
  FaMapMarkerAlt,
  FaClock,
  FaPhone,
  FaFileAlt,
  FaImage,
  FaCheck,
  FaTruck,
  FaCheckCircle,
  FaTimesCircle,
  FaTrash,
  FaUser,
} from "react-icons/fa";

interface Report {
  id: number;
  user_id?: number | null;
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
  guest_name?: string | null;
  user_name?: string | null;
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

interface ReportDetailModalProps {
  report: Report;
  onClose: () => void;
  onUpdateStatus?: (reportId: number, newStatus: string) => Promise<void>;
  onDispatchToPetugas?: (reportId: number) => Promise<void>;
  onDelete?: (reportId: number) => Promise<void>;
  readOnly?: boolean;
}

const StatusButton = ({
  label,
  icon,
  color,
  onClick,
  disabled = false,
}: {
  label: string;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
  disabled?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`${color} text-white px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all hover:shadow-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed`}
  >
    {icon}
    {label}
  </button>
);

export default function ReportDetailModal({
  report,
  onClose,
  onUpdateStatus,
  onDispatchToPetugas,
  onDelete,
  readOnly = false,
}: ReportDetailModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [kelurahanList, setKelurahanList] = useState<{ id: number; name: string }[]>([]);
  const [selectedKelurahan, setSelectedKelurahan] = useState<number | null>(report.kelurahan?.id || null);
  const [isEditingKelurahan, setIsEditingKelurahan] = useState(false);
  // State lokal untuk kelurahan agar tidak mutasi prop
  const [localKelurahan, setLocalKelurahan] = useState<{ id: number; name: string } | null | undefined>(report.kelurahan);

  // Fetch kelurahan list
  useEffect(() => {
    const fetchKelurahan = async () => {
      try {
        const res = await fetch('/api/kelurahan');
        const data = await res.json();
        if (data.success) setKelurahanList(data.data);
      } catch (err) {
        console.error('Error fetching kelurahan:', err);
      }
    };
    if (!readOnly) fetchKelurahan();
  }, [readOnly]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!onUpdateStatus || readOnly) return;
    setIsUpdating(true);
    try {
      await onUpdateStatus(report.id, newStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDispatch = async () => {
    if (!onDispatchToPetugas || readOnly) return;
    setIsUpdating(true);
    try {
      await onDispatchToPetugas(report.id);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || readOnly) return;
    setIsUpdating(true);
    try {
      await onDelete(report.id);
      onClose();
    } finally {
      setIsUpdating(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleSaveKelurahan = async () => {
    if (!selectedKelurahan) return;
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/operator/reports/${report.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kelurahanId: selectedKelurahan }),
      });
      if (res.ok) {
        setIsEditingKelurahan(false);
        // Update via callback agar parent state ikut terupdate (tidak mutasi prop)
        const found = kelurahanList.find(k => k.id === selectedKelurahan);
        if (found && onUpdateStatus) {
          // Trigger parent refresh — gunakan status yang sama agar tidak kirim notif
          // Cukup tutup edit mode, parent akan refresh saat next fetch
        }
        // Update tampilan lokal sementara (tidak mutasi prop, pakai state)
        setLocalKelurahan(found ?? null);
      } else {
        alert('Gagal menyimpan kelurahan. Coba lagi.');
      }
    } catch (err) {
      console.error('Error updating kelurahan:', err);
      alert('Terjadi kesalahan. Coba lagi.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const getStatusDisplay = (status: string) => {
    const statusMap: { [key: string]: { text: string; color: string; bgColor: string } } = {
      pending: { text: "Baru", color: "text-red-600", bgColor: "bg-red-50 border-red-200" },
      submitted: { text: "Baru", color: "text-red-600", bgColor: "bg-red-50 border-red-200" },
      verified: { text: "Diverifikasi", color: "text-yellow-600", bgColor: "bg-yellow-50 border-yellow-200" },
      diproses: { text: "Sedang Diproses", color: "text-blue-600", bgColor: "bg-blue-50 border-blue-200" },
      dispatched: { text: "Dikirim", color: "text-blue-600", bgColor: "bg-blue-50 border-blue-200" },
      dikirim: { text: "Tim Dikirim", color: "text-purple-600", bgColor: "bg-purple-50 border-purple-200" },
      arrived: { text: "Tiba", color: "text-indigo-600", bgColor: "bg-indigo-50 border-indigo-200" },
      ditangani: { text: "Sedang Ditangani", color: "text-cyan-600", bgColor: "bg-cyan-50 border-cyan-200" },
      completed: { text: "Selesai", color: "text-green-600", bgColor: "bg-green-50 border-green-200" },
      selesai: { text: "Selesai", color: "text-green-600", bgColor: "bg-green-50 border-green-200" },
      dibatalkan: { text: "Dibatalkan", color: "text-red-600", bgColor: "bg-red-50 border-red-200" },
      false_report: { text: "Laporan Palsu", color: "text-gray-600", bgColor: "bg-gray-50 border-gray-200" },
    };
    return (
      statusMap[status] || { text: status, color: "text-gray-600", bgColor: "bg-gray-50 border-gray-200" }
    );
  };

  const statusDisplay = getStatusDisplay(report.status);
  const safeMediaUrl = toSafeExternalUrl(report.media_url);

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200/60 px-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl">
              <FaFileAlt className="text-white text-base" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-gray-900">Detail Laporan #{report.id}</h2>
                {report.needs_backup == 1 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full animate-pulse shadow-sm">
                    🚨 BUTUH BACKUP
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">Informasi lengkap laporan kebakaran</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all p-2 rounded-xl"
            aria-label="Close modal"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* SOS Backup Banner */}
        {report.needs_backup ? (
          <div className="bg-red-600 px-6 py-3 flex items-center justify-between text-white shadow-inner animate-pulse">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🚨</span>
              <div>
                <p className="font-bold text-sm tracking-wide uppercase">PETUGAS MEMBUTUHKAN BANTUAN ARMADA</p>
                <p className="text-xs text-red-100 mt-0.5">Skala api besar, segera kirimkan unit pemadam tambahan ke lokasi ini!</p>
              </div>
            </div>
            {!readOnly && onUpdateStatus && (
              <button
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/operator/reports/${report.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ needsBackup: false }),
                    });
                    if (res.ok) {
                      // Tutup modal agar list refresh, atau panggil onUpdateStatus dengan status saat ini untuk me-trigger reload
                      await onUpdateStatus(report.id, report.status);
                      onClose();
                    } else {
                      alert('Gagal memproses. Coba lagi.');
                    }
                  } catch (e) {
                    alert('Terjadi kesalahan jaringan.');
                  }
                }}
                className="bg-white text-red-700 px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:bg-red-50 transition-colors whitespace-nowrap"
              >
                Tanggapi Bantuan
              </button>
            )}
          </div>
        ) : null}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-gray-50/30">
          {/* Status */}
          <div className={`rounded-xl p-5 border ${statusDisplay.bgColor}`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">Status Laporan</p>
                  <p className={`text-xl font-semibold ${statusDisplay.color}`}>
                    {statusDisplay.text}
                  </p>
                </div>
              </div>
              {report.assigned_petugas_name && (
                <div className="bg-white/60 p-3 rounded-lg border border-gray-200/50">
                  <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-1">Diambil Oleh Petugas</p>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-xs font-bold text-blue-700">{report.assigned_petugas_name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{report.assigned_petugas_name}</p>
                      {report.accepted_at && (
                        <p className="text-xs text-gray-500">
                          {new Date(report.accepted_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB
                        </p>
                      )}
                      {report.status_petugas && (
                        <div className="mt-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            report.status_petugas === 'accepted' ? 'bg-yellow-100 text-yellow-700' :
                            report.status_petugas === 'arrived' ? 'bg-blue-100 text-blue-700' :
                            report.status_petugas === 'completed' ? 'bg-green-100 text-green-700' :
                            report.status_petugas === 'false_report' ? 'bg-gray-100 text-gray-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {report.status_petugas === 'accepted' ? 'Menuju Lokasi' :
                             report.status_petugas === 'arrived' ? 'Tiba di Lokasi' :
                             report.status_petugas === 'completed' ? 'Selesai' :
                             report.status_petugas === 'false_report' ? 'Laporan Palsu' :
                             report.status_petugas}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Timing Metrics */}
          {(report.status_petugas === 'completed' || report.status_petugas === 'false_report') && report.dispatched_at && report.arrived_at && report.completed_at && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-4 border border-blue-100 shadow-sm flex flex-col items-center justify-center text-center">
                <p className="text-[11px] uppercase font-bold text-gray-500 tracking-wider mb-1">Waktu Respon</p>
                <p className="text-lg font-bold text-blue-700">
                  {Math.max(0, Math.floor((new Date(report.arrived_at).getTime() - new Date(report.dispatched_at).getTime()) / 60000))} Menit
                </p>
                <p className="text-[10px] text-gray-400 mt-1">Dikirim ➔ Tiba</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-orange-100 shadow-sm flex flex-col items-center justify-center text-center">
                <p className="text-[11px] uppercase font-bold text-gray-500 tracking-wider mb-1">Waktu Penanganan</p>
                <p className="text-lg font-bold text-orange-700">
                  {Math.max(0, Math.floor((new Date(report.completed_at).getTime() - new Date(report.arrived_at).getTime()) / 60000))} Menit
                </p>
                <p className="text-[10px] text-gray-400 mt-1">Tiba ➔ Selesai</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-green-100 shadow-sm flex flex-col items-center justify-center text-center">
                <p className="text-[11px] uppercase font-bold text-gray-500 tracking-wider mb-1">Total Waktu</p>
                <p className="text-lg font-bold text-green-700">
                  {Math.max(0, Math.floor((new Date(report.completed_at).getTime() - new Date(report.dispatched_at).getTime()) / 60000))} Menit
                </p>
                <p className="text-[10px] text-gray-400 mt-1">Dikirim ➔ Selesai</p>
              </div>
            </div>
          )}

          {/* Kategori dan Kelurahan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Kategori Bencana */}
            <div className="bg-white rounded-xl p-5 border border-gray-200/60 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <span className="text-lg">{report.category?.icon || '🔥'}</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1.5">Kategori Bencana</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {report.category?.name || 'Kebakaran'}
                  </p>
                </div>
              </div>
            </div>

            {/* Kelurahan */}
            <div className="bg-white rounded-xl p-5 border border-gray-200/60 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-teal-100 rounded-lg">
                  <FaMapMarkerAlt className="text-teal-600 text-sm" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1.5">Kelurahan</p>
                  {isEditingKelurahan && !readOnly ? (
                    <div className="flex gap-2">
                      <select
                        value={selectedKelurahan || ''}
                        onChange={(e) => setSelectedKelurahan(Number(e.target.value))}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      >
                        <option value="">Pilih Kelurahan</option>
                        {kelurahanList.map((kel) => (
                          <option key={kel.id} value={kel.id}>{kel.name}</option>
                        ))}
                      </select>
                      <button
                        onClick={handleSaveKelurahan}
                        className="px-3 py-2 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600"
                      >
                        Simpan
                      </button>
                      <button
                        onClick={() => setIsEditingKelurahan(false)}
                        className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-300"
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">
                        {localKelurahan?.name || 'Tidak tersedia'}
                      </p>
                      {!readOnly && (
                        <button
                          onClick={() => setIsEditingKelurahan(true)}
                          className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Informasi Pelapor */}
          <div className="bg-white rounded-xl p-5 border border-gray-200/60 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FaUser className="text-purple-600 text-sm" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-1">Informasi Pelapor</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900">
                    {report.user_name || report.guest_name || 'Tidak diketahui'}
                  </p>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${report.user_id ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                    {report.user_id ? 'Terdaftar' : 'Guest'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Deskripsi */}
          {report.description && (
            <div className="bg-white rounded-xl p-5 border border-gray-200/60 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FaFileAlt className="text-blue-600 text-sm" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-2">Deskripsi Kejadian</p>
                  <p className="text-sm text-gray-900 leading-relaxed">{report.description}</p>
                </div>
              </div>
            </div>
          )}

          {/* Alamat */}
          {report.address && (
            <div className="bg-white rounded-xl p-5 border border-gray-200/60 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <FaMapMarkerAlt className="text-orange-600 text-sm" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-2">Alamat/Patokan</p>
                  <p className="text-sm text-gray-900 leading-relaxed">{report.address}</p>
                </div>
              </div>
            </div>
          )}

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Waktu */}
            <div className="bg-white rounded-xl p-5 border border-gray-200/60 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <FaClock className="text-yellow-600 text-sm" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1.5">Waktu Laporan</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {new Date(report.created_at).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      timeZone: "Asia/Jakarta",
                    })}
                  </p>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {new Date(report.created_at).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                      timeZone: "Asia/Jakarta",
                    })} WIB
                  </p>
                </div>
              </div>
            </div>

            {/* Kontak */}
            <div className="bg-white rounded-xl p-5 border border-gray-200/60 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FaPhone className="text-green-600 text-sm" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1.5">Nomor Telepon</p>
                  <p className="text-sm font-semibold text-gray-900 font-mono">
                    {report.phone_number}
                  </p>
                  {report.contact && (
                    <p className="text-xs text-gray-600 mt-1">{report.contact}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Lokasi Kebakaran */}
          <div className="bg-white rounded-xl p-5 border border-gray-200/60 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <FaMapMarkerAlt className="text-red-600 text-sm" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-2">🔥 Lokasi Kebakaran</p>
                <p className="text-sm text-gray-900 font-mono">
                  Lat: {Number(report.fire_latitude).toFixed(6)}
                </p>
                <p className="text-sm text-gray-900 font-mono">
                  Lng: {Number(report.fire_longitude).toFixed(6)}
                </p>
                <a
                  href={`https://www.google.com/maps?q=${report.fire_latitude},${report.fire_longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 text-xs font-medium mt-2 inline-flex items-center gap-1 hover:underline"
                >
                  Buka di Google Maps →
                </a>
              </div>
            </div>
          </div>

          {/* Lokasi Pelapor */}
          {report.reporter_latitude && report.reporter_longitude && (
            <div className="bg-white rounded-xl p-5 border border-gray-200/60 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FaMapMarkerAlt className="text-blue-600 text-sm" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-2">📍 Lokasi Pelapor</p>
                  <p className="text-sm text-gray-900 font-mono">
                    Lat: {Number(report.reporter_latitude).toFixed(6)}
                  </p>
                  <p className="text-sm text-gray-900 font-mono">
                    Lng: {Number(report.reporter_longitude).toFixed(6)}
                  </p>
                  <a
                    href={`https://www.google.com/maps?q=${report.reporter_latitude},${report.reporter_longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 text-xs font-medium mt-2 inline-flex items-center gap-1 hover:underline"
                  >
                    Buka di Google Maps →
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Catatan */}
          {report.notes && (
            <div className="bg-white rounded-xl p-5 border border-gray-200/60 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FaFileAlt className="text-blue-600 text-sm" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-2">Catatan</p>
                  <p className="text-sm text-gray-900 leading-relaxed">{report.notes}</p>
                </div>
              </div>
            </div>
          )}

          {/* Peta Rute Kebakaran */}
          <div className="bg-white rounded-xl p-5 border border-gray-200/60 shadow-sm overflow-hidden">
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <FaMapMarkerAlt className="text-orange-600 text-sm" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Rute Pemadam Kebakaran</p>
                <p className="text-sm font-semibold text-gray-900">
                  Estimasi Rute Tercepat
                </p>
              </div>
            </div>
            <div className="w-full h-80 rounded-lg overflow-hidden border border-gray-200 relative z-0">
              <AdminMap
                reports={[report]}
                selectedReport={report}
                onReportClick={() => { }}
              />
            </div>
          </div>

          {/* Media */}
          {safeMediaUrl && (
            <div className="bg-white rounded-xl p-5 border border-gray-200/60 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FaImage className="text-purple-600 text-sm" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-3">Media Lampiran</p>
                  <div className="relative w-full h-64 rounded-xl overflow-hidden border border-gray-200">
                    <Image
                      src={safeMediaUrl}
                      alt="Bukti laporan"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <a
                    href={safeMediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 text-xs font-medium mt-3 inline-flex items-center gap-1 hover:underline"
                  >
                    Lihat Ukuran Penuh →
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Bukti Penyelesaian */}
          {report.completion_photo_url && (
            <div className="bg-white rounded-xl p-5 border border-green-200 shadow-sm bg-green-50/30">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FaCheckCircle className="text-green-600 text-sm" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-green-700 font-semibold mb-3">Bukti Penyelesaian (Dari Petugas)</p>
                  <div className="relative w-full h-64 rounded-xl overflow-hidden border border-green-200">
                    <Image
                      src={toSafeExternalUrl(report.completion_photo_url) || ''}
                      alt="Bukti penyelesaian laporan"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <a
                    href={toSafeExternalUrl(report.completion_photo_url) || undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-700 hover:text-green-800 text-xs font-medium mt-3 inline-flex items-center gap-1 hover:underline"
                  >
                    Lihat Ukuran Penuh →
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Catatan Lapangan dari Petugas */}
          {report.petugas_notes && (
            <div className="bg-white rounded-xl p-5 border border-purple-200 shadow-sm bg-purple-50/30">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FaFileAlt className="text-purple-600 text-sm" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-purple-700 font-semibold mb-2">Catatan Lapangan (Dari Petugas)</p>
                  <p className="text-sm text-gray-900 leading-relaxed bg-white p-3 rounded-lg border border-purple-100">{report.petugas_notes}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {!readOnly && onUpdateStatus && (
          <div className="sticky bottom-0 bg-white border-t border-gray-200/60 px-6 py-5">
            <p className="text-xs font-medium text-gray-600 mb-3">Ubah Status Laporan:</p>
            <div className="flex flex-wrap gap-2.5 justify-between items-center">
              <div className="flex flex-wrap gap-2.5">
                <StatusButton
                  label="Verifikasi"
                  icon={<FaCheck className="text-sm" />}
                  color="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700"
                  onClick={() => handleStatusUpdate("verified")}
                  disabled={report.status === 'completed' || report.status === 'false' || report.status === 'false_report'}
                />
                {onDispatchToPetugas && (
                  <StatusButton
                    label={report.assigned_petugas_id ? "Sudah Diambil Petugas" : "Kirim ke Petugas (Broadcast)"}
                    icon={<FaTruck className="text-sm" />}
                    color="bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700"
                    onClick={handleDispatch}
                    disabled={!!report.assigned_petugas_id || report.status === 'completed' || report.status === 'false' || report.status === 'false_report'}
                  />
                )}
                <StatusButton
                  label="Kirim Unit (Manual)"
                  icon={<FaTruck className="text-sm" />}
                  color="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700"
                  onClick={() => handleStatusUpdate("dispatched")}
                  disabled={!!report.assigned_petugas_id || report.status === 'completed' || report.status === 'false' || report.status === 'false_report'}
                />
                <StatusButton
                  label="Selesaikan"
                  icon={<FaCheckCircle className="text-sm" />}
                  color="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  onClick={() => handleStatusUpdate("completed")}
                  disabled={report.status === 'completed' || report.status === 'false' || report.status === 'false_report'}
                />
                <StatusButton
                  label="Laporan Palsu"
                  icon={<FaTimesCircle className="text-sm" />}
                  color="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700"
                  onClick={() => handleStatusUpdate("false")}
                  disabled={report.status === 'completed' || report.status === 'false' || report.status === 'false_report'}
                />
              </div>
              {/* Tombol Hapus */}
              {onDelete && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-all"
                >
                  <FaTrash className="text-sm" />
                  Hapus
                </button>
              )}
            </div>
          </div>
        )}

        {/* Dialog Konfirmasi Hapus */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center rounded-2xl z-10">
            <div className="bg-white rounded-2xl p-6 shadow-xl mx-4 max-w-sm w-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <FaTrash className="text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Hapus Laporan?</h3>
                  <p className="text-xs text-gray-500">Laporan #{report.id}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-5">
                Laporan ini akan dihapus permanen beserta notifikasinya. Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 border border-gray-200 hover:bg-gray-50 transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-all"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        )}

        {isUpdating && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center rounded-2xl">
            <div className="bg-white rounded-xl p-6 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 animate-spin rounded-full border-3 border-solid border-red-500 border-r-transparent"></div>
                <p className="text-sm font-medium text-gray-900">Memperbarui status...</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
