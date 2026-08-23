'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

const RoutingMachine = dynamic(() => import('./RoutingMachine'), { ssr: false });

const fireTruckIcon = new L.DivIcon({
  html: `
    <div style="position: relative; width: 40px; height: 40px;">
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:30px;height:30px;background:rgba(37,99,235,0.3);border-radius:50%;animation:pulse-truck 2s infinite;"></div>
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:28px;filter:drop-shadow(0 2px 4px rgba(0,0,0,.3));">🚒</div>
    </div>
    <style>@keyframes pulse-truck{0%,100%{width:30px;height:30px;opacity:1}50%{width:45px;height:45px;opacity:.5}}</style>
  `,
  className: 'leaflet-truck-icon petugas-marker',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

const fireLocationIcon = new L.DivIcon({
  html: `
    <div style="position: relative; width: 40px; height: 40px;">
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:30px;height:30px;background:rgba(239,68,68,0.3);border-radius:50%;animation:pulse-fire 2s infinite;"></div>
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:32px;filter:drop-shadow(0 2px 4px rgba(0,0,0,.3));">🔥</div>
    </div>
    <style>@keyframes pulse-fire{0%,100%{width:30px;height:30px;opacity:1}50%{width:45px;height:45px;opacity:.5}}</style>
  `,
  className: 'leaflet-fire-icon',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

function AutoFitBounds({ firePos, petugasPos }: { firePos: [number, number]; petugasPos: [number, number] | null }) {
  const map = useMap();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      if (firePos && petugasPos) {
        map.fitBounds(L.latLngBounds([firePos, petugasPos]), { padding: [60, 60], maxZoom: 16 });
      } else if (firePos) {
        map.setView(firePos, 15);
      }
      isFirstRender.current = false;
    }
  }, [firePos, petugasPos, map]);
  return null;
}

interface LiveTrackingMapProps {
  firePosition: [number, number];
  petugasPosition: [number, number] | null;
  petugasName?: string;
}

export default function LiveTrackingMap({ firePosition, petugasPosition, petugasName }: LiveTrackingMapProps) {
  return (
    <div className="w-full h-full min-h-[300px] rounded-xl overflow-hidden border border-gray-200" style={{ zIndex: 0 }}>
      <MapContainer
        center={firePosition}
        zoom={15}
        style={{ height: '100%', width: '100%', minHeight: '300px', zIndex: 0 }}
        zoomControl={false}
        scrollWheelZoom={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />

        <Marker position={firePosition} icon={fireLocationIcon}>
          <Popup>🔥 Lokasi Kejadian</Popup>
        </Marker>

        {petugasPosition && (
          <Marker position={petugasPosition} icon={fireTruckIcon}>
            <Popup>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontWeight: 'bold', color: '#2563eb' }}>🚒 Unit Meluncur</p>
                <p style={{ fontSize: '12px', color: '#4b5563' }}>{petugasName || 'Petugas'}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Rute OSRM dari posisi petugas ke lokasi kebakaran — update otomatis saat bergerak */}
        {petugasPosition && (
          <RoutingMachine start={petugasPosition} end={firePosition} />
        )}

        <AutoFitBounds firePos={firePosition} petugasPos={petugasPosition} />
      </MapContainer>
    </div>
  );
}
