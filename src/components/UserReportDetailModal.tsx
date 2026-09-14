"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { toSafeExternalUrl } from "@/lib/url-safety";
import {
    FaTimes,
    FaMapMarkerAlt,
    FaClock,
    FaPhone,
    FaFileAlt,
    FaImage,
} from "react-icons/fa";

const LiveTrackingMap = dynamic(() => import("./LiveTrackingMap"), {
    ssr: false,
    loading: () => <div className="w-full h-[300px] bg-gray-100 animate-pulse rounded-xl flex items-center justify-center text-gray-400 text-sm">Memuat Peta Tracking...</div>
});

interface Report {
    id: number;
    phone_number: string;
    fire_latitude: number;
    fire_longitude: number;
    reporter_latitude?: number;
    reporter_longitude?: number;
    status: string;
    created_at: string;
    media_url: string;
    notes?: string;
    contact?: string;
    description?: string;
    address?: string;
    category?: { id: number; name: string; icon: string; };
    kelurahan?: { id: number; name: string; kecamatan?: string; };
    category_name?: string;
    category_icon?: string;
    kelurahan_name?: string;
    kecamatan?: string;
    assigned_petugas_id?: number;
    petugas_lat?: number;
    petugas_lng?: number;
    petugas_name?: string;
}

interface UserReportDetailModalProps {
    report: Report;
    onClose: () => void;
}

