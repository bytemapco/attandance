"use client";

import React, { useState } from "react";
import { Download } from "lucide-react";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "@/lib/api";
import { downloadLinked } from "@/services/agent";
import type { Cell } from "@/types/agent";

interface TableBlockProps {
  title: string;
  columns: string[];
  rows: Cell[][];
  download?: string;
}

const VISIBLE_ROWS = 8;

function show(cell: Cell): string {
  return cell === null ? "-" : String(cell);
}

export default function TableBlock({ title, columns, rows, download }: TableBlockProps): React.ReactElement {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const shown = expanded ? rows : rows.slice(0, VISIBLE_ROWS);

  async function save(): Promise<void> {
    if (!download) return;
    setSaving(true);
    try {
      await downloadLinked(download);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-2 rounded-md border border-border bg-card" aria-label={title}>
      <header className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <h4 className="text-xs font-semibold text-foreground">
          {title} <span className="font-normal text-muted-foreground">({rows.length})</span>
        </h4>
        {download && (
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline disabled:opacity-50"
          >
            <Download size={12} aria-hidden /> Excel
          </button>
        )}
      </header>
      <div className="max-h-64 overflow-auto">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-secondary text-muted-foreground">
            <tr>
              {columns.map((column) => (
                <th key={column} scope="col" className="px-3 py-1.5 font-medium">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((row, index) => (
              <tr key={index} className="border-t border-border">
                {row.map((cell, position) => (
                  <td key={position} className="px-3 py-1.5 text-foreground">
                    {show(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > VISIBLE_ROWS && (
        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          className="w-full border-t border-border px-3 py-1.5 text-xs font-medium text-primary hover:bg-secondary"
        >
          {expanded ? "Show fewer" : `Show all ${rows.length}`}
        </button>
      )}
    </section>
  );
}
