"use client";

import React, { useEffect, useCallback, useRef } from "react";
import { AdvancedMarker, Circle, Map, Pin, useMap } from "@vis.gl/react-google-maps";
import { Navigation } from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import { BRAND_COLORS } from "@/lib/brandColors";

// Advanced markers need a map ID. Google's demo ID works everywhere; set a real one in Cloud Console for custom styling.
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";
const CAMPUS_ZOOM = 16;
const PAN_THRESHOLD_DEGREES = 0.005;

/** Moves the camera when the pin jumps somewhere new (a search result), not on every small drag. */
function FollowPin({ lat, lng }: { lat: number; lng: number }): null {
  const map = useMap();
  const previous = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!map) return;
    const last = previous.current;
    previous.current = { lat, lng };
    if (last && Math.hypot(lat - last.lat, lng - last.lng) <= PAN_THRESHOLD_DEGREES) return;
    map.panTo({ lat, lng });
    if ((map.getZoom() ?? 0) < CAMPUS_ZOOM) map.setZoom(CAMPUS_ZOOM);
  }, [lat, lng, map]);
  return null;
}

interface GeofenceMapProps {
  lat: number;
  lng: number;
  radius: number;
  onLocationChange: (lat: number, lng: number) => void;
}

export default function GeofenceMap({ lat, lng, radius, onLocationChange }: GeofenceMapProps): React.ReactElement {
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
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [onLocationChange]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg border border-border bg-surface">
      <Map
        mapId={MAP_ID}
        defaultCenter={{ lat, lng }}
        defaultZoom={CAMPUS_ZOOM}
        gestureHandling="greedy"
        streetViewControl={false}
        fullscreenControl={false}
        mapTypeControl={false}
        onClick={(event) => {
          const point = event.detail.latLng;
          if (point) onLocationChange(point.lat, point.lng);
        }}
      >
        <FollowPin lat={lat} lng={lng} />
        <AdvancedMarker
          position={{ lat, lng }}
          draggable
          title="Campus location. Drag to move."
          onDragEnd={(event) => {
            if (event.latLng) onLocationChange(event.latLng.lat(), event.latLng.lng());
          }}
        >
          <Pin background={BRAND_COLORS.primary} borderColor={BRAND_COLORS.primary} glyphColor={BRAND_COLORS.card} />
        </AdvancedMarker>
        <Circle
          center={{ lat, lng }}
          radius={radius}
          strokeColor={BRAND_COLORS.primary}
          strokeWeight={2}
          fillColor={BRAND_COLORS.primary}
          fillOpacity={0.12}
          clickable={false}
        />
      </Map>

      <div className="absolute right-3 top-3 z-[400]">
        <Button
          variant="secondary"
          size="sm"
          icon={<Navigation size={13} className="text-primary" />}
          onClick={handleGetCurrentLocation}
        >
          Current Location
        </Button>
      </div>
    </div>
  );
}
