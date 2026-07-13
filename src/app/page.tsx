import Navbar from './components/landing/Navbar';
import Hero from './components/landing/Hero';
import HowItWorks from './components/landing/HowItWorks';
import Features from './components/landing/Features';
import Stations from './components/landing/Stations';
import FAQ from './components/landing/FAQ';
import Articles from './components/landing/Articles';
import Contact from './components/landing/Contact';
import Footer from './components/landing/Footer';
import StructuredData from './components/landing/StructuredData';

export default function LandingPage() {
  return (
    <div className="bg-white">
      <StructuredData />
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <Stations />
        <Articles />
        <FAQ />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}