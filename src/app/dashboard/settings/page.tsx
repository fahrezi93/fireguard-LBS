"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    FaArrowLeft,
    FaBell,
    FaMoon,
    FaSun,
    FaShieldAlt,
    FaInfoCircle,
    FaChevronRight,
    FaToggleOn,
    FaToggleOff,
    FaMobileAlt,
    FaTrash,
    FaExclamationTriangle,
    FaCheck,
} from "react-icons/fa";

interface User {
    id: number;
    name: string;
    email: string;
}

export default function SettingsPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Settings state
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [darkMode, setDarkMode] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [toast, setToast] = useState("");

    const fetchProfile = useCallback(async () => {
        try {
            const response = await fetch("/api/auth/me");
            if (!response.ok) {
                router.push("/login");
                return;
            }
            const userData = await response.json();
            setUser(userData);

            // Load settings from localStorage
            const savedNotifications = localStorage.getItem("settings_notifications");
            const savedEmailNotifications = localStorage.getItem("settings_email_notifications");
            const savedDarkMode = localStorage.getItem("settings_dark_mode");

            if (savedNotifications !== null) setNotificationsEnabled(savedNotifications === "true");
            if (savedEmailNotifications !== null) setEmailNotifications(savedEmailNotifications === "true");
            if (savedDarkMode !== null) setDarkMode(savedDarkMode === "true");
        } catch {
            router.push("/login");
        } finally {
            setIsLoading(false);
        }
    }, [router]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const showToast = (message: string) => {
        setToast(message);
        setTimeout(() => setToast(""), 3000);
    };

    const toggleSetting = (setting: string, value: boolean) => {
        switch (setting) {
            case "notifications":
                setNotificationsEnabled(value);
                localStorage.setItem("settings_notifications", String(value));
                showToast(value ? "Notifikasi Push diaktifkan" : "Notifikasi Push dimatikan");
                break;
            case "email_notifications":
                setEmailNotifications(value);
                localStorage.setItem("settings_email_notifications", String(value));
                showToast(value ? "Notifikasi Email diaktifkan" : "Notifikasi Email dimatikan");
                break;
            case "dark_mode":
                setDarkMode(value);
                localStorage.setItem("settings_dark_mode", String(value));
                if (value) {
                    document.documentElement.classList.add("dark");
                } else {
                    document.documentElement.classList.remove("dark");
                }
                showToast(value ? "Mode Gelap diaktifkan" : "Mode Gelap dimatikan");
                break;
        }
    };

    const handleDeleteAccount = async () => {
        alert("Fitur hapus akun akan segera tersedia. Silakan hubungi admin untuk menghapus akun.");
        setShowDeleteConfirm(false);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center">
                <div className="w-10 h-10 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mb-4"></div>
                <p className="text-xs uppercase tracking-widest font-bold text-gray-500">Memuat Pengaturan</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8F9FA] font-sans selection:bg-red-500/30">

            {/* Toast Notification */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, x: "-50%" }}
                        animate={{ opacity: 1, y: 0, x: "-50%" }}
                        exit={{ opacity: 0, y: -20, x: "-50%" }}
                        className="fixed top-24 left-1/2 z-50 flex items-center gap-2 bg-gray-900 text-white px-4 py-3 rounded-2xl shadow-xl shadow-gray-900/20 font-bold text-[11px] uppercase tracking-widest"
                    >
                        <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                            <FaCheck className="text-xs" />
                        </div>
                        {toast}
                    </motion.div>
                )}
            </AnimatePresence>

            <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-40 px-6 md:px-8 flex items-center">
                <div className="max-w-3xl w-full mx-auto flex items-center justify-between">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-wider rounded-xl hover:bg-gray-50"
                    >
                        <FaArrowLeft className="text-sm" /> <span className="hidden sm:inline">Dashboard</span>
                    </Link>
                    <h1 className="text-xl font-bold tracking-tight text-gray-900 leading-none">Pengaturan.</h1>
                    <div className="w-[88px] sm:w-[130px] invisible"></div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-6 py-8 md:py-12 space-y-6">

                {/* Settings Sections */}

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-50 flex items-center gap-4 bg-gray-50/30">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <FaBell className="text-lg" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-gray-900 tracking-tight">Notifikasi Perangkat</h2>
                            <p className="text-[11px] uppercase tracking-widest font-bold text-gray-400 mt-0.5">Kelola Pemberitahuan</p>
                        </div>
                    </div>

                    <div className="px-6 py-2">
                        {/* Push Notifications */}
                        <div className="py-4 flex items-center justify-between border-b border-gray-50 last:border-0 group cursor-pointer" onClick={() => toggleSetting("notifications", !notificationsEnabled)}>
                            <div className="flex items-start gap-4">
                                <div className="mt-0.5 text-gray-400 group-hover:text-gray-900 transition-colors"><FaMobileAlt /></div>
                                <div>
                                    <p className="text-xs font-bold text-gray-900">Notifikasi Push Darurat</p>
                                    <p className="text-[11px] font-medium text-gray-500 mt-0.5">Menerima alert insiden di perangkat layar.</p>
                                </div>
                            </div>
                            <button className="text-3xl ml-4 focus:outline-none transition-transform active:scale-90">
                                {notificationsEnabled ? <FaToggleOn className="text-blue-500" /> : <FaToggleOff className="text-gray-200" />}
                            </button>
                        </div>

                        {/* Email Notifications */}
                        <div className="py-4 flex items-center justify-between group cursor-pointer" onClick={() => toggleSetting("email_notifications", !emailNotifications)}>
                            <div className="flex items-start gap-4">
                                <div className="mt-0.5 text-gray-400 group-hover:text-gray-900 transition-colors"><FaBell /></div>
                                <div>
                                    <p className="text-xs font-bold text-gray-900">Update Status via Email</p>
                                    <p className="text-[11px] font-medium text-gray-500 mt-0.5">Laporan perkembangan ke kotak masuk Anda.</p>
                                </div>
                            </div>
                            <button className="text-3xl ml-4 focus:outline-none transition-transform active:scale-90">
                                {emailNotifications ? <FaToggleOn className="text-blue-500" /> : <FaToggleOff className="text-gray-200" />}
                            </button>
                        </div>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-50 flex items-center gap-4 bg-gray-50/30">
                        <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                            {darkMode ? <FaMoon className="text-lg" /> : <FaSun className="text-lg" />}
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-gray-900 tracking-tight">Tampilan Visual</h2>
                            <p className="text-[11px] uppercase tracking-widest font-bold text-gray-400 mt-0.5">Adaptasi Mata Anda</p>
                        </div>
                    </div>

                    <div className="px-6 py-2">
                        <div className="py-4 flex items-center justify-between group cursor-pointer" onClick={() => toggleSetting("dark_mode", !darkMode)}>
                            <div className="flex items-start gap-4">
                                <div className="mt-0.5 text-gray-400 group-hover:text-gray-900 transition-colors"><FaMoon /></div>
                                <div>
                                    <p className="text-xs font-bold text-gray-900">Tema Gelap (Malam)</p>
                                    <p className="text-[11px] font-medium text-gray-500 mt-0.5">Kurangi paparan cahaya di kegelapan.</p>
                                </div>
                            </div>
                            <button className="text-3xl ml-4 focus:outline-none transition-transform active:scale-90">
                                {darkMode ? <FaToggleOn className="text-purple-500" /> : <FaToggleOff className="text-gray-200" />}
                            </button>
                        </div>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-50 flex items-center gap-4 bg-gray-50/30">
                        <div className="w-10 h-10 rounded-2xl bg-gray-900 text-white flex items-center justify-center shrink-0">
                            <FaShieldAlt className="text-lg" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-gray-900 tracking-tight">Keamanan Akses</h2>
                            <p className="text-[11px] uppercase tracking-widest font-bold text-gray-400 mt-0.5">Kontrol Penuh Akun</p>
                        </div>
                    </div>

                    <div className="px-6 py-2">
                        <Link href="/dashboard/profile" className="py-4 flex items-center justify-between border-b border-gray-50 last:border-0 group">
                            <div className="flex items-start gap-4">
                                <div className="mt-0.5 text-gray-400 group-hover:text-gray-900 transition-colors"><FaShieldAlt /></div>
                                <div>
                                    <p className="text-xs font-bold text-gray-900">Pembaruan Validasi Profil</p>
                                    <p className="text-[11px] font-medium text-gray-500 mt-0.5">Ganti identitas, kontak, atau nomor WhatsApp.</p>
                                </div>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-gray-100 group-hover:text-gray-900 text-gray-400 transition-colors">
                                <FaChevronRight className="text-xs" />
                            </div>
                        </Link>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-50 flex items-center gap-4 bg-gray-50/30">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <FaInfoCircle className="text-lg" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-gray-900 tracking-tight">Informasi Platform</h2>
                            <p className="text-[11px] uppercase tracking-widest font-bold text-gray-400 mt-0.5">SiagaBencana System</p>
                        </div>
                    </div>

                    <div className="px-6 py-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-[11px] uppercase tracking-widest font-bold text-gray-400">Build Version</p>
                            <p className="text-xs font-bold text-gray-900 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">v1.2.0-stable</p>
                        </div>
                        <div className="flex items-center justify-between">
                            <p className="text-[11px] uppercase tracking-widest font-bold text-gray-400">Deployment Node</p>
                            <p className="text-xs font-bold text-gray-900">ID-PLG-01</p>
                        </div>
                        <div className="flex items-center justify-between">
                            <p className="text-[11px] uppercase tracking-widest font-bold text-gray-400">Maintainer</p>
                            <p className="text-xs font-bold text-gray-900">SiagaBencana Plaju Dev</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-white rounded-3xl shadow-sm border border-red-100 overflow-hidden relative group">
                    <div className="absolute inset-0 bg-red-500/5 group-hover:bg-red-500/10 transition-colors pointer-events-none"></div>
                    <div className="px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                        <div>
                            <h2 className="text-sm font-bold text-red-600 tracking-tight flex items-center gap-2"><FaExclamationTriangle /> Tutup Permanen</h2>
                            <p className="text-xs font-medium text-red-500/80 mt-1 max-w-sm">
                                Penghapusan akun bersifat permanen. Seluruh riwayat laporan keselamatan akan dihilangkan dari basis data SiagaBencana.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="shrink-0 w-full md:w-auto flex items-center justify-center gap-2 py-3 px-6 bg-red-50 text-red-600 font-bold uppercase tracking-widest text-[11px] rounded-xl hover:bg-red-100 hover:text-red-700 transition-colors border border-red-100 active:scale-95"
                        >
                            <FaTrash /> Hapus Akun
                        </button>
                    </div>
                </motion.div>

            </main>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-white rounded-[2rem] shadow-2xl max-w-sm w-full p-8 overflow-hidden relative border border-gray-100"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-100 rounded-bl-full -mr-16 -mt-16 z-0"></div>

                        <div className="relative z-10 text-center">
                            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-red-100 shadow-sm">
                                <FaExclamationTriangle className="text-red-500 text-2xl" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 tracking-tight mb-2">Konfirmasi Akhir</h3>
                            <p className="text-xs font-medium text-gray-500 mb-8 leading-relaxed">
                                Tindakan ini tidak dapat dibatalkan. Riwayat pengguna dan pelaporan akan dihapus total dari peladen utama kami. Lanjutkan?
                            </p>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handleDeleteAccount}
                                    className="w-full py-4 bg-red-500 text-white text-[11px] rounded-2xl font-bold uppercase tracking-widest hover:bg-red-600 active:scale-95 transition-all shadow-[0_8px_30px_rgba(159,28,25,0.2)]"
                                >
                                    Verifikasi Penghapusan
                                </button>
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="w-full py-4 bg-white text-gray-500 border border-gray-200 text-[11px] rounded-2xl font-bold uppercase tracking-widest hover:bg-gray-50 hover:text-gray-900 active:scale-95 transition-all"
                                >
                                    Batal, Kembali
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

        </div>
    );
}
