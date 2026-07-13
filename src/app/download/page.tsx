import { Metadata } from 'next';
import Link from 'next/link';
import { FaAndroid, FaShieldAlt, FaUser } from 'react-icons/fa';

export const metadata: Metadata = {
  title: 'Download Aplikasi Android - SiagaBencana',
  description: 'Download aplikasi resmi SiagaBencana untuk Masyarakat Umum dan Petugas Damkar.',
};

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
            Download Aplikasi SiagaBencana
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Dapatkan akses penuh ke fitur pelaporan, pemantauan, dan penanganan bencana langsung dari genggaman Anda.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Card User */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <FaUser className="w-32 h-32 text-red-500" />
            </div>
            <div className="relative z-10">
              <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mb-6">
                <FaUser className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Aplikasi Masyarakat</h2>
              <p className="text-gray-500 mb-8 min-h-[80px]">
                Versi untuk warga umum. Lapor kejadian kebakaran, pantau status laporan secara real-time, dan baca edukasi tanggap darurat.
              </p>
              <a 
                href="/downloads/siagabencana-user.apk"
                download="siagabencana-user.apk"
                className="w-full flex items-center justify-center gap-3 bg-red-600 hover:bg-red-700 text-white py-4 px-6 rounded-2xl font-semibold transition-colors shadow-sm hover:shadow-md"
              >
                <FaAndroid className="text-xl" />
                Download APK User
              </a>
              <div className="mt-4 text-center">
                <span className="text-xs text-gray-400 font-medium bg-gray-50 px-3 py-1 rounded-full">
                  Android 8.0+ (Oreo)
                </span>
              </div>
            </div>
          </div>

          {/* Card Petugas */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <FaShieldAlt className="w-32 h-32 text-blue-500" />
            </div>
            <div className="relative z-10">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                <FaShieldAlt className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Aplikasi Petugas</h2>
              <p className="text-gray-500 mb-8 min-h-[80px]">
                Versi khusus armada Pemadam Kebakaran. Terima tugas lapangan, navigasi rute tercepat (OSRM), dan perbarui status pemadaman.
              </p>
              <a 
                href="/downloads/siagabencana-petugas.apk"
                download="siagabencana-petugas.apk"
                className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-2xl font-semibold transition-colors shadow-sm hover:shadow-md"
              >
                <FaAndroid className="text-xl" />
                Download APK Petugas
              </a>
              <div className="mt-4 text-center">
                <span className="text-xs text-gray-400 font-medium bg-gray-50 px-3 py-1 rounded-full">
                  Android 8.0+ (Oreo)
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 bg-blue-50 rounded-3xl p-8 text-center border border-blue-100">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Cara Install (Sideload)</h3>
          <p className="text-blue-700 text-sm max-w-2xl mx-auto leading-relaxed">
            Karena aplikasi belum di-publish ke Google Play Store, Android akan memblokir instalasi secara default. 
            Silakan buka file APK yang telah didownload, lalu izinkan opsi <strong className="font-bold">&quot;Install from Unknown Sources&quot;</strong> 
            (Instal dari Sumber Tidak Dikenal) di pengaturan HP Anda.
          </p>
        </div>

      </div>
    </div>
  );
}
