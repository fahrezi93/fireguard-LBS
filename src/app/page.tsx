import type { Metadata } from 'next';
import Navbar from './components/landing/Navbar';
import Hero from './components/landing/Hero';
import dynamic from 'next/dynamic';

export const metadata: Metadata = {
  title: 'SiagaBencana Kecamatan Plaju - Sistem Cepat Tanggap Kebakaran',
  description: 'SiagaBencana adalah sistem peringatan dini dan pelaporan kebakaran real-time untuk wilayah Kecamatan Plaju, Palembang. Laporkan insiden darurat secara instan, pantau respons tim pemadam, dan lindungi komunitas Anda.',
};

const HowItWorks = dynamic(() => import('./components/landing/HowItWorks'), {
  loading: () => <div className="h-32 bg-white animate-pulse" />,
});
const Features = dynamic(() => import('./components/landing/Features'), {
  loading: () => <div className="h-32 bg-white animate-pulse" />,
});
// Note: ssr:false is NOT allowed in Server Components — Stations handles it internally
const Stations = dynamic(() => import('./components/landing/Stations'), {
  loading: () => <div className="h-64 bg-white animate-pulse" />,
});
const FAQ = dynamic(() => import('./components/landing/FAQ'));
const Articles = dynamic(() => import('./components/landing/Articles'));
const Contact = dynamic(() => import('./components/landing/Contact'));
const Footer = dynamic(() => import('./components/landing/Footer'));
const StructuredData = dynamic(() => import('./components/landing/StructuredData'));

export default function LandingPage() {
  return (
    <div className="bg-white">
      <StructuredData />
      <Navbar isLight={false} />
      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <Stations />
        <Articles />
        <FAQ />
        <Contact />
      </main>
      <Footer isLight={true} />
    </div>
  );
}