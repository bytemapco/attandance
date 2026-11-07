"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import AgentMark from "@/components/agent/AgentMark";
import Markdown from "@/components/agent/Markdown";
import ProposalCard from "@/components/agent/ProposalCard";
import Steps from "@/components/agent/Steps";
import TableBlock from "@/components/agent/TableBlock";
import { useTypedText } from "@/hooks/useTypedText";
import type { AgentBlock, ChatMessage } from "@/types/agent";

function Block({ block }: { block: AgentBlock }): React.ReactElement {
  if (block.type === "proposal") return <ProposalCard proposal={block} />;
  if (block.kind === "table") return <TableBlock title={block.title} columns={block.columns} rows={block.rows} download={block.download} />;
  return (
    <Link href={block.path} className="inline-flex items-center gap-1 text-xs font-medium text-accent-strong hover:underline">
      {block.label} <ArrowUpRight size={12} strokeWidth={1.5} aria-hidden />
    </Link>
  );
}

function Reply({ message, live }: { message: ChatMessage; live: boolean }): React.ReactElement {
  const typed = useTypedText(message.text);
  const written = typed.length === message.text.length;
  const working = live && !message.text && message.blocks.length === 0;
  return (
    <li className="flex gap-3">
      <AgentMark working={working} />
      <div className="min-w-0 flex-1 space-y-3">
        <Steps steps={message.steps} working={working} />
        {typed && (message.failed ? <p className="text-sm text-destructive">{typed}</p> : <Markdown text={typed} />)}
        {written && message.blocks.map((block, index) => <Block key={index} block={block} />)}
      </div>
    </li>
  );
}

/** `live` is true for the reply that is still being written. */
export default function MessageBubble({ message, live = false }: { message: ChatMessage; live?: boolean }): React.ReactElement {
  if (message.role === "assistant") return <Reply message={message} live={live} />;
  return (
    <li className="flex justify-end">
      <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-lg bg-primary px-4 py-2 text-sm leading-relaxed text-primary-foreground">
        {message.text}
      </p>
    </li>
  );
}
