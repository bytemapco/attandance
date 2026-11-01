"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Plus, X, HelpCircle } from "lucide-react";
import toast from "react-hot-toast";
import api, { getApiErrorMessage } from "@/lib/api";
import {
  suggestCode,
  COLLEGE_DEPARTMENTS,
  COLLEGE_DESIGNATIONS,
  COLLEGE_SUBJECTS,
  COLLEGE_CLASSROOMS,
  type PresetItem,
} from "@/lib/onboarding/collegePreset";
import GlassButton from "@/components/ui/GlassButton";
import GlassErrorState from "@/components/ui/GlassErrorState";

interface ListItem {
  id: string;
  name: string;
  code?: string;
}

interface QuickAddListProps {
  /** List and create endpoint, for example "/admin/departments". */
  endpoint: string;
  /** Singular name shown in the UI, for example "department". */
  noun: string;
  /** Custom label for the name field, defaults to `${noun} name` */
  nameLabel?: string;
  /** Custom placeholder for the name field */
  placeholder?: string;
  /** Custom label for code field */
  codeLabel?: string;
  /** Custom placeholder for code field */
  codePlaceholder?: string;
  /** Real-world example shown in tooltip */
  codeExample?: string;
  /** Items without a code, such as classrooms, send only the name. */
  needsCode: boolean;
  presets?: PresetItem[];
  hint?: string;
  hideForm?: boolean;
  /** Called after anything is added so the wizard re-reads the setup status. */
  onChanged: () => void;
}

