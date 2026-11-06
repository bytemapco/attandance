"use client";

import React, { useState } from "react";
import { SendHorizontal } from "lucide-react";

const MAX_LENGTH = 2000;

interface ComposerProps {
  disabled: boolean;
  onSend: (text: string) => void;
}

export default function Composer({ disabled, onSend }: ComposerProps): React.ReactElement {
  const [text, setText] = useState("");

  function submit(event: React.FormEvent): void {
    event.preventDefault();
    if (disabled || !text.trim()) return;
    onSend(text);
    setText("");
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key === "Enter" && !event.shiftKey) submit(event);
  }

  return (
    <form onSubmit={submit} className="flex items-end gap-2 border-t border-border p-3">
      <label className="sr-only" htmlFor="assistant-input">Ask the assistant</label>
      <textarea
        id="assistant-input"
        rows={1}
        maxLength={MAX_LENGTH}
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Ask about attendance, classes, approvals..."
        className="max-h-32 min-h-9 flex-1 resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <button
        type="submit"
        disabled={disabled || !text.trim()}
        aria-label="Send"
        className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground transition-colors hover:bg-primary-hover disabled:pointer-events-none disabled:opacity-50"
      >
        <SendHorizontal size={16} aria-hidden />
      </button>
    </form>
  );
}
