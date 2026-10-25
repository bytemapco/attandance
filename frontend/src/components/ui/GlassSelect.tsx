"use client";

import React from "react";
import { cn } from "@/lib/utils";
import GlassCombobox from "@/components/ui/GlassCombobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface SelectOption {
  value: string;
  label: string;
}

export interface GlassSelectProps {
  label?: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  error?: string;
  id?: string;
  disabled?: boolean;
  searchable?: boolean;
  className?: string;
}

export default function GlassSelect({
  label,
  options,
  value,
  onChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  error,
  id,
  disabled = false,
  searchable,
  className = "",
}: GlassSelectProps): React.ReactElement {
  const isSearchable = searchable === true || (searchable !== false && options.length > 9);

  if (isSearchable) {
    return (
      <GlassCombobox
        label={label}
        options={options}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        searchPlaceholder={searchPlaceholder}
        error={error}
        id={id}
        disabled={disabled}
        className={className}
      />
    );
  }

  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
  const resolvedValue = value ? value : undefined;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <Select
        value={resolvedValue}
        onValueChange={(val) => onChange(val === "__EMPTY_SELECT__" ? "" : val)}
        disabled={disabled}
      >
        <SelectTrigger
          id={selectId}
          className={cn(
            "flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm shadow-2xs transition-colors cursor-pointer",
            error && "border-destructive focus:ring-destructive",
            className
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="max-h-80">
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value || "__EMPTY_SELECT__"}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-xs font-medium text-destructive mt-0.5">{error}</p>}
    </div>
  );
}

