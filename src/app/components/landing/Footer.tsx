'use client';

import Link from 'next/link';
import { FaBell, FaFacebookF, FaTwitter, FaInstagram, FaGithub, FaArrowRight } from 'react-icons/fa';
import { motion } from 'framer-motion';

const Footer = ({ isLight = false }: { isLight?: boolean }) => (
  <footer className={`${isLight ? 'bg-white text-gray-600 border-gray-100' : 'bg-[#050505] text-gray-400 border-white/5'} pt-20 pb-12 relative overflow-hidden border-t`}>
    {/* Abstract Background Elements */}
    <div className={`absolute top-0 right-0 w-[40rem] h-[40rem] ${isLight ? 'bg-red-500/5' : 'bg-red-600/10'} rounded-full blur-[120px] pointer-events-none mix-blend-multiply`} />
    <div className={`absolute bottom-0 left-0 w-[20rem] h-[20rem] ${isLight ? 'bg-orange-500/5' : 'bg-orange-500/10'} rounded-full blur-[100px] pointer-events-none mix-blend-multiply`} />

    <div className="max-w-7xl mx-auto px-6 relative z-10">

      {/* Top CTA Banner */}
      <div className={`${isLight ? 'bg-gray-50 border-black/5 shadow-sm' : 'bg-[#0A0A0A] border-white/5 shadow-[0_0_40px_rgba(0,0,0,0.5)]'} border rounded-3xl p-8 lg:p-12 flex flex-col md:flex-row items-center justify-between gap-8 mb-16`}>
        <div>
          <h3 className={`text-2xl md:text-3xl font-bold mb-2 tracking-tight ${isLight ? 'text-gray-900' : 'text-white'}`}>Siap melindungi wilayah Anda?</h3>
          <p className={`${isLight ? 'text-gray-500' : 'text-gray-500'} font-light`}>Bergabunglah dengan ekosistem pelaporan kebakaran paling terpadu di Palembang.</p>
        </div>
        <Link href="#how-it-works" className={`shrink-0 ${isLight ? 'bg-black text-white hover:bg-gray-800' : 'bg-white text-black hover:bg-gray-100'} px-6 py-3.5 rounded-full font-bold transition-colors flex items-center gap-2 group shadow-sm`}>
          Pelajari Sistem Kami <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8 mb-16">

        {/* Brand Section */}
        <div className="md:col-span-5 lg:col-span-4">
          <Link href="/" className="inline-flex items-center gap-3 mb-6 group">
            <div className="p-2.5 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl shadow-[0_0_20px_rgba(159,28,25,0.3)] group-hover:shadow-[0_0_25px_rgba(159,28,25,0.5)] transition-shadow">
              <FaBell className="text-xl text-white" />
            </div>
            <span className={`text-2xl font-bold tracking-tight ${isLight ? 'text-gray-900' : 'text-white'}`}>SiagaBencana</span>
          </Link>
          <p className={`text-sm leading-relaxed xl:pr-10 mb-8 font-light ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>
            Platform modern untuk peringatan dini, pelaporan, dan navigasi armada Pemadam Kebakaran yang berpusat di Plaju, Palembang. Misi kami: meminimalkan risiko kerugian jiwa dan materi.
          </p>
          <div className="flex gap-4">
            <a href="https://facebook.com/damkarpalembang" className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isLight ? 'bg-black/5 border-black/5 text-gray-600 hover:bg-red-500 hover:text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-red-500 hover:text-white'}`}>
              <FaFacebookF className="text-sm" />
            </a>
            <a href="https://twitter.com/damkarpalembang" className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isLight ? 'bg-black/5 border-black/5 text-gray-600 hover:bg-red-500 hover:text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-red-500 hover:text-white'}`}>
              <FaTwitter className="text-sm" />
            </a>
            <a href="https://instagram.com/pemadam_palembang" className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isLight ? 'bg-black/5 border-black/5 text-gray-600 hover:bg-orange-500 hover:text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-orange-500 hover:text-white'}`}>
              <FaInstagram className="text-sm" />
            </a>
            <a href="https://github.com" className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isLight ? 'bg-black/5 border-black/5 text-gray-600 hover:bg-black hover:text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-gray-100 hover:text-gray-900'}`}>
              <FaGithub className="text-sm" />
            </a>
          </div>
        </div>

        {/* Links Navigation */}
        <div className="md:col-span-3 lg:col-span-2 lg:col-start-7">
          <h4 className={`font-semibold mb-6 tracking-wide ${isLight ? 'text-gray-900' : 'text-white'}`}>Navigasi</h4>
          <ul className="space-y-4">
            <li><Link href="#how-it-works" className={`text-sm transition-colors ${isLight ? 'text-gray-500 hover:text-black' : 'text-gray-500 hover:text-white'}`}>Cara Kerja</Link></li>
            <li><Link href="#features" className={`text-sm transition-colors ${isLight ? 'text-gray-500 hover:text-black' : 'text-gray-500 hover:text-white'}`}>Fitur Unggulan</Link></li>
            <li><Link href="#stations" className={`text-sm transition-colors ${isLight ? 'text-gray-500 hover:text-black' : 'text-gray-500 hover:text-white'}`}>Peta Pos Damkar</Link></li>
            <li><Link href="#faq" className={`text-sm transition-colors ${isLight ? 'text-gray-500 hover:text-black' : 'text-gray-500 hover:text-white'}`}>Tanya Jawab</Link></li>
          </ul>
        </div>

        {/* Support & Legal */}
        <div className="md:col-span-4 lg:col-span-3">
          <h4 className={`font-semibold mb-6 tracking-wide ${isLight ? 'text-gray-900' : 'text-white'}`}>Bantuan & Legal</h4>
          <ul className="space-y-4">
            <li><Link href="#contact" className={`text-sm transition-colors ${isLight ? 'text-gray-500 hover:text-black' : 'text-gray-500 hover:text-white'}`}>Kontak Darurat</Link></li>
            <li><Link href="/operator/login" className={`text-sm transition-colors flex items-center gap-2 ${isLight ? 'text-gray-500 hover:text-red-500' : 'text-gray-500 hover:text-red-400'}`}>Portal Operator Terpadu</Link></li>
            <li><Link href="/terms" className={`text-sm transition-colors ${isLight ? 'text-gray-500 hover:text-black' : 'text-gray-500 hover:text-white'}`}>Syarat & Ketentuan</Link></li>
            <li><Link href="/privacy" className={`text-sm transition-colors ${isLight ? 'text-gray-500 hover:text-black' : 'text-gray-500 hover:text-white'}`}>Kebijakan Privasi</Link></li>
          </ul>
        </div>

      </div>

      <div className={`pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4 ${isLight ? 'border-black/5' : 'border-white/10'}`}>
        <p className={`text-xs font-light ${isLight ? 'text-gray-400' : 'text-gray-600'}`}>
          &copy; {new Date().getFullYear()} SiagaBencana. All Rights Reserved.
        </p>
        <div className="flex items-center gap-2 text-xs text-gray-600 font-light">
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
