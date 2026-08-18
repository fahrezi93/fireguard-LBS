'use client';

import { FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaArrowRight } from 'react-icons/fa';
import { motion } from 'framer-motion';

const Contact = () => {
  return (
    <section id="contact" className="py-12 md:py-16 bg-white relative overflow-hidden border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-6 relative z-10">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Text Content */}
          <div className="lg:col-span-5 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-snug mb-3">
                Keadaan <span className="text-red-600">Darurat?</span>
              </h2>
              <p className="text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed font-normal max-w-sm mx-auto lg:mx-0">
                Layanan tanggap darurat kami aktif 24 jam nonstop untuk seluruh warga Kecamatan Plaju.
              </p>
            </motion.div>
          </div>

          {/* Right Cards Content */}
          <div className="lg:col-span-7">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Main Emergency CTA - Spans Full Width */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="sm:col-span-2"
              >
                <div className="group relative bg-red-600 rounded-2xl p-6 md:p-7 overflow-hidden shadow-xs hover:shadow-md transition-all duration-300">
                  <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-left">
                    <div>
                      <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-black/20 rounded-full text-white backdrop-blur-xs mb-2">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-[10px] font-bold tracking-wider uppercase">Hotline Siaga</span>
                      </div>
                      <div className="flex items-center justify-center sm:justify-start gap-3">
                        <FaPhoneAlt className="text-2xl md:text-3xl text-white/70" />
                        <h3 className="text-4xl md:text-5xl font-black text-white tracking-tight">113</h3>
                      </div>
                    </div>

                    <a
                      href="tel:113"
                      className="w-full sm:w-auto bg-white text-red-600 px-5 py-3 rounded-xl font-bold text-xs sm:text-sm hover:bg-slate-50 transition-all shadow-2xs flex items-center justify-center gap-2 group/btn"
                    >
                      Panggil Sekarang
                      <FaArrowRight className="text-xs group-hover/btn:translate-x-1 transition-transform" />
                    </a>
                  </div>
                </div>
              </motion.div>

              {/* Email Card */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.06, ease: "easeOut" }}
                className="h-full"
              >
                <div className="h-full bg-slate-50/70 p-5 rounded-2xl border border-slate-100 shadow-2xs hover:bg-white hover:border-slate-200 transition-all duration-300 group">
                  <div className="w-10 h-10 bg-white border border-slate-200/60 text-slate-700 rounded-xl flex items-center justify-center mb-3 group-hover:text-red-600 transition-colors">
                    <FaEnvelope className="w-4 h-4" />
                  </div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email Resmi</h4>
                  <p className="text-slate-900 font-bold text-xs sm:text-sm break-all">damkar@plaju.go.id</p>
                </div>
              </motion.div>

              {/* Location Card */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.12, ease: "easeOut" }}
                className="h-full"
              >
                <div className="h-full bg-slate-50/70 p-5 rounded-2xl border border-slate-100 shadow-2xs hover:bg-white hover:border-slate-200 transition-all duration-300 group">
                  <div className="w-10 h-10 bg-white border border-slate-200/60 text-slate-700 rounded-xl flex items-center justify-center mb-3 group-hover:text-red-600 transition-colors">
                    <FaMapMarkerAlt className="w-4 h-4" />
                  </div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Markas Pusat</h4>
                  <p className="text-slate-900 font-bold text-xs sm:text-sm leading-normal">Kantor Kecamatan Plaju</p>
                </div>
              </motion.div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;