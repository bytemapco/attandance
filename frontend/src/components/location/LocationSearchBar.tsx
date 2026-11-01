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
  className?: string;
  placeholder?: string;
}

export default function LocationSearchBar({
  onSelectLocation,
  className = "w-full max-w-sm sm:max-w-md",
  placeholder = "Search campus, city, or address...",
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
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative flex items-center">
        <span className="pointer-events-none absolute left-3 text-[#526f78]">
          {loading ? (
            <Loader2 size={15} className="animate-spin text-[#28363b]" />
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
          placeholder={placeholder}
          className="h-9.5 w-full rounded-lg border border-[#e3e1dc] bg-white pl-9 pr-8 text-sm text-[#202b30] shadow-xs transition-colors placeholder:text-[#718087] focus:border-[#526f78] focus:outline-none focus:ring-2 focus:ring-[#526f78]/20"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 rounded p-1 text-[#718087] transition-colors hover:bg-[#eeece7] hover:text-[#202b30]"
            title="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <ul className="absolute left-0 right-0 z-[1000] mt-1.5 max-h-60 divide-y divide-[#e3e1dc] overflow-y-auto rounded-xl border border-[#e3e1dc] bg-white py-1 shadow-lg">
          {results.map((item) => {
            const parts = item.display_name.split(",");
            const title = parts[0];
            const subtitle = parts.slice(1, 4).join(",").trim();

            return (
              <li key={item.place_id}>
                <button
                  type="button"
                  onClick={() => handleSelect(item)}
                  className="flex w-full items-start gap-2.5 px-3.5 py-2.5 text-left transition-colors hover:bg-[#f5f2ed] focus:bg-[#f5f2ed] focus:outline-none"
                >
                  <MapPin
                    size={15}
                    className="mt-0.5 shrink-0 text-[#c98260]"
                  />
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <p className="truncate text-xs font-semibold text-[#202b30]">
                      {title}
                    </p>
                    {subtitle && (
                      <p className="truncate text-[11px] text-[#526f78]">
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
