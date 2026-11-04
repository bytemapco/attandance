"use client";

import React, { useState } from "react";
import { HelpCircle } from "lucide-react";
import { useNameSuggestion } from "@/hooks/useNameSuggestion";
import { suggestCode, type PresetItem } from "@/lib/onboarding/collegePreset";
import type { NewSetupItem } from "@/services/setupItems";
import GlassButton from "@/components/ui/GlassButton";

const MIN_NAME_LENGTH = 2;

interface QuickAddFormProps {
  noun: string;
  nameLabel?: string;
  placeholder?: string;
  codeLabel?: string;
  codePlaceholder?: string;
  /** Real-world example shown in the code tooltip. */
  codeExample?: string;
  needsCode: boolean;
  presets?: PresetItem[];
  /** Names already added, so they are not suggested again. */
  addedNames: string[];
  busy: boolean;
  /** Returns how many entries were created; the form clears when one was. */
  onAdd: (entries: NewSetupItem[]) => Promise<number>;
}

export default function QuickAddForm({
  noun,
  nameLabel,
  placeholder,
  codeLabel,
  codePlaceholder,
  codeExample,
  needsCode,
  presets,
  addedNames,
  busy,
  onAdd,
}: QuickAddFormProps): React.ReactElement {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const { suggestion, ghostSuffix } = useNameSuggestion(name, addedNames, noun, presets);

  const nameInputId = `quick-add-${noun.replace(/\s+/g, "-")}-name`;
  const defaultLabel = `${noun.charAt(0).toUpperCase() + noun.slice(1)} name`;

  const applySuggestion = (): void => {
    if (!suggestion) return;
    setName(suggestion.name);
    if (needsCode && !code && suggestion.code) setCode(suggestion.code);
  };

  const handleNameKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    const acceptsKey =
      event.key === "Tab" ||
      (event.key === "ArrowRight" && (event.currentTarget.selectionStart ?? 0) >= name.length);
    if (acceptsKey && suggestion && ghostSuffix) {
      event.preventDefault();
      applySuggestion();
    }
  };

  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < MIN_NAME_LENGTH) return;
    const finalCode = (code.trim() || suggestion?.code || suggestCode(trimmed)).toUpperCase();
    const added = await onAdd([{ name: trimmed, code: finalCode }]);
    if (added === 0) return;
    setName("");
    setCode("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`grid items-end gap-2.5 pt-0.5 ${needsCode ? "sm:grid-cols-[1fr_8.5rem_auto]" : "sm:grid-cols-[1fr_auto]"}`}
    >
      <div className="flex flex-col gap-1.5 w-full">
        <label htmlFor={nameInputId} className="text-xs sm:text-sm font-semibold text-foreground">
          {nameLabel || defaultLabel}
        </label>
        <div className="relative flex items-center w-full rounded-md border border-border bg-card shadow-2xs transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:border-transparent">
          {ghostSuffix && (
            <div
              className="pointer-events-none absolute inset-0 flex items-center px-3 py-1 text-sm font-sans tracking-normal overflow-hidden whitespace-pre select-none"
              aria-hidden="true"
            >
              <span className="opacity-0">{name}</span>
              <span className="text-muted-foreground/50">{ghostSuffix}</span>
            </div>
          )}

          <input
            id={nameInputId}
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={handleNameKeyDown}
            placeholder={placeholder || `Enter ${noun} name`}
            className={`h-9 sm:h-10 w-full bg-transparent px-3 py-1 text-sm font-sans tracking-normal text-foreground placeholder:text-muted-foreground focus:outline-none ${ghostSuffix ? "pr-16" : ""}`}
          />

          {ghostSuffix && (
            <button
              type="button"
              tabIndex={-1}
              onClick={applySuggestion}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex items-center gap-1 rounded border border-border bg-surface px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground shadow-2xs transition-colors hover:bg-secondary hover:text-foreground cursor-pointer"
              title="Press Tab to apply suggestion"
            >
              <span>Tab</span>
              <span className="text-[11px] leading-none">⇥</span>
            </button>
          )}
        </div>
      </div>

      {needsCode && (
        <div className="flex flex-col gap-1.5 w-full">
          <div className="flex items-center gap-1">
            <label htmlFor="quick-add-code-input" className="text-xs sm:text-sm font-semibold text-foreground">
              {codeLabel || "Code"}
            </label>
            <div className="group relative inline-flex items-center">
              <button
                type="button"
                tabIndex={-1}
                className="rounded-full p-0.5 text-muted-foreground transition-colors hover:text-foreground focus:outline-none"
                aria-label="Code example"
              >
                <HelpCircle size={13} />
              </button>
              <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden whitespace-nowrap rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground shadow-md group-hover:block group-focus-within:block z-[200]">
                <span>{codeExample || "e.g. CE, IT, ME"}</span>
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-2 w-2 rotate-45 border-b border-r border-border bg-card" />
              </div>
            </div>
          </div>
          <input
            id="quick-add-code-input"
            type="text"
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder={suggestCode(name) || codePlaceholder || "e.g. CSE"}
            className="flex h-9 sm:h-10 w-full rounded-md border border-border bg-card px-3 py-1 text-sm shadow-2xs transition-colors text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent uppercase"
          />
        </div>
      )}
      <GlassButton
        type="submit"
        variant="primary"
        loading={busy}
        disabled={name.trim().length < MIN_NAME_LENGTH}
        className="h-10"
      >
        Add {noun}
      </GlassButton>
    </form>
  );
}
