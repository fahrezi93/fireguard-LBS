'use client';

import { FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaArrowRight } from 'react-icons/fa';
import { motion } from 'framer-motion';

const Contact = () => {
  return (
    <section id="contact" className="py-16 lg:py-24 bg-[#FAFAFA] relative overflow-hidden">
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-red-50 to-transparent pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-orange-100 rounded-full blur-[100px] pointer-events-none opacity-60" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Text Content */}
          <div className="lg:col-span-5 lg:pr-8 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3 }}
            >
              <div className="inline-flex items-center justify-center lg:justify-start gap-3 mb-6">
                <span className="w-8 h-px bg-red-500"></span>
                <span className="text-xs font-bold text-red-500 uppercase tracking-[0.2em]">Pusat Bantuan</span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight leading-[1.1] mb-4">
                Keadaan <br className="hidden lg:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500">
                  Darurat?
                </span>
              </h2>
              <p className="text-gray-500 text-base leading-relaxed font-light mb-6 max-w-lg mx-auto lg:mx-0">
                Layanan tanggap darurat kami aktif 24 jam nonstop untuk seluruh warga Plaju, Palembang. Jangan ragu, waktu adalah nyawa.
              </p>
            </motion.div>
          </div>

          {/* Right Cards Content */}
          <div className="lg:col-span-7">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">

              {/* Main Emergency CTA - Spans Full Width */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3 }}
                className="md:col-span-2 group relative bg-red-600 rounded-3xl p-6 lg:p-10 overflow-hidden hover:shadow-[0_20px_40px_rgba(220,38,38,0.2)] transition-shadow duration-500"
              >
                {/* Cinematic Red Glow Inside */}
                <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.2)_0%,transparent_70%)] pointer-events-none" />
                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-orange-500 rounded-full blur-[80px] pointer-events-none opacity-50 group-hover:scale-110 transition-transform duration-700" />

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-black/20 rounded-full text-white backdrop-blur-sm mb-4">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-[10px] font-semibold tracking-wider uppercase">Hotline Siaga</span>
                    </div>
                    <div className="flex items-center justify-center md:justify-start gap-4">
                      <FaPhoneAlt className="text-3xl md:text-4xl text-white/50" />
                      <h3 className="text-5xl md:text-6xl font-black text-white tracking-tighter drop-shadow-sm">113</h3>
                    </div>
                  </div>

                  <a
                    href="tel:113"
                    className="flex-shrink-0 w-full md:w-auto bg-white text-red-600 px-6 py-4 rounded-2xl font-bold text-base hover:bg-gray-50 hover:-translate-y-1 transition-all shadow-xl flex items-center justify-center md:justify-between gap-3 group/btn"
                  >
                    Panggil Sekarang
                    <FaArrowRight className="group-hover/btn:translate-x-1 transition-transform" />
                  </a>
                </div>
              </motion.div>

              {/* Email Card */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3 }}
                className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group"
              >
                <div className="w-12 h-12 bg-gray-50 text-gray-900 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-red-50 group-hover:text-red-600 transition-colors duration-300">
                  <FaEnvelope className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Email Resmi</h4>
                <p className="text-gray-900 font-semibold text-base break-all">damkar<br />@palembang.go.id</p>
              </motion.div>

              {/* Location Card */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3 }}
                className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group"
              >
                <div className="w-12 h-12 bg-gray-50 text-gray-900 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-red-50 group-hover:text-red-600 transition-colors duration-300">
                  <FaMapMarkerAlt className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Markas Pusat</h4>
                <p className="text-gray-900 font-semibold text-sm leading-relaxed">Jl. Merdeka No.1, Plaju,<br />Palembang, Sumsel</p>
              </motion.div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;