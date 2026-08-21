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
    <div className="mt-3 bg-slate-50 border border-slate-200/80 rounded-xl p-3 sm:p-4 relative select-none">
      <button 
        onClick={() => setShow(false)} 
        className="absolute top-2.5 right-2.5 text-gray-400 hover:text-gray-700 p-1 rounded-md transition-colors"
        aria-label="Tutup panduan"
      >
        <FaTimes className="text-xs" />
      </button>
      <div className="flex items-center gap-1.5 mb-1.5">
        <FaExclamationTriangle className="text-red-500 text-xs" />
        <h3 className="text-xs font-bold text-gray-900">Panduan Titik Lokasi</h3>
      </div>
      <ul className="space-y-1 text-[11px] sm:text-xs text-gray-600">
        <li className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
          <span><strong className="text-gray-900">Ketuk peta / seret marker merah</strong> ke titik lokasi kebakaran.</span>
        </li>
        <li className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-900 shrink-0"></span>
          <span>Gunakan tombol <strong className="text-gray-900">Set Lokasi GPS</strong> untuk akurasi instan.</span>
        </li>
      </ul>
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
          <p className="text-[10px] uppercase font-bold text-gray-400 mb-1 flex items-center gap-1.5"><FaRoad className="text-gray-400" /> Jarak</p>
          <p className="text-base font-bold text-gray-900 tracking-tight">{distanceInKm} km</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
          <p className="text-[10px] uppercase font-bold text-gray-400 mb-1 flex items-center gap-1.5"><FaClock className="text-gray-400" /> Estimasi</p>
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
      } catch { }
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
      } catch { }
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
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-gray-900 selection:bg-red-500/30 flex flex-col">
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

      {/* Sticky Header */}
      <header className="h-14 sm:h-16 bg-white/90 backdrop-blur-xl border-b border-gray-200/80 sticky top-0 z-20 px-3 sm:px-6 lg:px-8 flex items-center justify-between shadow-2xs">
        <div className="max-w-6xl w-full mx-auto flex items-center justify-between gap-2">
          <button 
            onClick={() => router.push("/dashboard")} 
            className="h-8 px-2.5 sm:px-3 sm:h-9 flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all active:scale-95 shrink-0"
            title="Kembali ke Dashboard"
          >
            <FaArrowLeft className="text-xs" /> <span className="hidden sm:inline">Dashboard</span>
          </button>
          
          <h1 className="text-xs sm:text-base md:text-lg font-bold tracking-tight text-gray-900 text-center truncate px-1">
            Buat Laporan Darurat
          </h1>
          
          <div className="shrink-0">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-red-50 text-red-600 border border-red-200">
              <FaFire className="text-[10px]" /> <span className="hidden xs:inline">Siaga</span> 24/7
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 flex-1">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">

          {/* Kolom Kiri: Peta & Lokasi */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200/80 p-3.5 sm:p-5 md:p-6 shadow-xs space-y-3.5 sm:space-y-4">
              {/* Card Section Header */}
              <div className="flex items-start gap-2.5 pb-2.5 border-b border-gray-100">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-red-50 text-red-600 font-extrabold flex items-center justify-center text-xs shrink-0 mt-0.5">
                  1
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm sm:text-base font-bold text-gray-900 leading-tight">Titik Lokasi Kejadian</h2>
                  <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">Tentukan titik kebakaran di peta atau via GPS</p>
                </div>
              </div>

              {/* Map Container */}
              <div className="rounded-xl overflow-hidden border border-gray-200 relative bg-gray-50">
                <div className="h-[280px] sm:h-[360px] md:h-[420px] w-full relative z-0">
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

              {/* Location Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => requestLocation(setFirePosition, setIsGettingFireLocation)}
                  disabled={isGettingFireLocation || isGettingMyLocation}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 text-xs sm:text-sm font-bold tracking-wide text-white bg-slate-900 hover:bg-black rounded-xl transition-all shadow-2xs active:scale-95 disabled:opacity-50"
                >
                  {isGettingFireLocation ? (
                    <FaSpinner className="animate-spin text-sm" />
                  ) : (
                    <>
                      <FaCrosshairs className="text-xs text-red-400" /> Set Lokasi GPS Kejadian
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => requestLocation(setReporterPosition, setIsGettingMyLocation)}
                  disabled={isGettingMyLocation || isGettingFireLocation}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 text-xs sm:text-sm font-bold tracking-wide text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-xl transition-all active:scale-95 disabled:opacity-50"
                >
                  {isGettingMyLocation ? (
                    <FaSpinner className="animate-spin text-sm" />
                  ) : (
                    <>
                      <FaUser className="text-xs text-gray-400" /> Set Posisi Saya Saat Ini
                    </>
                  )}
                </button>
              </div>

              {geoPermissionState === "denied" && (
                <div className="px-3.5 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
                  Izin GPS browser ditolak. Mohon izinkan akses lokasi di browser untuk mendapatkan koordinat presisi.
                </div>
              )}

              {/* Koordinat Indicators */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {firePosition ? (
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-mono">
                    <FaCheckCircle className="text-emerald-400 text-xs shrink-0" />
                    <span className="truncate">Api: {firePosition[0].toFixed(5)}, {firePosition[1].toFixed(5)}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs">
                    <FaExclamationTriangle className="text-red-500 text-xs shrink-0" />
                    <span>Titik api belum ditentukan</span>
                  </div>
                )}

                {reporterPosition && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-xs font-mono">
                    <FaCheckCircle className="text-blue-500 text-xs shrink-0" />
                    <span className="truncate">Pelapor: {reporterPosition[0].toFixed(5)}, {reporterPosition[1].toFixed(5)}</span>
                  </div>
                )}
              </div>

              <MapInstructions />
              {nearestStation && <NearestStationInfoBox info={nearestStation} />}
            </div>
          </div>

          {/* Kolom Kanan: Detail Informasi Kejadian */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200/80 p-4 sm:p-6 shadow-xs space-y-4">
              {/* Card Section Header */}
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 font-extrabold flex items-center justify-center text-xs shrink-0">
                  2
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-gray-900 leading-tight">Detail Insiden & Bukti</h2>
                  <p className="text-[11px] sm:text-xs text-gray-500">Lengkapi data untuk mempercepat koordinasi penanganan</p>
                </div>
              </div>

              {/* Field: Kategori */}
              <div className="space-y-1">
                <label htmlFor="category" className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Jenis Insiden <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="category"
                    value={categoryId}
                    onChange={(e) => setCategoryId(Number(e.target.value))}
                    className="w-full appearance-none bg-slate-50/70 border border-gray-200 text-gray-900 text-xs sm:text-sm font-medium rounded-xl px-3.5 py-2.5 pr-10 focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all outline-none"
                    required
                  >
                    {categories.length === 0 ? (
                      <option value="1">Darurat Umum</option>
                    ) : (
                      categories.map((category) => (
                        <option key={category.id} value={category.id}>{category.icon} {category.name}</option>
                      ))
                    )}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5">
                    <FaChevronDown className="text-gray-400 text-xs" />
                  </div>
                </div>
              </div>

              {/* Field: Kelurahan */}
              <div className="space-y-1">
                <label htmlFor="kelurahan" className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Wilayah / Kelurahan <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="kelurahan"
                    value={kelurahanId || ""}
                    onChange={(e) => setKelurahanId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full appearance-none bg-slate-50/70 border border-gray-200 text-gray-900 text-xs sm:text-sm font-medium rounded-xl px-3.5 py-2.5 pr-10 focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all outline-none"
                    required
                  >
                    <option value="" disabled>-- Pilih Kelurahan --</option>
                    {kelurahanList.map((kel) => (
                      <option key={kel.id} value={kel.id}>{kel.name}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5">
                    <FaChevronDown className="text-gray-400 text-xs" />
                  </div>
                </div>
              </div>

              {/* Field: Alamat */}
              <div className="space-y-1">
                <label htmlFor="address" className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Jalan / Patokan Lokasi
                </label>
                <input
                  type="text"
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-50/70 border border-gray-200 text-gray-900 text-xs sm:text-sm font-medium rounded-xl px-3.5 py-2.5 focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all outline-none placeholder:text-gray-400"
                  placeholder="Contoh: Depan Kantor Camat Plaju / Samping SPBU"
                />
              </div>

              {/* Field: Deskripsi */}
              <div className="space-y-1">
                <label htmlFor="description" className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Rincian Situasi <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50/70 border border-gray-200 text-gray-900 text-xs sm:text-sm font-medium rounded-xl px-3.5 py-2.5 focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all outline-none resize-none placeholder:text-gray-400"
                  placeholder="Jelaskan objek yang terbakar, estimasi skala api, atau kondisi di sekitar..."
                  required
                />
              </div>

              {/* Field: File Upload */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Foto / Video Kejadian (Opsional)
                </label>
                <div className="relative group">
                  <input
                    type="file"
                    id="media"
                    onChange={handleFileChange}
                    accept="image/*,video/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className={`w-full border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center transition-all ${file ? "border-slate-900 bg-slate-50" : "border-gray-200 bg-white group-hover:border-gray-300 group-hover:bg-gray-50"}`}>
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-1.5 ${file ? "bg-slate-900 text-white" : "bg-gray-100 text-gray-400"}`}>
                      {file ? <FaCheckCircle className="text-sm" /> : <FaCloudUploadAlt className="text-base" />}
                    </div>
                    <span className="text-xs font-semibold text-gray-800 text-center truncate max-w-full px-2">
                      {file ? file.name : "Ketuk untuk upload foto/video insiden"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium flex items-center gap-2">
                  <FaExclamationTriangle className="text-red-500 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Action */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading || !firePosition}
                  className="w-full flex items-center justify-center gap-2.5 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold py-3 sm:py-3.5 rounded-xl transition-all shadow-md active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <FaSpinner className="animate-spin text-sm" /> Mengirim Laporan...
                    </>
                  ) : (
                    <>
                      <FaFireExtinguisher className="text-sm" /> Kirim Laporan Darurat
                    </>
                  )}
                </button>
                <p className="text-center text-[10px] text-gray-400 mt-2.5">
                  Laporan darurat akan langsung diteruskan ke Pos Pemadam Kebakaran terdekat.
                </p>
              </div>
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
