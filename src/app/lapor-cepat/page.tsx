"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  FaCamera, FaMapMarkerAlt, FaExclamationTriangle,
  FaPhone, FaSpinner, FaArrowLeft, FaCheckCircle, FaUser
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import Toast from "@/components/Toast";
import { useToast } from "@/hooks/useToast";

const ReportMap = dynamic(() => import("@/components/ReportMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-gray-100 flex items-center justify-center rounded-2xl">
      <FaSpinner className="animate-spin text-red-500 text-3xl" />
    </div>
  ),
});

export default function LaporCepatPage() {
  const router = useRouter();
  const { toast, success, error, hideToast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [firePosition, setFirePosition] = useState<[number, number] | null>(null);
  const [reporterName, setReporterName] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("1");
  const [phone, setPhone] = useState("");
  const [kelurahanId, setKelurahanId] = useState("");
  const [kelurahanList, setKelurahanList] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchKelurahan = async () => {
      try {
        const response = await fetch("/api/kelurahan");
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setKelurahanList(data.data);
            const plajuDarat = data.data.find((kel: any) => kel.name.toLowerCase().includes("plaju darat"));
            if (plajuDarat) setKelurahanId(plajuDarat.id.toString());
          }
        }
      } catch { }
    };
    fetchKelurahan();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/disaster-categories");
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setCategories(data.data);
            if (data.data.length > 0) {
              setCategoryId(data.data[0].id.toString());
            }
          }
        }
      } catch { }
    };
    fetchCategories();
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        error("Ukuran foto maksimal 5MB");
        return;
      }
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const validateForm = () => {
    if (!photo) return "Mohon unggah foto kejadian darurat.";
    if (!firePosition) return "Mohon tentukan lokasi kejadian di peta.";
    if (!address.trim()) return "Mohon masukkan alamat/patokan lokasi.";
    if (!description.trim()) return "Mohon tuliskan detail kejadian.";
    if (!kelurahanId) return "Mohon pilih wilayah/kelurahan.";
    if (!reporterName.trim()) return "Mohon masukkan nama Anda.";
    if (!phone.trim()) return "Mohon masukkan nomor WhatsApp Anda.";

    const phoneRegex = /^[0-9]{10,15}$/;
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      return "Nomor WhatsApp tidak valid (harus 10-15 digit angka).";
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      error(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload gambar ke server
      const uploadFormData = new FormData();
      uploadFormData.append("file", photo!);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      });

      if (!uploadRes.ok) throw new Error("Gagal mengunggah foto");
      const uploadData = await uploadRes.json();
      const photoUrl = uploadData.url;

      // Submit laporan
      const reportFormData = new FormData();
      reportFormData.append("latitude", firePosition![0].toString());
      reportFormData.append("longitude", firePosition![1].toString());
      reportFormData.append("address", address);
      reportFormData.append("description", description);
      reportFormData.append("reporter_name", reporterName);
      reportFormData.append("category_id", categoryId);
      reportFormData.append("kelurahan_id", kelurahanId);
      reportFormData.append("phone_number", phone);
      reportFormData.append("photo_url", photoUrl);

      const reportRes = await fetch("/api/reports/guest", {
        method: "POST",
        body: reportFormData,
      });

      const reportData = await reportRes.json();

      if (!reportRes.ok) {
        throw new Error(reportData.message || "Gagal mengirim laporan");
      }

      setIsSuccess(true);
      success("Laporan darurat berhasil dikirim!");

    } catch (err: any) {
      error(err.message || "Terjadi kesalahan sistem. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <FaCheckCircle className="text-5xl text-green-500" />
          </motion.div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Laporan Diterima!</h1>
          <p className="text-gray-500 mb-8">
            Terima kasih! Laporan darurat Anda telah diteruskan ke Operator SiagaBencana. Petugas pemadam akan segera meluncur ke lokasi dan menghubungi nomor WA Anda.
          </p>
          <button
            onClick={() => router.push("/")}
            className="w-full py-4 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl transition-all"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-20 font-sans">
      {toast.show && <Toast {...toast} onClose={hideToast} />}

      {/* Header */}
      <header className="bg-red-600 text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-red-700 hover:bg-red-800 transition-colors"
          >
            <FaArrowLeft />
          </button>
          <div>
            <h1 className="font-bold text-lg leading-tight">Lapor Cepat Darurat</h1>
            <p className="text-[10px] text-red-200 uppercase tracking-widest font-semibold">Pelaporan Cepat Tanpa Login</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6 flex gap-3">
          <FaExclamationTriangle className="text-yellow-600 text-xl shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-800 leading-relaxed font-medium">
            Formulir ini khusus untuk <strong className="text-red-600">Keadaan Darurat Asli</strong>. Dilarang memberikan laporan palsu (Prank). Sistem mencatat data perangkat Anda.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Section 1: Foto */}
          <section className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
            <h2 className="text-base font-bold mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs">1</span>
              Foto Kejadian <span className="text-red-500">*</span>
            </h2>

            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              ref={fileInputRef}
              onChange={handlePhotoChange}
            />

            {!photoPreview ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="h-40 rounded-2xl border-2 border-dashed border-gray-300 hover:border-red-400 bg-gray-50 flex flex-col items-center justify-center cursor-pointer transition-colors group"
              >
                <div className="w-12 h-12 rounded-full bg-red-100 text-red-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <FaCamera className="text-xl" />
                </div>
                <p className="font-semibold text-gray-700">Ambil Foto Kejadian</p>
                <p className="text-xs text-gray-400 mt-1">Gunakan kamera langsung atau dari galeri</p>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden bg-black h-48 sm:h-64">
                <Image src={photoPreview} alt="Preview" fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                  className="absolute top-3 right-3 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-colors"
                >
                  <FaArrowLeft className="rotate-45" />
                </button>
              </div>
            )}
          </section>

          {/* Section 2: Lokasi */}
          <section className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
            <h2 className="text-base font-bold mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs">2</span>
              Lokasi Api <span className="text-red-500">*</span>
            </h2>

            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => {
                  if ('geolocation' in navigator) {
                    navigator.geolocation.getCurrentPosition(
                      (pos) => setFirePosition([pos.coords.latitude, pos.coords.longitude]),
                      (err) => alert("Gagal mendapatkan lokasi. Pastikan GPS aktif.")
                    );
                  }
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-xs font-bold tracking-wide uppercase text-white bg-gray-900 hover:bg-black rounded-xl transition-all shadow-sm active:scale-95"
              >
                <FaMapMarkerAlt /> Gunakan GPS
              </button>
            </div>

            <div className="relative z-0 h-[350px] md:h-[450px] w-full rounded-2xl overflow-hidden ring-1 ring-gray-200">
              <ReportMap
                firePosition={firePosition}
                setFirePosition={setFirePosition}
                categoryId={parseInt(categoryId, 10)}
                categoryIcon={categories.find(c => c.id.toString() === categoryId)?.icon}
              />
            </div>
            {firePosition && (
              <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100 flex gap-3 items-start">
                <FaMapMarkerAlt className="text-red-500 mt-1 shrink-0" />
                <p className="text-sm font-medium text-gray-700 leading-relaxed">
                  Lokasi Terpilih: {firePosition[0].toFixed(5)}, {firePosition[1].toFixed(5)}
                </p>
              </div>
            )}
          </section>

          {/* Section 3: Detail */}
          <section className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-5">
            <h2 className="text-base font-bold mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs">3</span>
              Detail Laporan <span className="text-red-500">*</span>
            </h2>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Kategori Kejadian</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm font-medium text-gray-900 transition-all"
                required
              >
                {categories.length === 0 ? (
                  <option value="1">🔥 Kebakaran lingkungan & lahan kecil</option>
                ) : (
                  categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Wilayah / Kelurahan</label>
              <select
                value={kelurahanId}
                onChange={(e) => setKelurahanId(e.target.value)}
                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm font-medium text-gray-900 transition-all"
                required
              >
                <option value="" disabled>-- Pilih Kelurahan --</option>
                {kelurahanList.map((kel) => (
                  <option key={kel.id} value={kel.id}>{kel.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Jalan / Patokan Lokasi</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Misal: Dekat gapura masuk / sebelah pos ronda"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm font-medium text-gray-900 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Ceritakan Situasinya</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Misal: Api mulai membesar di lahan kosong belakang sekolah..."
                rows={3}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm font-medium text-gray-900 transition-all resize-none"
              />
            </div>
          </section>

          {/* Section 4: Kontak */}
          <section className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-4">
            <h2 className="text-base font-bold mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs">4</span>
              Kontak & Identitas <span className="text-red-500">*</span>
            </h2>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Petugas butuh identitas dan nomor Anda untuk mengonfirmasi rute dan lokasi persis secara cepat.
            </p>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Panggilan / Lengkap</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FaUser className="text-gray-400 text-sm" />
                </div>
                <input
                  type="text"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  placeholder="Contoh: Pak Budi"
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none text-sm font-bold text-gray-900 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nomor WhatsApp Aktif</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FaPhone className="text-gray-400 text-sm" />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Contoh: 081234567890"
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-sm font-bold text-gray-900 transition-all"
                  required
                />
              </div>
            </div>
          </section>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:text-gray-500 text-white font-bold rounded-2xl shadow-lg hover:shadow-red-500/30 transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <FaSpinner className="animate-spin text-xl" />
                <span>MENGIRIM LAPORAN...</span>
              </>
            ) : (
              <span>KIRIM LAPORAN SEKARANG</span>
            )}
          </button>

        </form>
      </main>
    </div>
  );
}
