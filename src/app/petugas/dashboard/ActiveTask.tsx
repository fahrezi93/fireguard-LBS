import { useState } from "react";
import dynamic from "next/dynamic";
import { FaMapMarkerAlt, FaPhoneAlt, FaCheck, FaTimes, FaCamera, FaSpinner, FaExclamationTriangle } from "react-icons/fa";
import { m, AnimatePresence } from "framer-motion";

const SimpleMap = dynamic(() => import("@/components/SimpleMap"), { ssr: false });

export default function ActiveTask({ task, onStatusUpdate }: { task: any, onStatusUpdate: (status: string, notes?: string, photoBase64?: string) => void }) {
  const [isCompleting, setIsCompleting] = useState(false);
  const [isFalseReport, setIsFalseReport] = useState(false);
  const [notes, setNotes] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  if (!task) {
    return (
      <div className="bg-white border border-neutral-100/90 p-8 sm:p-12 md:p-16 rounded-2xl text-center shadow-2xs">
        <div className="inline-flex items-center justify-center w-14 h-14 sm:w-20 sm:h-20 bg-green-50 rounded-full border border-green-100 mb-4 sm:mb-5">
          <FaCheck className="text-green-500 text-xl sm:text-2xl" />
        </div>
        <h3 className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight mb-1.5 sm:mb-2">Tidak Ada Tugas Aktif</h3>
        <p className="text-neutral-500 text-xs sm:text-sm max-w-sm mx-auto leading-relaxed">Anda saat ini sedang tidak menangani laporan apapun. Tetap siaga menunggu laporan masuk.</p>
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
        if (res.ok) onStatusUpdate("accepted");
      } else if (action === "request-backup") {
        const res = await fetch("/api/petugas/request-backup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reportId: task.id })
        });
        if (res.ok) alert("Permintaan bantuan telah dikirim ke operator!");
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
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-white border border-neutral-200 shadow-sm rounded-2xl overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-neutral-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-50">
        <div>
          <span className="inline-block px-2.5 py-1 bg-red-100 text-red-700 text-xs font-bold uppercase tracking-wider rounded-md mb-2">Tugas Saat Ini</span>
          <h2 className="text-lg sm:text-xl font-bold text-neutral-900">{task.category_name}</h2>
          <p className="text-sm text-neutral-600 mt-1 flex items-start gap-1.5"><FaMapMarkerAlt className="mt-1 text-red-500" /> {task.address}</p>
        </div>
        <div className="text-right sm:text-right text-left">
          <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">Status</p>
          <p className={`font-bold text-lg ${task.status_petugas === "accepted" ? "text-blue-600" : "text-orange-500"}`}>
            {task.status_petugas === "accepted" ? "SEDANG DITANGANI" : "MENUNGGU DITERIMA"}
          </p>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="bg-neutral-50 rounded-xl p-4 mb-4 border border-neutral-100">
              <h3 className="text-sm font-bold text-neutral-800 mb-3 border-b pb-2">Informasi Pelapor</h3>
              <p className="text-sm text-neutral-700"><span className="font-semibold w-24 inline-block">Nama:</span> {task.guest_name || task.registered_name || "Tanpa Nama"}</p>
              <p className="text-sm text-neutral-700 mt-1"><span className="font-semibold w-24 inline-block">Kontak:</span> {task.contact || task.registered_phone || "-"}</p>
              <p className="text-sm text-neutral-700 mt-1"><span className="font-semibold w-24 inline-block">Dilaporkan:</span> {new Date(task.dispatched_at || task.created_at).toLocaleString('id-ID')}</p>
            </div>
            
            <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-100">
              <h3 className="text-sm font-bold text-neutral-800 mb-3 border-b pb-2">Deskripsi Kejadian</h3>
              <p className="text-sm text-neutral-700 whitespace-pre-wrap">{task.description || "Tidak ada deskripsi."}</p>
            </div>
          </div>
          
          <div className="h-64 sm:h-full min-h-[250px] rounded-xl overflow-hidden border border-neutral-200">
             {(task.fire_latitude && task.fire_longitude) ? (
                <SimpleMap latitude={Number(task.fire_latitude)} longitude={Number(task.fire_longitude)} zoom={16} />
             ) : (
                <div className="w-full h-full bg-neutral-100 flex items-center justify-center text-neutral-400">
                  Koordinat tidak tersedia
                </div>
             )}
          </div>
        </div>

        <div className="mt-8 border-t border-neutral-100 pt-6">
          {task.status_petugas !== "accepted" ? (
            <button 
              onClick={() => handleAction("accept")} 
              disabled={loadingAction === "accept"}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-md transition-colors flex items-center justify-center gap-2"
            >
              {loadingAction === "accept" ? <FaSpinner className="animate-spin" /> : <FaCheck />}
              TERIMA TUGAS INI
            </button>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <button 
                onClick={() => setIsCompleting(true)}
                className="py-3 sm:py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm sm:text-base shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                <FaCheck /> TUGAS SELESAI
              </button>
              <button 
                onClick={() => setIsFalseReport(true)}
                className="py-3 sm:py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-sm sm:text-base shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                <FaTimes /> LAPORAN PALSU
              </button>
              <button 
                onClick={() => handleAction("request-backup")}
                disabled={loadingAction === "request-backup" || task.needs_backup}
                className={`py-3 sm:py-4 ${task.needs_backup ? 'bg-neutral-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'} text-white rounded-xl font-bold text-sm sm:text-base shadow-sm transition-colors flex items-center justify-center gap-2`}
              >
                {loadingAction === "request-backup" ? <FaSpinner className="animate-spin" /> : <FaExclamationTriangle />}
                {task.needs_backup ? 'BANTUAN DIKIRIM' : 'MINTA BANTUAN'}
              </button>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {(isCompleting || isFalseReport) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <m.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
              <h3 className="text-lg font-bold mb-2">{isCompleting ? "Selesaikan Laporan" : "Tandai Laporan Palsu"}</h3>
              <p className="text-sm text-neutral-500 mb-4">
                {isCompleting ? "Silakan unggah foto bukti penyelesaian dan tambahkan catatan." : "Tambahkan alasan mengapa ini ditandai sebagai laporan palsu."}
              </p>
              
              <textarea 
                className="w-full p-3 border border-neutral-200 rounded-xl mb-4 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-h-[100px]"
                placeholder="Catatan petugas (opsional)..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />

              {isCompleting && (
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2">Foto Bukti (Opsional namun disarankan)</label>
                  {photoPreview ? (
                    <div className="relative rounded-xl overflow-hidden border border-neutral-200 bg-neutral-100 aspect-video">
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-contain" />
                      <button onClick={() => setPhotoPreview(null)} className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-md">
                        <FaTimes />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-neutral-300 rounded-xl cursor-pointer hover:bg-neutral-50 transition-colors">
                      <FaCamera className="text-2xl text-neutral-400 mb-2" />
                      <span className="text-sm text-neutral-500 font-medium">Ketuk untuk Ambil Foto</span>
                      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoCapture} />
                    </label>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => { setIsCompleting(false); setIsFalseReport(false); setPhotoPreview(null); setNotes(""); }} className="px-4 py-2 font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors">
                  Batal
                </button>
                <button 
                  onClick={() => handleAction(isCompleting ? "complete" : "false_report")}
                  disabled={loadingAction === "complete" || loadingAction === "false_report"}
                  className={`px-6 py-2 font-bold text-white rounded-lg transition-colors flex items-center gap-2 ${isCompleting ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-orange-500 hover:bg-orange-600'}`}
                >
                  {(loadingAction === "complete" || loadingAction === "false_report") ? <FaSpinner className="animate-spin" /> : null}
                  Simpan
                </button>
              </div>
            </m.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
