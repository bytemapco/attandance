import React from "react";
import { Info } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";

interface StepFrameProps {
  title: string;
  /** Plain-language reasons this step is not finished yet. */
  blockers?: string[];
  scrollContent?: boolean;
  children: React.ReactNode;
}

/** Common frame for one wizard step: heading, what is still needed, then the step's own form. */
export default function StepFrame({ title, blockers = [], children, scrollContent = true }: StepFrameProps): React.ReactElement {
  return (
    <GlassCard className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-4 sm:p-5">
      <header className="shrink-0">
        <h2 className="text-xl font-semibold text-[#202b30]">{title}</h2>
      </header>
      {blockers.length > 0 && (
        <div className="shrink-0 flex items-center gap-2.5 rounded-lg border border-[#edd5c0] bg-[#faf5f0] px-3.5 py-2 text-xs" aria-label="Required setup items">
          <Info size={14} className="shrink-0 text-[#c98260]" aria-hidden />
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-semibold text-[#202b30]">Required to complete step:</span>
            {blockers.map((message) => {
              const clean = message.split(".")[0].trim().replace(/\.$/, "");
              return (
                <span key={message} className="inline-flex items-center gap-1.5 font-medium text-[#526f78]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#c98260]" aria-hidden />
                  {clean}
                </span>
              );
            })}
          </div>
        </div>
      )}
      <div className={`min-h-0 flex-1 ${scrollContent ? "overflow-y-auto overscroll-contain" : "flex flex-col overflow-visible"}`}>{children}</div>
    </GlassCard>
  );
}
