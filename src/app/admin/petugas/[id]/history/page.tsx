"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { FaArrowLeft, FaHistory, FaCheckCircle, FaClock, FaClipboardList, FaMapMarkerAlt, FaFire } from "react-icons/fa";
import OperatorLayout from "@/components/OperatorLayout";
import Link from "next/link";

interface PetugasStat {
  id: number;
  name: string;
  email: string;
  phone_number: string;
  total_handled: number;
  total_completed: number;
  avg_response_time: number;
}

interface HistoryReport {
  id: number;
  created_at: string;
  completed_at: string | null;
  category_name: string;
  category_color: string;
  kelurahan_name: string;
  status: string;
  status_petugas: string;
  response_time_seconds: number | null;
  description: string;
  address: string;
}

export default function PetugasHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [loading, setLoading] = useState(true);
  const [petugas, setPetugas] = useState<PetugasStat | null>(null);
  const [history, setHistory] = useState<HistoryReport[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/operator/users/petugas/${id}/history`);
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.message || "Gagal mengambil data riwayat petugas");
        }
        
        setPetugas(data.petugas);
        setHistory(data.history || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  return (
    <OperatorLayout>
      <div className="min-h-screen bg-gray-50 p-3 sm:p-6 md:p-10">
        <div className="max-w-5xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()}
              className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition shadow-sm shrink-0"
            >
              <FaArrowLeft />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Riwayat Petugas</h1>
              <p className="text-xs sm:text-sm text-gray-500">Detail penanganan laporan oleh petugas</p>
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl p-10 text-center shadow-xs border border-gray-100">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500 text-sm">Memuat data riwayat...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 text-center">
              <p className="font-medium">{error}</p>
              <button 
                onClick={() => router.back()}
                className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-bold transition"
              >
                Kembali
              </button>
            </div>
          ) : !petugas ? (
            <div className="bg-white rounded-2xl p-10 text-center shadow-xs border border-gray-100">
              <p className="text-gray-500">Data petugas tidak ditemukan.</p>
            </div>
          ) : (
            <>
              {/* Petugas Stats Card */}
              <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
                <div className="p-6 sm:p-8 bg-gradient-to-br from-indigo-900 to-blue-900 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <FaHistory className="text-9xl" />
                  </div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl font-bold border border-white/30">
                        {petugas.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">{petugas.name}</h2>
                        <p className="text-blue-200 text-sm flex items-center gap-2 mt-1">
                          {petugas.email} {petugas.phone_number && `• ${petugas.phone_number}`}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                        <div className="flex items-center gap-2 text-blue-200 mb-1">
                          <FaClipboardList className="text-sm" />
                          <span className="text-xs uppercase font-bold tracking-wider">Total Penanganan</span>
                        </div>
                        <p className="text-3xl font-bold">{petugas.total_handled}</p>
                      </div>
                      <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                        <div className="flex items-center gap-2 text-blue-200 mb-1">
                          <FaCheckCircle className="text-sm" />
                          <span className="text-xs uppercase font-bold tracking-wider">Selesai</span>
                        </div>
                        <p className="text-3xl font-bold">{petugas.total_completed}</p>
                      </div>
                      <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                        <div className="flex items-center gap-2 text-blue-200 mb-1">
                          <FaClock className="text-sm" />
                          <span className="text-xs uppercase font-bold tracking-wider">Rata-rata Respon</span>
                        </div>
                        <p className="text-3xl font-bold">
                          {petugas.avg_response_time > 0 ? `${Math.round(petugas.avg_response_time / 60)} Menit` : '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* History List */}
              <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <FaClipboardList className="text-blue-500" /> Daftar Riwayat Laporan
                  </h3>
                </div>
                
                <div className="divide-y divide-gray-100">
                  {history.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-sm">
                      Belum ada riwayat penanganan laporan.
                    </div>
                  ) : (
                    history.map((h, i) => (
                      <div key={i} className="p-5 sm:p-6 hover:bg-gray-50 transition">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="space-y-3 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg uppercase tracking-wide">
                                #{h.id}
                              </span>
                              <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                                h.status_petugas === 'completed' ? 'bg-green-100 text-green-700' :
                                h.status_petugas === 'false_report' ? 'bg-red-100 text-red-700' :
                                h.status_petugas === 'dibatalkan' ? 'bg-gray-100 text-gray-600' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {h.status_petugas === 'completed' ? 'SELESAI' :
                                 h.status_petugas === 'false_report' ? 'LAPORAN PALSU' :
                                 h.status_petugas === 'dibatalkan' ? 'DIBATALKAN' :
                                 h.status_petugas.toUpperCase()}
                              </span>
                              
                              <span className="text-xs text-gray-500">
                                {new Date(h.completed_at || h.created_at).toLocaleString('id-ID', {
                                  day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                })} WIB
                              </span>
                            </div>
                            
                            <div>
                              <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                <FaFire className="text-orange-500" /> {h.category_name}
                              </h4>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{h.description || 'Tidak ada deskripsi'}</p>
                            </div>
                            
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <FaMapMarkerAlt className="text-red-400" />
                              <span>{h.address || h.kelurahan_name}</span>
                            </div>
                          </div>
                          
                          <div className="shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                            {h.response_time_seconds != null && (
                              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-center min-w-[120px]">
                                <p className="text-[10px] uppercase font-bold text-blue-500 mb-1">Waktu Respon</p>
                                <p className="font-bold text-blue-900">{Math.round(h.response_time_seconds / 60)} Menit</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </OperatorLayout>
  );
}
