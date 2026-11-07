import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AgentMark from "@/components/agent/AgentMark";
import Markdown from "@/components/agent/Markdown";
import MessageBubble from "@/components/agent/MessageBubble";
import Steps from "@/components/agent/Steps";
import type { AgentBlock, ChatMessage } from "@/types/agent";

vi.mock("@/services/agent", () => ({ confirmProposal: vi.fn(), cancelProposal: vi.fn(), downloadLinked: vi.fn() }));
vi.mock("react-hot-toast", () => ({ default: { error: vi.fn() } }));

function message(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return { id: "m1", role: "assistant", text: "", blocks: [], steps: [], failed: false, ...overrides };
}

const pulsing = (element: Element | null): boolean => Boolean(element?.className.includes("animate-pulse"));

describe("the person's own message", () => {
  it("is shown as written, on the right, with line breaks kept", () => {
    render(<ul><MessageBubble message={message({ role: "user", text: "line one\nline two" })} /></ul>);
    const bubble = screen.getByText(/line one/);
    expect(bubble).toHaveClass("whitespace-pre-wrap");
    expect(bubble.textContent).toBe("line one\nline two");
    expect(bubble.closest("li")).toHaveClass("justify-end");
  });

  it("is never read as Markdown", () => {
    render(<ul><MessageBubble message={message({ role: "user", text: "**not bold** and - not a list" })} /></ul>);
    expect(screen.getByText("**not bold** and - not a list")).toBeInTheDocument();
    expect(document.querySelector("strong")).toBeNull();
  });

  it("has no assistant mark or steps", () => {
    const { container } = render(<ul><MessageBubble message={message({ role: "user", text: "hi" })} /></ul>);
    expect(container.querySelector("[aria-hidden]")).toBeNull();
  });
});

describe("the assistant's reply", () => {
  it("shows its text with the Markdown it uses", () => {
    render(<ul><MessageBubble message={message({ text: "You have **three** classes" })} /></ul>);
    expect(screen.getByText("three").tagName).toBe("STRONG");
  });

  it("shows a failure as plain red text, never as Markdown", () => {
    render(<ul><MessageBubble message={message({ text: "**Unavailable**", failed: true })} /></ul>);
    const text = screen.getByText("**Unavailable**");
    expect(text).toHaveClass("text-destructive");
    expect(document.querySelector("strong")).toBeNull();
  });

  it("shows nothing but the mark while it has not started writing", () => {
    const { container } = render(<ul><MessageBubble message={message()} live /></ul>);
    expect(container.querySelector("p")).toBeNull();
    expect(pulsing(container.querySelector("[aria-hidden] span"))).toBe(true);
  });

  it("the mark breathes only while the assistant is working", () => {
    const writing = render(<ul><MessageBubble message={message({ text: "Hello" })} live /></ul>);
    expect(pulsing(writing.container.querySelector("[aria-hidden] span"))).toBe(false);
    writing.unmount();

    const finished = render(<ul><MessageBubble message={message()} live={false} /></ul>);
    expect(pulsing(finished.container.querySelector("[aria-hidden] span"))).toBe(false);
  });

  it("does not breathe after a failure", () => {
    const { container } = render(<ul><MessageBubble message={message({ text: "Unavailable", failed: true })} live /></ul>);
    expect(pulsing(container.querySelector("[aria-hidden] span"))).toBe(false);
  });

  it("lists what it looked up", () => {
    render(<ul><MessageBubble message={message({ steps: ["my schedule", "class register"], text: "ok" })} /></ul>);
    const steps = within(screen.getByRole("list", { name: "What the assistant looked up" })).getAllByRole("listitem");
    expect(steps.map((step) => step.textContent)).toEqual(["My schedule", "Class register"]);
  });

  it("shows no steps list when nothing was looked up", () => {
    render(<ul><MessageBubble message={message({ text: "Hello" })} /></ul>);
    expect(screen.queryByRole("list", { name: "What the assistant looked up" })).toBeNull();
  });
});