export default function UserReportDetailModal({ report, onClose }: UserReportDetailModalProps) {
    const [livePetugasLocation, setLivePetugasLocation] = useState<[number, number] | null>(
        report.petugas_lat && report.petugas_lng ? [report.petugas_lat, report.petugas_lng] : null
    );

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    // WebSocket listener for live tracking
    useEffect(() => {
        if (!report.assigned_petugas_id) return;
        
        let ws: WebSocket | null = null;
        let reconnectTimeout: NodeJS.Timeout;

        const connect = () => {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}/ws`;
            
            ws = new WebSocket(wsUrl);

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === "PETUGAS_LOCATION_UPDATE" && data.payload) {
                        // PENTING: cast ke Number() di kedua sisi — petugasId dari WS bisa string,
                        // assigned_petugas_id dari DB bisa string saat di-serialize JSON.
                        // Tanpa cast ini, === selalu false dan tracking tidak pernah update.
                        if (Number(data.payload.petugasId) === Number(report.assigned_petugas_id)) {
                            setLivePetugasLocation([data.payload.lat, data.payload.lng]);
                        }
                    }
                } catch (e) {
                    console.error("Error parsing WS message", e);
                }
            };

            ws.onclose = () => {
                reconnectTimeout = setTimeout(connect, 3000);
            };
        };

        connect();

        return () => {
            clearTimeout(reconnectTimeout);
            if (ws) {
                ws.onclose = null;
                ws.close();
            }
        };
    }, [report.assigned_petugas_id]);

    const getStatusDisplay = (status: string) => {
        const statusMap: { [key: string]: { text: string; color: string; bgColor: string } } = {
            pending: { text: "Menunggu Verifikasi", color: "text-amber-600", bgColor: "bg-amber-50" },
            submitted: { text: "Menunggu Verifikasi", color: "text-amber-600", bgColor: "bg-amber-50" },
            verified: { text: "Terverifikasi", color: "text-blue-600", bgColor: "bg-blue-50" },
            diproses: { text: "Sedang Diproses", color: "text-blue-600", bgColor: "bg-blue-50" },
            dispatched: { text: "Unit Meluncur", color: "text-indigo-600", bgColor: "bg-indigo-50" },
            dikirim: { text: "Tim Dikirim", color: "text-indigo-600", bgColor: "bg-indigo-50" },
            arrived: { text: "Unit Tiba", color: "text-cyan-600", bgColor: "bg-cyan-50" },
            ditangani: { text: "Sedang Ditangani", color: "text-cyan-600", bgColor: "bg-cyan-50" },
            completed: { text: "Selesai", color: "text-emerald-600", bgColor: "bg-emerald-50" },
            selesai: { text: "Selesai", color: "text-emerald-600", bgColor: "bg-emerald-50" },
            dibatalkan: { text: "Dibatalkan", color: "text-red-600", bgColor: "bg-red-50" },
            in_progress: { text: "Sedang Ditangani", color: "text-indigo-600", bgColor: "bg-indigo-50" },
            false_report: { text: "Laporan Palsu", color: "text-red-600", bgColor: "bg-red-50" },
        };
        return statusMap[status] || { text: status, color: "text-gray-600", bgColor: "bg-gray-50" };
    };

    const statusDisplay = getStatusDisplay(report.status);
    const safeMediaUrl = toSafeExternalUrl(report.media_url);
    const googleMapsUrl = `https://www.google.com/maps?q=${report.fire_latitude},${report.fire_longitude}`;

    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[9998] flex items-center justify-center bg-gray-900/30 backdrop-blur-sm p-4 sm:p-6" 
            onClick={onClose}
        >
            <motion.div 
                initial={{ scale: 0.98, y: 15, opacity: 0 }} 
                animate={{ scale: 1, y: 0, opacity: 1 }} 
                exit={{ scale: 0.98, y: 15, opacity: 0 }} 
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className="bg-white rounded-2xl md:rounded-3xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col border border-gray-100" 
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 bg-white/90 backdrop-blur-xl z-20 px-6 py-5 flex justify-between items-center border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-gray-900">Detail Laporan</h2>
                        <p className="text-xs font-semibold text-gray-400 mt-0.5 uppercase tracking-wide">ID: #{report.id}</p>
                    </div>
                    <button onClick={onClose} className="p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl transition-colors shrink-0">
                        <FaTimes className="text-base" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-4 bg-gray-50/50">
                    
                    {/* Status Banner */}
                    <div className={`rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 border border-white ${statusDisplay.bgColor}`}>
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1 opacity-70">Status Laporan</p>
                            <p className={`text-xl md:text-2xl font-bold tracking-tight ${statusDisplay.color}`}>
                                {statusDisplay.text}
                            </p>
                        </div>
                        <div className="flex flex-col items-start md:items-end">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1 opacity-70">Waktu Lap.</p>
                            <p className="text-sm font-medium text-gray-700">
                                {new Date(report.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })} &middot; {new Date(report.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                            <div className="flex items-start gap-3">
                                <div className="p-2.5 bg-red-50 text-red-500 rounded-lg text-base shrink-0">
                                    {report.category?.icon || report.category_icon || '??'}
                                </div>
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-0.5">Kategori</p>
                                    <p className="text-base font-semibold text-gray-900 tracking-tight">
                                        {report.category?.name || report.category_name || 'Darurat'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                            <div className="flex items-start gap-3">
                                <div className="p-2.5 bg-teal-50 text-teal-600 rounded-lg text-base shrink-0">
                                    <FaMapMarkerAlt />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-0.5">Wilayah</p>
                                    <p className="text-base font-semibold text-gray-900 tracking-tight leading-tight truncate">
                                        {report.kelurahan?.name || report.kelurahan_name || 'Area'}
                                    </p>
                                    {(report.kelurahan?.kecamatan || report.kecamatan) && (
                                        <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                                            Kec. {report.kelurahan?.kecamatan || report.kecamatan}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {(report.address || report.description) && (
                        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
                            {report.address && (
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5"><FaMapMarkerAlt/> Alamat & Patokan</p>
                                    <p className="text-sm text-gray-700 leading-relaxed bg-gray-50/50 border border-gray-100 p-3 rounded-xl">{report.address}</p>
                                </div>
                            )}
                            {report.description && (
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5"><FaFileAlt/> Rincian Kejadian</p>
                                    <p className="text-sm text-gray-700 leading-relaxed bg-gray-50/50 border border-gray-100 p-3 rounded-xl">{report.description}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Live Tracking Map */}
                    {/* Tampilkan live tracking sejak petugas berangkat (accepted) sampai selesai di lokasi */}
                    {(['accepted', 'dispatched', 'dikirim', 'arrived', 'ditangani', 'in_progress'].includes(report.status)) && report.assigned_petugas_id && (
                        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-500 flex items-center gap-1.5">
                                <span className="relative flex h-2 w-2 mr-1">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                </span>
                                Live Tracking Petugas
                            </p>
                            <div className="h-[300px] w-full relative z-0">
                                <LiveTrackingMap 
                                    firePosition={[report.fire_latitude, report.fire_longitude]}
                                    petugasPosition={livePetugasLocation}
                                    petugasName={report.petugas_name}
                                />
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                         <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-col justify-between">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Koordinat</p>
                                <p className="text-sm font-medium text-gray-900 font-mono tracking-tight mb-3">
                                    {Number(report.fire_latitude).toFixed(5)}, {Number(report.fire_longitude).toFixed(5)}
                                </p>
                            </div>
                            <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm focus:ring-2 focus:ring-gray-900/20">
                                Buka di Maps
                            </a>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-col justify-between">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Kontak Tersimpan</p>
                                <p className="text-base font-semibold text-gray-900 font-mono mb-3">{report.phone_number || '-'}</p>
                            </div>
                            <div className="inline-flex items-center justify-center gap-2 w-full py-2.5 bg-gray-50 border border-gray-100 text-gray-500 text-xs font-semibold rounded-lg">
                                <FaPhone className="text-gray-400"/> Data Kontak
                            </div>
                        </div>
                    </div>

                    {safeMediaUrl && (
                        <div className="bg-gray-900 rounded-2xl p-5 overflow-hidden relative">
                            <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-red-500/20 blur-[40px] pointer-events-none mix-blend-screen" />
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50 mb-3 relative z-10 flex items-center gap-1.5"><FaImage/> Dokumentasi TKP</p>
                            <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/10 group bg-black/50">
                                <Image
                                    src={safeMediaUrl}
                                    alt="Bukti laporan"
                                    fill
                                    sizes="(max-width: 640px) 100vw, 672px"
                                    loading="lazy"
                                    className="object-contain transition-transform duration-700"
                                />
                            </div>
                            <div className="mt-3 text-center">
                                <a href={safeMediaUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-gray-400 font-medium hover:text-white transition-colors underline underline-offset-2 decoration-gray-600 hover:decoration-white">
                                    Lihat Ukuran Penuh
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
