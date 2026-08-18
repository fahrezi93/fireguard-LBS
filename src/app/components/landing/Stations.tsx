'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { FaPhone, FaFire, FaMap, FaExclamationCircle } from 'react-icons/fa';
import { motion } from 'framer-motion';

// Dynamic import untuk map
const StationsMap = dynamic(() => import('../../../components/StationsMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-gray-50/50 flex flex-col items-center justify-center animate-pulse">
      <div className="w-10 h-10 border-[3px] border-red-500/20 border-t-red-500 rounded-full animate-spin mb-4" />
      <p className="text-sm font-medium text-gray-400 tracking-wide">Memuat Sistem Pemetaan...</p>
    </div>
  ),
});

// Import data pos damkar
import { fireStations } from '@/lib/fire-stations';

const Stations = () => {
  const [selectedStation, setSelectedStation] = useState<any>(null);

  return (
    <section id="stations" className="py-12 md:py-16 bg-white relative scroll-mt-20 border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-6">

        {/* Header */}
        <div className="mb-8 md:mb-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-snug">
              Jaringan Pos Pemadam <br className="hidden md:block" />
              <span className="text-slate-400 font-normal">Kecamatan Plaju.</span>
            </h2>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.06, ease: "easeOut" }}
            className="text-xs sm:text-sm md:text-base text-slate-600 max-w-md leading-relaxed font-normal"
          >
            Mengintegrasikan <strong className="text-slate-900 font-semibold">{fireStations.length} titik pos strategis</strong> ke dalam satu sistem pemantauan real-time untuk respons cepat 24/7 di seluruh area operasi.
          </motion.p>
        </div>

        {/* Map & Directory Interface */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
          className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-3 md:p-4 shadow-xs"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:h-[540px]">

            {/* Sidebar Directory */}
            <div className="lg:col-span-4 flex flex-col bg-white rounded-xl border border-slate-100 shadow-2xs overflow-hidden h-[340px] lg:h-full relative">

              <div className="p-4 border-b border-slate-100 bg-white/90 backdrop-blur-md z-20 sticky top-0 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FaMap className="text-red-500 text-xs" />
                  Direktori Pos
                </h3>
                <span className="bg-slate-100 text-slate-600 py-0.5 px-2.5 rounded-full text-[11px] font-bold">
                  {fireStations.length} Pos
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2 relative no-scrollbar">
                {fireStations.map((station, index) => {
                  const isSelected = selectedStation?.name === station.name;
                  return (
                    <motion.div
                      key={station.name}
                      initial={{ opacity: 0, x: -12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.35, delay: index * 0.04, ease: "easeOut" }}
                    >
                      <button
                        onClick={() => setSelectedStation(station)}
                        className={`w-full text-left p-3 rounded-xl transition-all duration-200 border focus:outline-none ${isSelected ? 'bg-red-50/60 border-red-200 shadow-2xs' : 'bg-transparent border-transparent hover:bg-slate-50'}`}
                      >
                        <div className="flex gap-3">
                          <div className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center transition-colors duration-200 ${isSelected ? 'bg-red-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-400'}`}>
                            <FaFire className="text-sm" />
                          </div>
                          <div className="min-w-0">
                            <h4 className={`text-xs sm:text-sm font-bold mb-0.5 transition-colors truncate ${isSelected ? 'text-red-600' : 'text-slate-900'}`}>
                              {station.name}
                            </h4>
                            <p className="text-[11px] text-slate-500 leading-normal mb-1.5 line-clamp-2 font-normal">
                              {station.address}
                            </p>
                            {station.phone && (
                              <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                                <FaPhone className="w-2.5 h-2.5" /> {station.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Map Area */}
            <div className="lg:col-span-8 bg-slate-100 rounded-xl overflow-hidden relative border border-slate-200/60 h-[380px] lg:h-full">
              <StationsMap
                stations={fireStations}
                selectedStation={selectedStation}
                onStationClick={setSelectedStation}
              />

              {/* Floating Emergency Banner */}
              <div className="absolute bottom-4 left-4 right-4 md:right-auto md:max-w-sm bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-md border border-slate-100">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                    <FaExclamationCircle className="text-sm" />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-xs mb-1">Siaga Darurat 24 Jam</h5>
                    <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
                      Hubungi Call Center <strong className="text-red-600 font-bold">113</strong> atau laporkan kejadian secara instan melalui sistem ini.
                    </p>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </motion.div>

      </div>
    </section>
  );
};

export default Stations;
