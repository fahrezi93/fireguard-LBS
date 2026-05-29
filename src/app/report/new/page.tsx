"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { NearestStationInfo } from "@/components/ReportMap";
import { useModal } from "@/hooks/useModal";
import { useToast } from "@/hooks/useToast";
import Modal from "@/components/Modal";
import Toast from "@/components/Toast";
import {
  FaMapMarkerAlt,
  FaArrowLeft,
  FaFireExtinguisher,
  FaClock,
  FaRoad,
  FaExclamationTriangle,
  FaTimes,
  FaFire,
  FaUser,
  FaCheckCircle,
  FaSpinner,
  FaCloudUploadAlt,
  FaChevronDown,
  FaCrosshairs
} from "react-icons/fa";

const MapWithNoSSR = dynamic(() => import("@/components/ReportMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-gray-50 flex items-center justify-center rounded-[2rem] border border-gray-100">
      <div className="text-center flex flex-col items-center">
        <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold tracking-wide text-gray-400 mt-4 uppercase">Memuat Peta</p>
      </div>
    </div>
  ),
});

function MapInstructions() {
  const [show, setShow] = useState(true);
  if (!show) return null;

  return (
    <div className="mt-4 bg-gray-900 rounded-2xl p-5 relative overflow-hidden select-none">
      <button onClick={() => setShow(false)} className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors z-10">
        <FaTimes className="text-sm" />
      </button>
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <FaExclamationTriangle className="text-red-500 text-sm" />
          <h3 className="text-sm font-bold text-white tracking-wide">Panduan Peta</h3>
        </div>
        <ul className="space-y-2.5">
          <li className="flex items-center gap-3 text-xs md:text-sm text-gray-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 shadow-[0_0_8px_rgba(159,28,25,0.6)]"></span>
            <span><strong className="text-white">Klik</strong> untuk menandai titik darurat.</span>
          </li>
          <li className="flex items-center gap-3 text-xs md:text-sm text-gray-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></span>
            <span><strong className="text-white">Seret marker</strong> untuk menyesuaikan posisi.</span>
          </li>
          <li className="flex items-center gap-3 text-xs md:text-sm text-gray-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-green-500 shrink-0 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
            <span>Gunakan <strong className="text-white">Lokasi Saya</strong> untuk akurasi GPS.</span>
          </li>
        </ul>
      </div>
      <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-red-500/20 blur-[50px] rounded-full pointer-events-none"></div>
    </div>
  );
}

function NearestStationInfoBox({ info }: { info: NearestStationInfo }) {
  const distanceInKm = (info.distance / 1000).toFixed(2);
  const timeInMinutes = Math.round(info.time / 60);

  return (
    <div className="mt-4 rounded-2xl bg-white border border-red-100 p-5 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 blur-[40px] pointer-events-none rounded-full"></div>
      
      <div className="flex items-center gap-3 mb-4 relative z-10">
        <div className="p-2 bg-red-50 text-red-600 rounded-xl">
          <FaFireExtinguisher className="text-base" />
        </div>
        <div>
          <h3 className="text-xs uppercase tracking-wider font-bold text-gray-400">Pos Pemadam Terdekat</h3>
          <p className="text-sm font-bold text-gray-900 leading-tight">{info.name}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 relative z-10">
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
          <p className="text-[10px] uppercase font-bold text-gray-400 mb-1 flex items-center gap-1.5"><FaRoad className="text-gray-400"/> Jarak</p>
          <p className="text-base font-bold text-gray-900 tracking-tight">{distanceInKm} km</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
          <p className="text-[10px] uppercase font-bold text-gray-400 mb-1 flex items-center gap-1.5"><FaClock className="text-gray-400"/> Estimasi</p>
          <p className="text-base font-bold text-gray-900 tracking-tight">~{timeInMinutes} Min</p>
        </div>
      </div>
    </div>
  );
}

