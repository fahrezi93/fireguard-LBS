'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';

// Icon untuk pos damkar
const fireStationIcon = new L.DivIcon({
  html: `<div style="font-size: 28px;">🚒</div>`,
  className: 'leaflet-emoji-icon',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

// Icon untuk pos damkar yang dipilih
const selectedFireStationIcon = new L.DivIcon({
  html: `<div style="font-size: 36px; filter: drop-shadow(0 0 8px rgba(239, 68, 68, 0.8));">🚒</div>`,
  className: 'leaflet-emoji-icon',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

import { FireStation } from '@/lib/fire-stations';

interface StationsMapProps {
  stations: FireStation[];
  selectedStation: FireStation | null;
  onStationClick: (station: FireStation) => void;
}

// Component untuk mengatur view map saat station dipilih
function MapController({ selectedStation }: { selectedStation: FireStation | null }) {
  const map = useMap();

  useEffect(() => {
    if (selectedStation) {
      map.flyTo([selectedStation.latitude, selectedStation.longitude], 15, {
        duration: 1,
      });
    }
  }, [selectedStation, map]);

  return null;
}

export default function StationsMap({ stations, selectedStation, onStationClick }: StationsMapProps) {
  const DEFAULT_CENTER: [number, number] = [-3.0073, 104.8156]; // Pusat Plaju

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={14}
      style={{ height: '100%', width: '100%' }}
      className="z-0"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      <MapController selectedStation={selectedStation} />

      {stations.map((station) => (
        <Marker
          key={station.name}
          position={[station.latitude, station.longitude]}
          icon={selectedStation?.name === station.name ? selectedFireStationIcon : fireStationIcon}
          eventHandlers={{
            click: () => onStationClick(station),
          }}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-semibold text-sm text-gray-900 mb-1">{station.name}</h3>
              <p className="text-xs text-gray-600 mb-1">{station.address}</p>
              {station.phone && (
                <p className="text-xs text-gray-600">📞 {station.phone}</p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
