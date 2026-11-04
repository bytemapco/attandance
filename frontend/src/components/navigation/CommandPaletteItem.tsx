import React from "react";
import { CornerDownLeft } from "lucide-react";
import { getCommandIcon } from "./commandIcons";
import type { SearchResultItem } from "@/types";

interface CommandPaletteItemProps {
  item: SearchResultItem;
  isSelected: boolean;
  onSelect: (item: SearchResultItem) => void;
  onMouseEnter: () => void;
}

export default function CommandPaletteItem({
  item,
  isSelected,
  onSelect,
  onMouseEnter,
}: CommandPaletteItemProps): React.ReactElement {
  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      onMouseEnter={onMouseEnter}
      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs transition-all cursor-pointer ${
        isSelected
          ? "bg-accent-soft text-primary border-l-2 border-accent"
          : "text-muted-foreground hover:bg-secondary/60 border-l-2 border-transparent"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-2 rounded-lg bg-card border border-border shrink-0 text-primary">
          {getCommandIcon(item.icon_type, item.category)}
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-foreground truncate flex items-center gap-2">
            <span>{item.title}</span>
            {item.badge && item.badge !== "Action" && (
              <span
                className={`px-1.5 py-0.5 rounded-sm text-xs font-semibold border ${
                  item.badge === "LIVE"
                    ? "bg-success-soft text-success border-success-border"
                    : "bg-secondary text-muted-foreground border-border"
                }`}
              >
                {item.badge}
              </span>
            )}
          </div>
          {item.subtitle && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{item.subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 ml-3 text-xs text-muted-foreground">
        <CornerDownLeft
          size={13}
          className={`transition-opacity ${isSelected ? "text-accent-strong opacity-100" : "opacity-0"}`}
        />
      </div>
    </button>
  );
}
