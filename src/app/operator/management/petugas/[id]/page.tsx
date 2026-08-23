"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { FaArrowLeft, FaCheckCircle, FaTimesCircle, FaClock, FaCalendarAlt, FaMapMarkerAlt, FaFileAlt } from "react-icons/fa";
import OperatorLayout from "@/components/OperatorLayout";
import { useToast } from "@/hooks/useToast";
import Toast from "@/components/Toast";

interface PetugasInfo {
  id: number;
  name: string;
  email: string;
  phone_number: string;
  total_handled: number;
  total_completed: number;
  avg_response_time: number;
}

interface ReportHistory {
  id: number;
  category_name: string;
  category_icon: string;
  category_color: string;
  kelurahan_name: string;
  created_at: string;
  completed_at: string;
  status_petugas: string;
  response_time_seconds: number;
  completion_photo_url: string | null;
  petugas_notes: string | null;
  notes: string | null;
}

export default function PetugasHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const petugasId = resolvedParams.id;
  const { toast, showToast, hideToast } = useToast();

  const [petugas, setPetugas] = useState<PetugasInfo | null>(null);
  const [history, setHistory] = useState<ReportHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [petugasId]);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/operator/users/petugas/${petugasId}/history`);
      const data = await res.json();
      if (res.ok) {
        setPetugas(data.petugas);
        setHistory(data.history);
      } else {
        showToast("error", data.message || "Gagal mengambil data riwayat");
      }
    } catch (err) {
      showToast("error", "Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "-";
    if (seconds < 60) return `${seconds} dtk`;
    const mins = Math.floor(seconds / 60);
    return `${mins} mnt`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <OperatorLayout>
      {toast.show && <Toast {...toast} onClose={hideToast} />}
      
      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header Section */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => router.push('/operator/management')}
            className="p-2.5 text-gray-500 hover:text-gray-900 bg-white border border-gray-200 hover:border-gray-300 rounded-xl transition-all shadow-sm"
          >
            <FaArrowLeft />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Riwayat Tugas Petugas</h1>
            <p className="text-sm text-gray-500 mt-1">Lihat rekam jejak laporan yang ditangani oleh petugas ini.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
          </div>
        ) : !petugas ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
            <p className="text-gray-500">Data petugas tidak ditemukan.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Petugas Info Card */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{petugas.name}</h2>
                <div className="text-sm text-gray-500 mt-1 flex flex-col sm:flex-row sm:gap-4">
                  <span>{petugas.email}</span>
                  <span className="hidden sm:inline">•</span>
                  <span>{petugas.phone_number || "Tidak ada nomor WA"}</span>
                </div>
              </div>
              <div className="flex gap-4 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                <div className="bg-emerald-50 border border-emerald-100 px-4 py-3 rounded-xl min-w-[120px]">
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Diselesaikan</p>
                  <p className="text-2xl font-black text-emerald-700">{petugas.total_completed} <span className="text-sm font-semibold text-emerald-600/70">/ {petugas.total_handled}</span></p>
                </div>
                <div className="bg-blue-50 border border-blue-100 px-4 py-3 rounded-xl min-w-[120px]">
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Rata Waktu</p>
                  <p className="text-2xl font-black text-blue-700">{formatDuration(petugas.avg_response_time)}</p>
                </div>
              </div>
            </div>

            {/* History List */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-bold text-gray-900">Daftar Laporan yang Ditangani ({history.length})</h3>
              </div>
              
              {history.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  Belum ada riwayat tugas untuk petugas ini.
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {history.map((item) => (
                    <div key={item.id} className="p-4 sm:p-6 hover:bg-gray-50/50 transition-colors">
                      <div className="flex flex-col md:flex-row gap-4 md:gap-6 justify-between items-start">
                        
                        {/* Kiri: Kategori & Info */}
                        <div className="flex gap-4">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-2xl" style={{ backgroundColor: `${item.category_color}15`, color: item.category_color }}>
                            {item.category_icon}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">#{item.id}</span>
                              <h4 className="font-bold text-gray-900">{item.category_name || "Lainnya"}</h4>
                              {item.status_petugas === 'completed' && <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold"><FaCheckCircle /> SELESAI</span>}
                              {item.status_petugas === 'false_report' && <span className="inline-flex items-center gap-1 bg-gray-200 text-gray-600 px-2 py-0.5 rounded text-[10px] font-bold"><FaTimesCircle /> PALSU</span>}
                              {item.status_petugas === 'dibatalkan' && <span className="inline-flex items-center gap-1 bg-red-100 text-red-600 px-2 py-0.5 rounded text-[10px] font-bold"><FaTimesCircle /> BATAL</span>}
                            </div>
                            
                            <div className="text-sm text-gray-500 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 mt-2">
                              <div className="flex items-center gap-1.5">
                                <FaCalendarAlt className="text-gray-400" /> 
                                {formatDate(item.created_at)}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <FaMapMarkerAlt className="text-gray-400" />
                                {item.kelurahan_name || "Lokasi tidak diketahui"}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <FaClock className="text-gray-400" />
                                Respon: <span className="font-semibold text-gray-700">{formatDuration(item.response_time_seconds)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Kanan: Foto / Notes */}
                        <div className="flex flex-col md:items-end w-full md:w-auto min-w-[200px]">
                          {item.petugas_notes || item.notes ? (
                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 w-full mb-3 text-xs text-gray-600 flex gap-2">
                              <FaFileAlt className="text-gray-400 shrink-0 mt-0.5" />
                              <p className="line-clamp-2 italic">&quot;{item.petugas_notes || item.notes}&quot;</p>
                            </div>
                          ) : null}
                          
                          {item.completion_photo_url && (
                            <a href={item.completion_photo_url} target="_blank" rel="noreferrer" className="inline-flex">
                              <div className="h-16 w-16 sm:h-20 sm:w-24 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden bg-cover bg-center" style={{ backgroundImage: `url(${item.completion_photo_url})` }}></div>
                            </a>
                          )}
                        </div>
                        
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </OperatorLayout>
  );
}
