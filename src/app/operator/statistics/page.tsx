"use client";

import { useEffect, useState } from "react";
import { FaChartBar, FaFire, FaClock, FaCheckCircle, FaTimesCircle, FaTrophy, FaCalendarAlt, FaListUl } from "react-icons/fa";
import OperatorLayout from "@/components/OperatorLayout";
import { motion } from "framer-motion";

interface PetugasLeaderboard {
    petugas_id: number;
    petugas_name: string;
    total_handled: number;
    total_completed: number;
    avg_response_time: number;
}

export default function StatisticsPage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [availableYears, setAvailableYears] = useState<number[]>([currentYear]);
  
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const url = `/api/operator/statistics?year=${selectedYear}${selectedMonth !== 'all' ? `&month=${selectedMonth}` : ''}`;
        const response = await fetch(url);
        if (response.ok) {
          const res = await response.json();
          setStats(res.data);
          if (res.data.availableYears && res.data.availableYears.length > 0) {
            setAvailableYears(res.data.availableYears);
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [selectedYear, selectedMonth]);

  if (isLoading && !stats) {
    return (
      <OperatorLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
        </div>
      </OperatorLayout>
    );
  }

  let validStatus = 0;
  let falseStatus = 0;
  let totalReports = stats?.totalReports || 0;
  
  stats?.statusStats?.forEach((s: any) => {
    if (['completed', 'arrived', 'dispatched'].includes(s.status)) validStatus += s.total;
    if (s.status === 'false') falseStatus += s.total;
  });

  const getPercentage = (value: number) => {
    return totalReports > 0 ? Math.round((value / totalReports) * 100) : 0;
  };

  const getStatusCount = (status: string) => {
    const s = stats?.statusStats?.find((x: any) => x.status === status);
    return s ? s.total : 0;
  };

  let chartData: any[] = [];
  let chartMax = 0;
  
  if (selectedMonth !== 'all' && stats?.dailyStats) {
      chartData = stats.dailyStats.map((d: any) => ({ label: `Tgl ${d.day}`, value: d.total }));
  } else if (stats?.monthlyStats) {
      chartData = stats.monthlyStats.map((m: any) => ({ label: m.month_name.substring(0,3), value: m.total }));
  }
  
  if (chartData.length > 0) {
      chartMax = Math.max(...chartData.map((d: any) => d.value));
      chartMax = Math.max(chartMax + 2, 5); 
  }

  return (
    <OperatorLayout>
      <div className="bg-white border-b border-gray-200/70 p-4 sticky top-0 z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center shadow-inner border border-gray-200/50">
            <FaChartBar className="text-gray-500 text-lg" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Statistik Kinerja</h2>
            <p className="text-xs font-medium text-gray-500 mt-0.5">Analitik Operasional</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200/60 self-start sm:self-auto">
          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-2 rounded-lg text-sm font-bold bg-transparent text-gray-700 outline-none cursor-pointer hover:bg-gray-200/50 transition-colors"
          >
            {availableYears.map(y => (
                <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <div className="w-px h-6 bg-gray-300"></div>
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm font-bold bg-transparent text-gray-700 outline-none cursor-pointer hover:bg-gray-200/50 transition-colors"
          >
            <option value="all">Semua Bulan</option>
            <option value="1">Januari</option>
            <option value="2">Februari</option>
            <option value="3">Maret</option>
            <option value="4">April</option>
            <option value="5">Mei</option>
            <option value="6">Juni</option>
            <option value="7">Juli</option>
            <option value="8">Agustus</option>
            <option value="9">September</option>
            <option value="10">Oktober</option>
            <option value="11">November</option>
            <option value="12">Desember</option>
          </select>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6 w-full">

        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <div className="bg-white rounded-2xl p-6 border border-gray-200/60 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-gray-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative z-10">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-2"><FaFire className="text-red-400"/> Laporan Masuk</p>
                <div className="flex items-end gap-3 mt-4">
                  <span className="text-5xl font-extrabold tracking-tighter text-gray-900">{totalReports}</span>
                </div>
              </div>
           </div>

           <div className="bg-white rounded-2xl p-6 border border-gray-200/60 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative z-10">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-2"><FaCheckCircle className="text-emerald-400"/> Insiden Valid</p>
                <div className="flex items-end gap-3 mt-4">
                  <span className="text-5xl font-extrabold tracking-tighter text-gray-900">{validStatus}</span>
                  <span className="text-sm font-semibold text-emerald-500 bg-emerald-50 px-2 py-1 rounded mb-1">{getPercentage(validStatus)}%</span>
                </div>
              </div>
           </div>

           <div className="bg-white rounded-2xl p-6 border border-gray-200/60 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-red-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative z-10">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-2"><FaTimesCircle className="text-red-400"/> Laporan Palsu</p>
                <div className="flex items-end gap-3 mt-4">
                  <span className="text-5xl font-extrabold tracking-tighter text-gray-900">{falseStatus}</span>
                  <span className="text-sm font-semibold text-red-500 bg-red-50 px-2 py-1 rounded mb-1">{getPercentage(falseStatus)}%</span>
                </div>
              </div>
           </div>

           <div className="bg-white rounded-2xl p-6 border border-gray-200/60 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative z-10">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-2"><FaClock className="text-blue-400"/> Petugas Aktif</p>
                <div className="flex items-end gap-3 mt-4">
                  <span className="text-5xl font-extrabold tracking-tighter text-gray-900">{stats?.petugasLeaderboard?.length || 0}</span>
                  <span className="text-lg font-bold text-gray-400 mb-1">orang</span>
                </div>
              </div>
           </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">

           <div className="bg-white rounded-2xl p-6 border border-gray-200/60 shadow-sm flex flex-col col-span-1 lg:col-span-2 overflow-x-auto">
              <div className="mb-6 flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-extrabold tracking-tight text-gray-900 flex items-center gap-2"><FaCalendarAlt className="text-gray-400"/> Tren Insiden</h3>
                    <p className="text-gray-500 text-sm font-medium">Berdasarkan {selectedMonth === 'all' ? 'Bulan' : 'Tanggal'} (Tahun {selectedYear})</p>
                </div>
              </div>
              
              <div className="flex items-end gap-2 h-64 mt-4 w-full min-w-[600px] border-b border-gray-200 pb-2 relative">
                {chartData.length === 0 ? (
                    <div className="w-full flex justify-center items-center h-full text-gray-400 font-medium">Tidak ada data untuk periode ini</div>
                ) : (
                    chartData.map((d: any, idx: number) => {
                        const heightPercent = chartMax > 0 ? (d.value / chartMax) * 100 : 0;
                        return (
                            <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs font-bold py-1 px-2 rounded absolute -top-8 pointer-events-none z-10 whitespace-nowrap">
                                    {d.label}: {d.value} Lap
                                </div>
                                <motion.div 
                                    initial={{ height: 0 }}
                                    animate={{ height: `${heightPercent}%` }}
                                    transition={{ duration: 0.5, delay: idx * 0.02 }}
                                    className="w-full max-w-[40px] bg-red-500 hover:bg-red-600 rounded-t-sm transition-colors cursor-pointer"
                                />
                                <span className="text-[10px] sm:text-xs font-semibold text-gray-500 mt-2 rotate-45 sm:rotate-0 origin-left whitespace-nowrap">{d.label}</span>
                            </div>
                        )
                    })
                )}
              </div>
           </div>

           <div className="bg-white rounded-2xl p-6 border border-gray-200/60 shadow-sm flex flex-col">
              <div className="mb-6">
                <h3 className="text-lg font-extrabold tracking-tight text-gray-900 flex items-center gap-2"><FaTrophy className="text-yellow-500"/> Kinerja Petugas (Leaderboard)</h3>
                <p className="text-gray-500 text-sm font-medium">Peringkat berdasarkan laporan terselesaikan</p>
              </div>
              
              <div className="flex flex-col gap-3 flex-1 overflow-y-auto max-h-[400px] pr-2">
                 {stats?.petugasLeaderboard?.length === 0 ? (
                     <div className="text-center text-gray-400 py-10 font-medium">Belum ada petugas yang menangani laporan di periode ini.</div>
                 ) : (
                     stats?.petugasLeaderboard?.map((petugas: PetugasLeaderboard, idx: number) => (
                        <div key={petugas.petugas_id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-colors">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : idx === 1 ? 'bg-gray-200 text-gray-700' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-blue-50 text-blue-700'}`}>
                                #{idx + 1}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-gray-900">{petugas.petugas_name}</h4>
                                <div className="text-xs text-gray-500 font-medium flex items-center gap-3 mt-1">
                                    <span>Tugas: <strong className="text-gray-700">{petugas.total_handled}</strong></span>
                                    <span>Rata-rata Respon: <strong className="text-gray-700">{petugas.avg_response_time ? Math.round(petugas.avg_response_time / 60) : 0} mnt</strong></span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="block text-lg font-extrabold text-emerald-600">{petugas.total_completed}</span>
                                <span className="text-[10px] font-bold uppercase text-gray-400">Selesai</span>
                            </div>
                        </div>
                     ))
                 )}
              </div>
           </div>

           <div className="bg-white rounded-2xl p-6 border border-gray-200/60 shadow-sm flex flex-col">
              <div className="mb-6">
                <h3 className="text-lg font-extrabold tracking-tight text-gray-900 flex items-center gap-2"><FaListUl className="text-gray-400"/> Komposisi Status</h3>
                <p className="text-gray-500 text-sm font-medium">Distribusi status penanganan pada periode ini</p>
              </div>
              
              <div className="flex flex-col gap-5 justify-center flex-1">
                 {[
                   { label: 'Baru', count: getStatusCount('submitted'), color: 'bg-red-500' },
                   { label: 'Diverifikasi', count: getStatusCount('verified'), color: 'bg-yellow-500' },
                   { label: 'Dikirim', count: getStatusCount('dispatched'), color: 'bg-blue-500' },
                   { label: 'Tiba', count: getStatusCount('arrived'), color: 'bg-indigo-500' },
                   { label: 'Selesai', count: getStatusCount('completed'), color: 'bg-emerald-500' },
                   { label: 'Palsu', count: getStatusCount('false'), color: 'bg-slate-500' },
                 ].map((item, idx) => (
                    <div key={idx} className="flex flex-col gap-1.5">
                       <div className="flex justify-between text-sm font-bold">
                          <span className="text-gray-700">{item.label}</span>
                          <span className="text-gray-900">{item.count} <span className="text-gray-400 text-xs ml-1 font-medium">({getPercentage(item.count)}%)</span></span>
                       </div>
                       <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                          <div className={`h-2.5 rounded-full ${item.color} transition-all duration-1000`} style={{ width: `${Math.max(getPercentage(item.count), 2)}%` }}></div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>

        </section>

      </div>
    </OperatorLayout>
  );
}
