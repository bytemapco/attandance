"use client";

import React from "react";
import { Check, Copy } from "lucide-react";
import { useClipboard } from "./ClipboardContext";

interface InfoRowProps {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  /** Shows a copy button when both this and `copyKey` are set. */
  copyValue?: string;
  copyKey?: string;
}

export default function InfoRow({ icon: Icon, label, value, copyValue, copyKey }: InfoRowProps): React.ReactElement {
  const { copiedKey, copy } = useClipboard();

  return (
    <div className="group flex items-center justify-between p-3 rounded-lg border border-transparent hover:border-border/60 hover:bg-muted/40 transition-colors">
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-muted/60 border border-border/60 flex items-center justify-center text-[#526f78] shrink-0">
          <Icon size={16} />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="text-sm font-semibold text-foreground truncate">{value}</p>
        </div>
      </div>
      {copyValue && copyKey && (
        <button
          type="button"
          onClick={() => copy(copyValue, copyKey)}
          className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 rounded-md hover:bg-card text-muted-foreground hover:text-foreground transition-all cursor-pointer"
          title={`Copy ${label}`}
          aria-label={`Copy ${label}`}
        >
          {copiedKey === copyKey ? <Check size={14} className="text-[#247653]" /> : <Copy size={14} />}
        </button>
      )}
    </div>
  );
}
