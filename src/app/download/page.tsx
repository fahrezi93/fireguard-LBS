import { Metadata } from 'next';
import Link from 'next/link';
import { FaAndroid, FaShieldAlt, FaUser, FaInfoCircle } from 'react-icons/fa';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';

export const metadata: Metadata = {
  title: 'Download Aplikasi Android - SiagaBencana',
  description: 'Download aplikasi resmi SiagaBencana untuk Masyarakat Umum dan Petugas Damkar.',
};

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      {/* Header / Navbar */}
      <Navbar isLight={true} />

      <main className="pt-28 pb-12 md:pt-32 md:pb-16 flex-1">
        <div className="max-w-4xl mx-auto px-6 w-full">

          {/* Page Header */}
          <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-semibold tracking-wider uppercase mb-3 border border-red-100/50 shadow-2xs">
              <FaAndroid className="text-[11px]" /> Unduh Aplikasi Mobile
            </span>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 mb-3 tracking-tight leading-snug">
              Download Aplikasi SiagaBencana
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed font-normal">
              Dapatkan akses penuh ke fitur pelaporan, pemantauan, dan penanganan bencana langsung dari genggaman Anda.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card User */}
            <div className="bg-slate-50/70 rounded-2xl p-6 sm:p-7 border border-slate-100 shadow-2xs hover:bg-white hover:border-slate-200/80 hover:shadow-md transition-all duration-200 relative overflow-hidden group">
              <div className="absolute -top-4 -right-4 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <FaUser className="w-28 h-28 text-red-600" />
              </div>
              <div className="relative z-10">
                <div className="w-11 h-11 bg-white text-red-600 rounded-xl flex items-center justify-center mb-4 border border-slate-200/60 shadow-2xs">
                  <FaUser className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 mb-1.5">Aplikasi Masyarakat</h2>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-6 font-normal min-h-[56px]">
                  Versi untuk warga umum. Lapor kejadian kebakaran, pantau status laporan secara real-time, dan baca edukasi tanggap darurat.
                </p>
                <a 
                  href="/downloads/siagabencana-user.apk"
                  download="siagabencana-user.apk"
                  className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-3 px-5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-2xs"
                >
                  <FaAndroid className="text-base" />
                  Download APK User
                </a>
                <div className="mt-3 text-center">
                  <span className="text-[11px] text-slate-400 font-medium bg-white px-2.5 py-0.5 rounded-full border border-slate-200/60">
                    Android 8.0+ (Oreo)
                  </span>
                </div>
              </div>
            </div>

            {/* Card Petugas */}
            <div className="bg-slate-50/70 rounded-2xl p-6 sm:p-7 border border-slate-100 shadow-2xs hover:bg-white hover:border-slate-200/80 hover:shadow-md transition-all duration-200 relative overflow-hidden group">
              <div className="absolute -top-4 -right-4 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <FaShieldAlt className="w-28 h-28 text-blue-600" />
              </div>
              <div className="relative z-10">
                <div className="w-11 h-11 bg-white text-blue-600 rounded-xl flex items-center justify-center mb-4 border border-slate-200/60 shadow-2xs">
                  <FaShieldAlt className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 mb-1.5">Aplikasi Petugas</h2>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-6 font-normal min-h-[56px]">
                  Versi khusus armada Pemadam Kebakaran. Terima tugas lapangan, navigasi rute tercepat (OSRM), dan perbarui status pemadaman.
                </p>
                <a 
                  href="/downloads/siagabencana-petugas.apk"
                  download="siagabencana-petugas.apk"
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-2xs"
                >
                  <FaAndroid className="text-base" />
                  Download APK Petugas
                </a>
                <div className="mt-3 text-center">
                  <span className="text-[11px] text-slate-400 font-medium bg-white px-2.5 py-0.5 rounded-full border border-slate-200/60">
                    Android 8.0+ (Oreo)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Sideload Instruction Box */}
          <div className="mt-8 bg-slate-50/70 rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-2xs">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 mb-1.5 flex items-center justify-center gap-2">
              <FaInfoCircle className="text-blue-500 text-sm" /> Cara Instalasi (Sideload APK)
            </h3>
            <p className="text-xs text-slate-600 max-w-xl mx-auto leading-relaxed font-normal text-center">
              Karena aplikasi didistribusikan via server mandiri, Android akan memverifikasi izin instalasi. 
              Silakan buka file APK yang diunduh, lalu izinkan opsi <strong className="font-semibold text-slate-900">&quot;Install from Unknown Sources&quot;</strong> 
              di HP Anda.
            </p>
          </div>

        </div>
      </main>

      {/* Footer */}
      <Footer isLight={true} />
    </div>
  );
}
