"use client";

import React, { useState, useRef, useEffect, useId } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import ComboboxDropdown from "./ComboboxDropdown";

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
        <label htmlFor={comboboxId} className="text-sm font-semibold text-[#202b30]">
          {label}
        </label>
      )}

      <select
        id={comboboxId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only pointer-events-none"
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      <div className="relative w-full">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen((prev) => !prev)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-md border border-[#e3e1dc] bg-card px-3 py-1 text-sm shadow-xs transition-colors text-left cursor-pointer",
            "text-[#202b30] hover:border-[#c98260]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#526f78]",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-[#b54242] focus-visible:ring-[#b54242]",
            className
          )}
        >
          <span className={cn("truncate", !selectedOption && "text-[#526f78]")}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            size={16}
            className={cn(
              "text-[#526f78] shrink-0 transition-transform duration-200 ml-2",
              isOpen && "rotate-180"
            )}
          />
        </button>

        {isOpen && (
          <ComboboxDropdown
            searchInputRef={searchInputRef}
            listRef={listRef}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder={searchPlaceholder}
            filteredOptions={filteredOptions}
            selectedValue={value}
            highlightedIndex={highlightedIndex}
            onHighlightIndex={setHighlightedIndex}
            onSelectOption={handleSelect}
          />
        )}
      </div>

      {error && <p className="text-xs font-medium text-[#b54242] mt-0.5">{error}</p>}
    </div>
  );
}
