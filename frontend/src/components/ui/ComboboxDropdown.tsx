"use client";

import React from "react";
import { Search, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ComboboxOption } from "./GlassCombobox";

interface ComboboxDropdownProps {
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  listRef: React.RefObject<HTMLUListElement | null>;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder: string;
  filteredOptions: ComboboxOption[];
  selectedValue: string;
  highlightedIndex: number;
  onHighlightIndex: (index: number) => void;
  onSelectOption: (value: string) => void;
}

export default function ComboboxDropdown({
  searchInputRef,
  listRef,
  searchQuery,
  onSearchChange,
  searchPlaceholder,
  filteredOptions,
  selectedValue,
  highlightedIndex,
  onHighlightIndex,
  onSelectOption,
}: ComboboxDropdownProps): React.ReactElement {
  return (
    <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-md border border-[#e3e1dc] bg-card text-card-foreground shadow-[0_8px_24px_rgba(40,54,59,0.12)] animate-in fade-in-0 zoom-in-95 duration-100">
      <div className="flex items-center border-b border-[#e3e1dc] px-2.5 py-2">
        <Search size={14} className="text-[#526f78] mr-2 shrink-0" />
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full bg-transparent text-xs text-[#202b30] placeholder:text-[#526f78] focus:outline-none"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="text-[#526f78] hover:text-[#202b30] p-0.5 cursor-pointer"
            aria-label="Clear search"
          >
            <X size={13} />
          </button>
        )}
      </div>

      <ul
        ref={listRef}
        role="listbox"
        className="max-h-60 overflow-y-auto p-1 text-xs focus:outline-none"
      >
        {filteredOptions.length === 0 ? (
          <li className="p-3 text-center text-[#526f78]">
            No matching options found
          </li>
        ) : (
          filteredOptions.map((opt, index) => {
            const isSelected = opt.value === selectedValue;
            const isHighlighted = index === highlightedIndex;
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => onSelectOption(opt.value)}
                onMouseEnter={() => onHighlightIndex(index)}
                className={cn(
                  "relative flex cursor-pointer items-center justify-between rounded px-2.5 py-2 transition-colors",
                  isHighlighted && "bg-secondary text-[#202b30]",
                  isSelected && !isHighlighted && "bg-secondary/60 font-medium",
                  !isSelected && !isHighlighted && "text-[#202b30] hover:bg-secondary/50"
                )}
              >
                <span className="truncate pr-2">{opt.label}</span>
                {isSelected && <Check size={14} className="text-[#c98260] shrink-0 ml-1.5" />}
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
