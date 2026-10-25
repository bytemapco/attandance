"use client";

import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GlassSearchProps {
  placeholder?: string;
  value?: string;
  onSearch: (query: string) => void;
  debounceMs?: number;
  className?: string;
}

export default function GlassSearch({
  placeholder = "Search...",
  value: externalValue,
  onSearch,
  debounceMs = 300,
  className = "",
}: GlassSearchProps): React.ReactElement {
  const [query, setQuery] = useState(externalValue || "");

  useEffect(() => {
    const timer = setTimeout(() => onSearch(query), debounceMs);
    return () => clearTimeout(timer);
  }, [query, debounceMs, onSearch]);

  return (
    <div className={cn("relative w-full max-w-sm", className)}>
      <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="flex h-9 w-full rounded-md border border-input bg-card pl-9 pr-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
  );
}
