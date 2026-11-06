"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { Search, MapPin, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface Suggestion {
  id: string;
  title: string;
  subtitle: string;
  prediction: google.maps.places.PlacePrediction;
}

interface LocationSearchBarProps {
  onSelectLocation: (lat: number, lng: number, name: string) => void;
  className?: string;
  placeholder?: string;
}

function toSuggestion(item: google.maps.places.AutocompleteSuggestion): Suggestion | null {
  const prediction = item.placePrediction;
  if (!prediction) return null;
  return {
    id: prediction.placeId,
    title: prediction.mainText?.text ?? prediction.text.text,
    subtitle: prediction.secondaryText?.text ?? "",
    prediction,
  };
}

export default function LocationSearchBar({
  onSelectLocation,
  className = "w-full max-w-sm sm:max-w-md",
  placeholder = "Search campus, city, or address...",
}: LocationSearchBarProps): React.ReactElement {
  const places = useMapsLibrary("places");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  // One token groups the typing and the final pick into a single billed search.
  const sessionRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const latestRef = useRef("");

  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const search = useCallback(
    async (text: string): Promise<void> => {
      if (!places) return;
      sessionRef.current ??= new places.AutocompleteSessionToken();
      latestRef.current = text;
      setLoading(true);
      try {
        const { suggestions } = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: text,
          sessionToken: sessionRef.current,
        });
        if (latestRef.current !== text) return;
        const found = suggestions.map(toSuggestion).filter((s): s is Suggestion => s !== null);
        setResults(found);
        setIsOpen(found.length > 0);
      } catch {
        if (latestRef.current === text) toast.error("Could not fetch location results");
      } finally {
        if (latestRef.current === text) setLoading(false);
      }
    },
    [places],
  );

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      latestRef.current = "";
      setResults([]);
      setIsOpen(false);
      setLoading(false);
      return;
    }
    const timer = setTimeout(() => void search(trimmed), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  const handleSelect = async (item: Suggestion): Promise<void> => {
    setIsOpen(false);
    setLoading(true);
    try {
      const place = item.prediction.toPlace();
      await place.fetchFields({ fields: ["location", "displayName"] });
      if (!place.location) throw new Error("No coordinates");
      onSelectLocation(place.location.lat(), place.location.lng(), item.title);
      setQuery(item.title);
      toast.success(`Moved to: ${item.title}`);
    } catch {
      toast.error("Could not open that place");
    } finally {
      sessionRef.current = null;
      setLoading(false);
    }
  };

  const handleClear = (): void => {
    latestRef.current = "";
    setQuery("");
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative flex items-center">
        <span className="pointer-events-none absolute left-3 text-muted-foreground">
          {loading ? <Loader2 size={15} className="animate-spin text-primary" /> : <Search size={15} />}
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          disabled={!places}
          className="h-9.5 w-full rounded-lg border border-border bg-card pl-9 pr-8 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus:border-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 disabled:opacity-60"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 rounded-sm p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            title="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <ul className="absolute left-0 right-0 z-[1000] mt-1.5 max-h-60 divide-y divide-border overflow-y-auto rounded-lg border border-border bg-card py-1 shadow-popover">
          {results.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => void handleSelect(item)}
                className="flex w-full items-start gap-2.5 px-3.5 py-2.5 text-left transition-colors hover:bg-background focus:bg-background focus:outline-none"
              >
                <MapPin size={15} className="mt-0.5 shrink-0 text-accent-strong" />
                <div className="min-w-0 flex-1 overflow-hidden">
                  <p className="truncate text-xs font-semibold text-foreground">{item.title}</p>
                  {item.subtitle && <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p>}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
