"use client";

import React, { useMemo } from "react";
import { useQuickAddItems } from "@/hooks/useQuickAddItems";
import type { PresetItem } from "@/lib/onboarding/collegePreset";
import ErrorState from "@/components/ui/ErrorState";
import QuickAddChips from "./QuickAddChips";
import QuickAddForm from "./QuickAddForm";

const ALWAYS_CODED_NOUNS = ["subject", "department"];

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
  hint,
  hideForm,
  needsCode,
  onChanged,
  ...formProps
}: QuickAddListProps): React.ReactElement {
  const { items, loading, loadFailed, adding, removingId, reload, addMany, remove } = useQuickAddItems({
    endpoint,
    noun,
    sendsCode: needsCode || ALWAYS_CODED_NOUNS.includes(noun),
    onChanged,
  });
  const addedNames = useMemo(() => items.map((item) => item.name), [items]);

  if (loading) return <p role="status" className="text-xs text-muted-foreground">Loading {noun}s…</p>;
  if (loadFailed) {
    return (
      <ErrorState
        title={`Could not load ${noun}s`}
        message="Your saved items are unchanged. Try again to continue."
        retryLabel="Reload items"
        className="p-5 sm:p-8"
        onRetry={() => void reload()}
      />
    );
  }

  return (
    <div className="space-y-3">
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <QuickAddChips
        items={items}
        noun={noun}
        showCodes={needsCode}
        removingId={removingId}
        onRemove={(id, name) => void remove(id, name)}
      />
      {!hideForm && (
        <QuickAddForm
          {...formProps}
          noun={noun}
          needsCode={needsCode}
          addedNames={addedNames}
          busy={adding}
          onAdd={addMany}
        />
      )}
    </div>
  );
}
