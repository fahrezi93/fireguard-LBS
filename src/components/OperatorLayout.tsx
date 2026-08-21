"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  FaBell, 
  FaChartBar, 
  FaTags, 
  FaFileAlt, 
  FaWhatsapp, 
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaUserShield
} from "react-icons/fa";

export default function OperatorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/profile")
      .then(res => res.json())
      .then(data => {
        if (data && data.role) setRole(data.role);
      })
      .catch(console.error);
  }, []);

  const menuItems = [
    { name: "Dashboard", href: role === "SUPER_ADMIN" ? "/admin/dashboard" : "/operator/dashboard", icon: <FaBell /> },
    { name: "Statistik", href: "/operator/statistics", icon: <FaChartBar /> },
    { name: "Manajemen", href: "/operator/management", icon: <FaTags /> },
    ...(role === "SUPER_ADMIN" 
        ? [{ name: "Manajemen User", href: "/admin/users", icon: <FaUserShield /> }]
        : []),
    { name: "Edukasi & Berita", href: "/operator/articles", icon: <FaFileAlt /> },
    { name: "WhatsApp", href: "/operator/whatsapp", icon: <FaWhatsapp /> },
  ];

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
      window.location.href = "/login";
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-gray-900 font-sans selection:bg-red-500/30 flex flex-col">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      <aside className={`
        fixed inset-y-0 left-0 h-full w-72 max-w-[85vw] lg:w-64 bg-white border-r border-gray-200/80 z-50 flex flex-col transition-transform duration-300 ease-out shadow-xl lg:shadow-none shrink-0
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        {/* Brand Header */}
        <div className="h-16 lg:h-20 flex items-center gap-3 px-5 lg:px-6 border-b border-gray-100 shrink-0">
          <div className="w-9 h-9 lg:w-10 lg:h-10 bg-gray-900 rounded-xl flex items-center justify-center shadow-md shrink-0">
            <FaBell className="text-white text-base" />
          </div>
          <div className="overflow-hidden flex-1">
            <h1 className="text-base lg:text-lg font-bold tracking-tight text-gray-900 truncate">
              SiagaBencana <span className="text-red-500">Ops</span>
            </h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate">
              {role === 'SUPER_ADMIN' ? 'Super Admin' : 'Operator'}
            </p>
          </div>
          {/* Close button on mobile */}
          <button 
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg lg:hidden transition-colors"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Tutup Menu"
          >
            <FaTimes className="text-sm" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto py-4 lg:py-6 px-3 lg:px-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link 
                key={item.name} 
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 lg:py-3 rounded-xl transition-colors font-semibold text-sm ${
                  isActive 
                    ? "bg-red-50 text-red-600 font-bold" 
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <div className={`text-base shrink-0 ${isActive ? "text-red-500" : "text-gray-400"}`}>
                  {item.icon}
                </div>
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer (Logout) */}
        <div className="p-3 lg:p-4 border-t border-gray-100 shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3.5 py-2.5 lg:py-3 rounded-xl transition-colors font-semibold text-sm text-red-600 hover:bg-red-50"
          >
            <FaSignOutAlt className="text-base text-red-500 shrink-0" />
            <span>Keluar Akun</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:pl-64 flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Sponsor Banner */}
        <div className="w-full bg-white border-b border-gray-200/80 z-30 flex justify-center items-center py-1.5 sm:py-2 shrink-0 relative">
          <div className="flex items-center gap-2.5 sm:gap-3.5 px-3">
            <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.15em] text-slate-500">
              Didanai Oleh:
            </span>
            <div className="bg-white px-2 py-0.5 rounded-md">
              <img src="/Logo_LPKM.png" alt="Sponsorship Logos" className="h-6 sm:h-7 md:h-8 object-contain" />
            </div>
          </div>
        </div>

        {/* Mobile Header */}
        <header className="lg:hidden h-14 bg-white border-b border-gray-200/80 flex items-center justify-between px-3 sm:px-4 shrink-0 sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-2.5">
            <button 
              className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg active:scale-95 transition-transform"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Buka Menu"
            >
              <FaBars className="text-base" />
            </button>
            <span className="font-bold text-sm sm:text-base text-gray-900">SiagaBencana <span className="text-red-500">Ops</span></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
              {role === 'SUPER_ADMIN' ? 'Admin' : 'Operator'}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 relative overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
