import React from "react";
import { parseBlocks, type Inline } from "@/lib/agent/markdown";

function Inlines({ parts }: { parts: Inline[] }): React.ReactElement {
  return (
    <>
      {parts.map((part, index) => {
        if (part.kind === "bold") return <strong key={index} className="font-semibold">{part.text}</strong>;
        if (part.kind === "code") return <code key={index} className="rounded-sm bg-secondary px-1 font-mono text-[0.85em]">{part.text}</code>;
        return <React.Fragment key={index}>{part.text}</React.Fragment>;
      })}
    </>
  );
}

/** An assistant answer: paragraphs, lists, bold and code. */
export default function Markdown({ text }: { text: string }): React.ReactElement {
  return (
    <div className="space-y-2 break-words text-sm leading-relaxed text-foreground">
      {parseBlocks(text).map((block, index) => {
        if (block.kind === "paragraph") {
          return <p key={index} className="whitespace-pre-wrap"><Inlines parts={block.inline} /></p>;
        }
        const List = block.ordered ? "ol" : "ul";
        return (
          <List key={index} className={block.ordered ? "list-decimal space-y-1 pl-5" : "list-disc space-y-1 pl-5 marker:text-accent"}>
            {block.items.map((item, position) => (
              <li key={position}><Inlines parts={item} /></li>
            ))}
          </List>
        );
      })}
    </div>
  );
}
