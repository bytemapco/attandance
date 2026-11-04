"use client";

import React, { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useMapEvents, useMap } from "react-leaflet";
import { Navigation } from "lucide-react";
import toast from "react-hot-toast";
import GlassButton from "@/components/ui/GlassButton";
import { BRAND_COLORS } from "@/lib/brandColors";

const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false }
);
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), {
  ssr: false,
});
const Circle = dynamic(() => import("react-leaflet").then((m) => m.Circle), {
  ssr: false,
});

function MapClickHandler({
  onLocationSelect,
}: {
  onLocationSelect: (lat: number, lng: number) => void;
}): null {
  useMapEvents({
    click: (e: { latlng: { lat: number; lng: number } }) =>
      onLocationSelect(e.latlng.lat, e.latlng.lng),
  });
  return null;
}

function MapUpdater({ lat, lng }: { lat: number; lng: number }): null {
  const map = useMap();
  const prevRef = React.useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!prevRef.current) {
      prevRef.current = { lat, lng };
      map.setView([lat, lng], Math.max(map.getZoom(), 16));
      return;
    }
    const dist = Math.hypot(lat - prevRef.current.lat, lng - prevRef.current.lng);
    prevRef.current = { lat, lng };

    if (dist > 0.005) {
      map.flyTo([lat, lng], Math.max(map.getZoom(), 16), {
        duration: 1.2,
      });
    }
  }, [lat, lng, map]);
  return null;
}

interface GeofenceMapProps {
  lat: number;
  lng: number;
  radius: number;
  onLocationChange: (lat: number, lng: number) => void;
}

export default function GeofenceMap({
  lat,
  lng,
  radius,
  onLocationChange,
}: GeofenceMapProps): React.ReactElement {
  const [mapReady, setMapReady] = useState(false);
  const [pinIcon, setPinIcon] = useState<unknown>(null);

  useEffect(() => {
    import("leaflet/dist/leaflet.css");
    import("leaflet").then((L) => {
      interface DefaultIconPrototype {
        _getIconUrl?: unknown;
      }
      delete (L.Icon.Default.prototype as DefaultIconPrototype)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      const icon = L.divIcon({
        className: "custom-campus-pin",
        html: `
          <div style="display:flex;flex-direction:column;align-items:center;cursor:grab;">
            <div style="filter: drop-shadow(0 4px 8px rgba(32,43,48,0.35));">
              <svg width="34" height="42" viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 0C7.611 0 0 7.611 0 17C0 29.5 17 42 17 42C17 42 34 29.5 34 17C34 7.611 26.389 0 17 0Z" fill="${BRAND_COLORS.primary}"/>
                <circle cx="17" cy="17" r="7" fill="${BRAND_COLORS.accent}"/>
                <circle cx="17" cy="17" r="3" fill="${BRAND_COLORS.card}"/>
              </svg>
            </div>
          </div>
        `,
        iconSize: [34, 42],
        iconAnchor: [17, 42],
      });
      setPinIcon(icon);
      setMapReady(true);
    });
  }, []);

  const handleGetCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    toast.loading("Fetching GPS coordinates...", { id: "geo" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onLocationChange(pos.coords.latitude, pos.coords.longitude);
        toast.success("GPS Location updated", { id: "geo" });
      },
      (err) => {
        toast.error(`Failed to get location: ${err.message}`, { id: "geo" });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [onLocationChange]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg border border-border bg-surface">
      <style>{`
        .custom-campus-pin {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
      {mapReady ? (
        <>
          <MapContainer
            center={[lat, lng]}
            zoom={16}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler onLocationSelect={onLocationChange} />
            <MapUpdater lat={lat} lng={lng} />
            <Marker
              position={[lat, lng]}
              icon={pinIcon as never}
              draggable={true}
              eventHandlers={{
                dragend: (e) => {
                  const marker = e.target;
                  if (marker) {
                    const pos = marker.getLatLng();
                    onLocationChange(pos.lat, pos.lng);
                  }
                },
              }}
            />
            <Circle
              center={[lat, lng]}
              radius={radius}
              pathOptions={{
                color: BRAND_COLORS.primary,
                fillColor: BRAND_COLORS.primary,
                fillOpacity: 0.12,
                weight: 2,
                dashArray: "5, 5",
              }}
            />
          </MapContainer>

          {/* Current Location button */}
          <div className="absolute right-3 top-3 z-[400]">
            <GlassButton
              variant="secondary"
              size="sm"
              icon={<Navigation size={13} className="text-primary" />}
              onClick={handleGetCurrentLocation}
            >
              Current Location
            </GlassButton>
          </div>
        </>
      ) : (
        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
          Loading interactive map...
        </div>
      )}
    </div>
  );
}
