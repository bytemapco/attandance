"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { masterDataTabs } from "@/components/navigation/masterDataTabs";

export default function MasterDataLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  const pathname = usePathname();
  const showTabs = masterDataTabs.some((tab) => tab.href === pathname);

  return (
    <div className="space-y-5">
      {showTabs && (
        <div className="space-y-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#526f78]">Master Data</p>
            <p className="text-xs text-[#718087]">Reference information used across students, classes and attendance.</p>
          </div>
          <nav aria-label="Master data" className="flex gap-1 overflow-x-auto border-b border-[#e3e1dc]">
            {masterDataTabs.map((tab) => {
              const active = tab.href === pathname;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors -mb-px",
                    active
                      ? "border-[#c98260] text-[#28363b]"
                      : "border-transparent text-[#526f78] hover:text-[#202b30] hover:border-[#e3e1dc]"
                  )}
                >
                  <span className={active ? "text-[#c98260]" : ""}>{tab.icon}</span>
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
      {children}
    </div>
  );
}
