'use client';

import { FaMapMarkerAlt, FaRoute, FaClock, FaMobileAlt } from 'react-icons/fa';
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';
import { MouseEvent } from 'react';

const features = [
  {
    icon: <FaMapMarkerAlt className="w-6 h-6 text-red-500" />,
    title: "Lokasi Real-time",
    description: "Deteksi lokasi otomatis menggunakan GPS presisi tinggi untuk pelaporan yang akurat, langsung dari titik kejadian tanpa perlu mengetik alamat manual.",
    glowColor: "rgba(239, 68, 68, 0.08)",
    iconBg: "bg-red-50",
    iconBorder: "border-red-100",
    colSpan: "md:col-span-2 lg:col-span-2"
  },
  {
    icon: <FaRoute className="w-6 h-6 text-orange-500" />,
    title: "Rute Cerdas",
    description: "Algoritma routing dinamis yang menghindari kemacetan, menuntun armada langsung ke lokasi Anda melalui akses tercepat.",
    glowColor: "rgba(249, 115, 22, 0.08)",
    iconBg: "bg-orange-50",
    iconBorder: "border-orange-100",
    colSpan: "md:col-span-1 lg:col-span-2"
  },
  {
    icon: <FaClock className="w-6 h-6 text-blue-500" />,
    title: "Estimasi Presisi",
    description: "Kalkulasi Waktu Tiba (ETA) real-time berdasar lalu lintas, memberikan ketenangan sementara Anda menunggu bantuan datang.",
    glowColor: "rgba(59, 130, 246, 0.08)",
    iconBg: "bg-blue-50",
    iconBorder: "border-blue-100",
    colSpan: "md:col-span-1 lg:col-span-2"
  },
  {
    icon: <FaMobileAlt className="w-6 h-6 text-emerald-500" />,
    title: "Aplikasi Mobile",
    description: "Nikmati pengalaman penuh dengan aplikasi native di Play Store & App Store. Lebih stabil, lebih cepat, dan dilengkapi push notification untuk info darurat.",
    glowColor: "rgba(16, 185, 129, 0.08)",
    iconBg: "bg-emerald-50",
    iconBorder: "border-emerald-100",
    colSpan: "md:col-span-2 lg:col-span-2"
  }
];

const FeatureCard = ({ feature, idx }: { feature: typeof features[0], idx: number }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
      onMouseMove={handleMouseMove}
      className={`${feature.colSpan} group relative rounded-[2.5rem] bg-white/80 border border-neutral-200/60 p-6 lg:p-8 overflow-hidden shadow-[0_8px_40px_rgb(0,0,0,0.04)] transition-all duration-500`}
    >
      {/* Spotlight Effect Overlay */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition duration-300 z-10"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              ${feature.glowColor},
              transparent 80%
            )
          `,
        }}
      />

      <div className="relative z-20 flex flex-col h-full">
        <div className={`w-14 h-14 rounded-2xl ${feature.iconBg} border ${feature.iconBorder} flex items-center justify-center mb-6 transition-all duration-700 group-hover:scale-110 group-hover:rotate-3 shadow-sm`}>
          {feature.icon}
        </div>

        <h3 className="text-2xl font-bold text-neutral-900 mb-3 tracking-tight transition-all duration-500">
          {feature.title}
        </h3>

        <p className="text-sm md:text-base text-neutral-500 leading-relaxed font-normal mt-auto opacity-80 group-hover:opacity-100 transition-opacity duration-500">
          {feature.description}
        </p>
      </div>

      {/* Premium Border Aura */}
      <div className="absolute inset-0 border border-neutral-200 rounded-[2.5rem] group-hover:border-neutral-300 transition-colors duration-500 pointer-events-none" />
    </motion.div>
  );
};

const Features = () => {
  return (
    <section id="features" className="py-16 lg:py-24 bg-[#fafafa] relative overflow-hidden">
      {/* Subtle Ambient Shapes */}
      <div className="absolute top-0 left-1/4 w-[50rem] h-[50rem] bg-red-100/40 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[40rem] h-[40rem] bg-orange-50/50 rounded-full blur-[80px] pointer-events-none" />

      {/* Minimalist Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="mb-12 md:mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-red-50 border border-red-100 mb-6 shadow-sm"
            >
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.3)]" />
              <span className="text-xs font-bold text-red-600 tracking-widest uppercase">Fitur Unggulan</span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="text-3xl md:text-5xl font-extrabold text-neutral-900 leading-[1.15] tracking-tight"
            >
              Teknologi Canggih <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
                Keamanan Maksimal.
              </span>
            </motion.h2>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-sm md:text-base text-neutral-500 max-w-md leading-relaxed font-light"
          >
            Sistem terintegrasi kami dirancang untuk memotong birokrasi, memberikan respons ultra-cepat langsung dari sentuhan jari Anda.
          </motion.p>
        </div>

        {/* Bento Grid Layout with refined spacing */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, idx) => (
            <FeatureCard key={idx} feature={feature} idx={idx} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;