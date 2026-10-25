"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Loader2, CornerDownLeft, Sparkles } from "lucide-react";

import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import { useDebounce } from "@/hooks/useDebounce";
import { getCommandIcon } from "./command-icons";
import type { SearchResultItem, GlobalSearchResponse } from "@/types";

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPaletteModal({ isOpen, onClose }: CommandPaletteModalProps): React.ReactElement | null {
  const router = useRouter();
  const { user } = useAuthStore();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(query, 180);

  // Fetch search results from backend whenever query or modal open state changes
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
      return;
    }

    setTimeout(() => inputRef.current?.focus(), 40);

    let active = true;
    async function performSearch(): Promise<void> {
      setLoading(true);
      try {
        const { data } = await api.get<GlobalSearchResponse>(`/search?q=${encodeURIComponent(debouncedQuery)}`);
        if (active) {
          setResults(data.results || []);
          setSelectedIndex(0);
        }
      } catch {
        if (active) setResults([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    void performSearch();
    return () => { active = false; };
  }, [isOpen, debouncedQuery]);

  const handleSelect = (item: SearchResultItem): void => {
    onClose();
    router.push(item.href);
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden z-10 flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-border gap-3 bg-card/90">
          <Search size={18} className="text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder={
              user?.role === "ADMIN"
                ? "Search students, faculty, classes, or quick actions..."
                : "Search enrolled students, classes, sessions, or commands..."
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 text-sm bg-transparent text-foreground placeholder:text-muted-foreground outline-none font-medium"
          />
          {loading && <Loader2 size={16} className="animate-spin text-emerald-500 shrink-0" />}
          <button
            onClick={onClose}
            aria-label="Close search"
            className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Results Stream */}
        <div className="overflow-y-auto p-2.5 space-y-1">
          {results.length === 0 && !loading ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              {query ? (
                <>No matching results found for &ldquo;<strong className="text-foreground">{query}</strong>&rdquo;</>
              ) : (
                "Type a query to search across the institution..."
              )}
            </div>
          ) : (
            results.map((item, idx) => {
              const isSelected = selectedIndex === idx;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left text-xs transition-all ${
                    isSelected
                      ? "bg-secondary text-foreground shadow-xs border border-border/70"
                      : "text-muted-foreground hover:bg-secondary/50 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-card border border-border shrink-0">
                      {getCommandIcon(item.icon_type, item.category)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-foreground truncate flex items-center gap-2">
                        <span>{item.title}</span>
                        {item.badge && (
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${
                            item.badge === "LIVE"
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 animate-pulse"
                              : "bg-secondary text-muted-foreground border-border/50"
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                      {item.subtitle && (
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">{item.subtitle}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3 text-[10px] text-muted-foreground">
                    <span className="capitalize font-mono px-2 py-0.5 rounded-md bg-card border border-border/70">
                      {item.category}
                    </span>
                    <CornerDownLeft size={12} className={isSelected ? "text-emerald-500 opacity-100" : "opacity-0"} />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Hints */}
        <div className="px-4 py-2.5 border-t border-border bg-secondary/30 flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span><kbd className="font-mono px-1.5 py-0.5 rounded border border-border bg-card text-[10px]">↑↓</kbd> Navigate</span>
            <span><kbd className="font-mono px-1.5 py-0.5 rounded border border-border bg-card text-[10px]">↵</kbd> Select</span>
            <span><kbd className="font-mono px-1.5 py-0.5 rounded border border-border bg-card text-[10px]">esc</kbd> Dismiss</span>
          </div>
          <span className="font-semibold text-[11px] text-emerald-500 flex items-center gap-1">
            <Sparkles size={12} /> Enterprise Global Search
          </span>
        </div>
      </div>
    </div>
  );
}
