'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { fireStations, FireStation } from '@/lib/fire-stations';
import RoutingMachine from './RoutingMachine';
import { useMemo, useEffect } from 'react';

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
}

// Ikon untuk Pos Damkar
const fireStationIcon = new L.DivIcon({
  html: `<div style="font-size: 24px;">🚒</div>`,
  className: 'leaflet-emoji-icon',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
});

// Fungsi untuk membuat icon berdasarkan kategori
const createCategoryIcon = (categoryId?: number, categoryIcon?: string, isCompleted?: boolean) => {
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

  return new L.DivIcon({
    html: `<div style="font-size: 28px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">${emoji}</div>`,
    className: 'leaflet-emoji-icon',
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });
};

// Ikon untuk lokasi pelapor
const reporterLocationIcon = new L.DivIcon({
  html: `<div style="font-size: 24px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">📍</div>`,
  className: 'leaflet-emoji-icon',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
});

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
  const defaultPosition: [number, number] = [-2.976, 104.775]; // Plaju, Palembang

  // Hitung pos damkar terdekat untuk laporan yang dipilih
  const nearestStation: FireStation | null = useMemo(() => {
    if (!selectedReport) return null;

    // Pastikan koordinat adalah number (DB bisa mengembalikan string)
    const fireLat = Number(selectedReport.fire_latitude);
    const fireLng = Number(selectedReport.fire_longitude);
    if (isNaN(fireLat) || isNaN(fireLng)) return null;

    const firePos: [number, number] = [fireLat, fireLng];
    let closest: FireStation | null = null;
    let minDistance = Infinity;

    fireStations.forEach(station => {
      const distance = haversineDistance(firePos, [station.latitude, station.longitude]);
      if (distance < minDistance) {
        minDistance = distance;
        closest = station;
      }
    });
    return closest;
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
    <MapContainer center={defaultPosition} zoom={12} style={{ height: '100%', width: '100%', backgroundColor: '#ffffff' }}>
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
          icon={fireStationIcon}
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
        const categoryIcon = createCategoryIcon(report.category?.id, report.category?.icon, isCompleted);
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
      {reports.filter(r => r.reporter_latitude && r.reporter_longitude).map(report => {
        const repLat = Number(report.reporter_latitude);
        const repLng = Number(report.reporter_longitude);
        if (isNaN(repLat) || isNaN(repLng)) return null;
        return (
          <Marker
            key={`reporter-${report.id}`}
            position={[repLat, repLng]}
            icon={reporterLocationIcon}
            eventHandlers={{ click: () => onReportClick(report) }}
          >
            <Popup>
              <strong>Lokasi Pelapor</strong><br />
              Laporan #{report.id}
            </Popup>
          </Marker>
        );
      })}

      {/* Rute dari pos damkar terdekat ke lokasi kebakaran */}
      {showRoute && nearestStation && selectedReport && (
        <RoutingMachine
          key={`route-${selectedReport.id}-${nearestStation.name}`}
          start={[nearestStation.latitude, nearestStation.longitude]}
          end={[Number(selectedReport.fire_latitude), Number(selectedReport.fire_longitude)]}
        />
      )}
    </MapContainer>
  );
}
