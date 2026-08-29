"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { 
  FaMapMarkerAlt, 
  FaPhoneAlt, 
  FaCheck, 
  FaTimes, 
  FaCamera, 
  FaSpinner, 
  FaExclamationTriangle,
  FaLocationArrow,
  FaFire,
  FaUser,
  FaClock,
  FaCheckCircle,
  FaExternalLinkAlt
} from "react-icons/fa";
import { m, AnimatePresence } from "framer-motion";

const SimpleMap = dynamic(() => import("@/components/SimpleMap"), { ssr: false });

export default function ActiveTask({ 
  task, 
  onStatusUpdate 
}: { 
  task: any; 
  onStatusUpdate: (status: string, notes?: string, photoBase64?: string) => void;
}) {
  const [isCompleting, setIsCompleting] = useState(false);
  const [isFalseReport, setIsFalseReport] = useState(false);
  const [notes, setNotes] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  if (!task) {
    return (
      <div className="bg-white border border-neutral-100 rounded-3xl p-8 sm:p-12 text-center shadow-xs">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full border border-emerald-100 mb-4 shadow-xs">
          <FaCheck className="text-2xl" />
        </div>
        <h3 className="text-base sm:text-lg font-bold text-neutral-900 mb-1.5">Tidak Ada Tugas Aktif</h3>
        <p className="text-neutral-500 text-xs sm:text-sm max-w-sm mx-auto leading-relaxed">
          Anda saat ini sedang tidak menangani laporan apapun. Tetap siaga menunggu laporan masuk.
        </p>
      </div>
    );
  }

  const handleAction = async (action: string) => {
    setLoadingAction(action);
    try {
      if (action === "accept") {
        const res = await fetch("/api/petugas/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reportId: task.id })
        });
        if (res.ok) {
          onStatusUpdate("accepted");
        } else {
          const errData = await res.json().catch(() => ({}));
          alert(errData.message || "Gagal menerima tugas. Mungkin sudah diambil oleh petugas lain.");
          onStatusUpdate("refresh");
        }
      } else if (action === "request-backup") {
        const res = await fetch("/api/petugas/request-backup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reportId: task.id })
        });
        if (res.ok) alert("Permintaan bantuan telah dikirim ke operator!");
      } else if (action === "arrived") {
        await onStatusUpdate("arrived");
      } else if (action === "complete") {
        await onStatusUpdate("completed", notes, photoPreview || undefined);
        setIsCompleting(false);
      } else if (action === "false_report") {
        await onStatusUpdate("false_report", notes);
        setIsFalseReport(false);
      }
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan.");
    } finally {
      setLoadingAction(null);
    }
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Kompresi gambar (maksimal lebar/tinggi 1280px)
        const MAX_DIMENSION = 1280;
        let width = img.width;
        let height = img.height;

        if (width > height && width > MAX_DIMENSION) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else if (height > MAX_DIMENSION) {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.7);
          setPhotoPreview(compressedDataUrl);
        } else {
          setPhotoPreview(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const openGoogleMaps = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, "_blank");
  };

  const isAccepted = task.status_petugas === "accepted";
  const isArrived = task.status_petugas === "arrived";
  const isPending = !task.status_petugas || task.status_petugas === "pending";

  const reporterContact = task.contact || task.registered_phone;

  return (
    <div className="bg-white border border-red-100 rounded-3xl shadow-sm overflow-hidden mb-6">
      
      {/* Top Banner Alert / Status Header */}
      <div className={`p-4 sm:p-5 border-b flex flex-col sm:flex-row justify-between sm:items-center gap-3 ${
        isPending 
          ? "bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border-amber-200"
          : isAccepted
          ? "bg-gradient-to-r from-blue-500/15 via-sky-500/10 to-blue-500/15 border-blue-200"
          : "bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/15 border-emerald-200"
      }`}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-red-600 flex items-center justify-center text-white shrink-0 shadow-xs mt-0.5">
            <FaFire className="text-lg" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-red-100 text-red-700">
                PANGGILAN DARURAT
              </span>
              <span className="text-xs text-neutral-500 font-medium">
                #{task.id}
              </span>
            </div>
            <h2 className="text-base sm:text-xl font-extrabold text-neutral-900 leading-tight">
              {task.category_name || "Laporan Darurat"}
            </h2>
          </div>
        </div>

        {/* Dynamic Status Badge */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between pt-2 sm:pt-0 border-t sm:border-0 border-neutral-200/50">
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider hidden sm:block">Status Penanganan</span>
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 shadow-2xs ${
            isPending
              ? "bg-amber-500 text-white animate-pulse"
              : isAccepted
              ? "bg-blue-600 text-white"
              : "bg-emerald-600 text-white"
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            {isPending ? "Menunggu Diterima" : isAccepted ? "Menuju Lokasi" : "Tiba di Lokasi"}
          </span>
        </div>
      </div>

      {/* Main Task Body */}
      <div className="p-4 sm:p-6 space-y-4">
        
        {/* Address Card with Map Link */}
        <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200/70">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <FaMapMarkerAlt className="text-red-500 text-base shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Lokasi Kejadian</p>
                <p className="text-sm font-semibold text-neutral-800 mt-0.5 leading-snug">
                  {task.address || "Lokasi spesifik belum tersedia"}
                </p>
              </div>
            </div>
            {task.fire_latitude && task.fire_longitude && (
              <button 
                onClick={() => openGoogleMaps(task.fire_latitude, task.fire_longitude)}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 rounded-xl text-xs font-bold transition-colors active:scale-95 shadow-2xs"
              >
                <FaLocationArrow className="text-[10px]" />
                <span className="hidden xs:inline">Navigasi</span>
              </button>
            )}
          </div>
        </div>

        {/* Reporter Info & Description Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          
          {/* Pelapor Info */}
          <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200/70">
            <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider mb-2.5 flex items-center gap-2">
              <FaUser className="text-neutral-400" /> Informasi Pelapor
            </h3>
            <div className="space-y-2 text-xs text-neutral-700">
              <div className="flex justify-between items-center py-1 border-b border-neutral-200/50">
                <span className="text-neutral-500">Nama Pelapor</span>
                <span className="font-semibold">{task.guest_name || task.registered_name || "Masyarakat / Anonim"}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-neutral-200/50">
                <span className="text-neutral-500">Waktu Lapor</span>
                <span className="font-medium">{new Date(task.dispatched_at || task.created_at).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-neutral-500">Nomor Kontak</span>
                {reporterContact ? (
                  <a 
                    href={`tel:${reporterContact}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition-colors shadow-2xs"
                  >
                    <FaPhoneAlt className="text-[10px]" /> {reporterContact}
                  </a>
                ) : (
                  <span className="text-neutral-400">-</span>
                )}
              </div>
            </div>
          </div>

          {/* Incident Description */}
          <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200/70 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider mb-2">
                Keterangan Kejadian
              </h3>
              <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed italic">
                {task.description ? `"${task.description}"` : "Tidak ada catatan tambahan dari pelapor."}
              </p>
            </div>
          </div>
        </div>

        {/* Map Preview */}
        <div className="rounded-2xl overflow-hidden border border-neutral-200/80 h-52 sm:h-64 relative shadow-2xs">
          {(task.fire_latitude && task.fire_longitude) ? (
            <SimpleMap latitude={Number(task.fire_latitude)} longitude={Number(task.fire_longitude)} zoom={16} />
          ) : (
            <div className="w-full h-full bg-neutral-100 flex items-center justify-center text-xs text-neutral-400 font-medium">
              Peta koordinat tidak tersedia
            </div>
          )}
        </div>

        {/* Emergency Action Buttons (Mobile-First Big Buttons) */}
        <div className="pt-2">
          {isPending ? (
            <button 
              onClick={() => handleAction("accept")} 
              disabled={loadingAction === "accept"}
              className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-2xl font-extrabold text-sm sm:text-base shadow-md hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2.5"
            >
              {loadingAction === "accept" ? (
                <FaSpinner className="animate-spin text-lg" />
              ) : (
                <FaCheckCircle className="text-lg" />
              )}
              <span>TERIMA TUGAS SEKARANG</span>
            </button>
          ) : isAccepted ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button 
                onClick={() => handleAction("arrived")} 
                disabled={loadingAction === "arrived"}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-2xl font-bold text-sm shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {loadingAction === "arrived" ? <FaSpinner className="animate-spin text-base" /> : <FaMapMarkerAlt className="text-base" />}
                <span>SUDAH TIBA DI LOKASI</span>
              </button>
              <button 
                onClick={() => openGoogleMaps(task.fire_latitude, task.fire_longitude)}
                className="w-full py-3.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-2xl font-bold text-sm shadow-xs transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <FaExternalLinkAlt className="text-xs" />
                <span>BUKA RUTE DI GOOGLE MAPS</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button 
                onClick={() => setIsCompleting(true)}
                className="py-3 sm:py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <FaCheck /> TUGAS SELESAI
              </button>
              <button 
                onClick={() => setIsFalseReport(true)}
                className="py-3 sm:py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-2xl font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <FaTimes /> LAPORAN PALSU
              </button>
              <button 
                onClick={() => handleAction("request-backup")}
                disabled={loadingAction === "request-backup" || task.needs_backup}
                className={`py-3 sm:py-3.5 ${
                  task.needs_backup 
                    ? 'bg-neutral-300 text-neutral-600 cursor-not-allowed' 
                    : 'bg-red-600 hover:bg-red-700 text-white'
                } rounded-2xl font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2`}
              >
                {loadingAction === "request-backup" ? <FaSpinner className="animate-spin" /> : <FaExclamationTriangle />}
                {task.needs_backup ? 'BANTUAN DIKIRIM' : 'MINTA BANTUAN'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Completion & False Report Dialog */}
      <AnimatePresence>
        {(isCompleting || isFalseReport) && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <m.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 10 }} 
              className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl border border-neutral-100"
            >
              <h3 className="text-base sm:text-lg font-extrabold text-neutral-900 mb-1">
                {isCompleting ? "Konfirmasi Tugas Selesai" : "Tandai Laporan Palsu"}
              </h3>
              <p className="text-xs text-neutral-500 mb-4 leading-relaxed">
                {isCompleting 
                  ? "Unggah foto bukti penanganan di lokasi dan tambahkan catatan akhir bila ada." 
                  : "Tambahkan alasan mengapa laporan ini ditandai sebagai laporan palsu/tidak valid."}
              </p>
              
              <textarea 
                className="w-full p-3 border border-neutral-200 rounded-2xl mb-4 text-xs sm:text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 min-h-[90px] resize-none"
                placeholder={isCompleting ? "Catatan penanganan di lapangan (opsional)..." : "Tuliskan alasan..."}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />

              {isCompleting && (
                <div className="mb-4">
                  <label className="block text-xs font-bold text-neutral-700 mb-2">Foto Dokumentasi Lapangan</label>
                  {photoPreview ? (
                    <div className="relative rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-100 aspect-video shadow-2xs">
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => setPhotoPreview(null)} 
                        className="absolute top-2 right-2 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 shadow-md transition-transform active:scale-95"
                      >
                        <FaTimes className="text-xs" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-neutral-300 rounded-2xl cursor-pointer hover:bg-neutral-50 hover:border-neutral-400 transition-colors">
                      <FaCamera className="text-xl text-neutral-400 mb-1.5" />
                      <span className="text-xs text-neutral-600 font-semibold">Ambil / Pilih Foto Dokumentasi</span>
                      <span className="text-[10px] text-neutral-400 mt-0.5">Kamera otomatis terkompresi</span>
                      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoCapture} />
                    </label>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 mt-5 pt-3 border-t border-neutral-100">
                <button 
                  onClick={() => { 
                    setIsCompleting(false); 
                    setIsFalseReport(false); 
                    setPhotoPreview(null); 
                    setNotes(""); 
                  }} 
                  className="px-4 py-2.5 font-semibold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-xl text-xs transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={() => handleAction(isCompleting ? "complete" : "false_report")}
                  disabled={loadingAction === "complete" || loadingAction === "false_report"}
                  className={`px-5 py-2.5 font-bold text-white rounded-xl text-xs transition-all active:scale-95 flex items-center gap-2 shadow-xs ${
                    isCompleting 
                      ? 'bg-emerald-600 hover:bg-emerald-700' 
                      : 'bg-orange-600 hover:bg-orange-700'
                  }`}
                >
                  {(loadingAction === "complete" || loadingAction === "false_report") ? <FaSpinner className="animate-spin text-xs" /> : null}
                  <span>{isCompleting ? "Selesaikan Laporan" : "Kirim Status"}</span>
                </button>
              </div>
            </m.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
