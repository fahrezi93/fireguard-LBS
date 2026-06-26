import { fireStations, FireStation } from './fire-stations';

// Asumsi kecepatan rata-rata mobil damkar di dalam kota (dalam km/jam)
const AVERAGE_SPEED_KMH = 40;

/**
 * Menghitung jarak Haversine (garis lurus di permukaan bumi) antara dua titik GPS.
 * @returns Jarak dalam kilometer.
 */
function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius Bumi dalam km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Jarak dalam km
}

export interface ETAResult {
  nearestStation: FireStation;
  distanceKm: number;
  etaMinutes: number;
}

/**
 * Mendapatkan alamat dari koordinat menggunakan Nominatim (OpenStreetMap).
 * @param lat Latitude
 * @param lon Longitude
 * @returns String alamat lengkap atau pesan error.
 */
export async function getAddressFromCoordinates(lat: number, lon: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
      {
        headers: {
          'User-Agent': 'SiagaBencanaApp/1.0 (https://github.com/your-repo)' // Aturan penggunaan Nominatim
        }
      }
    );
    if (!response.ok) {
      throw new Error(`Nominatim API failed with status ${response.status}`);
    }
    const data = await response.json();
    if (data && data.display_name) {
      return data.display_name;
    }
    return "Alamat detail tidak ditemukan.";
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return "Tidak dapat mengambil data alamat saat ini.";
  }
}

/**
 * Menghitung pos damkar terdekat dan estimasi waktu tiba (ETA).
 * @param reportLat Latitude dari lokasi kejadian.
 * @param reportLon Longitude dari lokasi kejadian.
 * @returns Objek yang berisi data pos terdekat, jarak, dan ETA.
 */
export function calculateETA(reportLat: number, reportLon: number): ETAResult {
  let nearestStation: FireStation | null = null;
  let minDistance = Infinity;

  // Cari pos damkar dengan jarak terpendek
  for (const station of fireStations) {
    const distance = getHaversineDistance(reportLat, reportLon, station.latitude, station.longitude);
    if (distance < minDistance) {
      minDistance = distance;
      nearestStation = station;
    }
  }

  if (!nearestStation) {
    throw new Error("Tidak ada data pos damkar.");
  }

  const timeInHours = minDistance / AVERAGE_SPEED_KMH;
  const timeInMinutes = Math.round(timeInHours * 60);

  return {
    nearestStation: nearestStation,
    distanceKm: parseFloat(minDistance.toFixed(2)),
    etaMinutes: timeInMinutes,
  };
}
