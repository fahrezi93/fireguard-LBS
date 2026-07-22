'use client';

import { FaMobileAlt, FaMapMarkedAlt, FaTruck } from 'react-icons/fa';
import { motion } from 'framer-motion';

const steps = [
    {
        icon: <FaMobileAlt className="w-7 h-7 text-red-600" />,
        title: "Buka & Lapor",
        description: "Buka aplikasi SiagaBencana dan tekan tombol darurat merah. Laporan langsung terkirim tanpa proses rumit.",
        bgColor: "bg-red-50",
        ringColor: "ring-red-100",
        num: "1",
        accent: "from-red-500 to-red-600"
    },
    {
        icon: <FaMapMarkedAlt className="w-7 h-7 text-orange-600" />,
        title: "Deteksi Lokasi",
        description: "Sistem otomatis melacak koordinat presisi Anda menggunakan GPS dan mengirimkan ke pos terdekat.",
        bgColor: "bg-orange-50",
        ringColor: "ring-orange-100",
        num: "2",
        accent: "from-orange-500 to-orange-600"
    },
    {
        icon: <FaTruck className="w-7 h-7 text-emerald-600" />,
        title: "Bantuan Tiba",
        description: "Armada pemadam kebakaran segera meluncur dengan rute optimal real-time ke lokasi Anda.",
        bgColor: "bg-emerald-50",
        ringColor: "ring-emerald-100",
        num: "3",
        accent: "from-emerald-500 to-emerald-600"
    }
];

const HowItWorks = () => {
    return (
        <section id="how-it-works" className="py-12 lg:py-16 bg-slate-50/70 border-y border-slate-100 relative overflow-hidden">
            <div className="max-w-6xl mx-auto px-6 relative z-10">
                <div className="text-center mb-10 md:mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        className="flex flex-col items-center"
                    >
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200/80 shadow-xs mb-3">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-[11px] font-bold text-slate-700 tracking-wider uppercase">Alur Pelaporan</span>
                        </div>

                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 mb-3 tracking-tight max-w-2xl">
                            Lapor Cepat dalam <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500">3 Langkah Mudah</span>
                        </h2>

                        <p className="text-xs sm:text-sm md:text-base text-slate-600 max-w-xl mx-auto leading-relaxed font-normal">
                            Di saat krisis, setiap detik sangat berharga. Kami menyederhanakan proses pelaporan agar Anda mendapatkan bantuan maksimal tanpa hambatan.
                        </p>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                    {/* Connecting Line (Desktop) */}
                    <div className="hidden md:block absolute top-[3.25rem] left-[15%] right-[15%] border-t border-dashed border-slate-200 z-0" />

                    {steps.map((step, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.5, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
                            className="relative group h-full"
                        >
                            {/* Card Body */}
                            <div className="h-full relative z-10 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs transition-all duration-300 hover:shadow-md hover:-translate-y-1 flex flex-col justify-between overflow-hidden">

                                {/* Step Number Badge */}
                                <div className="absolute top-5 right-5 w-7 h-7 rounded-full bg-slate-50 text-slate-400 text-xs font-bold flex items-center justify-center border border-slate-100">
                                    0{step.num}
                                </div>

                                <div className="relative z-10">
                                    <div className={`w-12 h-12 rounded-xl ${step.bgColor} flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-105`}>
                                        {step.icon}
                                    </div>

                                    <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2 tracking-tight">{step.title}</h3>
                                    <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-normal">
                                        {step.description}
                                    </p>
                                </div>

                                {/* Subtle Hover Accent Line */}
                                <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r ${step.accent} transform scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-300`} />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;
