'use client';

import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useMemo } from 'react';

interface Hotspot {
    fire_latitude: number;
    fire_longitude: number;
    kelurahan_name: string;
    category_name: string;
    category_icon: string;
    created_at: string;
}

interface HotspotMapProps {
    hotspots: Hotspot[];
    year: number;
}

// Create custom icon based on category
const createHotspotIcon = (icon: string) => {
    return new L.DivIcon({
        html: `<div style="font-size: 20px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">${icon}</div>`,
        className: 'leaflet-emoji-icon',
        iconSize: [20, 20],
        iconAnchor: [10, 20],
    });
};

// Group hotspots by location
const groupHotspotsByLocation = (hotspots: Hotspot[]) => {
    const groups: { [key: string]: { lat: number; lng: number; count: number; items: Hotspot[] } } = {};

    hotspots.forEach(spot => {
        // Round to 4 decimal places to group nearby points
        const key = `${Number(spot.fire_latitude).toFixed(4)},${Number(spot.fire_longitude).toFixed(4)}`;
        if (!groups[key]) {
            groups[key] = {
                lat: Number(spot.fire_latitude),
                lng: Number(spot.fire_longitude),
                count: 0,
                items: [],
            };
        }
        groups[key].count++;
        groups[key].items.push(spot);
    });

    return Object.values(groups);
};

export default function HotspotMap({ hotspots, year }: HotspotMapProps) {
    const defaultPosition: [number, number] = [-3.0073, 104.8156]; // Pusat Plaju

    // Group hotspots for heatmap-like visualization
    const groupedHotspots = useMemo(() => groupHotspotsByLocation(hotspots), [hotspots]);

    // Get max count for scaling
    const maxCount = useMemo(() => Math.max(...groupedHotspots.map(g => g.count), 1), [groupedHotspots]);

    return (
        <MapContainer
            center={defaultPosition}
            zoom={14}
            style={{ height: '100%', width: '100%', backgroundColor: '#ffffff' }}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            {/* Render circle markers for hotspot intensity */}
            {groupedHotspots.map((group, index) => {
                const intensity = group.count / maxCount;
                const radius = Math.max(15, intensity * 50);

                return (
                    <CircleMarker
                        key={`circle-${index}`}
                        center={[group.lat, group.lng]}
                        radius={radius}
                        pathOptions={{
                            color: intensity > 0.7 ? '#8B1816' : intensity > 0.4 ? '#DD2C28' : '#EAB308',
                            fillColor: intensity > 0.7 ? '#8B1816' : intensity > 0.4 ? '#DD2C28' : '#EAB308',
                            fillOpacity: 0.4,
                            weight: 2,
                        }}
                    >
                        <Popup>
                            <div className="text-center">
                                <p className="font-bold text-red-600">{group.count} Kejadian</p>
                                <p className="text-xs text-gray-600">di lokasi ini</p>
                                <hr className="my-2" />
                                <p className="text-xs font-medium">Kelurahan: {group.items[0]?.kelurahan_name || 'Tidak Diketahui'}</p>
                            </div>
                        </Popup>
                    </CircleMarker>
                );
            })}

            {/* Render individual markers */}
            {hotspots.map((spot, index) => (
                <Marker
                    key={`hotspot-${index}`}
                    position={[Number(spot.fire_latitude), Number(spot.fire_longitude)]}
                    icon={createHotspotIcon(spot.category_icon || '🔥')}
                >
                    <Popup>
                        <div className="min-w-[150px]">
                            <p className="font-bold text-gray-800">
                                {spot.category_icon} {spot.category_name || 'Kebakaran'}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                                📍 {spot.kelurahan_name || 'Lokasi Tidak Diketahui'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                📅 {new Date(spot.created_at).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                })}
                            </p>
                        </div>
                    </Popup>
                </Marker>
            ))}

            {/* Legend */}
            <div className="leaflet-bottom leaflet-right" style={{ pointerEvents: 'auto' }}>
                <div className="bg-white p-3 rounded-lg shadow-lg m-3 text-xs">
                    <p className="font-semibold text-gray-800 mb-2">📊 Legenda</p>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-red-600 opacity-60"></div>
                            <span>Tinggi (&gt;70%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-orange-500 opacity-60"></div>
                            <span>Sedang (40-70%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-yellow-500 opacity-60"></div>
                            <span>Rendah (&lt;40%)</span>
                        </div>
                    </div>
                </div>
            </div>
        </MapContainer>
    );
}
