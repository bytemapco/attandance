"use client";

import React, { useLayoutEffect, useRef, useState } from "react";
import { ArrowUp, Square } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_LENGTH = 2000;
const MAX_HEIGHT_PX = 144;
const ROUND = "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors";

interface ComposerProps {
  busy: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
}

export default function Composer({ busy, onSend, onStop }: ComposerProps): React.ReactElement {
  const [text, setText] = useState("");
  const box = useRef<HTMLTextAreaElement>(null);
  const ready = !busy && text.trim().length > 0;

  useLayoutEffect(() => {
    const field = box.current;
    if (!field) return;
    field.style.height = "auto";
    field.style.height = `${Math.min(field.scrollHeight, MAX_HEIGHT_PX)}px`;
  }, [text]);

  function submit(event: React.SyntheticEvent): void {
    event.preventDefault();
    if (!ready) return;
    onSend(text);
    setText("");
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) submit(event);
  }

  return (
    <form onSubmit={submit} className="px-3 pb-3 pt-1">
      <div className="flex items-end gap-2 rounded-lg border border-input bg-card py-2 pl-4 pr-2 transition-colors focus-within:border-ring">
        <label className="sr-only" htmlFor="assistant-input">Ask the assistant</label>
        <textarea
          ref={box}
          id="assistant-input"
          rows={1}
          maxLength={MAX_LENGTH}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask a question"
          className="max-h-36 min-h-7 flex-1 resize-none bg-transparent py-1 text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground focus-visible:outline-none"
        />
        {busy ? (
          <button type="button" onClick={onStop} aria-label="Stop" className={cn(ROUND, "bg-primary text-primary-foreground hover:bg-primary-hover")}>
            <Square size={12} fill="currentColor" aria-hidden />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!ready}
            aria-label="Send"
            className={cn(ROUND, ready ? "bg-primary text-primary-foreground hover:bg-primary-hover" : "bg-secondary text-muted-foreground")}
          >
            <ArrowUp size={16} strokeWidth={1.5} aria-hidden />
          </button>
        )}
      </div>
    </form>
  );
}