describe("blocks in a reply", () => {
  const table: AgentBlock = { type: "ui", kind: "table", title: "Absent", columns: ["Name"], rows: [["Asha"]] };
  const link: AgentBlock = { type: "ui", kind: "link", label: "Open review", path: "/teacher/review" };
  const card: AgentBlock = {
    type: "proposal", id: "p1", tool: "send_message", summary: "Send a reminder", details: {}, editable: {}, expires_at: "2030-01-01T00:00:00Z",
  };

  it("shows a table, a link and a confirmation card in the order given", () => {
    render(<ul><MessageBubble message={message({ blocks: [table, link, card] })} /></ul>);
    expect(screen.getByRole("region", { name: "Absent" })).toHaveTextContent("Asha");
    expect(screen.getByRole("link", { name: /Open review/ })).toHaveAttribute("href", "/teacher/review");
    expect(screen.getByRole("region", { name: "Confirm this change" })).toHaveTextContent("Send a reminder");
  });

  it("holds a table back until the text above it has been written out", async () => {
    const { rerender } = render(<ul><MessageBubble message={message({ text: "" })} live /></ul>);
    rerender(<ul><MessageBubble message={message({ text: "x".repeat(400), blocks: [table] })} live /></ul>);

    expect(screen.queryByRole("region", { name: "Absent" })).toBeNull();
    expect(await screen.findByRole("region", { name: "Absent" })).toBeInTheDocument();
  });

  it("shows the table at once in a chat that was saved", () => {
    render(<ul><MessageBubble message={message({ text: "x".repeat(400), blocks: [table] })} /></ul>);
    expect(screen.getByRole("region", { name: "Absent" })).toBeInTheDocument();
  });

  it("shows blocks even when the reply has no text", () => {
    render(<ul><MessageBubble message={message({ blocks: [table] })} live /></ul>);
    expect(screen.getByRole("region", { name: "Absent" })).toBeInTheDocument();
  });

  it("stops the mark breathing once a block has arrived", () => {
    const { container } = render(<ul><MessageBubble message={message({ blocks: [table] })} live /></ul>);
    expect(pulsing(container.querySelector("[aria-hidden] span"))).toBe(false);
  });
});

describe("steps", () => {
  it("gives the line being worked on a breathing dot and settles the earlier ones", () => {
    const { container } = render(<Steps steps={["my schedule", "class register"]} working />);
    const steps = Array.from(container.querySelectorAll("li"));
    expect(steps.map((step) => Boolean(step.querySelector(".animate-pulse")))).toEqual([false, true]);
    expect(steps[0].querySelector("svg")).not.toBeNull();
  });

  it("settles every line once the assistant is done", () => {
    const { container } = render(<Steps steps={["my schedule", "class register"]} working={false} />);
    expect(container.querySelector(".animate-pulse")).toBeNull();
    expect(container.querySelectorAll("li svg")).toHaveLength(2);
  });

  it("renders nothing without steps", () => {
    const { container } = render(<Steps steps={[]} working />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("the assistant mark", () => {
  it("is hidden from screen readers and breathes only when asked", () => {
    const { container } = render(<><AgentMark /><AgentMark working /></>);
    const marks = Array.from(container.querySelectorAll("[aria-hidden]"));
    expect(marks).toHaveLength(2);
    expect(marks.map((mark) => pulsing(mark.querySelector("span")))).toEqual([false, true]);
  });
});

describe("answers written in Markdown", () => {
  it("shows bold and code", () => {
    render(<Markdown text="Use **bold** and `code`" />);
    expect(screen.getByText("bold").tagName).toBe("STRONG");
    expect(screen.getByText("code").tagName).toBe("CODE");
  });

  it("shows a bullet list and a numbered list as lists", () => {
    const { container } = render(<Markdown text={"- one\n- two\n\n1. first\n2. second"} />);
    expect(container.querySelectorAll("ul > li")).toHaveLength(2);
    expect(container.querySelectorAll("ol > li")).toHaveLength(2);
  });

  it("keeps line breaks inside a paragraph", () => {
    render(<Markdown text={"line one\nline two"} />);
    expect(screen.getByText(/line one/)).toHaveClass("whitespace-pre-wrap");
  });

  it("shows nothing for empty text", () => {
    const { container } = render(<Markdown text="" />);
    expect(container.firstElementChild).toBeEmptyDOMElement();
  });

  it("does not turn the model's text into page elements", () => {
    const { container } = render(<Markdown text={'<img src=x onerror="alert(1)"> <script>alert(1)</script> [link](javascript:alert(1))'} />);
    expect(container.querySelector("img, script, a")).toBeNull();
    expect(container).toHaveTextContent("<script>alert(1)</script>");
  });

  it("hides a half-typed bold mark until it closes", () => {
    const { container, rerender } = render(<Markdown text="You have **three" />);
    expect(container).toHaveTextContent("You have three");
    expect(container.querySelector("strong")).toBeNull();
    rerender(<Markdown text="You have **three** classes" />);
    expect(container.querySelector("strong")).toHaveTextContent("three");
  });
});
