"use client";

import React, { useEffect, useRef } from "react";
import useSWR from "swr";
import { SquarePen } from "lucide-react";
import AgentBot from "@/components/agent/AgentBot";
import Composer from "@/components/agent/Composer";
import MessageBubble from "@/components/agent/MessageBubble";
import NoticeGate from "@/components/agent/NoticeGate";
import { useAgentChat } from "@/hooks/useAgentChat";
import type { AgentStatus } from "@/types/agent";

const NEAR_BOTTOM_PX = 80;
const TITLE = "SAHAJ Assistant";

function Suggestions({ onPick }: { onPick: (text: string) => void }): React.ReactElement {
  const { data } = useSWR<{ suggestions: string[] }>("/agent/suggestions");
  return (
    <div className="space-y-3 px-4 py-6">
      <p className="text-sm text-muted-foreground">Suggested questions</p>
      <ul className="flex flex-col gap-2">
        {data?.suggestions.map((text) => (
          <li key={text}>
            <button
              type="button"
              onClick={() => onPick(text)}
              className="w-full rounded-lg border border-border bg-card px-4 py-3 text-left text-sm text-foreground transition-colors hover:border-border-strong hover:bg-secondary"
            >
              {text}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface AgentPanelProps {
  /** Whether the window is showing. When it is not, it is kept mounted but hidden, so the chat survives. */
  open: boolean;
  onMinimize: () => void;
}

/** The chat window. It grows out of the bot when it opens and shrinks back into it when minimized. */
export default function AgentPanel({ open, onMinimize }: AgentPanelProps): React.ReactElement {
  const { data: status, mutate } = useSWR<AgentStatus>("/agent/status");
  const chat = useAgentChat(() => void mutate());
  const scroller = useRef<HTMLDivElement>(null);
  const following = useRef(true);
  const ready = Boolean(status?.model_configured && status.notice_accepted);
  const { messages, busy } = chat.state;

  // Follow the answer as it grows, unless the person has scrolled up to read.
  useEffect(() => {
    const box = scroller.current;
    if (box && following.current) box.scrollTop = box.scrollHeight;
  }, [messages, open]);

  // The question box only exists once the assistant is known to be on, so focus again when it appears.
  useEffect(() => {
    if (open && ready) document.getElementById("assistant-input")?.focus();
  }, [open, ready]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent): void {
      if (event.key === "Escape") onMinimize();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onMinimize]);

  function onScroll(): void {
    const box = scroller.current;
    if (box) following.current = box.scrollHeight - box.scrollTop - box.clientHeight < NEAR_BOTTOM_PX;
  }

  function send(text: string): void {
    following.current = true;
    void chat.send(text);
  }

  return (
    <aside
      role="dialog"
      aria-label={TITLE}
      aria-hidden={!open}
      inert={!open}
      className={`fixed inset-0 z-50 flex origin-bottom-right flex-col overflow-hidden border-border bg-background transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none sm:inset-auto sm:bottom-4 sm:right-4 sm:h-[min(700px,calc(100dvh-2rem))] sm:w-[420px] sm:rounded-lg sm:border sm:shadow-popover ${open ? "scale-100 opacity-100" : "pointer-events-none scale-75 opacity-0"}`}
    >
      <header className="flex items-center gap-2 border-b border-border px-4 py-2">
        <h2 className="min-w-0 flex-1 text-sm font-medium text-foreground">{TITLE}</h2>
        <button
          type="button"
          onClick={chat.reset}
          aria-label="New chat"
          className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <SquarePen size={16} strokeWidth={1.5} aria-hidden />
        </button>
        <button
          type="button"
          onClick={onMinimize}
          aria-label="Minimize to the bot"
          className="rounded-md p-1 transition-colors hover:bg-secondary"
        >
          <AgentBot size={28} />
        </button>
      </header>

      <div ref={scroller} onScroll={onScroll} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto w-full max-w-3xl">
          {status && !ready && <NoticeGate status={status} onAccepted={() => void mutate()} />}
          {ready && messages.length === 0 && <Suggestions onPick={send} />}
          {ready && messages.length > 0 && (
            <ul className="space-y-6 px-4 py-6" aria-live="polite">
              {messages.map((message, index) => (
                <MessageBubble key={message.id} message={message} live={busy && index === messages.length - 1} />
              ))}
            </ul>
          )}
        </div>
      </div>

      {ready && (
        <div className="mx-auto w-full max-w-3xl">
          <Composer busy={busy} onSend={send} onStop={chat.stop} />
        </div>
      )}
    </aside>
  );
}
