"use client";

import { useState } from "react";
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
  FaTimes
} from "react-icons/fa";

export default function OperatorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems = [
    { name: "Dashboard", href: "/operator/dashboard", icon: <FaBell /> },
    { name: "Statistik", href: "/operator/statistics", icon: <FaChartBar /> },
    { name: "Manajemen", href: "/operator/management", icon: <FaTags /> },
    { name: "Edukasi & Berita", href: "/operator/articles", icon: <FaFileAlt /> },
    { name: "WhatsApp", href: "/operator/whatsapp", icon: <FaWhatsapp /> },
  ];

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      window.location.href = "/operator/login";
    } catch (error) {
      console.error("Logout error:", error);
      window.location.href = "/operator/login";
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-gray-900 font-sans selection:bg-red-500/30 flex">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200/70 z-50 flex flex-col transition-transform duration-300
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        {/* Brand */}
        <div className="h-20 flex items-center gap-3 px-6 border-b border-gray-200/70 shrink-0">
          <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center shadow-md shrink-0">
            <FaBell className="text-white text-lg" />
          </div>
          <div className="overflow-hidden">
            <h1 className="text-lg font-bold tracking-tight text-gray-900 truncate">SiagaBencana <span className="text-red-500">Ops</span></h1>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-widest truncate">Operator</p>
          </div>
          {/* Close button on mobile */}
          <button 
            className="ml-auto lg:hidden text-gray-500 hover:text-gray-700"
            onClick={() => setIsSidebarOpen(false)}
          >
            <FaTimes />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5">
          {menuItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link 
                key={item.name} 
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-semibold text-sm ${
                  isActive 
                    ? "bg-red-50 text-red-600" 
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <div className={`text-base ${isActive ? "text-red-500" : "text-gray-400"}`}>
                  {item.icon}
                </div>
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer (Logout) */}
        <div className="p-4 border-t border-gray-200/70">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-colors font-semibold text-sm text-red-600 hover:bg-red-50"
          >
            <FaSignOutAlt className="text-base text-red-500" />
            Keluar Akun
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Mobile Header (Shows only on small screens to open sidebar) */}
        <header className="lg:hidden h-16 bg-white border-b border-gray-200/70 flex items-center px-4 shrink-0 sticky top-0 z-30">
          <button 
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            onClick={() => setIsSidebarOpen(true)}
          >
            <FaBars />
          </button>
          <span className="ml-3 font-bold text-gray-900">SiagaBencana Ops</span>
        </header>

        {/* Page Content */}
        <main className="flex-1 relative">
          {children}
        </main>
      </div>
    </div>
  );
}
