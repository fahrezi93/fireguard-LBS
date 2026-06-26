'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaFire, FaArrowLeft, FaShieldAlt, FaExclamationTriangle, FaGavel, FaUserLock } from 'react-icons/fa';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';

export default function TermsPage() {
  const sections = [
    {
      icon: <FaUserLock className="text-red-500" />,
      title: "1. Penggunaan Layanan",
      content: "Layanan SiagaBencana disediakan khusus untuk pelaporan dan pemantauan insiden kebakaran di wilayah Plaju Darat, Palembang. Pengguna wajib memberikan informasi yang akurat dan jujur saat melakukan registrasi maupun pelaporan."
    },
    {
      icon: <FaExclamationTriangle className="text-orange-500" />,
      title: "2. Larangan Laporan Palsu",
      content: "Penyalahgunaan tombol darurat untuk laporan palsu (prank) adalah tindakan ilegal. Kami berhak melaporkan data pelaku ke pihak kepolisian dan memblokir akses perangkat secara permanen dari ekosistem SiagaBencana."
    },
    {
      icon: <FaShieldAlt className="text-blue-500" />,
      title: "3. Tanggung Jawab Pengguna",
      content: "Keamanan akun dan perangkat adalah tanggung jawab pengguna. SiagaBencana tidak bertanggung jawab atas kerugian yang timbul akibat kelalaian pengguna dalam menjaga kerahasiaan informasi akun atau akses perangkat."
    },
    {
      icon: <FaGavel className="text-emerald-500" />,
      title: "4. Perubahan Ketentuan",
      content: "Kami berhak memperbarui syarat dan ketentuan ini sewaktu-waktu tanpa pemberitahuan sebelumnya. Penggunaan layanan secara berkelanjutan setelah perubahan dianggap sebagai persetujuan terhadap ketentuan baru."
    }
  ];

  return (
    <div className="bg-slate-50 min-h-screen font-sans selection:bg-red-500/10">
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
              Syarat & <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">Ketentuan.</span>
            </h1>
            <p className="text-gray-500 text-lg leading-relaxed max-w-2xl font-light">
              Terakhir diperbarui: 19 April 2026. Harap baca dengan teliti sebelum menggunakan layanan SiagaBencana.
            </p>
          </motion.div>

          {/* Content Area */}
          <div className="space-y-12">
            {sections.map((section, idx) => (
              <motion.section 
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="relative p-8 rounded-3xl bg-white border border-black/5 group hover:border-red-500/20 transition-all shadow-md shadow-black/[0.01]"
              >
                <div className="flex items-start gap-6">
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-black/5 flex items-center justify-center shrink-0 text-xl group-hover:scale-110 transition-transform duration-500">
                    {section.icon}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 tracking-tight">{section.title}</h2>
                    <p className="text-gray-600 leading-relaxed font-light">
                      {section.content}
                    </p>
                  </div>
                </div>
              </motion.section>
            ))}
          </div>

          {/* Contact CTA */}
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-20 p-10 rounded-[2.5rem] bg-red-50 border border-red-100 text-center"
          >
            <h3 className="text-gray-900 font-bold text-2xl mb-4">Punya pertanyaan?</h3>
            <p className="text-gray-500 mb-8 font-light max-w-md mx-auto">
              Jika Anda memerlukan klarifikasi lebih lanjut mengenai ketentuan ini, tim kami siap membantu Anda.
            </p>
            <Link href="/#contact" className="inline-flex h-12 items-center justify-center px-8 rounded-full bg-black text-white font-bold hover:bg-gray-800 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-black/10">
              Hubungi Kami
            </Link>
          </motion.div>
        </div>
      </main>

      <Footer isLight={true} />

      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-1/4 right-0 w-[40rem] h-[40rem] bg-red-500/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] bg-orange-500/5 rounded-full blur-[120px]" />
      </div>
    </div>
  );
}
