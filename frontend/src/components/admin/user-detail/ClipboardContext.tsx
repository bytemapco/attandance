"use client";

import { createContext, useContext } from "react";

export interface ClipboardValue {
  copiedKey: string | null;
  copy: (text: string, key: string) => Promise<void>;
}

const ClipboardContext = createContext<ClipboardValue | null>(null);

export const ClipboardProvider = ClipboardContext.Provider;

export function useClipboard(): ClipboardValue {
  const value = useContext(ClipboardContext);
  if (!value) throw new Error("useClipboard must be used inside a ClipboardProvider");
  return value;
}
