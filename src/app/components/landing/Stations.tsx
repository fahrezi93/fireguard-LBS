'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { FaMapMarkerAlt, FaPhone, FaFire, FaMap, FaExclamationCircle } from 'react-icons/fa';
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
    <section id="stations" className="py-16 md:py-24 bg-white relative scroll-mt-20">
      <div className="max-w-screen-2xl mx-auto px-6 xl:px-12">

        {/* Header - Minimalist & Typography focused */}
        <div className="mb-10 md:mb-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="inline-flex items-center gap-3 mb-4">
                <span className="w-6 h-px bg-red-500"></span>
                <span className="text-[10px] sm:text-xs font-bold text-red-500 uppercase tracking-[0.2em]">Infrastruktur Wilayah</span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight leading-[1.1]">
                Jaringan Pos Pemadam <br className="hidden md:block" />
                <span className="text-gray-400 font-light">Plaju, Palembang.</span>
              </h2>
            </motion.div>
          </div>

          <div className="lg:col-span-5 lg:pb-3">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="text-gray-500 leading-relaxed text-sm md:text-base max-w-lg"
            >
              Kami mengintegrasikan <strong className="text-gray-900 font-semibold">{fireStations.length} titik pos strategis</strong> ke dalam satu sistem pemantauan real-time untuk memastikan respons cepat 24/7 di seluruh area operasi.
            </motion.p>
          </div>
        </div>

        {/* Dashboard-like Map Interface */}
        <div className="bg-[#FAFAFA] border border-gray-200/60 rounded-[2.5rem] p-4 md:p-6 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:h-[700px]">

            {/* Sidebar / List */}
            <div className="lg:col-span-4 flex flex-col bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden h-[400px] lg:h-full relative">

              <div className="p-6 border-b border-gray-50 bg-white/80 backdrop-blur-xl z-20 sticky top-0">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-3">
                  <FaMap className="text-red-500" />
                  Direktori Pos
                  <span className="ml-auto bg-gray-100 text-gray-600 py-1 px-3 rounded-full text-xs font-bold">
                    {fireStations.length} Tersedia
                  </span>
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2 relative no-scrollbar">
                {/* Penyesuaian class custom scrollbar bisa diatur di global css, di sini pure tailwind standard */}
                {fireStations.map((station, index) => {
                  const isSelected = selectedStation?.name === station.name;
                  return (
                    <motion.button
                      key={station.name}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-20px" }}
                      transition={{ duration: 0.6, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
                      onClick={() => setSelectedStation(station)}
                      className={`w-full text-left p-4 rounded-2xl transition-all duration-300 border focus:outline-none ${isSelected ? 'bg-red-50/50 border-red-100 shadow-sm ring-1 ring-red-500/10' : 'bg-transparent border-transparent hover:bg-gray-50'}`}
                    >
                      <div className="flex gap-4">
                        <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center transition-colors duration-300 ${isSelected ? 'bg-red-500 text-white shadow-md shadow-red-500/20' : 'bg-gray-100 text-gray-400'}`}>
                          <FaFire className="text-lg" />
                        </div>
                        <div>
                          <h4 className={`font-semibold mb-1 transition-colors ${isSelected ? 'text-red-600' : 'text-gray-900'}`}>
                            {station.name}
                          </h4>
                          <p className="text-xs text-gray-500 leading-relaxed mb-2 line-clamp-2">
                            {station.address}
                          </p>
                          {station.phone && (
                            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
                              <FaPhone className="w-3 h-3" /> {station.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Map Area */}
            <div className="lg:col-span-8 bg-gray-100 rounded-[2rem] overflow-hidden relative border border-gray-200/50 h-[500px] lg:h-full">
              <StationsMap
                stations={fireStations}
                selectedStation={selectedStation}
                onStationClick={setSelectedStation}
              />

              {/* Floating Overlay for Map */}
              <div className="absolute bottom-6 left-6 right-6 md:right-auto md:max-w-md bg-white/95 backdrop-blur-xl p-5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                    <FaExclamationCircle className="text-lg" />
                  </div>
                  <div>
                    <h5 className="font-bold text-gray-900 text-sm mb-1.5">Siaga Darurat 24 Jam</h5>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Seluruh unit komando dapat dihubungi melalui Call Center <strong className="text-red-600 font-bold border-b border-red-600/30 pb-0.5">113</strong> atau lapor instan via aplikasi ini.
                    </p>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>
    </section>
  );
};

export default Stations;
