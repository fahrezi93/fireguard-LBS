'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaBell, FaUser, FaUserShield, FaChevronDown, FaSignOutAlt, FaBars, FaTimes } from 'react-icons/fa';

const Navbar = ({ isLight = false }: { isLight?: boolean }) => {
  const { push } = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{ name?: string; email?: string; phone?: string; id?: number; isOperator?: boolean } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setIsLoggedIn(true);
          setUser(userData);
        } else {
          setIsLoggedIn(false);
          setUser(null);
        }
      } catch {
        setIsLoggedIn(false);
        setUser(null);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [mobileMenuOpen]);

  const handleLogout = async () => {
    const redirectTarget = "/";

    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      setIsLoggedIn(false);
      setUser(null);
      setDropdownOpen(false);
      // Force full page reload to clear all cached state
      window.location.href = redirectTarget;
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = redirectTarget;
    }
  };

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ease-out ${scrolled ? 'pt-4' : 'pt-6'}`}>
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className={`flex justify-between items-center px-5 py-3 md:px-6 md:py-3.5 mx-auto transition-all duration-500 ${scrolled
            ? isLight
              ? 'bg-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl border border-black/5 rounded-[2rem]'
              : 'bg-[#0A0A0A]/80 shadow-[0_8px_30px_rgb(0,0,0,0.5)] backdrop-blur-xl border border-white/10 rounded-[2rem]'
            : 'bg-transparent border border-transparent'
          }`}>

          <Link href="/" className="flex items-center gap-3 group z-50">
            <div className={`p-2.5 rounded-[1rem] transition-all duration-500 ${scrolled
                ? 'bg-gradient-to-br from-red-500 to-orange-600 shadow-md shadow-red-500/20'
                : isLight ? 'bg-black/5 backdrop-blur-md' : 'bg-white/10 backdrop-blur-md'
              }`}>
              <FaBell className={`text-xl ${scrolled ? 'text-white' : isLight ? 'text-red-500' : 'text-white'}`} />
            </div>
            <span className={`text-xl font-bold tracking-tight ${isLight && !scrolled ? 'text-neutral-900' : scrolled && isLight ? 'text-neutral-900' : 'text-white'}`}>SiagaBencana</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            <Link href="#features" className={`text-sm font-medium transition-colors ${isLight ? 'text-neutral-600 hover:text-black' : 'text-neutral-300 hover:text-white'}`}>Fitur</Link>
            <Link href="#stations" className={`text-sm font-medium transition-colors ${isLight ? 'text-neutral-600 hover:text-black' : 'text-neutral-300 hover:text-white'}`}>Lokasi Pos</Link>
            <Link href="#contact" className={`text-sm font-medium transition-colors ${isLight ? 'text-neutral-600 hover:text-black' : 'text-neutral-300 hover:text-white'}`}>Kontak</Link>
          </div>

          <div className="hidden md:flex items-center gap-4 z-50">
            {isLoggedIn ? (
              <div className="relative" ref={dropdownRef}>
                <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center gap-2.5 transition-all hover:opacity-80">
                  <div className="size-10 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-red-500/20">
                    {user?.isOperator ? <FaUserShield size={14} /> : <FaUser size={14} />}
                  </div>
                  <FaChevronDown size={10} className={`transition-transform duration-300 ${isLight ? 'text-neutral-900' : 'text-white'} ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu Desktop */}
                <div className={`absolute right-0 mt-4 w-56 ${isLight ? 'bg-white border-black/5 shadow-[0_10px_40px_rgba(0,0,0,0.1)]' : 'bg-[#111] border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.8)]'} backdrop-blur-xl border rounded-2xl py-2 transition-all duration-300 origin-top-right ${dropdownOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                  <div className={`px-5 py-3 border-b ${isLight ? 'border-black/5' : 'border-white/5'}`}>
                    <p className={`text-xs font-semibold uppercase tracking-widest mb-0.5 ${user?.isOperator ? 'text-red-500' : isLight ? 'text-neutral-400' : 'text-neutral-500'}`}>
                      {user?.isOperator ? 'Operator' : 'User'}
                    </p>
                    <p className={`text-sm font-medium line-clamp-1 ${isLight ? 'text-neutral-900' : 'text-white'}`}>{user?.name || user?.email || (user?.isOperator ? 'Operator' : 'User')}</p>
                  </div>
                  <div className="p-2 space-y-1">
                    <button onClick={() => { setDropdownOpen(false); push(user?.isOperator ? '/operator/dashboard' : '/dashboard'); }} className={`w-full text-left px-3 py-2.5 rounded-xl text-sm flex items-center gap-3 transition-colors ${isLight ? 'text-neutral-600 hover:bg-black/5 hover:text-black' : 'text-neutral-300 hover:bg-white/5 hover:text-white'}`}>
                      {user?.isOperator ? <FaUserShield size={14} className="text-neutral-400" /> : <FaUser size={14} className="text-neutral-400" />} Dashboard
                    </button>
                    <button onClick={handleLogout} className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-500/10 flex items-center gap-3 transition-colors">
                      <FaSignOutAlt size={14} /> Logout
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button onClick={() => push('/login')} className={`text-sm font-semibold px-5 py-2.5 rounded-full transition-all ${isLight ? 'text-neutral-900 hover:bg-black/5' : 'text-white hover:bg-white/10'}`}>
                Masuk
              </button>
            )}
            <button onClick={() => push('/report/new')} className={`${isLight ? 'bg-black text-white hover:bg-neutral-800' : 'bg-white text-black hover:bg-neutral-200'} px-6 py-2.5 rounded-full font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-sm`}>
              Lapor Darurat
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`relative z-50 -mr-2 rounded-full p-2 transition-all active:scale-90 md:hidden ${isLight ? 'bg-black/5 border-black/10 text-black' : 'bg-white/5 border-white/10 text-white'} ${mobileMenuOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            aria-label="Buka menu"
            aria-expanded={mobileMenuOpen}
          >
            <FaBars className="text-lg" />
          </button>
        </div>
      </div>

      {/* Mobile Menu Fullscreen Overlay */}
      <div className={`fixed inset-0 z-[60] transition-all duration-500 md:hidden ${isLight ? 'bg-white/95' : 'bg-[#050505]/95'} backdrop-blur-2xl ${mobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
        <div className="fixed inset-x-0 top-0 z-10 px-8 pt-[max(1.5rem,env(safe-area-inset-top))]">
          <div className="flex items-center justify-between">
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3">
              <div className={`flex size-10 items-center justify-center rounded-full ${isLight ? 'bg-black/5 text-red-500' : 'bg-white/10 text-white'}`}>
                <FaBell className="text-lg" />
              </div>
              <span className={`text-xl font-bold ${isLight ? 'text-neutral-900' : 'text-white'}`}>SiagaBencana</span>
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex size-10 items-center justify-center rounded-full transition-all active:scale-90 ${isLight ? 'bg-black/5 text-neutral-900 hover:bg-black/10' : 'bg-white/10 text-white hover:bg-white/15'}`}
              aria-label="Tutup menu"
            >
              <FaTimes className="text-lg" />
            </button>
          </div>
        </div>

        <div className="flex h-full flex-col justify-center gap-y-8 overflow-y-auto px-8 pb-10 pt-28">
          <div className="flex flex-col gap-y-6 text-center">
            <Link href="#features" onClick={() => setMobileMenuOpen(false)} className={`text-3xl font-bold transition-colors ${isLight ? 'text-neutral-400 hover:text-black' : 'text-neutral-400 hover:text-white'}`}>Fitur
            </Link>
            <Link href="#stations" onClick={() => setMobileMenuOpen(false)} className={`text-3xl font-bold transition-colors ${isLight ? 'text-neutral-400 hover:text-black' : 'text-neutral-400 hover:text-white'}`}>Lokasi Pos
            </Link>
            <Link href="#contact" onClick={() => setMobileMenuOpen(false)} className={`text-3xl font-bold transition-colors ${isLight ? 'text-neutral-400 hover:text-black' : 'text-neutral-400 hover:text-white'}`}>Kontak
            </Link>
          </div>

          <div className={`pt-8 border-t flex flex-col gap-4 ${isLight ? 'border-black/5' : 'border-white/10'}`}>
            {isLoggedIn ? (
              <>
                <button onClick={() => { setMobileMenuOpen(false); push(user?.isOperator ? '/operator/dashboard' : '/dashboard'); }} className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 ${isLight ? 'bg-black/5 text-black' : 'bg-white/5 text-white'}`}>
                  {user?.isOperator ? <FaUserShield className="text-neutral-400" /> : <FaUser className="text-neutral-400" />} Dashboard
                </button>
                <button onClick={() => { setMobileMenuOpen(false); handleLogout(); }} className="w-full bg-red-500/10 text-red-500 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3">
                  <FaSignOutAlt /> Keluar Akun
                </button>
              </>
            ) : (
              <button onClick={() => { setMobileMenuOpen(false); push('/login'); }} className={`w-full py-4 rounded-2xl font-bold text-lg border ${isLight ? 'bg-black/5 text-black border-black/5' : 'bg-white/5 text-white border-white/10'}`}>
                Masuk / Login
              </button>
            )}
            <button onClick={() => { setMobileMenuOpen(false); push('/report/new'); }} className="w-full bg-[#9F1C19] text-white py-4 rounded-2xl font-bold text-lg shadow-[0_0_30px_rgba(159,28,25,0.3)]">
              Lapor Darurat Sekarang
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