export default function QuickAddList({
  endpoint,
  noun,
  nameLabel,
  placeholder,
  codeLabel,
  codePlaceholder,
  codeExample,
  needsCode,
  presets,
  hint,
  hideForm,
  onChanged,
}: QuickAddListProps): React.ReactElement {
  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  const activePresets = useMemo<PresetItem[]>(() => {
    if (presets && presets.length > 0) return presets;
    if (noun === "department") return COLLEGE_DEPARTMENTS;
    if (noun === "teacher" || noun === "teacher title" || noun === "designation") return COLLEGE_DESIGNATIONS;
    if (noun === "subject") return COLLEGE_SUBJECTS;
    if (noun === "classroom") return COLLEGE_CLASSROOMS;
    return [];
  }, [presets, noun]);

  // Find candidate preset that starts with the typed text (case-insensitive)
  const activeSuggestion = useMemo(() => {
    const trimmed = name.trim();
    if (!trimmed || trimmed.length < 1) return null;
    const lower = trimmed.toLowerCase();
    const existingNames = new Set(items.map((i) => i.name.toLowerCase()));

    return (
      activePresets.find((p) => {
        if (existingNames.has(p.name.toLowerCase())) return false;
        const pLower = p.name.toLowerCase();
        return pLower.startsWith(lower) && pLower !== lower;
      }) ?? null
    );
  }, [name, items, activePresets]);

  // Compute the suffix to show inline as ghost text
  const ghostSuffix = useMemo(() => {
    if (!activeSuggestion) return "";
    const trimmed = name.trimStart();
    if (!trimmed) return "";
    if (!activeSuggestion.name.toLowerCase().startsWith(trimmed.toLowerCase())) return "";
    return activeSuggestion.name.slice(trimmed.length);
  }, [activeSuggestion, name]);

  const applySuggestion = useCallback((): void => {
    if (!activeSuggestion) return;
    setName(activeSuggestion.name);
    if (needsCode && !code && activeSuggestion.code) {
      setCode(activeSuggestion.code);
    }
  }, [activeSuggestion, needsCode, code]);

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (
      (e.key === "Tab" || (e.key === "ArrowRight" && (e.currentTarget.selectionStart ?? 0) >= name.length)) &&
      activeSuggestion &&
      ghostSuffix
    ) {
      e.preventDefault();
      applySuggestion();
    }
  };

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setLoadFailed(false);
    try {
      const { data } = await api.get<ListItem[]>(endpoint);
      if (!Array.isArray(data)) throw new Error("Unexpected item list response");
      setItems(data);
    } catch {
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    void load();
  }, [load]);

  async function create(entry: { name: string; code?: string }): Promise<boolean> {
    try {
      const payload: Record<string, unknown> = { name: entry.name };
      if (entry.code && (needsCode || noun === "subject" || noun === "department")) {
        payload.code = entry.code;
      }
      await api.post(endpoint, payload);
      return true;
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, `Could not add ${entry.name}`));
      return false;
    }
  }

  async function deleteItem(id: string, itemName: string): Promise<void> {
    setBusyId(id);
    try {
      await api.delete(`${endpoint}/${id}`);
      toast.success(`Removed ${itemName}`);
      setItems((prev) => prev.filter((i) => i.id !== id));
      onChanged();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, `Could not remove ${itemName}`));
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function addMany(entries: { name: string; code?: string }[]): Promise<number> {
    setBusy(true);
    let added = 0;
    try {
      for (const entry of entries) {
        if (await create(entry)) added += 1;
      }
    } finally {
      setBusy(false);
    }
    if (added > 0) {
      toast.success(`${added} ${noun}${added === 1 ? "" : "s"} added`);
      await load();
      onChanged();
    }
    return added;
  }

  async function addCustom(): Promise<void> {
    const trimmed = name.trim();
    if (trimmed.length < 2) return;
    const finalCode = (
      code.trim() ||
      activeSuggestion?.code ||
      suggestCode(trimmed)
    ).toUpperCase();
    const added = await addMany([{ name: trimmed, code: finalCode }]);
    if (added === 0) return;
    setName("");
    setCode("");
  }

  if (loading) return <p role="status" className="text-xs text-[#526f78]">Loading {noun}s…</p>;
  if (loadFailed) {
    return <GlassErrorState title={`Could not load ${noun}s`} message="Your saved items are unchanged. Try again to continue." retryLabel="Reload items" className="p-5 sm:p-8" onRetry={() => void load()} />;
  }

  const defaultLabel = `${noun.charAt(0).toUpperCase() + noun.slice(1)} name`;

  return (
    <div className="space-y-3">
      {hint && <p className="text-xs text-[#526f78]">{hint}</p>}

      {/* Active Items Chips with Remove Buttons */}
      <div className="flex flex-wrap items-center gap-2" aria-live="polite">
        {items.map((item) => (
          <span
            key={item.id}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#c6e2d3] bg-[#e8f3ed] py-1 pl-2.5 pr-1.5 text-xs font-medium text-[#247653] shadow-2xs transition-colors"
          >
            <Check size={12} className="stroke-[2.5]" aria-hidden />
            <span className="font-semibold text-[#202b30]">{item.name}</span>
            {item.code && needsCode && (
              <span className="rounded border border-[#c6e2d3] bg-white px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-[#526f78]">
                {item.code}
              </span>
            )}
            <button
              type="button"
              disabled={busyId === item.id}
              onClick={() => void deleteItem(item.id, item.name)}
              className="ml-0.5 rounded p-0.5 text-[#526f78] transition-colors hover:bg-black/5 hover:text-[#b54242] focus:outline-none focus:ring-1 focus:ring-[#247653]"
              title={`Remove ${item.name}`}
              aria-label={`Remove ${item.name}`}
            >
              <X size={13} />
            </button>
          </span>
        ))}
        {items.length === 0 && <span className="text-xs italic text-[#718087]">No {noun}s added yet.</span>}
      </div>

      {/* Input Form with Inline Ghost Completion and Code Tooltip */}
      {!hideForm && (
        <form
          onSubmit={(event) => { event.preventDefault(); void addCustom(); }}
          className={`grid items-end gap-2.5 pt-0.5 ${needsCode ? "sm:grid-cols-[1fr_8.5rem_auto]" : "sm:grid-cols-[1fr_auto]"}`}
        >
        <div className="flex flex-col gap-1.5 w-full">
          <label htmlFor={`quick-add-${noun.replace(/\s+/g, "-")}-name`} className="text-xs sm:text-sm font-semibold text-[#202b30]">
            {nameLabel || defaultLabel}
          </label>
          <div className="relative flex items-center w-full rounded-md border border-[#e3e1dc] bg-card shadow-2xs transition-colors focus-within:ring-2 focus-within:ring-[#526f78] focus-within:border-transparent">
            {/* Ghost text overlay directly over the input text */}
            {ghostSuffix && (
              <div
                className="pointer-events-none absolute inset-0 flex items-center px-3 py-1 text-sm font-sans tracking-normal overflow-hidden whitespace-pre select-none"
                aria-hidden="true"
              >
                <span className="opacity-0">{name}</span>
                <span className="text-[#8e9fa6]">{ghostSuffix}</span>
              </div>
            )}

            <input
              id={`quick-add-${noun.replace(/\s+/g, "-")}-name`}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleNameKeyDown}
              placeholder={placeholder || `Enter ${noun} name`}
              className={`h-9 sm:h-10 w-full bg-transparent px-3 py-1 text-sm font-sans tracking-normal text-[#202b30] placeholder:text-[#718087] focus:outline-none ${ghostSuffix ? "pr-16" : ""}`}
            />

            {/* Inline Tab pill badge shown when a suggestion is available */}
            {ghostSuffix && (
              <button
                type="button"
                tabIndex={-1}
                onClick={applySuggestion}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex items-center gap-1 rounded border border-[#e3e1dc] bg-[#faf8f5] px-1.5 py-0.5 text-[10px] font-medium text-[#526f78] shadow-2xs transition-colors hover:bg-[#eeece7] hover:text-[#202b30] cursor-pointer"
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
              <label htmlFor="quick-add-code-input" className="text-xs sm:text-sm font-semibold text-[#202b30]">
                {codeLabel || "Code"}
              </label>
              <div className="group relative inline-flex items-center">
                <button
                  type="button"
                  tabIndex={-1}
                  className="rounded-full p-0.5 text-[#718087] transition-colors hover:text-[#202b30] focus:outline-none"
                  aria-label="Code example"
                >
                  <HelpCircle size={13} />
                </button>
                {/* Simple light tooltip showing only example */}
                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden whitespace-nowrap rounded-md border border-[#e3e1dc] bg-white px-2.5 py-1 text-xs font-medium text-[#202b30] shadow-md group-hover:block group-focus-within:block z-[200]">
                  <span>{codeExample || "e.g. CE, IT, ME"}</span>
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-2 w-2 rotate-45 border-b border-r border-[#e3e1dc] bg-white" />
                </div>
              </div>
            </div>
            <input
              id="quick-add-code-input"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder={suggestCode(name) || codePlaceholder || "e.g. CSE"}
              className="flex h-9 sm:h-10 w-full rounded-md border border-[#e3e1dc] bg-card px-3 py-1 text-sm shadow-2xs transition-colors text-[#202b30] placeholder:text-[#718087] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#526f78] focus-visible:border-transparent uppercase"
            />
          </div>
        )}
        <GlassButton type="submit" variant="primary" loading={busy} disabled={name.trim().length < 2} className="h-10">
          Add {noun}
        </GlassButton>
      </form>
      )}
    </div>
  );
}
