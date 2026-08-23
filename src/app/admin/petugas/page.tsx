"use client";

import { useEffect, useState } from "react";
import { FaUserShield, FaHistory, FaSearch, FaClipboardList } from "react-icons/fa";
import OperatorLayout from "@/components/OperatorLayout";
import Link from "next/link";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  kelurahan_id: number | null;
  phone_number: string | null;
}

export default function AdminPetugasPage() {
  const [petugas, setPetugas] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/users");
        if (res.ok) {
          const allUsers: User[] = await res.json();
          // Hanya ambil petugas
          setPetugas(allUsers.filter(u => u.role?.toUpperCase() === 'PETUGAS'));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filteredPetugas = petugas.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <OperatorLayout>
      <div className="min-h-screen bg-gray-50 p-3 sm:p-6 md:p-10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                <FaClipboardList className="text-xl" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Riwayat Petugas</h1>
                <p className="text-xs sm:text-sm text-gray-500">Pilih petugas untuk melihat riwayat penanganan laporan</p>
              </div>
            </div>
            
            <div className="relative">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari nama / email petugas..."
                className="w-full sm:w-64 pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Grid Petugas */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
            </div>
          ) : filteredPetugas.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center shadow-xs border border-gray-100">
              <p className="text-gray-500">Tidak ada petugas ditemukan.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredPetugas.map(p => (
                <div key={p.id} className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 flex flex-col h-full hover:shadow-md transition">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xl shrink-0">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{p.name}</h3>
                      <p className="text-xs text-gray-500 mb-1">{p.email}</p>
                      <span className="inline-block px-2 py-0.5 bg-teal-100 text-teal-700 text-[10px] font-bold rounded">
                        PETUGAS
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-5 pt-4 border-t border-gray-50">
                    <Link
                      href={`/admin/petugas/${p.id}/history`}
                      className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition"
                    >
                      <FaHistory /> Lihat Riwayat Kinerja
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </OperatorLayout>
  );
}
