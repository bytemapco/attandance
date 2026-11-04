import React from "react";
import { Keyboard } from "lucide-react";

const SHORTCUTS: [string, string][] = [
  ["↑ ↓", "Move"],
  ["P", "Present, then next"],
  ["A", "Absent, then next"],
  ["Space", "Toggle present / absent"],
  ["U", "Undo unsaved change"],
  ["⇧ P", "Mark remaining present"],
  ["Ctrl S", "Save changes"],
  ["Ctrl ↵", "Stop & lock"],
  ["/", "Search"],
  ["1 2 3…", "Filter"],
  ["F", "Full screen QR"],
];

export default function ShortcutHints(): React.ReactElement {
  return (
    <details className="group hidden border-t border-border pt-4 md:block">
      <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-semibold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
        <Keyboard size={14} aria-hidden /> Keyboard shortcuts
      </summary>
      <ul className="mt-3 space-y-1.5" aria-label="Keyboard shortcuts">
        {SHORTCUTS.map(([keys, label]) => (
          <li key={label} className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
            {label}
            <kbd className="rounded-sm border border-border bg-background px-1.5 py-0.5 font-sans text-xs font-semibold text-foreground">{keys}</kbd>
          </li>
        ))}
      </ul>
    </details>
  );
}
