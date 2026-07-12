import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';

// Ikon kustom untuk mobil pemadam kebakaran
const fireTruckIcon = new L.DivIcon({
  html: `
        <div style="position: relative; width: 40px; height: 40px;">
            <div style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 30px;
                height: 30px;
                background-color: rgba(37, 99, 235, 0.3);
                border-radius: 50%;
                animation: pulse-truck 2s infinite;
            "></div>
            <div style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 28px;
                text-align: center;
                line-height: 28px;
                filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
            ">🚒</div>
        </div>
        <style>
            @keyframes pulse-truck {
                0%, 100% {
                    width: 30px;
                    height: 30px;
                    opacity: 1;
                }
                50% {
                    width: 45px;
                    height: 45px;
                    opacity: 0.5;
                }
            }
        </style>
    `,
  className: 'leaflet-truck-icon',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

// Ikon untuk lokasi kejadian kebakaran
const fireLocationIcon = new L.DivIcon({
  html: `
        <div style="position: relative; width: 40px; height: 40px;">
            <div style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 30px;
                height: 30px;
                background-color: rgba(239, 68, 68, 0.3);
                border-radius: 50%;
                animation: pulse-fire 2s infinite;
            "></div>
            <div style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 32px;
                text-align: center;
                line-height: 32px;
                filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
            ">🔥</div>
        </div>
        <style>
            @keyframes pulse-fire {
                0%, 100% {
                    width: 30px;
                    height: 30px;
                    opacity: 1;
                }
                50% {
                    width: 45px;
                    height: 45px;
                    opacity: 0.5;
                }
            }
        </style>
    `,
  className: 'leaflet-fire-icon',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

// Komponen untuk otomatis menyesuaikan bounds (menampilkan kedua marker jika ada)
function AutoFitBounds({ firePos, petugasPos }: { firePos: [number, number], petugasPos: [number, number] | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (firePos && petugasPos) {
      const bounds = L.latLngBounds([firePos, petugasPos]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    } else if (firePos) {
      map.setView(firePos, 15);
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
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />

        <Marker position={firePosition} icon={fireLocationIcon}>
          <Popup>📍 Lokasi Kejadian</Popup>
        </Marker>

        {petugasPosition && (
          <Marker position={petugasPosition} icon={fireTruckIcon}>
            <Popup>
              <div className="text-center">
                <p className="font-bold text-blue-600">🚒 Unit Meluncur</p>
                <p className="text-xs text-gray-600">{petugasName || 'Petugas'}</p>
              </div>
            </Popup>
          </Marker>
        )}

        <AutoFitBounds firePos={firePosition} petugasPos={petugasPosition} />
      </MapContainer>
    </div>
  );
}
