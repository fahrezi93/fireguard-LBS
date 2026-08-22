'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { FaShieldAlt, FaPhoneAlt } from 'react-icons/fa';

const Hero = () => {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideshowReady, setSlideshowReady] = useState(false);
  const images = ['/bg1.webp', '/bg2.webp', '/bg3.webp', '/bg4.webp'];

  useEffect(() => {
    // Delay slideshow start so it doesn't interfere with LCP
    const ready = setTimeout(() => setSlideshowReady(true), 3000);
    return () => clearTimeout(ready);
  }, []);

  useEffect(() => {
    if (!slideshowReady) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % images.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [slideshowReady, images.length]);

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#050505] text-white">
      {/* Background Images - Static first image for LCP, then slideshow */}
      {!slideshowReady ? (
        <div className="absolute inset-0 z-0">
          <Image
            src="/bg1.webp"
            alt="Hero Background"
            fill
            priority
            fetchPriority="high"
            className="object-cover object-center"
            sizes="(max-width: 828px) 750px, 1920px"
            quality={75}
          />
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <motion.div
            key={currentSlide}
            initial={currentSlide === 0 ? false : { opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="absolute inset-0 z-0"
          >
            <Image
              src={images[currentSlide]}
              alt="Hero Background"
              fill
              priority={currentSlide === 0}
              className="object-cover object-center"
              sizes="(max-width: 828px) 750px, 1920px"
              quality={75}
            />
          </motion.div>
        </AnimatePresence>
      )}

      {/* Cinematic Gradient Overlays */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/80 via-black/50 to-[#050505]" />
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/80 via-transparent to-black/80" />

      {/* Main Content */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-6 flex flex-col items-center text-center mt-12">

        {/* Hero Typography */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-200 to-gray-500 mb-6 drop-shadow-sm leading-[1.1] md:leading-[1.1]">
            Respons Cepat.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">Tanpa Panik.</span>
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-sm sm:text-base md:text-lg text-gray-400 font-light max-w-2xl mx-auto px-4 mb-8 leading-relaxed"
        >
          Sistem pelaporan darurat terpadu untuk wilayah <strong className="text-white font-medium">Kecamatan Plaju</strong>. Mendeteksi, merespons, dan mengamankan dengan presisi.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto px-6 sm:px-0"
        >
          <button
            onClick={() => router.push('/lapor-cepat')}
            className="group relative w-full sm:w-auto overflow-hidden bg-red-600 text-white px-6 py-3 rounded-full font-bold text-sm transition-all hover:-translate-y-1 shadow-[0_0_20px_rgba(220,38,38,0.4)] animate-pulse-new"
          >
            {/* Inner Glow / Plasma */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="relative flex items-center justify-center gap-2">
              <FaPhoneAlt className="text-white/90 group-hover:animate-bounce" /> Lapor Darurat (Tanpa Login)
            </span>
          </button>

          <Link
            href="/login"
            className="group w-full sm:w-auto px-6 py-3 rounded-full font-bold text-sm text-white border border-white/20 bg-white/5 backdrop-blur-md hover:bg-white/10 hover:border-white/40 transition-all flex items-center justify-center gap-2"
          >
            Login & Riwayat Laporan
          </Link>
        </motion.div>
      </div>

      {/* Modern Slide Indicators — fixed-width containers, only opacity changes (composited) */}
      <div className="absolute bottom-10 left-0 right-0 z-30 flex justify-center items-center gap-3">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className="relative h-1.5 focus:outline-none group flex items-center"
            aria-label={`Go to slide ${index + 1}`}
          >
            {/* Fixed-width outer — no width transition, only opacity/color changes */}
            <div className={`rounded-full h-1.5 overflow-hidden transition-all duration-500 ${index === currentSlide ? 'w-12' : 'w-4'}`}>
              <div
                className={`h-full w-full rounded-full ${
                  index === currentSlide
                    ? 'bg-red-500'
                    : 'bg-white/30 group-hover:bg-white/50'
                }`}
              />
            </div>
          </button>
        ))}
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-10 right-10 z-20 hidden md:flex flex-col items-center gap-2 text-gray-500"
      >
        <span className="text-xs tracking-[0.2em] text-white/50 uppercase origin-left rotate-90 mb-8 translate-x-3">Scroll</span>
        <div className="w-px h-16 bg-white/10 relative overflow-hidden">
          <motion.div
            animate={{ y: [0, 64] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-transparent via-red-500 to-transparent"
          />
        </div>
      </motion.div>
    </section>
  );
};

export default Hero;