export default function NewReportPage() {
  const router = useRouter();
  const { modal, error: showError } = useModal();
  const { toast, error: errorToast, hideToast } = useToast();

  const [firePosition, setFirePosition] = useState<[number, number] | null>(null);
  const [reporterPosition, setReporterPosition] = useState<[number, number] | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [contact, setContact] = useState("");
  const [categoryId, setCategoryId] = useState<number>(1);
  const [categories, setCategories] = useState<any[]>([]);
  const [kelurahanId, setKelurahanId] = useState<number | null>(null);
  const [kelurahanList, setKelurahanList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [nearestStation, setNearestStation] = useState<NearestStationInfo | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [isGettingFireLocation, setIsGettingFireLocation] = useState(false);
  const [isGettingMyLocation, setIsGettingMyLocation] = useState(false);
  const [geoPermissionState, setGeoPermissionState] = useState<PermissionState | "unknown" | "unsupported">("unknown");

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (!response.ok) router.replace("/login?redirect=/report/new");
      } catch {
        router.replace("/login?redirect=/report/new");
      } finally {
        setIsAuthenticating(false);
      }
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/disaster-categories");
        if (response.ok) {
          const data = await response.json();
          if (data.success) setCategories(data.data);
        }
      } catch {}
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchKelurahan = async () => {
      try {
        const response = await fetch("/api/kelurahan");
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setKelurahanList(data.data);
            const plajuDarat = data.data.find((kel: any) => kel.name.toLowerCase().includes("plaju darat"));
            if (plajuDarat) setKelurahanId((prev) => (prev === null ? plajuDarat.id : prev));
          }
        }
      } catch {}
    };
    fetchKelurahan();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
  };

  const GEO_OPTIONS: PositionOptions = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 };

  const getGeoPermissionState = useCallback(async (): Promise<PermissionState | "unknown" | "unsupported"> => {
    if (!navigator.geolocation) return "unsupported";
    if (!("permissions" in navigator) || typeof navigator.permissions?.query !== "function") return "unknown";
    try {
      const permission = await navigator.permissions.query({ name: "geolocation" as PermissionName });
      return permission.state;
    } catch {
      return "unknown";
    }
  }, []);

  useEffect(() => {
    let permissionStatus: PermissionStatus | null = null;

    const syncPermissionState = async () => {
      const state = await getGeoPermissionState();
      setGeoPermissionState(state);

      if (state === "unsupported" || !("permissions" in navigator)) return;

      try {
        permissionStatus = await navigator.permissions.query({ name: "geolocation" as PermissionName });
        setGeoPermissionState(permissionStatus.state);
        permissionStatus.onchange = () => {
          setGeoPermissionState(permissionStatus?.state ?? "unknown");
        };
      } catch {
        // Browser tertentu membatasi query permission sampai ada interaksi user.
      }
    };

    syncPermissionState();

    return () => {
      if (permissionStatus) {
        permissionStatus.onchange = null;
      }
    };
  }, [getGeoPermissionState]);

  const getCurrentPosition = useCallback(
    () =>
      new Promise<[number, number]>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => resolve([position.coords.latitude, position.coords.longitude]),
          (err) => reject(err),
          GEO_OPTIONS
        );
      }),
    []
  );

  const handleLocationError = (err: GeolocationPositionError) => {
    switch (err.code) {
      case err.PERMISSION_DENIED: errorToast("Izin lokasi ditolak. Klik ikon kunci di address bar browser, lalu ubah Location menjadi Allow."); break;
      case err.POSITION_UNAVAILABLE: errorToast("Lokasi tidak tersedia. Pastikan GPS aktif."); break;
      case err.TIMEOUT: errorToast("Waktu habis saat mencari lokasi."); break;
      default: errorToast("Gagal mendapatkan lokasi GPS.");
    }
  };

  const requestLocation = async (onSuccess: (pos: [number, number]) => void, setLoadingState: (v: boolean) => void) => {
    if (!navigator.geolocation) {
      setGeoPermissionState("unsupported");
      errorToast("Perangkat Anda tidak mendukung fitur GPS.");
      return;
    }

    setLoadingState(true);

    try {
      const coords = await getCurrentPosition();
      const latestPermissionState = await getGeoPermissionState();
      setGeoPermissionState(latestPermissionState === "unknown" ? "granted" : latestPermissionState);

      onSuccess(coords);
    } catch (err) {
      if (err && typeof err === "object" && "code" in err) {
        const geoErr = err as GeolocationPositionError;
        if (geoErr.code === geoErr.PERMISSION_DENIED) {
          setGeoPermissionState("denied");
        }
        handleLocationError(err as GeolocationPositionError);
      } else {
        errorToast("Gagal mendapatkan lokasi GPS.");
      }
    } finally {
      setLoadingState(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firePosition) return setError("Titik koordinat kejadian belum di-set pada peta.");
    setIsLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("fireLatitude", firePosition[0].toString());
    formData.append("fireLongitude", firePosition[1].toString());
    if (reporterPosition) {
      formData.append("reporterLatitude", reporterPosition[0].toString());
      formData.append("reporterLongitude", reporterPosition[1].toString());
    }
    formData.append("description", description);
    formData.append("address", address);
    if (file) formData.append("media", file);
    formData.append("notes", notes);
    formData.append("contact", contact);
    formData.append("categoryId", categoryId.toString());
    if (kelurahanId) formData.append("kelurahanId", kelurahanId.toString());

    try {
      const response = await fetch("/api/reports", { method: "POST", body: formData });
      if (!response.ok) {
        const data = await response.json();
        if (response.status === 401) {
          showError("Sesi Berakhir", "Sesi Anda telah berakhir.", () => router.push("/login"));
          return;
        }
        throw new Error(data.message || "Gagal mengirim laporan.");
      }
      
      // Langsung dialihkan (redirect) ke dashboard
      router.push("/dashboard");
    } catch (err: any) {
      errorToast(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthenticating) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8F9FA]">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans text-gray-900 selection:bg-red-500/30">
      <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-40 px-6 lg:px-8 flex items-center justify-between transition-all">
        <button onClick={() => router.back()} className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-wider rounded-xl hover:bg-gray-50">
          <FaArrowLeft className="text-sm" /> <span>Kembali</span>
        </button>
        <div className="flex items-center gap-3">
            <div className="bg-red-500 p-2.5 rounded-xl shadow-sm text-white">
              <FaFireExtinguisher className="text-lg" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900 leading-none">Laporan Baru.</h1>
            </div>
        </div>
        <div className="w-[88px] invisible"></div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* Lokasi Peta (Kiri) */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-gray-900 mb-1">Geolokasi</h2>
              <p className="text-sm text-gray-500">Tentukan titik presisi lokasi kejadian darurat.</p>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-2 relative">
                <div className="h-[460px] w-full rounded-[1.5rem] overflow-hidden bg-gray-50 relative z-0">
                  <MapWithNoSSR
                    firePosition={firePosition}
                    setFirePosition={setFirePosition}
                    reporterPosition={reporterPosition}
                    setReporterPosition={setReporterPosition}
                    onNearestStationFound={setNearestStation}
                    categoryId={categoryId}
                    categoryIcon={categories.find((c) => c.id === categoryId)?.icon}
                  />
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => requestLocation(setFirePosition, setIsGettingFireLocation)}
                  disabled={isGettingFireLocation || isGettingMyLocation}
                  className="flex-1 flex max-w-sm items-center justify-center gap-2.5 px-6 py-3.5 text-sm font-bold tracking-wide uppercase text-white bg-gray-900 hover:bg-black rounded-2xl transition-all shadow-sm active:scale-95 disabled:opacity-50"
                >
                  {isGettingFireLocation ? <FaSpinner className="animate-spin text-lg" /> : <><FaCrosshairs className="text-lg text-gray-400" /> Set Lokasi GPS</>}
                </button>
                <button
                  type="button"
                  onClick={() => requestLocation(setReporterPosition, setIsGettingMyLocation)}
                  disabled={isGettingMyLocation || isGettingFireLocation}
                  className="flex-1 flex max-w-sm items-center justify-center gap-2.5 px-6 py-3.5 text-sm font-bold tracking-wide uppercase text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-2xl transition-all active:scale-95 disabled:opacity-50"
                >
                  {isGettingMyLocation ? <FaSpinner className="animate-spin text-lg" /> : <><FaUser className="text-lg text-gray-400" /> Posisi Saya</>}
                </button>
            </div>

            <p className="text-xs font-semibold text-gray-500">
              Klik tombol lokasi, lalu pilih <span className="text-gray-900">Izinkan</span> saat popup izin lokasi browser muncul.
            </p>

            {geoPermissionState === "denied" && (
              <div className="px-4 py-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
                Izin lokasi browser sedang ditolak. Klik ikon kunci di address bar, ubah Location ke Allow, lalu klik tombol lokasi lagi.
              </div>
            )}

            {/* Koordinat Indicators */}
            <div className="flex flex-col gap-2">
                {firePosition && (
                  <div className="flex items-center gap-3 px-5 py-3 bg-gray-900 text-white rounded-2xl">
                    <FaCheckCircle className="text-green-500 shrink-0" />
                    <span className="text-xs font-mono tracking-wider opacity-90 truncate">Koor Darurat: {firePosition[0].toFixed(5)}, {firePosition[1].toFixed(5)}</span>
                  </div>
                )}
                {reporterPosition && (
                  <div className="flex items-center gap-3 px-5 py-3 bg-white border border-gray-200 text-gray-700 rounded-2xl">
                    <FaCheckCircle className="text-blue-500 shrink-0" />
                    <span className="text-xs font-mono tracking-wider truncate">Koor Pelapor: {reporterPosition[0].toFixed(5)}, {reporterPosition[1].toFixed(5)}</span>
                  </div>
                )}
            </div>

            <MapInstructions />
            {nearestStation && <NearestStationInfoBox info={nearestStation} />}
          </div>

          {/* Form Detail Darurat (Kanan) */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-gray-900 mb-1">Form Darurat</h2>
              <p className="text-sm text-gray-500">Lengkapi data untuk mempercepat respons.</p>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-6">
              
              {/* Field: Kategori */}
              <div>
                <label htmlFor="category" className="block text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-2">Jenis Insiden <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select
                    id="category"
                    value={categoryId}
                    onChange={(e) => setCategoryId(Number(e.target.value))}
                    className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-900 text-sm font-semibold rounded-2xl block p-4 pr-10 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 focus:bg-white transition-all outline-none"
                    required
                  >
                    {categories.length === 0 ? (
                      <option value="1">Darurat Umum</option>
                    ) : (
                      categories.map((category) => (
                        <option key={category.id} value={category.id}>{category.icon}  {category.name}</option>
                      ))
                    )}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                    <FaChevronDown className="text-gray-400 text-xs" />
                  </div>
                </div>
              </div>

               {/* Field: Kelurahan */}
               <div>
                <label htmlFor="kelurahan" className="block text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-2">Wilayah / Kelurahan <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select
                    id="kelurahan"
                    value={kelurahanId || ""}
                    onChange={(e) => setKelurahanId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-900 text-sm font-semibold rounded-2xl block p-4 pr-10 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 focus:bg-white transition-all outline-none"
                    required
                  >
                    <option value="" disabled>-- Pilih Kelurahan --</option>
                    {kelurahanList.map((kel) => (
                      <option key={kel.id} value={kel.id}>{kel.name}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                    <FaChevronDown className="text-gray-400 text-xs" />
                  </div>
                </div>
              </div>

              {/* Field: Alamat */}
              <div>
                <label htmlFor="address" className="block text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-2">Jalan / Patokan</label>
                <input
                  type="text"
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm font-semibold rounded-2xl block p-4 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 focus:bg-white transition-all outline-none placeholder:text-gray-400 placeholder:font-medium"
                  placeholder="Mis: Samping SPBU Cempaka"
                />
              </div>

              {/* Field: Deskripsi */}
              <div>
                <label htmlFor="description" className="block text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-2">Rincian Situasi <span className="text-red-500">*</span></label>
                <textarea
                  id="description"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm font-semibold rounded-2xl block p-4 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 focus:bg-white transition-all outline-none resize-none placeholder:text-gray-400 placeholder:font-medium"
                  placeholder="Deskripsikan apa yang terbakar dan skalanya..."
                  required
                />
              </div>

              {/* Divider */}
              <div className="h-px bg-gray-100 my-2"></div>

              {/* Field: File Upload */}
              <div>
                <label className="block text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-2">Foto Kejadian (Opsional)</label>
                <div className="relative group">
                  <input
                    type="file"
                    id="media"
                    onChange={handleFileChange}
                    accept="image/*,video/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className={`w-full border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center transition-all ${file ? "border-gray-900 bg-gray-50" : "border-gray-200 bg-white group-hover:border-gray-300 group-hover:bg-gray-50"}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${file ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-400"}`}>
                      {file ? <FaCheckCircle className="text-lg" /> : <FaCloudUploadAlt className="text-lg" />}
                    </div>
                    <span className="text-xs font-bold text-gray-900 text-center truncate max-w-full px-2">
                      {file ? file.name : "Ketuk untuk upload foto/video"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

             {/* Error Message */}
             {error && (
                <div className="px-5 py-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-semibold text-center flex items-center justify-center gap-2">
                  <FaExclamationTriangle className="text-red-500 shrink-0" />
                  {error}
                </div>
              )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading || !firePosition}
                className="w-full flex items-center justify-center gap-3 bg-red-600 hover:bg-red-700 text-white text-sm font-bold uppercase tracking-widest py-4 md:py-5 rounded-2xl transition-all shadow-[0_8px_30px_rgba(220,38,38,0.2)] hover:shadow-[0_8px_40px_rgba(220,38,38,0.3)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {isLoading ? (
                  <><FaSpinner className="animate-spin text-lg" /> Memproses...</>
                ) : (
                  <><FaFireExtinguisher className="text-lg opacity-80" /> Kirim Darurat</>
                )}
              </button>
              <p className="text-center text-[10px] uppercase font-bold tracking-widest text-gray-400 mt-4 leading-relaxed">
                Penyalahgunaan sistem mengancam jiwa pihak yang benar-benar membutuhkan.
              </p>
            </div>

          </div>
        </form>
      </main>

      {modal.show && (
        <Modal type={modal.type} title={modal.title} message={modal.message} onConfirm={modal.onConfirm} onCancel={modal.onCancel} confirmText={modal.confirmText} cancelText={modal.cancelText} />
      )}
      {toast.show && <Toast type={toast.type} message={toast.message} onClose={hideToast} />}
    </div>
  );
}
