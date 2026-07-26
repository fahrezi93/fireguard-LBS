'use client';

import { FaMobileAlt, FaMapMarkedAlt, FaTruck } from 'react-icons/fa';
import { motion } from 'framer-motion';

const steps = [
    {
        number: "1",
        icon: <FaMobileAlt className="w-5 h-5 text-red-600" />,
        title: "Buka & Lapor",
        description: "Buka aplikasi SiagaBencana dan tekan tombol darurat merah. Laporan langsung terkirim tanpa proses rumit."
    },
    {
        number: "2",
        icon: <FaMapMarkedAlt className="w-5 h-5 text-red-600" />,
        title: "Deteksi Lokasi",
        description: "Sistem otomatis melacak koordinat presisi Anda menggunakan GPS dan mengirimkan ke pos terdekat."
    },
    {
        number: "3",
        icon: <FaTruck className="w-5 h-5 text-red-600" />,
        title: "Bantuan Tiba",
        description: "Armada pemadam kebakaran segera meluncur dengan rute optimal real-time ke lokasi Anda."
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
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 mb-3 tracking-tight max-w-2xl">
                            Lapor Cepat dalam <span className="text-red-600">3 Langkah Mudah</span>
                        </h2>

                        <p className="text-xs sm:text-sm md:text-base text-slate-600 max-w-xl mx-auto leading-relaxed font-normal">
                            Di saat krisis, setiap detik sangat berharga. Kami menyederhanakan proses pelaporan agar Anda mendapatkan bantuan maksimal tanpa hambatan.
                        </p>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {steps.map((step, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.5, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
                            className="h-full"
                        >
                            <div className="h-full bg-white p-6 rounded-2xl border border-slate-200/80 hover:border-red-200 hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
                                <div>
                                    <div className="flex items-center justify-between mb-5">
                                        <div className="w-11 h-11 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 group-hover:scale-105 transition-transform duration-300">
                                            {step.icon}
                                        </div>
                                        <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-100/80 px-2.5 py-1 rounded-lg">
                                            Langkah 0{step.number}
                                        </span>
                                    </div>

                                    <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2 tracking-tight">
                                        {step.title}
                                    </h3>
                                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                                        {step.description}
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

export default HowItWorks;
