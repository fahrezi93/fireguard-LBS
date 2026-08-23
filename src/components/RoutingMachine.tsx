import L from "leaflet";
import { useMap } from "react-leaflet";
import { useEffect, useRef, useCallback } from "react";

interface RoutingMachineProps {
  start: [number, number];
  end: [number, number];
  onRouteFound?: (summary: { totalDistance: number; totalTime: number }) => void;
  onLoadingChange?: (isLoading: boolean) => void;
}

const RoutingMachine = ({ start, end, onRouteFound, onLoadingChange }: RoutingMachineProps) => {
  const map = useMap();
  const isFirstRender = useRef(true);
  const animationRef = useRef<number | null>(null);
  const onRouteFoundRef = useRef(onRouteFound);
  const onLoadingChangeRef = useRef(onLoadingChange);
  const lastRouteKey = useRef<string>("");
  const fetchControllerRef = useRef<AbortController | null>(null);
  const fetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const routeRequestIdRef = useRef(0);
  const fallbackPolylineRef = useRef<L.Polyline | null>(null);
  const animatedPolylineRef = useRef<L.Polyline | null>(null);
  const movingMarkerRef = useRef<L.Marker | null>(null);

  const clearRouteLayers = useCallback(() => {
    if (fallbackPolylineRef.current) {
      map.removeLayer(fallbackPolylineRef.current);
      fallbackPolylineRef.current = null;
    }
    if (animatedPolylineRef.current) {
      map.removeLayer(animatedPolylineRef.current);
      animatedPolylineRef.current = null;
    }
    if (movingMarkerRef.current) {
      map.removeLayer(movingMarkerRef.current);
      movingMarkerRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, [map]);
  
  // Update ref when callback changes
  useEffect(() => {
    onRouteFoundRef.current = onRouteFound;
  }, [onRouteFound]);

  useEffect(() => {
    onLoadingChangeRef.current = onLoadingChange;
  }, [onLoadingChange]);

  useEffect(() => {
    if (!map) return;

    let didCleanup = false;
    routeRequestIdRef.current += 1;
    const currentRequestId = routeRequestIdRef.current;

    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = null;
    }

    if (fetchControllerRef.current) {
      fetchControllerRef.current.abort();
      fetchControllerRef.current = null;
    }

    clearRouteLayers();

    // Fungsi untuk menggambar rute statis (tanpa animasi yang mengganggu)
    const drawRoute = (coordinates: L.LatLngExpression[]) => {
      animatedPolylineRef.current = L.polyline(coordinates, {
        color: '#9F1C19',
        weight: 6,
        opacity: 0.8,
        lineJoin: 'round',
        lineCap: 'round',
      }).addTo(map);
    };

    const fetchRoute = async () => {
      try {
        // Validasi koordinat
        if (!start || !end || start.length !== 2 || end.length !== 2) {
          return;
        }
        
        // Cek apakah route sudah sama dengan sebelumnya
        const routeKey = `${start[0]},${start[1]}-${end[0]},${end[1]}`;
        if (routeKey === lastRouteKey.current) {
          onLoadingChangeRef.current?.(false);
          return; // Skip jika route sama
        }
        lastRouteKey.current = routeKey;

        const controller = new AbortController();
        fetchControllerRef.current = controller;

        // PENTING: start dan end sudah dalam format [lat, lng] dari Leaflet
        // OSRM API membutuhkan format: longitude,latitude (dibalik!)
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson&alternatives=false&steps=true&annotations=true`;

        const response = await fetch(osrmUrl, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
          }
        });

        if (didCleanup || currentRequestId !== routeRequestIdRef.current) return;

        if (!response.ok) {
          throw new Error(`OSRM API error: ${response.status}`);
        }

        const data = await response.json();

        // FIX: Re-check if component unmounted while awaiting response.json()
        if (didCleanup || currentRequestId !== routeRequestIdRef.current) return;

        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const coordinates = route.geometry.coordinates;

          if (!coordinates || coordinates.length === 0) {
            throw new Error('No coordinates in route geometry');
          }

          // PENTING: OSRM mengembalikan koordinat dalam format [lng, lat]
          // Leaflet membutuhkan format [lat, lng], jadi harus dibalik!
          const latlngs: L.LatLngExpression[] = coordinates.map((coord: number[]) => [coord[1], coord[0]]);

          clearRouteLayers();

          // Gambar rute secara langsung tanpa animasi berulang
          drawRoute(latlngs);
          
          // Fit bounds ke rute HANYA pada render pertama agar tidak mengganggu pandangan user (Gojek style)
          if (isFirstRender.current) {
            const tempPolyline = L.polyline(latlngs);
            const bounds = tempPolyline.getBounds();
            map.fitBounds(bounds, {
              padding: [80, 80],
              maxZoom: 15,
              animate: true,
              duration: 1
            });
            isFirstRender.current = false;
          }

          // Kirim summary ke parent component
          if (onRouteFoundRef.current) {
            onRouteFoundRef.current({
              totalDistance: route.distance, // dalam meter
              totalTime: route.duration, // dalam detik
            });
          }
        } else {
          throw new Error(data.message || 'No route found');
        }
      } catch (error: unknown) {
        if (didCleanup || currentRequestId !== routeRequestIdRef.current) return;
        if (error instanceof Error && error.name === 'AbortError') return;

        // Fallback: gunakan garis lurus jika routing gagal
        clearRouteLayers();

        fallbackPolylineRef.current = L.polyline([start, end], {
          color: '#9F1C19',
          weight: 4,
          opacity: 0.5,
          dashArray: '10, 10',
        }).addTo(map);

        const bounds = L.latLngBounds([start, end]);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      } finally {
        if (!didCleanup && currentRequestId === routeRequestIdRef.current) {
          onLoadingChangeRef.current?.(false);
        }
      }
    };

    // Debounce fetch untuk menghindari spam request saat drag cepat
    onLoadingChangeRef.current?.(true);
    fetchTimeoutRef.current = setTimeout(fetchRoute, 500);

    return () => {
      didCleanup = true;
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }
      if (fetchControllerRef.current) {
        fetchControllerRef.current.abort();
        fetchControllerRef.current = null;
      }
      clearRouteLayers();
      onLoadingChangeRef.current?.(false);
    };
  }, [map, start[0], start[1], end[0], end[1], clearRouteLayers]);

  return null;
};

export default RoutingMachine;
