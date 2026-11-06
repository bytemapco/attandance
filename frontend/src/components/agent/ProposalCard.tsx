"use client";

import React, { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import Button from "@/components/ui/Button";
import TableBlock from "@/components/agent/TableBlock";
import { getApiErrorMessage } from "@/lib/api";
import { cancelProposal, confirmProposal } from "@/services/agent";
import type { Cell, ProposalData, TableBlockData } from "@/types/agent";

type Phase = "idle" | "working" | "confirmed" | "cancelled";

const LONG_TEXT = 60;

function previewTable(details: ProposalData["details"]): TableBlockData | null {
  const candidate = details.table as Partial<TableBlockData> | undefined;
  if (!candidate?.columns || !candidate.rows) return null;
  return { type: "ui", kind: "table", title: candidate.title ?? "Preview", columns: candidate.columns, rows: candidate.rows };
}

function listOf(details: ProposalData["details"]): string[] {
  const recipients = details.recipients;
  return Array.isArray(recipients) ? recipients.map(String) : [];
}

interface FieldProps {
  name: string;
  value: Cell;
  onChange: (value: Cell) => void;
}

function Field({ name, value, onChange }: FieldProps): React.ReactElement {
  const label = name.replace(/_/g, " ");
  if (typeof value === "boolean") {
    return (
      <label className="flex items-center gap-2 text-xs text-foreground">
        <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
        <span className="capitalize">{label}</span>
      </label>
    );
  }
  const text = String(value ?? "");
  const className = "mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground";
  return (
    <label className="block text-xs font-medium text-muted-foreground">
      <span className="capitalize">{label}</span>
      {text.length > LONG_TEXT || name === "message" ? (
        <textarea className={className} rows={4} value={text} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className={className} value={text} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}

export default function ProposalCard({ proposal }: { proposal: ProposalData }): React.ReactElement {
  const [phase, setPhase] = useState<Phase>("idle");
  const [edits, setEdits] = useState<Record<string, Cell>>(proposal.editable);
  const [outcome, setOutcome] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const table = previewTable(proposal.details);
  const recipients = listOf(proposal.details);

  async function decide(action: "confirm" | "cancel"): Promise<void> {
    setPhase("working");
    setError(null);
    try {
      if (action === "confirm") setOutcome((await confirmProposal(proposal.id, edits)).message);
      else await cancelProposal(proposal.id);
      setPhase(action === "confirm" ? "confirmed" : "cancelled");
    } catch (failure) {
      setError(getApiErrorMessage(failure));
      setPhase("idle");
    }
  }

  if (phase === "confirmed") {
    return (
      <p className="mt-2 flex items-center gap-2 rounded-md border border-border bg-success-soft px-3 py-2 text-sm text-success" role="status">
        <CheckCircle2 size={16} aria-hidden /> {outcome ?? "Done."}
      </p>
    );
  }
  if (phase === "cancelled") {
    return <p className="mt-2 rounded-md border border-border bg-secondary px-3 py-2 text-sm text-muted-foreground">Cancelled. Nothing was changed.</p>;
  }

  return (
    <section className="mt-2 rounded-md border border-primary/40 bg-card p-3" aria-label="Confirm this change">
      <h4 className="text-sm font-semibold text-foreground">{proposal.summary}</h4>
      {recipients.length > 0 && <p className="mt-1 text-xs text-muted-foreground">To: {recipients.join(", ")}</p>}
      {table && <TableBlock {...table} />}
      <div className="mt-3 space-y-2">
        {Object.entries(edits).map(([name, value]) => (
          <Field key={name} name={name} value={value} onChange={(next) => setEdits((current) => ({ ...current, [name]: next }))} />
        ))}
      </div>
      {error && <p className="mt-2 text-xs text-destructive" role="alert">{error}</p>}
      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={() => decide("confirm")} loading={phase === "working"}>Confirm</Button>
        <Button size="sm" variant="secondary" onClick={() => decide("cancel")} disabled={phase === "working"}>Cancel</Button>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">Nothing changes until you press Confirm.</p>
    </section>
  );
}
