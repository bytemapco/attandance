"use client";

import { useEffect } from "react";

/** Asks the browser to confirm before the tab is closed or reloaded while there is unsaved work. */
export function useWarnBeforeLeaving(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    const warn = (e: BeforeUnloadEvent): void => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [active]);
}
