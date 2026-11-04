"use client";

import { useMemo } from "react";
import {
  COLLEGE_CLASSROOMS,
  COLLEGE_DEPARTMENTS,
  COLLEGE_DESIGNATIONS,
  COLLEGE_SUBJECTS,
  type PresetItem,
} from "@/lib/onboarding/collegePreset";

const PRESETS_BY_NOUN: Record<string, PresetItem[]> = {
  department: COLLEGE_DEPARTMENTS,
  teacher: COLLEGE_DESIGNATIONS,
  "teacher title": COLLEGE_DESIGNATIONS,
  designation: COLLEGE_DESIGNATIONS,
  subject: COLLEGE_SUBJECTS,
  classroom: COLLEGE_CLASSROOMS,
};

interface NameSuggestion {
  /** The preset the typed text is the start of, or null. */
  suggestion: PresetItem | null;
  /** The rest of the suggested name, shown as ghost text after what has been typed. */
  ghostSuffix: string;
}

/** Suggests the first preset not yet added whose name starts with what the admin has typed. */
export function useNameSuggestion(
  typed: string,
  addedNames: string[],
  noun: string,
  presets?: PresetItem[]
): NameSuggestion {
  const candidates = useMemo<PresetItem[]>(
    () => (presets && presets.length > 0 ? presets : PRESETS_BY_NOUN[noun] ?? []),
    [presets, noun]
  );

  const suggestion = useMemo(() => {
    const lower = typed.trim().toLowerCase();
    if (!lower) return null;
    const added = new Set(addedNames.map((name) => name.toLowerCase()));
    return (
      candidates.find((preset) => {
        const candidate = preset.name.toLowerCase();
        return !added.has(candidate) && candidate.startsWith(lower) && candidate !== lower;
      }) ?? null
    );
  }, [typed, addedNames, candidates]);

  const ghostSuffix = useMemo(() => {
    const start = typed.trimStart();
    if (!suggestion || !start) return "";
    if (!suggestion.name.toLowerCase().startsWith(start.toLowerCase())) return "";
    return suggestion.name.slice(start.length);
  }, [suggestion, typed]);

  return { suggestion, ghostSuffix };
}
