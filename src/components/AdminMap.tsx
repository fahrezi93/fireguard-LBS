'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { fireStations, FireStation } from '@/lib/fire-stations';
import RoutingMachine from './RoutingMachine';
import { useMemo, useEffect, useState } from 'react';

// Komponen untuk memperbaiki ukuran peta saat container berubah
function MapResizeHandler() {
  const map = useMap();

  useEffect(() => {
    // Invalidate size setelah mount dengan delay kecil
    const timeoutId = setTimeout(() => {
      map.invalidateSize();
    }, 100);

    // Juga invalidate saat window resize
    const handleResize = () => {
      map.invalidateSize();
    };

    window.addEventListener('resize', handleResize);

    // Invalidate lagi setelah beberapa saat untuk memastikan CSS sudah sepenuhnya applied
    const secondTimeoutId = setTimeout(() => {
      map.invalidateSize();
    }, 500);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(secondTimeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, [map]);

  return null;
}

// Definisikan tipe untuk Laporan
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
  assigned_petugas_id?: number | null;
  notes?: string;
  contact?: string;
  acknowledged?: boolean;
  category?: {
    id: number;
    name: string;
    icon: string;
  };
  kelurahan?: {
    id: number;
    name: string;
  };
  needs_backup?: number | boolean;
}

// Ikon untuk Pos Damkar
const createFireStationIcon = () => new L.DivIcon({
  html: `<div style="font-size: 24px;">🚒</div>`,
  className: 'leaflet-emoji-icon',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
});

// Fungsi untuk membuat icon berdasarkan kategori
const createCategoryIcon = (categoryId?: number, categoryIcon?: string, isCompleted?: boolean, needsBackup?: boolean | number) => {
  if (isCompleted) {
    return new L.DivIcon({
      html: `<div style="font-size: 28px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">✅</div>`,
      className: 'leaflet-emoji-icon',
      iconSize: [28, 28],
      iconAnchor: [14, 28],
    });
  }

  // Default emoji berdasarkan categoryId
  const categoryEmojis: Record<number, string> = {
    1: '🔥',  // Kebakaran
    2: '🏗️', // Kerusakan Infrastruktur
    3: '🌊',  // Banjir
    4: '🌪️',  // Angin Puting Beliung
    5: '⛰️',   // Tanah Longsor
    6: '⚠️',   // Kecelakaan
    7: '🚨',   // Lainnya
  };

  const emoji = categoryIcon || categoryEmojis[categoryId || 1] || '🔥';

  const backupIndicator = needsBackup 
    ? `<div style="position: absolute; top: -5px; right: -5px; width: 14px; height: 14px; background-color: #ef4444; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px #ef4444; z-index: 10;" class="animate-pulse"></div>` 
    : '';

  return new L.DivIcon({
    html: `<div style="font-size: 28px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3)); position: relative; display: inline-block;">
             ${backupIndicator}
             ${emoji}
           </div>`,
    className: 'leaflet-emoji-icon',
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });
};

// Ikon untuk lokasi pelapor
const createReporterLocationIcon = () => new L.DivIcon({
  html: `<div style="font-size: 24px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">📍</div>`,
  className: 'leaflet-emoji-icon',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
});

// Ikon untuk petugas pemadam
const createPetugasIcon = () => new L.DivIcon({
  html: `<div style="font-size: 28px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">🚒</div>`,
  className: 'leaflet-emoji-icon',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

interface PetugasLocation {
  id: number;
  name: string;
  last_latitude: number;
  last_longitude: number;
  last_location_update: string;
  is_on_duty: number | boolean;
}

interface AdminMapProps {
  reports: Report[];
  onReportClick: (report: Report) => void;
  selectedReport?: Report | null;
}

// Fungsi untuk menghitung jarak Haversine (jarak garis lurus)
function haversineDistance(coords1: [number, number], coords2: [number, number]): number {
  function toRad(x: number): number {
    return x * Math.PI / 180;
  }

  const R = 6371; // Radius bumi dalam km
  const dLat = toRad(coords2[0] - coords1[0]);
  const dLon = toRad(coords2[1] - coords1[1]);
  const lat1 = toRad(coords1[0]);
  const lat2 = toRad(coords2[0]);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function AdminMap({ reports, onReportClick, selectedReport }: AdminMapProps) {
  const defaultPosition: [number, number] = [-3.0073, 104.8156]; // Plaju, Palembang
  const [petugasLocations, setPetugasLocations] = useState<PetugasLocation[]>([]);

  // Cek apakah ada laporan aktif yang butuh tracking
  const hasActiveTracking = useMemo(() => {
    return reports.some(r => {
      const s = r.status.toLowerCase();
      return ['diproses', 'dikirim', 'dispatched', 'arrived', 'ditangani', 'in_progress'].includes(s);
    });
  }, [reports]);

  // Fetch lokasi petugas sekali saat ada laporan aktif, lalu dengarkan via WebSocket
  useEffect(() => {
    if (!hasActiveTracking) {
      setPetugasLocations([]);
      return;
    }

    const fetchPetugas = async () => {
      try {
        const res = await fetch('/api/operator/petugas-locations');
        if (res.ok) {
          const data = await res.json();
          setPetugasLocations(data);
        }
      } catch (err) {
        console.error("Gagal fetch petugas:", err);
      }
    };

    fetchPetugas();

    // Setup WebSocket
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
                    setPetugasLocations(prev => {
                        const exists = prev.find(p => p.id === data.payload.petugasId);
                        if (exists) {
                            return prev.map(p => p.id === data.payload.petugasId ? {
                                ...p,
                                last_latitude: data.payload.lat,
                                last_longitude: data.payload.lng,
                                last_location_update: new Date().toISOString()
                            } : p);
                        } else {
                            // Fetch ulang jika ada petugas baru yang tiba-tiba broadcast
                            fetchPetugas();
                            return prev;
                        }
                    });
                }
            } catch (e) {
                // Ignore parsing errors
            }
        };

        ws.onclose = () => {
            reconnectTimeout = setTimeout(connect, 5000);
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
  }, [hasActiveTracking]);

  // Hitung pos damkar terdekat untuk laporan yang dipilih
  const nearestStation: FireStation | null = useMemo(() => {
    if (!selectedReport) return null;

    // Pastikan koordinat adalah number (DB bisa mengembalikan string)
    const fireLat = Number(selectedReport.fire_latitude);
    const fireLng = Number(selectedReport.fire_longitude);
    if (isNaN(fireLat) || isNaN(fireLng)) return null;

    const firePos: [number, number] = [fireLat, fireLng];

    return fireStations.reduce<FireStation | null>((closest, station) => {
      const distance = haversineDistance(firePos, [station.latitude, station.longitude]);
      if (!closest) {
        return station;
      }

      const closestDistance = haversineDistance(firePos, [closest.latitude, closest.longitude]);
      return distance < closestDistance ? station : closest;
    }, null);
  }, [selectedReport]);

  // Tentukan apakah rute harus ditampilkan
  const showRoute = !!(
    selectedReport &&
    nearestStation &&
    selectedReport.status !== 'selesai' &&
    selectedReport.status !== 'completed' &&
    selectedReport.status !== 'false' &&
    selectedReport.status !== 'false_report'
  );

  return (
    <MapContainer center={defaultPosition} zoom={14} style={{ height: '100%', width: '100%', backgroundColor: '#ffffff' }}>
      <MapResizeHandler />
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {/* Tampilkan semua pos damkar */}
      {fireStations.map(station => (
        <Marker
          key={`station-${station.name}`}
          position={[station.latitude, station.longitude]}
          icon={createFireStationIcon()}
        >
          <Popup>{station.name}</Popup>
        </Marker>
      ))}

      {/* Marker lokasi kejadian untuk semua laporan */}
      {reports.map(report => {
        const fireLat = Number(report.fire_latitude);
        const fireLng = Number(report.fire_longitude);
        if (isNaN(fireLat) || isNaN(fireLng)) return null;

        const isCompleted = report.status === 'Selesai' || report.status === 'completed' || report.status === 'selesai';
        const categoryIcon = createCategoryIcon(report.category?.id, report.category?.icon, isCompleted, report.needs_backup);
        const categoryName = report.category?.name || 'Kebakaran';

        return (
          <Marker
            key={`fire-${report.id}`}
            position={[fireLat, fireLng]}
            icon={categoryIcon}
            eventHandlers={{ click: () => onReportClick(report) }}
          >
            <Popup>
              <strong>{isCompleted ? `${categoryName} - Selesai` : `Lokasi ${categoryName}`}</strong><br />
              Laporan #{report.id}<br />
              Status: {report.status}
              {report.kelurahan && <><br />Kelurahan: {report.kelurahan.name}</>}
            </Popup>
          </Marker>
        );
      })}

      {/* Marker lokasi pelapor untuk laporan yang punya koordinat pelapor */}
      {reports.flatMap(report => {
        if (!report.reporter_latitude || !report.reporter_longitude) return [];

        const repLat = Number(report.reporter_latitude);
        const repLng = Number(report.reporter_longitude);
        if (isNaN(repLat) || isNaN(repLng)) return [];

        return [(
          <Marker
            key={`reporter-${report.id}`}
            position={[repLat, repLng]}
            icon={createReporterLocationIcon()}
            eventHandlers={{ click: () => onReportClick(report) }}
          >
            <Popup>
              <strong>Lokasi Pelapor</strong><br />
              Laporan #{report.id}
            </Popup>
          </Marker>
        )];
      })}

      {/* Marker lokasi petugas */}
      {petugasLocations.map(petugas => (
        <Marker
          key={`petugas-${petugas.id}`}
          position={[Number(petugas.last_latitude), Number(petugas.last_longitude)]}
          icon={createPetugasIcon()}
        >
          <Popup>
            <strong>{petugas.name}</strong><br />
            {petugas.is_on_duty ? <span style={{ color: 'green' }}>🟢 Bertugas</span> : <span style={{ color: 'orange' }}>🟡 Standby</span>}<br />
            <span style={{ fontSize: '10px', color: '#666' }}>Update: {new Date(petugas.last_location_update).toLocaleTimeString('id-ID')}</span>
          </Popup>
        </Marker>
      ))}

      {/* Rute dari petugas (jika sudah di-assign) atau pos damkar terdekat ke lokasi kebakaran */}
      {showRoute && selectedReport && (() => {
        let routeStart: [number, number] | null = null;
        let routeKey = '';

        if (selectedReport.assigned_petugas_id) {
          const petugas = petugasLocations.find(p => p.id === selectedReport.assigned_petugas_id);
          if (petugas) {
            routeStart = [Number(petugas.last_latitude), Number(petugas.last_longitude)];
            routeKey = `route-petugas-${petugas.id}-${selectedReport.id}`;
          }
        }

        if (!routeStart && nearestStation) {
           routeStart = [nearestStation.latitude, nearestStation.longitude];
           routeKey = `route-station-${nearestStation.name}-${selectedReport.id}`;
        }

        if (!routeStart) return null;

        return (
          <RoutingMachine
            key={routeKey}
            start={routeStart}
            end={[Number(selectedReport.fire_latitude), Number(selectedReport.fire_longitude)]}
          />
        );
      })()}
    </MapContainer>
  );
}
