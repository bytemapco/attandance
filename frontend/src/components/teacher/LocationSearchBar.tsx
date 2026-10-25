"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, MapPin, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface NominatimResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  type?: string;
}

interface LocationSearchBarProps {
  onSelectLocation: (lat: number, lng: number, name: string) => void;
}

export default function LocationSearchBar({
  onSelectLocation,
}: LocationSearchBarProps): React.ReactElement {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchLocation = useCallback(async (searchQuery: string): Promise<void> => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
          trimmed
        )}&limit=5&addressdetails=1`,
        {
          headers: {
            "Accept-Language": "en",
          },
        }
      );
      if (!response.ok) {
        throw new Error("Location search service unavailable");
      }
      const data = (await response.json()) as NominatimResult[];
      setResults(data);
      setIsOpen(data.length > 0);
    } catch {
      toast.error("Could not fetch location results");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length >= 2) {
        void searchLocation(query);
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query, searchLocation]);

  const handleSelect = (item: NominatimResult): void => {
    const parsedLat = parseFloat(item.lat);
    const parsedLng = parseFloat(item.lon);
    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      toast.error("Invalid coordinates for selected location");
      return;
    }

    onSelectLocation(parsedLat, parsedLng, item.display_name);
    setQuery(item.display_name.split(",")[0]);
    setIsOpen(false);
    toast.success(`Moved to: ${item.display_name.split(",")[0]}`);
  };

  const handleClear = (): void => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <div className="relative flex items-center">
        <span className="absolute left-3 text-muted-foreground pointer-events-none">
          {loading ? (
            <Loader2 size={15} className="animate-spin text-primary" />
          ) : (
            <Search size={15} />
          )}
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder="Search campus, city, or address..."
          className="w-full pl-9 pr-8 py-1.5 text-xs text-foreground bg-card border border-input rounded-md shadow-xs focus:outline-none focus:ring-2 focus:ring-ring transition-all placeholder:text-muted-foreground"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 text-muted-foreground hover:text-foreground transition-colors p-0.5"
            title="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <ul className="absolute left-0 right-0 mt-1.5 py-1 bg-card border border-border rounded-md shadow-lg z-[500] max-h-56 overflow-y-auto divide-y divide-border">
          {results.map((item) => {
            const parts = item.display_name.split(",");
            const title = parts[0];
            const subtitle = parts.slice(1, 4).join(",").trim();

            return (
              <li key={item.place_id}>
                <button
                  type="button"
                  onClick={() => handleSelect(item)}
                  className="w-full text-left px-3 py-2 hover:bg-secondary focus:bg-secondary focus:outline-none transition-colors flex items-start gap-2"
                >
                  <MapPin
                    size={14}
                    className="text-primary shrink-0 mt-0.5"
                  />
                  <div className="overflow-hidden">
                    <p className="text-xs font-medium text-foreground truncate">
                      {title}
                    </p>
                    {subtitle && (
                      <p className="text-[10px] text-muted-foreground truncate">
                        {subtitle}
                      </p>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
