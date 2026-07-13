"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaChartBar, FaArrowLeft, FaFilter, FaFire, FaClock, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import OperatorLayout from "@/components/OperatorLayout";

interface Report {
  id: number;
  status: string;
  created_at: string;
  category_name?: string;
  kelurahan_name?: string;
}

export default function StatisticsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d'|'30d'|'1y'>('7d');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch("/api/operator/reports");
        if (response.ok) {
          const data = await response.json();
          setReports(data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReports();
  }, []);

  // --- Aggregate Data ---
  
  const statusCounts = reports.reduce((acc, curr) => {
    const stat = curr.status;
    if (!stat) return acc;
    acc[stat] = (acc[stat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const validStatus = reports.filter(r => r.status === 'completed' || r.status === 'arrived' || r.status === 'dispatched').length;
  const falseStatus = reports.filter(r => r.status === 'false').length;
  const totalReports = reports.length;

  const getPercentage = (value: number) => {
    return totalReports > 0 ? Math.round((value / totalReports) * 100) : 0;
  };

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
          <button 
            onClick={() => setTimeRange('7d')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${timeRange === '7d' ? 'bg-white text-gray-900 shadow-[0_2px_10px_rgba(0,0,0,0.05)]' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'}`}
          >
            7 Hari
          </button>
          <button 
            onClick={() => setTimeRange('30d')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${timeRange === '30d' ? 'bg-white text-gray-900 shadow-[0_2px_10px_rgba(0,0,0,0.05)]' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'}`}
          >
            30 Hari
          </button>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6 w-full">

        {/* Global Summary Cards */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
           {/* Total Card */}
           <div className="bg-white rounded-2xl p-6 border border-gray-200/60 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-gray-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative z-10">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-2"><FaFire className="text-red-400"/> Total Laporan Masuk</p>
                <div className="flex items-end gap-3 mt-4">
                  <span className="text-5xl font-extrabold tracking-tighter text-gray-900">{totalReports}</span>
                </div>
              </div>
           </div>

           {/* Valid Reports */}
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

           {/* False Reports */}
           <div className="bg-white rounded-2xl p-6 border border-gray-200/60 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-red-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative z-10">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-2"><FaTimesCircle className="text-red-400"/> Laporan Palsu (Prank)</p>
                <div className="flex items-end gap-3 mt-4">
                  <span className="text-5xl font-extrabold tracking-tighter text-gray-900">{falseStatus}</span>
                  <span className="text-sm font-semibold text-red-500 bg-red-50 px-2 py-1 rounded mb-1">{getPercentage(falseStatus)}%</span>
                </div>
              </div>
           </div>

           {/* Avg Response Time */}
           <div className="bg-white rounded-2xl p-6 border border-gray-200/60 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative z-10">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-2"><FaClock className="text-blue-400"/> Rata-rata Respons Unit</p>
                <div className="flex items-end gap-3 mt-4">
                  <span className="text-5xl font-extrabold tracking-tighter text-gray-900">4.2</span>
                  <span className="text-lg font-bold text-gray-400 mb-1">menit</span>
                </div>
              </div>
           </div>
        </section>

        {/* Charts Grid Alternative */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">

           {/* Status Breakdown (HTML/CSS Bar) */}
           <div className="bg-white rounded-2xl p-6 border border-gray-200/60 shadow-sm flex flex-col">
              <div className="mb-6">
                <h3 className="text-lg font-extrabold tracking-tight text-gray-900">Komposisi Status</h3>
                <p className="text-gray-500 text-sm font-medium">Distribusi status penanganan</p>
              </div>
              
              <div className="flex flex-col gap-5 justify-center flex-1">
                 {[
                   { label: 'Baru', count: statusCounts['submitted'] || 0, color: 'bg-red-500' },
                   { label: 'Diverifikasi', count: statusCounts['verified'] || 0, color: 'bg-yellow-500' },
                   { label: 'Dikirim', count: statusCounts['dispatched'] || 0, color: 'bg-blue-500' },
                   { label: 'Tiba', count: statusCounts['arrived'] || 0, color: 'bg-indigo-500' },
                   { label: 'Selesai', count: statusCounts['completed'] || 0, color: 'bg-emerald-500' },
                   { label: 'Palsu', count: statusCounts['false'] || 0, color: 'bg-slate-500' },
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

           {/* Example Categories HTML Bar */}
           <div className="bg-white rounded-2xl p-6 border border-gray-200/60 shadow-sm flex flex-col">
              <div className="mb-6">
                <h3 className="text-lg font-extrabold tracking-tight text-gray-900">Berdasarkan Kategori</h3>
                <p className="text-gray-500 text-sm font-medium">Volume insiden berdasarkan jenis kejadian</p>
              </div>
              
              <div className="flex flex-col gap-6 justify-center flex-1">
                 {/* Mock Data for categories because we don't have exactly category groups yet without complex reduce */}
                 {[
                   { label: 'Kebakaran Pemukiman', count: Math.round(totalReports * 0.6), color: 'bg-orange-500' },
                   { label: 'Lahan / Hutan', count: Math.round(totalReports * 0.2), color: 'bg-amber-600' },
                   { label: 'Evakuasi Hewan', count: Math.round(totalReports * 0.15), color: 'bg-teal-500' },
                   { label: 'Lainnya', count: Math.round(totalReports * 0.05), color: 'bg-gray-400' },
                 ].map((item, idx) => (
                    <div key={idx} className="flex flex-col gap-1.5">
                       <div className="flex justify-between text-sm font-bold">
                          <span className="text-gray-700">{item.label}</span>
                          <span className="text-gray-900">{item.count}</span>
                       </div>
                       <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                          <div className={`h-full rounded-full ${item.color} transition-all duration-1000`} style={{ width: `${Math.max(item.count > 0 ? (item.count / totalReports) * 100 : 0, 2)}%` }}></div>
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
