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
        <section id="faq" className="py-12 md:py-16 bg-white relative overflow-hidden border-b border-slate-100">
            <div className="max-w-6xl mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">

                    {/* Typography & Header - Sticky on Desktop */}
                    <div className="lg:col-span-5 lg:sticky lg:top-28">
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-snug mb-3">
                                Sering Miskomunikasi? <br />
                                <span className="text-slate-400 font-normal">Kami Jelaskan.</span>
                            </h2>

                            <p className="text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed font-normal max-w-sm mb-6">
                                Jawaban transparan seputar privasi, jangkauan, dan teknis operasional aplikasi perlindungan kebakaran Anda.
                            </p>

                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100/80">
                                <p className="text-xs text-slate-600 font-medium mb-1">Masih punya pertanyaan spesifik?</p>
                                <a href="/#contact" className="text-red-600 font-bold text-xs tracking-wide hover:underline underline-offset-4 decoration-red-200 transition-all">
                                    Hubungi Tim Dukungan &rarr;
                                </a>
                            </div>
                        </motion.div>
                    </div>

                    {/* Accordion List */}
                    <div className="lg:col-span-7">
                        <div className="border-t border-slate-200/70">
                            {faqs.map((faq, idx) => {
                                const isActive = activeIndex === idx;
                                return (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 10 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.35, delay: idx * 0.04, ease: "easeOut" }}
                                        className="border-b border-slate-200/70 group"
                                    >
                                        <button
                                            onClick={() => toggleAccordion(idx)}
                                            className="w-full flex items-center justify-between py-4 sm:py-5 text-left focus:outline-none"
                                        >
                                            <span className={`text-sm sm:text-base md:text-lg font-bold tracking-tight transition-colors duration-200 pr-6 ${isActive ? 'text-red-600' : 'text-slate-900 group-hover:text-red-600'}`}>
                                                {faq.question}
                                            </span>

                                            <div className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-slate-50 group-hover:bg-red-50 transition-colors duration-200">
                                                <motion.div
                                                    animate={{ rotate: isActive ? 45 : 0 }}
                                                    transition={{ duration: 0.25, ease: "easeInOut" }}
                                                    className={`${isActive ? 'text-red-600' : 'text-slate-400 group-hover:text-red-600'}`}
                                                >
                                                    <FaPlus className="text-xs" />
                                                </motion.div>
                                            </div>
                                        </button>

                                        <AnimatePresence initial={false}>
                                            {isActive && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="pb-5 pr-8 text-xs sm:text-sm text-slate-500 font-normal leading-relaxed">
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
