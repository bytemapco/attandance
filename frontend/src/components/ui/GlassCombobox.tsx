"use client";

import React, { useState, useRef, useEffect, useId } from "react";
import { Search, ChevronDown, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ComboboxOption {
  value: string;
  label: string;
}

export interface GlassComboboxProps {
  label?: string;
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  error?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
}

export default function GlassCombobox({
  label,
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  error,
  id,
  disabled = false,
  className = "",
}: GlassComboboxProps): React.ReactElement {
  const generatedId = useId();
  const comboboxId = id || generatedId;
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setHighlightedIndex(-1);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  function handleSelect(optionValue: string): void {
    onChange(optionValue);
    setIsOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent): void {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredOptions.length - 1
      );
    } else if (e.key === "Enter" && highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
      e.preventDefault();
      handleSelect(filteredOptions[highlightedIndex].value);
    }
  }

  return (
    <div className="flex flex-col gap-1.5 w-full relative" ref={containerRef} onKeyDown={handleKeyDown}>
      {label && (
        <label htmlFor={comboboxId} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}

      {/* Hidden native select for Playwright e2e test compatibility and HTML form access */}
      <select
        id={comboboxId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only pointer-events-none"
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Trigger Button */}
      <div className="relative w-full">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen((prev) => !prev)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm transition-colors text-left cursor-pointer",
            "text-foreground hover:border-slate-400 dark:hover:border-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50",
            error && "border-destructive focus-visible:ring-destructive",
            className
          )}
        >
          <span className={cn("truncate", !selectedOption && "text-muted-foreground")}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            size={16}
            className={cn(
              "text-muted-foreground shrink-0 transition-transform duration-200 ml-2",
              isOpen && "rotate-180"
            )}
          />
        </button>

        {/* Dropdown Popover */}
        {isOpen && (
          <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-md border border-border bg-card text-card-foreground shadow-lg animate-in fade-in-0 zoom-in-95 duration-100">
            {/* Search Input Bar */}
            <div className="flex items-center border-b border-border px-2.5 py-2">
              <Search size={14} className="text-muted-foreground mr-2 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                  aria-label="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Options List */}
            <ul
              ref={listRef}
              role="listbox"
              className="max-h-60 overflow-y-auto p-1 text-xs focus:outline-none"
            >
              {filteredOptions.length === 0 ? (
                <li className="p-3 text-center text-muted-foreground">
                  No matching options found
                </li>
              ) : (
                filteredOptions.map((opt, index) => {
                  const isSelected = opt.value === value;
                  const isHighlighted = index === highlightedIndex;
                  return (
                    <li
                      key={opt.value}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(opt.value)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={cn(
                        "relative flex cursor-pointer items-center justify-between rounded px-2.5 py-2 transition-colors",
                        isHighlighted && "bg-accent text-accent-foreground",
                        isSelected && !isHighlighted && "bg-accent/40 font-medium",
                        !isSelected && !isHighlighted && "text-foreground hover:bg-accent/50"
                      )}
                    >
                      <span className="truncate pr-2">{opt.label}</span>
                      {isSelected && <Check size={14} className="text-primary shrink-0 ml-1.5" />}
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        )}
      </div>

      {error && <p className="text-xs font-medium text-destructive mt-0.5">{error}</p>}
    </div>
  );
}
