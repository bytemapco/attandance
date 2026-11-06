"use client";

import React, { useEffect, useRef } from "react";
import useSWR from "swr";
import { Plus, X } from "lucide-react";
import Composer from "@/components/agent/Composer";
import MessageBubble from "@/components/agent/MessageBubble";
import NoticeGate from "@/components/agent/NoticeGate";
import { useAgentChat } from "@/hooks/useAgentChat";
import type { AgentStatus } from "@/types/agent";

interface AgentPanelProps {
  onClose: () => void;
}

function Suggestions({ onPick }: { onPick: (text: string) => void }): React.ReactElement | null {
  const { data } = useSWR<{ suggestions: string[] }>("/agent/suggestions");
  if (!data) return null;
  return (
    <div className="space-y-2 p-4">
      <p className="text-sm text-muted-foreground">Ask me about attendance, classes and approvals. For example:</p>
      <ul className="flex flex-col gap-2">
        {data.suggestions.map((text) => (
          <li key={text}>
            <button
              type="button"
              onClick={() => onPick(text)}
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-left text-sm text-foreground hover:bg-secondary"
            >
              {text}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AgentPanel({ onClose }: AgentPanelProps): React.ReactElement {
  const { data: status, mutate } = useSWR<AgentStatus>("/agent/status");
  const chat = useAgentChat(() => void mutate());
  const endRef = useRef<HTMLDivElement>(null);
  const ready = Boolean(status?.model_configured && status.notice_accepted);

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: "end" });
  }, [chat.state.messages]);

  useEffect(() => {
    function onKey(event: KeyboardEvent): void {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <aside
      role="dialog"
      aria-label="SAHAJ Assistant"
      className="fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-border bg-background shadow-xl sm:w-[420px]"
    >
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">SAHAJ Assistant</h2>
        <div className="flex items-center gap-1">
          <button type="button" onClick={chat.reset} aria-label="New chat" className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground">
            <Plus size={16} aria-hidden />
          </button>
          <button type="button" onClick={onClose} aria-label="Close assistant" className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground">
            <X size={16} aria-hidden />
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {!status && <p className="p-4 text-sm text-muted-foreground">Loading...</p>}
        {status && !ready && <NoticeGate status={status} onAccepted={() => void mutate()} />}
        {ready && chat.state.messages.length === 0 && <Suggestions onPick={(text) => void chat.send(text)} />}
        {ready && chat.state.messages.length > 0 && (
          <ul className="space-y-4 p-4" aria-live="polite">
            {chat.state.messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </ul>
        )}
        <div ref={endRef} />
      </div>

      {ready && <Composer disabled={chat.state.busy} onSend={(text) => void chat.send(text)} />}
    </aside>
  );
}
