'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaFire, FaArrowLeft, FaMapMarkerAlt, FaShieldAlt, FaDatabase, FaUserSecret } from 'react-icons/fa';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';

export default function PrivacyPage() {
  const policies = [
    {
      icon: <FaMapMarkerAlt className="text-red-500" />,
      title: "Informasi Lokasi",
      content: "Kami mengumpulkan koordinat GPS presisi saat Anda menggunakan fitur pelaporan darurat. Data ini digunakan semata-mata untuk memandu armada pemadam kebakaran ke lokasi Anda secepat mungkin."
    },
    {
      icon: <FaDatabase className="text-orange-500" />,
      title: "Data Identitas",
      content: "Informasi seperti nama dan nomor telepon disimpan untuk validasi laporan. Kami tidak menjual data Anda kepada pihak ketiga manapun untuk tujuan komersial atau periklanan."
    },
    {
      icon: <FaShieldAlt className="text-blue-500" />,
      title: "Keamanan Data",
      content: "Seluruh data yang dikirimkan melalui aplikasi SiagaBencana dilindungi dengan enkripsi SSL/TLS. Server kami menggunakan protap keamanan tingkat tinggi untuk mencegah akses yang tidak sah."
    },
    {
      icon: <FaUserSecret className="text-emerald-500" />,
      title: "Keterbukaan Data",
      content: "Data insiden (lokasi dan foto) akan dibagikan secara real-time kepada operator di Pos Pemadam terdekat untuk proses evakuasi. Anda memiliki hak untuk meminta penghapusan akun kapan saja."
    }
  ];

  return (
    <div className="bg-slate-50 min-h-screen font-sans selection:bg-orange-500/10">
      <Navbar isLight={true} />
      
      <main className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-16"
          >
            <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors mb-8 group">
              <FaArrowLeft className="text-sm group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Kembali ke Beranda</span>
            </Link>
            
            <h1 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tighter mb-6">
              Kebijakan <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-500">Privasi.</span>
            </h1>
            <p className="text-gray-500 text-lg leading-relaxed max-w-2xl font-light">
              Privasi Anda adalah prioritas kami. Di SiagaBencana, kami berkomitmen untuk melindungi data pribadi Anda sementara memberikan layanan tanggap darurat terbaik.
            </p>
          </motion.div>

          {/* Content Area */}
          <div className="grid grid-cols-1 gap-8">
            {policies.map((policy, idx) => (
              <motion.section 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="relative p-8 rounded-3xl bg-white border border-black/5 overflow-hidden group hover:border-orange-500/20 transition-all duration-500 shadow-xl shadow-black/[0.02]"
              >
                {/* Subtle spotlight effect inside card */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/[0.01] to-transparent pointer-events-none" />
                
                <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
                  <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-black/5 flex items-center justify-center shrink-0 text-2xl group-hover:scale-110 transition-transform duration-500">
                    {policy.icon}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 tracking-tight">{policy.title}</h2>
                    <p className="text-gray-600 text-lg leading-relaxed font-light">
                      {policy.content}
                    </p>
                  </div>
                </div>
              </motion.section>
            ))}
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-24 border-t border-black/5 pt-12"
          >
            <h3 className="text-gray-900 font-bold text-xl mb-6 tracking-tight">Informasi Tambahan</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-gray-500 font-light text-sm leading-relaxed">
              <p>
                Informasi yang dikumpulkan juga dapat digunakan untuk analisis statistik insiden kebakaran di wilayah Palembang guna membantu perencanaan pencegahan bencana di masa depan.
              </p>
              <p>
                Kami menggunakan Cookies fungsional untuk menjaga sesi login Anda tetap aman. Kami tidak menggunakan Cookies untuk tracking iklan atau keperluan komersial lainnya.
              </p>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer isLight={true} />

      {/* Decorative Lights */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-[50rem] h-[50rem] bg-orange-500/5 rounded-full blur-[180px]" />
        <div className="absolute -bottom-20 -left-20 w-[40rem] h-[40rem] bg-red-500/5 rounded-full blur-[150px]" />
      </div>
    </div>
  );
}
