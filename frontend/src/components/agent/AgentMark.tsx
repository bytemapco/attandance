import React from "react";
import { cn } from "@/lib/utils";

/** The assistant's mark: a copper dot. It breathes while the assistant is working. */
export default function AgentMark({ working = false, className }: { working?: boolean; className?: string }): React.ReactElement {
  return (
    <span
      aria-hidden
      className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-accent-border bg-accent-soft", className)}
    >
      <span className={cn("h-2 w-2 rounded-full bg-accent", working && "animate-pulse motion-reduce:animate-none")} />
    </span>
  );
}
