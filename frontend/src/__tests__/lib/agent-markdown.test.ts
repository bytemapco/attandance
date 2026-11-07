import { describe, expect, it } from "vitest";
import { parseBlocks, parseInline } from "@/lib/agent/markdown";

describe("parseInline", () => {
  it("reads bold and code inside a line", () => {
    expect(parseInline("Use **two** `ids`")).toEqual([
      { kind: "text", text: "Use " },
      { kind: "bold", text: "two" },
      { kind: "text", text: " " },
      { kind: "code", text: "ids" },
    ]);
  });

  it("hides a mark whose closing half has not arrived yet", () => {
    expect(parseInline("half **bold")).toEqual([{ kind: "text", text: "half bold" }]);
    expect(parseInline("run `ls")).toEqual([{ kind: "text", text: "run ls" }]);
    expect(parseInline("*")).toEqual([]);
  });

  it("keeps a star that is part of the text, and never turns text into markup", () => {
    expect(parseInline("2*3 and 5 * 4")).toEqual([{ kind: "text", text: "2*3 and 5 * 4" }]);
    expect(parseInline("<img src=x onerror=alert(1)>")).toEqual([{ kind: "text", text: "<img src=x onerror=alert(1)>" }]);
  });
});

describe("parseBlocks", () => {
  it("splits paragraphs on blank lines and keeps line breaks inside one", () => {
    const blocks = parseBlocks("First line\nsecond line\n\nNext paragraph");
    expect(blocks.map((block) => block.kind)).toEqual(["paragraph", "paragraph"]);
    expect(blocks[0]).toMatchObject({ inline: [{ kind: "text", text: "First line\nsecond line" }] });
  });

  it("reads bullet and numbered lists", () => {
    const [bullets, numbers] = parseBlocks("- one\n- two\n\n1. first\n2. second");
    expect(bullets).toMatchObject({ kind: "list", ordered: false });
    expect(numbers).toMatchObject({ kind: "list", ordered: true });
    expect(bullets.kind === "list" && bullets.items).toHaveLength(2);
  });

  it("ends a paragraph where a list starts", () => {
    expect(parseBlocks("Here is the list\n- a\n- b").map((block) => block.kind)).toEqual(["paragraph", "list"]);
  });

  it("waits to show a list item until it has some text", () => {
    const [list] = parseBlocks("- first\n- *");
    expect(list.kind === "list" && list.items).toHaveLength(1);
  });

  it("does not take a line that starts with bold text for a list", () => {
    expect(parseBlocks("**Asha** is absent")[0].kind).toBe("paragraph");
  });
});
