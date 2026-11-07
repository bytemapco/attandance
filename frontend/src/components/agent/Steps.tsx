import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** What the assistant looked up. The line being worked on has a breathing dot; finished lines get a tick. */
export default function Steps({ steps, working }: { steps: string[]; working: boolean }): React.ReactElement | null {
  if (steps.length === 0) return null;
  return (
    <ul className="space-y-1.5" aria-label="What the assistant looked up">
      {steps.map((label, index) => {
        const active = working && index === steps.length - 1;
        return (
          <li key={index} className={cn("flex items-center gap-2 text-xs", active ? "text-foreground" : "text-muted-foreground")}>
            <span aria-hidden className="flex h-4 w-4 shrink-0 items-center justify-center">
              {active ? (
                <span className="h-2 w-2 animate-pulse rounded-full bg-accent motion-reduce:animate-none" />
              ) : (
                <Check size={12} strokeWidth={2} />
              )}
            </span>
            {label.charAt(0).toUpperCase() + label.slice(1)}
          </li>
        );
      })}
    </ul>
  );
}
