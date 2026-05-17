"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { FaBell, FaCheck, FaInfoCircle, FaCheckCircle, FaThumbsUp, FaSync, FaShieldAlt, FaBullhorn, FaTimesCircle } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  report_id?: number;
  is_read: boolean;
  created_at: string;
}

interface NotificationBellProps {
  onViewReport?: (reportId: number) => void;
}

export default function NotificationBell({ onViewReport }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = async (notificationId: number) => {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_read", notificationId }),
      });
      fetchNotifications();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    setIsLoading(true);
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_all_read" }),
      });
      fetchNotifications();
    } catch (error) {
      console.error("Error marking all as read:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    if (notification.report_id && onViewReport) {
      onViewReport(notification.report_id);
      setIsOpen(false);
    }
  };

  const getNotificationIcon = (notification: Notification) => {
    const type = notification.type;
    // Gabungkan title + message untuk deteksi — handle data lama maupun baru
    const text = `${notification.title ?? ''} ${notification.message ?? ''}`.toLowerCase();

    if (type === 'broadcast') {
      return { icon: <FaBullhorn className="text-lg" />, color: 'text-red-500', bg: 'bg-red-50' };
    }

    // Deteksi dari konten teks (title atau message)
    if (text.includes('disetujui')) {
      return { icon: <FaThumbsUp className="text-lg" />, color: 'text-green-600', bg: 'bg-green-50' };
    }
    if (text.includes('ditangani') || text.includes('diproses') || text.includes('in_progress') || text.includes('sedang')) {
      return { icon: <FaSync className="text-lg" />, color: 'text-blue-500', bg: 'bg-blue-50' };
    }
    if (text.includes('selesai') || text.includes('completed')) {
      return { icon: <FaCheckCircle className="text-lg" />, color: 'text-teal-600', bg: 'bg-teal-50' };
    }
    if (text.includes('terverifikasi') || text.includes('verified') || text.includes('diverifikasi')) {
      return { icon: <FaShieldAlt className="text-lg" />, color: 'text-indigo-600', bg: 'bg-indigo-50' };
    }
    if (text.includes('ditolak') || text.includes('palsu') || text.includes('false')) {
      return { icon: <FaTimesCircle className="text-lg" />, color: 'text-red-500', bg: 'bg-red-50' };
    }

    // Fallback untuk status_update yang tidak dikenali
    if (type === 'status_update') {
      return { icon: <FaInfoCircle className="text-lg" />, color: 'text-blue-400', bg: 'bg-blue-50' };
    }

    return { icon: <FaInfoCircle className="text-lg" />, color: 'text-gray-400', bg: 'bg-gray-50' };
  };

  // Bersihkan emoji dari teks (untuk data lama di DB yang masih pakai emoji)
  const stripEmoji = (text: string) =>
    text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FEFF}]/gu, '').trim();

  // Normalkan title lama "Status Laporan #X Diperbarui" → ambil dari message jika bisa
  const getDisplayTitle = (notification: Notification): string => {
    const title = notification.title ?? '';
    // Jika title masih format lama, derive dari message
    if (/^Status Laporan #\d+ Diperbarui$/i.test(title)) {
      const msg = (notification.message ?? '').toLowerCase();
      if (msg.includes('disetujui')) return 'Laporan Disetujui';
      if (msg.includes('ditangani') || msg.includes('diproses') || msg.includes('sedang')) return 'Laporan Sedang Ditangani';
      if (msg.includes('selesai')) return 'Laporan Selesai';
      if (msg.includes('terverifikasi') || msg.includes('diverifikasi')) return 'Laporan Terverifikasi';
      if (msg.includes('palsu') || msg.includes('ditolak')) return 'Laporan Ditolak';
    }
    return stripEmoji(title);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "Baru saja";
    if (minutes < 60) return `${minutes}mnt`;
    if (hours < 24) return `${hours}j`;
    if (days < 7) return `${days}hr`;
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 w-10 h-10 flex items-center justify-center bg-white border border-gray-200/80 hover:border-gray-300 rounded-full transition-all shadow-sm"
        aria-label="Notifications"
      >
        <FaBell className={`text-sm ${unreadCount > 0 ? "text-gray-900" : "text-gray-400"}`} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="fixed left-4 right-4 top-[84px] sm:absolute sm:left-auto sm:-right-2 sm:top-full sm:mt-4 sm:w-[380px] bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-gray-100 z-[9999] overflow-hidden sm:origin-top-right"
          >
            {/* Perhatikan logic right khusus untuk layar hp di atas, kita geser sedikit agar rapi secara visual */}
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between bg-white/90 backdrop-blur-xl">
              <div>
                <h3 className="font-bold text-gray-900 tracking-tight">Notifikasi</h3>
                <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mt-0.5">
                  {unreadCount} Pesan Baru
                </p>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  disabled={isLoading}
                  className="text-[10px] font-bold uppercase tracking-wider text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-lg active:scale-95"
                >
                  <FaCheck /> Tandai Dibaca
                </button>
              )}
            </div>

            <div className="max-h-[350px] overflow-y-auto no-scrollbar pb-2">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className="px-5 py-4 hover:bg-gray-50 cursor-pointer transition-colors relative group"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`mt-0.5 shrink-0 ${!notification.is_read ? 'opacity-100' : 'opacity-40'}`}>
                        {(() => {
                          const { icon, color, bg } = getNotificationIcon(notification);
                          return (
                            <div className={`w-8 h-8 rounded-full ${bg} flex items-center justify-center ${color}`}>
                              {icon}
                            </div>
                          );
                        })()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className={`text-sm font-bold leading-tight ${!notification.is_read ? "text-gray-900" : "text-gray-500"}`}>
                            {getDisplayTitle(notification)}
                          </p>
                          <p className="text-[10px] font-bold text-gray-400 shrink-0 pt-0.5">
                            {formatTime(notification.created_at)}
                          </p>
                        </div>
                        <p className={`text-xs leading-relaxed ${!notification.is_read ? "text-gray-600 font-medium" : "text-gray-400"}`}>
                          {stripEmoji(notification.message)}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0 mt-1.5"></div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-5 py-10 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                    <FaBell className="text-gray-300 text-xl" />
                  </div>
                  <p className="text-sm font-bold text-gray-900">Belum Ada Notifikasi</p>
                  <p className="text-xs text-gray-500 mt-1 max-w-[200px]">Semua pemberitahuan insiden akan muncul di sini.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
