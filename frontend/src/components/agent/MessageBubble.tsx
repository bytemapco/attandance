"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight, Loader2 } from "lucide-react";
import ProposalCard from "@/components/agent/ProposalCard";
import TableBlock from "@/components/agent/TableBlock";
import { cn } from "@/lib/utils";
import type { AgentBlock, ChatMessage } from "@/types/agent";

function Block({ block }: { block: AgentBlock }): React.ReactElement {
  if (block.type === "proposal") return <ProposalCard proposal={block} />;
  if (block.kind === "table") return <TableBlock title={block.title} columns={block.columns} rows={block.rows} download={block.download} />;
  return (
    <Link href={block.path} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
      {block.label} <ArrowUpRight size={12} aria-hidden />
    </Link>
  );
}

export default function MessageBubble({ message }: { message: ChatMessage }): React.ReactElement {
  const mine = message.role === "user";
  return (
    <li className={cn("flex", mine ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[92%] text-sm", mine ? "rounded-lg bg-primary px-3 py-2 text-primary-foreground" : "text-foreground")}>
        {message.text && (
          <p className={cn("whitespace-pre-wrap break-words", message.failed && "text-destructive")}>{message.text}</p>
        )}
        {message.working && (
          <p className="flex items-center gap-2 text-xs text-muted-foreground" role="status">
            <Loader2 size={12} className="animate-spin" aria-hidden /> Using {message.working}...
          </p>
        )}
        {message.blocks.map((block, index) => (
          <Block key={index} block={block} />
        ))}
      </div>
    </li>
  );
}
