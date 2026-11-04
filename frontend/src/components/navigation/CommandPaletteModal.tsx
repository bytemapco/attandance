"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Loader2 } from "lucide-react";

import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import { useDebounce } from "@/hooks/useDebounce";
import CommandPaletteItem from "./CommandPaletteItem";
import type { SearchResultItem, GlobalSearchResponse } from "@/types";

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORY_ORDER: { [key: string]: { label: string; order: number } } = {
  action: { label: "Quick Actions", order: 1 },
  class: { label: "Classes", order: 2 },
  student: { label: "Students", order: 3 },
  faculty: { label: "Faculty", order: 4 },
  session: { label: "Sessions", order: 5 },
  tenant: { label: "Institutions", order: 6 },
  navigation: { label: "Navigation", order: 7 },
};

export default function CommandPaletteModal({ isOpen, onClose }: CommandPaletteModalProps): React.ReactElement | null {
  const router = useRouter();
  const { user } = useAuthStore();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(query, 160);

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

  const searchPlaceholder = useMemo(() => {
    if (user?.role === "SUPER_ADMIN") return "Search institutions, licenses, or system actions...";
    if (user?.role === "ADMIN" || user?.role === "TENANT_ADMIN") return "Search students, faculty, classes, or actions...";
    return "Search students, classes, or quick actions...";
  }, [user?.role]);

  // Group results by category preserving global flat indexing
  const groupedSections = useMemo(() => {
    const groups: { [key: string]: { label: string; items: { item: SearchResultItem; globalIndex: number }[] } } = {};
    results.forEach((item, globalIndex) => {
      const cat = item.category || "action";
      const config = CATEGORY_ORDER[cat] || { label: cat.toUpperCase(), order: 99 };
      if (!groups[cat]) {
        groups[cat] = { label: config.label, items: [] };
      }
      groups[cat].items.push({ item, globalIndex });
    });

    return Object.entries(groups)
      .sort(([a], [b]) => (CATEGORY_ORDER[a]?.order ?? 99) - (CATEGORY_ORDER[b]?.order ?? 99))
      .map(([, group]) => group);
  }, [results]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-primary/50">
      <div className="fixed inset-0" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-background shadow-[0_8px_24px_rgba(40,54,59,0.14)] overflow-hidden z-10 flex flex-col max-h-[80vh]">
        <div className="flex items-center px-4 py-3.5 border-b border-border gap-3 bg-background">
          <Search size={18} className="text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder={searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 text-sm bg-transparent text-foreground placeholder:text-muted-foreground outline-none font-medium"
          />
          {loading && <Loader2 size={16} className="animate-spin text-accent-strong shrink-0" />}
          <button
            onClick={onClose}
            aria-label="Close search"
            className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto p-2.5 space-y-3">
          {results.length === 0 && !loading ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              {query ? (
                <>No matching results found for &ldquo;<strong className="text-foreground">{query}</strong>&rdquo;</>
              ) : (
                "Type a query to search across your workspace..."
              )}
            </div>
          ) : (
            groupedSections.map((section) => (
              <div key={section.label} className="space-y-1">
                <p className="px-3 pt-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  {section.label}
                </p>
                {section.items.map(({ item, globalIndex }) => (
                  <CommandPaletteItem
                    key={item.id}
                    item={item}
                    isSelected={selectedIndex === globalIndex}
                    onSelect={handleSelect}
                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                  />
                ))}
              </div>
            ))
          )}
        </div>

        <div className="px-4 py-2.5 border-t border-border bg-secondary/60 flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span><kbd className="font-mono px-1.5 py-0.5 rounded border border-border bg-background text-[10px]">↑↓</kbd> Navigate</span>
            <span><kbd className="font-mono px-1.5 py-0.5 rounded border border-border bg-background text-[10px]">↵</kbd> Select</span>
            <span><kbd className="font-mono px-1.5 py-0.5 rounded border border-border bg-background text-[10px]">esc</kbd> Dismiss</span>
          </div>
          <span className="font-semibold text-[11px] text-muted-foreground">
            Sahaj Search
          </span>
        </div>
      </div>
    </div>
  );
}

