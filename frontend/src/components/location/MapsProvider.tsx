"use client";

import React from "react";
import { APIProvider } from "@vis.gl/react-google-maps";
import { MapPin } from "lucide-react";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

/** Loads Google Maps once for everything inside it. Without a key it says so instead of showing a broken map. */
export default function MapsProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  if (!API_KEY) {
    return (
      <div className="flex min-h-[180px] flex-col items-center justify-center gap-2 rounded-lg border border-border bg-surface px-6 text-center">
        <MapPin size={20} className="text-accent-strong" aria-hidden />
        <p className="text-xs text-muted-foreground">
          Google Maps is not set up. Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY and rebuild the web app.
        </p>
      </div>
    );
  }
  return <APIProvider apiKey={API_KEY}>{children}</APIProvider>;
}
