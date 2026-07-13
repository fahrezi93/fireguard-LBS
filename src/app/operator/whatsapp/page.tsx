"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FaWhatsapp, FaQrcode, FaCheckCircle, FaExclamationTriangle, FaSignOutAlt, FaSpinner, FaArrowLeft } from "react-icons/fa";
import { useToast } from "@/hooks/useToast";
import Toast from "@/components/Toast";
import OperatorLayout from "@/components/OperatorLayout";

export default function OperatorWhatsAppPage() {
  const [status, setStatus] = useState<"loading" | "connected" | "disconnected" | "error">("loading");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { toast, success, error, hideToast } = useToast();
  const router = useRouter();

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/operator/whatsapp/status");
      const data = await res.json();
      if (res.ok) {
        setStatus(data.status);
      } else {
        setStatus("error");
      }
    } catch (e) {
      setStatus("error");
    }
  };

  const fetchQr = async () => {
    try {
      const res = await fetch("/api/operator/whatsapp/qr");
      const data = await res.json();
      if (res.ok && data.status === "ready" && data.qr) {
        setQrCode(data.qr);
        setStatus("disconnected");
      } else if (data.status === "connected") {
        setStatus("connected");
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Polling status and QR every 5 seconds
    const interval = setInterval(() => {
      fetchStatus();
      if (status !== "connected") {
        fetchQr();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [status]);

  const handleLogout = async () => {
    if (!confirm("Yakin ingin mengeluarkan nomor WhatsApp pengirim saat ini? Anda harus melakukan scan QR ulang setelah ini.")) return;
    setIsLoggingOut(true);
    try {
      const res = await fetch("/api/operator/whatsapp/logout", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        success("Berhasil logout. Menyiapkan QR code baru...");
        setStatus("loading");
        setQrCode(null);
        setTimeout(() => {
          fetchQr();
        }, 3000);
      } else {
        error(data.message || "Gagal melakukan logout.");
      }
    } catch (e) {
      error("Terjadi kesalahan server saat logout.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <OperatorLayout>
      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-200/70 p-4 sticky top-0 z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center shadow-inner border border-green-200/50">
            <FaWhatsapp className="text-xl" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Manajemen WhatsApp
            </h2>
            <p className="text-xs font-medium text-gray-500 mt-0.5">Sistem Notifikasi</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">WhatsApp Sender</h2>
          <p className="text-gray-500 mt-2 text-sm">
            Kelola nomor pengirim WhatsApp resmi SiagaBencana. Sistem akan menggunakan nomor ini untuk mengirimkan OTP dan notifikasi laporan ke pelapor.
          </p>
        </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Status Koneksi</h2>
            <p className="text-xs text-gray-500">Status realtime dari server WhatsApp (Baileys)</p>
          </div>
          <div className="flex items-center gap-2">
            {status === "connected" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wide">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                Terhubung
              </span>
            )}
            {status === "disconnected" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold uppercase tracking-wide">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                Terputus / Scan QR
              </span>
            )}
            {status === "loading" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wide">
                <FaSpinner className="animate-spin" />
                Memuat...
              </span>
            )}
            {status === "error" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-100 text-red-700 text-xs font-bold uppercase tracking-wide">
                <FaExclamationTriangle />
                Server Mati
              </span>
            )}
          </div>
        </div>

        <div className="p-8">
          {status === "connected" ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                <FaCheckCircle className="text-4xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">WhatsApp Berhasil Terhubung</h3>
              <p className="text-gray-500 max-w-md mb-8">
                Sistem Notifikasi WhatsApp saat ini sudah aktif dan berjalan normal. OTP dan update laporan akan dikirim melalui nomor ini.
              </p>
              
              <button 
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-semibold transition-all active:scale-95 disabled:opacity-50"
              >
                {isLoggingOut ? <FaSpinner className="animate-spin" /> : <FaSignOutAlt />}
                {isLoggingOut ? "Sedang Logout..." : "Ganti Nomor Pengirim"}
              </button>
            </div>
          ) : status === "error" ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
                <FaExclamationTriangle className="text-4xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Server WhatsApp Tidak Merespons</h3>
              <p className="text-gray-500 max-w-md mb-8">
                Pastikan instance wa-server berjalan di port 3001. Jika server di-restart, tunggu beberapa saat hingga server kembali aktif.
              </p>
              <button 
                onClick={fetchStatus}
                className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white hover:bg-black rounded-xl font-semibold transition-all"
              >
                Coba Lagi
              </button>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center justify-center md:justify-start gap-2">
                  <FaQrcode className="text-gray-400" /> Tautkan Perangkat Baru
                </h3>
                <ol className="text-left text-gray-600 space-y-4 list-decimal pl-5 marker:font-bold marker:text-gray-900">
                  <li>Buka aplikasi WhatsApp di HP pengirim resmi.</li>
                  <li>Ketuk Menu (titik tiga) di Android, atau Pengaturan di iPhone.</li>
                  <li>Pilih <strong>Perangkat Taut</strong> (Linked Devices).</li>
                  <li>Ketuk <strong>Tautkan Perangkat</strong>.</li>
                  <li>Arahkan kamera ke layar ini untuk memindai kode QR.</li>
                </ol>
                <p className="mt-6 text-xs text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100 font-medium">
                  <strong>Peringatan:</strong> Pastikan Anda menggunakan nomor khusus notifikasi (bot). Hindari menggunakan nomor pribadi operator.
                </p>
              </div>
              
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="p-4 bg-white border border-gray-200 shadow-sm rounded-2xl relative w-64 h-64 flex items-center justify-center">
                  {qrCode ? (
                    <img src={qrCode} alt="WhatsApp QR Code" className="w-full h-full object-contain" />
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                      <FaSpinner className="animate-spin text-3xl" />
                      <span className="text-xs font-semibold uppercase tracking-widest">Membuat QR...</span>
                    </div>
                  )}
                </div>
                <p className="mt-4 text-xs text-gray-400 font-medium text-center">
                  QR Code otomatis diperbarui setiap 5 detik.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {toast.show && <Toast type={toast.type} message={toast.message} onClose={hideToast} />}
      </div>
    </OperatorLayout>
  );
}
