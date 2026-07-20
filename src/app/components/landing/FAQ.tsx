'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus } from 'react-icons/fa';

const faqs = [
    {
        question: "Apakah layanan SiagaBencana ini gratis?",
        answer: "Ya, SiagaBencana adalah inisiatif swadaya untuk publik dan sepenuhnya GRATIS 100% tanpa biaya tersembunyi bagi seluruh masyarakat Plaju, Palembang."
    },
    {
        question: "Apakah bisa melapor tanpa koneksi internet yang stabil?",
        answer: "Aplikasi ini didesain berbasis flutter yang sangat ringan. Namun jika koneksi Anda benar-benar terputus, sistem akan mengarahkan Anda ke tombol Darurat Seluler (113) yang akan menelepon pos pemadam secara langsung menggunakan jaringan seluler biasa."
    },
    {
        question: "Wilayah mana saja yang dicakup oleh aplikasi ini?",
        answer: "Saat ini jangkauan koordinat deteksi otomatis kami berfokus melayani seluruh wilayah administratif Kecamatan Plaju, Palembang. Jika laporan terdeteksi di luar zona, sistem akan meneruskan notifikasi pembantu ke unit kecamatan tetangga terkait."
    },
    {
        question: "Bagaimana sistem melindungi keamanan data privasi pelapor?",
        answer: "Identitas Anda dienkripsi end-to-end dan hanya dibuka oleh petugas operator resmi untuk keperluan validasi. Hal ini kami lakukan murni guna mencegah laporan palsu (prank call) yang merugikan publik dan membahayakan nyawa."
    }
];

const FAQ = () => {
    const [activeIndex, setActiveIndex] = useState<number | null>(0);

    const toggleAccordion = (index: number) => {
        setActiveIndex(activeIndex === index ? null : index);
    };

    return (
        <section id="faq" className="py-16 lg:py-24 bg-white relative overflow-hidden border-t border-gray-100">
            {/* Subtle Gradient Backdrop */}
            <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-gradient-to-bl from-gray-50 to-transparent rounded-full opacity-60 pointer-events-none -translate-y-1/2 translate-x-1/3" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 items-start">

                    {/* Typography & Header - Sticky on Desktop */}
                    <div className="lg:col-span-5 lg:sticky lg:top-32">
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="inline-flex items-center gap-3 mb-6">
                                <span className="w-8 h-px bg-red-500"></span>
                                <span className="text-xs font-bold text-red-500 uppercase tracking-[0.2em]">Pertanyaan Umum</span>
                            </div>

                            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight leading-[1.1] mb-6">
                                Sering <br className="hidden lg:block" /> Miskomunikasi? <br />
                                <span className="text-gray-400 font-light">Kami Jelaskan.</span>
                            </h2>

                            <p className="text-gray-500 leading-relaxed font-light text-base max-w-md">
                                Jawaban transparan seputar privasi, jangkauan, dan teknis operasional aplikasi perlindungan kebakaran Anda.
                            </p>

                            <div className="mt-10 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                <p className="text-sm text-gray-600 font-medium mb-1">Masih punya pertanyaan spesifik?</p>
                                <a href="#contact" className="text-red-600 font-bold text-sm tracking-wide hover:underline underline-offset-4 decoration-red-200 transition-all">
                                    Hubungi Tim Dukungan &rarr;
                                </a>
                            </div>
                        </motion.div>
                    </div>

                    {/* Accordion List */}
                    <div className="lg:col-span-7">
                        <div className="border-t border-gray-200">
                            {faqs.map((faq, idx) => {
                                const isActive = activeIndex === idx;
                                return (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0 }}
                                        whileInView={{ opacity: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.3 }}
                                        className="border-b border-gray-200 group"
                                    >
                                        <button
                                            onClick={() => toggleAccordion(idx)}
                                            className="w-full flex items-center justify-between py-5 md:py-6 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-red-100 rounded-lg"
                                        >
                                            <span className={`text-base md:text-lg lg:text-xl font-semibold tracking-tight transition-colors duration-300 pr-8 ${isActive ? 'text-red-600' : 'text-gray-900 group-hover:text-red-500'}`}>
                                                {faq.question}
                                            </span>

                                            <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-gray-50 group-hover:bg-red-50 transition-colors duration-300">
                                                <motion.div
                                                    animate={{ rotate: isActive ? 45 : 0 }}
                                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                                    className={`${isActive ? 'text-red-600' : 'text-gray-400 group-hover:text-red-500'}`}
                                                >
                                                    <FaPlus className="text-sm" />
                                                </motion.div>
                                            </div>
                                        </button>

                                        <AnimatePresence initial={false}>
                                            {isActive && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} /* Custom spring ease */
                                                    className="overflow-hidden"
                                                >
                                                    <div className="pb-6 pr-12 text-gray-500 font-light leading-relaxed text-sm md:text-base">
                                                        {faq.answer}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FAQ;
