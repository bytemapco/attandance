"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

const CONFIRMATION_MS = 2000;

interface CopyToClipboard {
  /** The key of the value copied a moment ago, so its button can show a tick. */
  copiedKey: string | null;
  copy: (text: string, key: string) => Promise<void>;
}

export function useCopyToClipboard(): CopyToClipboard {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const copy = useCallback(async (text: string, key: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      toast.error("Failed to copy to clipboard");
      return;
    }
    setCopiedKey(key);
    toast.success(`${key} copied to clipboard`);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopiedKey(null), CONFIRMATION_MS);
  }, []);

  return useMemo(() => ({ copiedKey, copy }), [copiedKey, copy]);
}
