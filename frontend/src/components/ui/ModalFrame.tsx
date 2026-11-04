"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface ModalFrameProps {
  /** Accessible name of the dialog. */
  label: string;
  children: React.ReactNode;
  /** Called on Escape and on a click outside the panel. Omit for a dialog that must be completed. */
  onClose?: () => void;
  size?: "md" | "lg";
  align?: "center" | "top";
  className?: string;
}

const sizeClass = { md: "max-w-md", lg: "max-w-2xl" } as const;

// Dialogs can stack (a confirmation over a form); only the topmost one reacts to Escape.
const openFrames: symbol[] = [];

export default function ModalFrame({
  label,
  children,
  onClose,
  size = "md",
  align = "center",
  className,
}: ModalFrameProps): React.ReactElement {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const token = Symbol("modal");
    const previouslyFocused = document.activeElement as HTMLElement | null;
    openFrames.push(token);
    if (!panelRef.current?.contains(document.activeElement)) panelRef.current?.focus();

    function handleKeyDown(e: KeyboardEvent): void {
      if (e.defaultPrevented || e.key !== "Escape") return;
      if (openFrames[openFrames.length - 1] === token) onCloseRef.current?.();
    }
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      openFrames.splice(openFrames.indexOf(token), 1);
      previouslyFocused?.focus();
    };
  }, []);

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex justify-center bg-overlay p-4",
        align === "top" ? "items-start pt-16" : "items-center"
      )}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className={cn(
          "max-h-full w-full overflow-y-auto rounded-lg border border-border bg-card shadow-popover outline-none",
          sizeClass[size],
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
