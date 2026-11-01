import React from "react";

export interface SettingsNavItem {
  id: string;
  label: string;
}

/** Jumps to a settings section. A row on small screens, a sticky column on large ones. */
export default function SettingsNav({ items }: { items: SettingsNavItem[] }): React.ReactElement {
  return (
    <nav aria-label="Settings sections" className="lg:sticky lg:top-6 lg:self-start">
      <ul className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
        {items.map((item) => (
          <li key={item.id} className="shrink-0">
            <a
              href={`#${item.id}`}
              className="block whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-[#526f78] transition-colors hover:bg-[#eeece7] hover:text-[#202b30] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#526f78]"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
