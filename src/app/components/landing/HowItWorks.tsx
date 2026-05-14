'use client';

import { FaMobileAlt, FaMapMarkedAlt, FaTruck } from 'react-icons/fa';
import { motion } from 'framer-motion';

const steps = [
    {
        icon: <FaMobileAlt className="w-7 h-7 text-red-600" />,
        title: "Buka & Lapor",
        description: "Buka aplikasi FireGuard dan tekan tombol darurat merah. Laporan langsung terkirim tanpa proses rumit.",
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
        <section id="how-it-works" className="py-16 lg:py-24 bg-[#FAFAFA] relative overflow-hidden">
            {/* Minimalist Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-white to-transparent pointer-events-none" />
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-red-100 rounded-full blur-[100px] opacity-50 pointer-events-none" />
            <div className="absolute -bottom-40 -left-40 w-[30rem] h-[30rem] bg-orange-50 rounded-full blur-[120px] opacity-70 pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center mb-12 md:mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="flex flex-col items-center"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm mb-8">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-xs font-bold text-gray-800 tracking-widest uppercase">Alur Pelaporan</span>
                        </div>

                        <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight max-w-3xl">
                            Lapor Cepat dalam <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500">3 Langkah Mudah</span>
                        </h2>

                        <p className="text-gray-500 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
                            Di saat krisis, setiap detik sangat berharga. Kami menyederhanakan proses pelaporan agar Anda mendapatkan bantuan maksimal tanpa hambatan.
                        </p>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 relative">
                    {/* Connecting Dashed Line (Desktop) */}
                    <div className="hidden md:block absolute top-[4rem] left-[15%] right-[15%] border-t-2 border-dashed border-gray-200 z-0" />

                    {steps.map((step, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.6, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
                            className="relative group h-full"
                        >
                            {/* Card Body */}
                            <div className="h-full relative z-10 bg-white p-6 lg:p-8 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden transition-all duration-500 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-2 flex flex-col">

                                {/* Large Watermark Number */}
                                <div className="absolute -top-8 -right-4 text-[8rem] md:text-[10rem] font-black text-gray-50/80 group-hover:text-gray-100/50 transition-colors duration-500 pointer-events-none leading-none select-none">
                                    {step.num}
                                </div>

                                <div className="relative z-10 flex-1 flex flex-col">
                                    <div className={`w-14 h-14 rounded-2xl ${step.bgColor} ring-4 ${step.ringColor} flex items-center justify-center mb-8 transition-transform duration-500 group-hover:scale-110`}>
                                        {step.icon}
                                    </div>

                                    <h3 className="text-xl font-bold text-gray-900 mb-3 tracking-tight mt-auto">{step.title}</h3>
                                    <p className="text-sm md:text-base text-gray-500 leading-relaxed font-medium">
                                        {step.description}
                                    </p>
                                </div>

                                {/* Hover Accent Line at the bottom */}
                                <div className={`absolute bottom-0 left-0 w-full h-1.5 bg-gradient-to-r ${step.accent} transform scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-500`} />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;
