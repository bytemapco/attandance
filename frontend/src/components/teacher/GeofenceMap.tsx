"use client";

import React, { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useMapEvents, useMap } from "react-leaflet";
import { Navigation } from "lucide-react";
import toast from "react-hot-toast";
import GlassButton from "@/components/ui/GlassButton";
import LocationSearchBar from "@/components/teacher/LocationSearchBar";

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
  useEffect(() => {
    map.flyTo([lat, lng], Math.max(map.getZoom(), 16), {
      duration: 1.2,
    });
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

  const handleSearchSelect = useCallback(
    (newLat: number, newLng: number) => {
      onLocationChange(newLat, newLng);
    },
    [onLocationChange]
  );

  return (
    <div
      className="relative w-full h-[460px] rounded-xl overflow-hidden border border-border bg-card shadow-xs"
      style={{ minHeight: 460 }}
    >
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
            <Marker position={[lat, lng]} />
            <Circle
              center={[lat, lng]}
              radius={radius}
              pathOptions={{
                color: "#0f172a",
                fillColor: "#0f172a",
                fillOpacity: 0.12,
                weight: 2,
              }}
            />
          </MapContainer>

          <div className="absolute top-4 left-4 z-[400] w-72 sm:w-80">
            <LocationSearchBar onSelectLocation={handleSearchSelect} />
          </div>

          <div className="absolute top-4 right-4 z-[400]">
            <GlassButton
              variant="secondary"
              size="sm"
              icon={<Navigation size={14} className="text-foreground" />}
              onClick={handleGetCurrentLocation}
              className="bg-card shadow-md text-xs border border-border"
            >
              Current Location
            </GlassButton>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-full text-muted-foreground bg-muted text-xs">
          Loading interactive map...
        </div>
      )}
    </div>
  );
}
