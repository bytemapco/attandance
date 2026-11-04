import React from "react";
import { Check, X } from "lucide-react";
import type { SetupItem } from "@/services/setupItems";

interface QuickAddChipsProps {
  items: SetupItem[];
  noun: string;
  showCodes: boolean;
  removingId: string | null;
  onRemove: (id: string, name: string) => void;
}

export default function QuickAddChips({
  items,
  noun,
  showCodes,
  removingId,
  onRemove,
}: QuickAddChipsProps): React.ReactElement {
  return (
    <div className="flex flex-wrap items-center gap-2" aria-live="polite">
      {items.map((item) => (
        <span
          key={item.id}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#c6e2d3] bg-[#e8f3ed] py-1 pl-2.5 pr-1.5 text-xs font-medium text-[#247653] shadow-2xs transition-colors"
        >
          <Check size={12} className="stroke-[2.5]" aria-hidden />
          <span className="font-semibold text-[#202b30]">{item.name}</span>
          {item.code && showCodes && (
            <span className="rounded border border-[#c6e2d3] bg-white px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-[#526f78]">
              {item.code}
            </span>
          )}
          <button
            type="button"
            disabled={removingId === item.id}
            onClick={() => onRemove(item.id, item.name)}
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
  );
}
