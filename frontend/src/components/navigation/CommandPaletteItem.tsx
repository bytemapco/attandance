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
      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-all cursor-pointer ${
        isSelected
          ? "bg-[#f7efea] text-[#28363b] shadow-2xs border-l-2 border-[#c98260]"
          : "text-[#526f78] hover:bg-secondary/60 border-l-2 border-transparent"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-2 rounded-lg bg-card border border-[#e3e1dc] shrink-0 text-[#28363b]">
          {getCommandIcon(item.icon_type, item.category)}
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-[#202b30] truncate flex items-center gap-2">
            <span>{item.title}</span>
            {item.badge && item.badge !== "Action" && (
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                  item.badge === "LIVE"
                    ? "bg-[#e8f3ed] text-[#247653] border-[#c6e2d3]"
                    : "bg-[#eeece7] text-[#526f78] border-[#e3e1dc]"
                }`}
              >
                {item.badge}
              </span>
            )}
          </div>
          {item.subtitle && (
            <p className="text-[11px] text-[#526f78] truncate mt-0.5">{item.subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 ml-3 text-[10px] text-[#526f78]">
        <CornerDownLeft
          size={13}
          className={`transition-opacity ${isSelected ? "text-[#c98260] opacity-100" : "opacity-0"}`}
        />
      </div>
    </button>
  );
}
