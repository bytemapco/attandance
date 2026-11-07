import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Composer from "@/components/agent/Composer";

const onSend = vi.fn();
const onStop = vi.fn();

function mount(busy = false): void {
  render(<Composer busy={busy} onSend={onSend} onStop={onStop} />);
}

const box = (): HTMLTextAreaElement => screen.getByLabelText("Ask the assistant") as HTMLTextAreaElement;
const type = (value: string): void => void fireEvent.change(box(), { target: { value } });
const enter = (init: KeyboardEventInit = {}): void => void fireEvent.keyDown(box(), { key: "Enter", ...init });

beforeEach(() => {
  onSend.mockReset();
  onStop.mockReset();
});

describe("sending a question", () => {
  it("cannot send until there is something to send", () => {
    mount();
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
    type("   ");
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
    type("hello");
    expect(screen.getByRole("button", { name: "Send" })).toBeEnabled();
  });

  it("sends with the Send button and empties the box", () => {
    mount();
    type("who is absent");
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(onSend).toHaveBeenCalledExactlyOnceWith("who is absent");
    expect(box()).toHaveValue("");
  });

  it("sends with Enter", () => {
    mount();
    type("who is absent");
    enter();
    expect(onSend).toHaveBeenCalledExactlyOnceWith("who is absent");
    expect(box()).toHaveValue("");
  });

  it("adds a new line with Shift+Enter instead of sending", () => {
    mount();
    type("line one");
    enter({ shiftKey: true });
    expect(onSend).not.toHaveBeenCalled();
    expect(box()).toHaveValue("line one");
  });

  it("does not send when Enter only confirms a word being composed, as in Hindi or Japanese input", () => {
    mount();
    type("नमस्ते");
    fireEvent(box(), new KeyboardEvent("keydown", { key: "Enter", isComposing: true, bubbles: true, cancelable: true }));
    expect(onSend).not.toHaveBeenCalled();
  });

  it("does not send an empty question with Enter", () => {
    mount();
    enter();
    expect(onSend).not.toHaveBeenCalled();
  });

  it("limits a question to 2000 characters", () => {
    mount();
    expect(box()).toHaveAttribute("maxlength", "2000");
  });

  it("keeps what was typed when it is not sent", () => {
    mount();
    type("half a question");
    expect(box()).toHaveValue("half a question");
  });

  it("asks for a question in few words", () => {
    mount();
    expect(box()).toHaveAttribute("placeholder", "Ask a question");
  });
});

describe("while an answer is coming", () => {
  it("shows Stop instead of Send, and Stop calls the stop handler", () => {
    mount(true);
    expect(screen.queryByRole("button", { name: "Send" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Stop" }));
    expect(onStop).toHaveBeenCalledOnce();
  });

  it("lets the next question be typed but not sent yet", () => {
    mount(true);
    type("next question");
    enter();
    expect(onSend).not.toHaveBeenCalled();
    expect(box()).toHaveValue("next question");
  });

  it("has no Stop button when idle", () => {
    mount();
    expect(screen.queryByRole("button", { name: "Stop" })).toBeNull();
  });
});
