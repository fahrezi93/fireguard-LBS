'use client';

import { FaMapMarkerAlt, FaRoute, FaClock, FaMobileAlt } from 'react-icons/fa';
import { motion } from 'framer-motion';

const features = [
  {
    icon: <FaMapMarkerAlt className="w-5 h-5 text-red-600" />,
    title: "Lokasi Real-time",
    description: "Deteksi lokasi otomatis GPS presisi tinggi untuk pelaporan akurat dari titik kejadian tanpa perlu mengetik alamat."
  },
  {
    icon: <FaRoute className="w-5 h-5 text-red-600" />,
    title: "Rute Cerdas",
    description: "Algoritma routing dinamis yang menuntun armada pemadam langsung ke lokasi Anda melalui rute tercepat."
  },
  {
    icon: <FaClock className="w-5 h-5 text-red-600" />,
    title: "Estimasi Presisi",
    description: "Kalkulasi Waktu Tiba (ETA) real-time berdasar lalu lintas untuk kepastian selama menunggu bantuan."
  },
  {
    icon: <FaMobileAlt className="w-5 h-5 text-red-600" />,
    title: "Aplikasi Mobile",
    description: "Aplikasi Android & iOS yang stabil, cepat, dan dilengkapi push notification untuk informasi darurat."
  }
];

const Features = () => {
  return (
    <section id="features" className="py-12 lg:py-16 bg-white border-b border-slate-100 relative">
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="mb-10 md:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-xl">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-100/50 mb-3 shadow-2xs"
            >
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[11px] font-bold text-red-600 tracking-wider uppercase">Fitur Unggulan</span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-snug"
            >
              Teknologi Canggih <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500">
                Keamanan Maksimal.
              </span>
            </motion.h2>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="text-xs sm:text-sm md:text-base text-slate-600 max-w-md leading-relaxed font-normal"
          >
            Sistem terintegrasi kami dirancang untuk memotong birokrasi, memberikan respons ultra-cepat langsung dari sentuhan jari Anda.
          </motion.p>
        </div>

        {/* Clean 4-card grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.06, ease: "easeOut" }}
              className="h-full"
            >
              <div className="group h-full bg-slate-50/70 p-6 rounded-2xl border border-slate-100 hover:border-slate-200 hover:bg-white hover:shadow-md transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="w-11 h-11 rounded-xl bg-white border border-slate-200/60 text-red-600 flex items-center justify-center mb-4 shadow-2xs group-hover:scale-105 transition-transform duration-300">
                    {feature.icon}
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2 tracking-tight">
                    {feature.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-normal">
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
