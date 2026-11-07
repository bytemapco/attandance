/**
 * The little Markdown the assistant is told to use: paragraphs, "- " and "1." lists, **bold** and `code`.
 * It returns data, never HTML. Marks still waiting for their closing half are hidden, so half-typed text
 * never shows a stray `**`.
 */
export interface Inline {
  kind: "text" | "bold" | "code";
  text: string;
}

export type Block = { kind: "paragraph"; inline: Inline[] } | { kind: "list"; ordered: boolean; items: Inline[][] };

const INLINE = /`([^`\n]+)`|\*\*([^*\n]+?)\*\*/;
const ITEM = /^\s*(?:[-*•]|(\d+)[.)])\s+(.*)$/;

export function parseInline(source: string): Inline[] {
  const found: Inline[] = [];
  let rest = source;
  for (let match = INLINE.exec(rest); match; match = INLINE.exec(rest)) {
    if (match.index > 0) found.push({ kind: "text", text: rest.slice(0, match.index) });
    found.push(match[1] ? { kind: "code", text: match[1] } : { kind: "bold", text: match[2] });
    rest = rest.slice(match.index + match[0].length);
  }
  const tail = rest.replace(/\*\*|`/g, "").replace(/\*$/, "");
  if (tail) found.push({ kind: "text", text: tail });
  return found;
}

export function parseBlocks(source: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  const endParagraph = (): void => {
    if (paragraph.length > 0) blocks.push({ kind: "paragraph", inline: parseInline(paragraph.join("\n")) });
    paragraph = [];
  };

  for (const line of source.split("\n")) {
    const item = ITEM.exec(line);
    if (!item) {
      if (line.trim()) paragraph.push(line);
      else endParagraph();
      continue;
    }
    endParagraph();
    const text = parseInline(item[2]);
    if (text.length === 0) continue; // an item with no text yet is still arriving
    const ordered = Boolean(item[1]);
    const last = blocks[blocks.length - 1];
    if (last?.kind === "list" && last.ordered === ordered) last.items.push(text);
    else blocks.push({ kind: "list", ordered, items: [text] });
  }
  endParagraph();
  return blocks;
}
