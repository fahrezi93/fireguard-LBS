'use client';

import Link from 'next/link';
import { FaBell, FaFacebookF, FaInstagram, FaEnvelope, FaArrowRight } from 'react-icons/fa';

const Footer = ({ isLight = true }: { isLight?: boolean }) => (
  <footer className={`${isLight ? 'bg-slate-50 text-slate-600 border-slate-200/80' : 'bg-[#050505] text-slate-400 border-white/5'} pt-12 pb-8 relative overflow-hidden border-t`}>
    <div className="max-w-6xl mx-auto px-6 relative z-10">

      {/* Top CTA Banner */}
      <div className={`${isLight ? 'bg-white border-slate-200/80 shadow-2xs' : 'bg-[#0A0A0A] border-white/5'} border rounded-2xl p-6 lg:p-8 flex flex-col md:flex-row items-center justify-between gap-6 mb-10`}>
        <div>
          <h3 className={`text-xl md:text-2xl font-bold mb-1 tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>Siap melindungi wilayah Anda?</h3>
          <p className={`${isLight ? 'text-slate-500' : 'text-slate-400'} text-xs sm:text-sm font-normal`}>Bergabunglah dengan ekosistem pelaporan kebakaran paling terpadu di Kecamatan Plaju.</p>
        </div>
        <Link href="/#how-it-works" className={`shrink-0 ${isLight ? 'bg-slate-900 text-white hover:bg-black' : 'bg-white text-black hover:bg-slate-100'} px-5 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 group shadow-2xs`}>
          Pelajari Sistem Kami <FaArrowRight className="text-xs group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-10">

        {/* Brand Section */}
        <div className="md:col-span-5 lg:col-span-4">
          <Link href="/" className="inline-flex items-center gap-2 mb-3.5 group">
            <FaBell className="text-xl text-red-500 transition-transform group-hover:scale-110" />
            <span className={`text-xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>SiagaBencana</span>
          </Link>
          <p className={`text-xs leading-relaxed mb-5 font-normal max-w-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Platform modern untuk peringatan dini, pelaporan, dan navigasi armada Pemadam Kebakaran yang berpusat di Kecamatan Plaju.
          </p>
          <div className="flex gap-2.5">
            <a href="https://facebook.com/damkarpalembang" className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isLight ? 'bg-white border border-slate-200/60 text-slate-500 hover:bg-red-600 hover:text-white hover:border-red-600' : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-red-600 hover:text-white'}`}>
              <FaFacebookF className="text-xs" />
            </a>
            <a href="https://instagram.com/pemadam_palembang" className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isLight ? 'bg-white border border-slate-200/60 text-slate-500 hover:bg-red-500 hover:text-white hover:border-orange-500' : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-orange-500 hover:text-white'}`}>
              <FaInstagram className="text-xs" />
            </a>
            <a href="mailto:lapor@siagabencana.cloud" className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isLight ? 'bg-white border border-slate-200/60 text-slate-500 hover:bg-red-500 hover:text-white hover:border-orange-500' : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-orange-500 hover:text-white'}`}>
              <FaEnvelope className="text-xs" />
            </a>
          </div>
        </div>

        {/* Links Navigation */}
        <div className="md:col-span-3 lg:col-span-2 lg:col-start-7">
          <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${isLight ? 'text-slate-900' : 'text-white'}`}>Navigasi</h4>
          <ul className="space-y-2.5">
            <li><Link href="/#how-it-works" className={`text-xs transition-colors ${isLight ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white'}`}>Cara Kerja</Link></li>
            <li><Link href="/#features" className={`text-xs transition-colors ${isLight ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white'}`}>Fitur Unggulan</Link></li>
            <li><Link href="/#stations" className={`text-xs transition-colors ${isLight ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white'}`}>Peta Pos Damkar</Link></li>
            <li><Link href="/#faq" className={`text-xs transition-colors ${isLight ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white'}`}>Tanya Jawab</Link></li>
          </ul>
        </div>

        {/* Support & Legal */}
        <div className="md:col-span-4 lg:col-span-3">
          <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${isLight ? 'text-slate-900' : 'text-white'}`}>Bantuan & Legal</h4>
          <ul className="space-y-2.5">
            <li><Link href="/#contact" className={`text-xs transition-colors ${isLight ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white'}`}>Kontak Darurat</Link></li>
            <li><Link href="/operator/login" className={`text-xs transition-colors ${isLight ? 'text-slate-500 hover:text-red-600' : 'text-slate-400 hover:text-red-400'}`}>Portal Operator Terpadu</Link></li>
            <li><Link href="/terms" className={`text-xs transition-colors ${isLight ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white'}`}>Syarat & Ketentuan</Link></li>
            <li><Link href="/privacy" className={`text-xs transition-colors ${isLight ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white'}`}>Kebijakan Privasi</Link></li>
          </ul>
        </div>

      </div>

      <div className={`pt-6 border-t flex flex-col md:flex-row items-center justify-between gap-3 ${isLight ? 'border-slate-200/60' : 'border-white/10'}`}>
        <p className={`text-[11px] font-normal ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
          &copy; {new Date().getFullYear()} SiagaBencana. All Rights Reserved.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
