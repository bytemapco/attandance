import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AgentLauncher from "@/components/agent/AgentLauncher";
import { BOT_EDGE, BOT_SIZE, clampSpot, readSpot, writeSpot } from "@/lib/agent/botSpot";
import { useAuthStore } from "@/store/authStore";
import { makeUser } from "../helpers";

vi.mock("@/components/agent/AgentPanel", () => ({ default: () => <div role="dialog" aria-label="SAHAJ Assistant" /> }));

const VIEW = { width: 1000, height: 800 };

beforeEach(() => {
  localStorage.clear();
  Object.defineProperty(window, "innerWidth", { configurable: true, value: VIEW.width });
  Object.defineProperty(window, "innerHeight", { configurable: true, value: VIEW.height });
  useAuthStore.setState({ user: makeUser({ role: "TEACHER" }) });
});

describe("keeping the bot on screen", () => {
  it("leaves a spot that is already on screen alone", () => {
    expect(clampSpot({ x: 100, y: 200 }, VIEW)).toEqual({ x: 100, y: 200 });
  });

  it("pulls a spot that was left off the right or bottom edge back in", () => {
    expect(clampSpot({ x: 5000, y: 5000 }, VIEW)).toEqual({ x: VIEW.width - BOT_SIZE - BOT_EDGE, y: VIEW.height - BOT_SIZE - BOT_EDGE });
  });

  it("keeps the bot inside the screen on the left and top too", () => {
    expect(clampSpot({ x: -300, y: -20 }, VIEW)).toEqual({ x: BOT_EDGE, y: BOT_EDGE });
  });

  it("rounds fractions from a drag to whole pixels", () => {
    expect(clampSpot({ x: 100.6, y: 40.2 }, VIEW)).toEqual({ x: 101, y: 40 });
  });

  it("still works on a screen smaller than the bot", () => {
    expect(clampSpot({ x: 500, y: 500 }, { width: 30, height: 30 })).toEqual({ x: BOT_EDGE, y: BOT_EDGE });
  });
});

describe("remembering the bot's place", () => {
  it("is nothing until it has been moved", () => {
    expect(readSpot()).toBeNull();
  });

  it("is remembered between visits", () => {
    writeSpot({ x: 240, y: 90 });
    expect(readSpot()).toEqual({ x: 240, y: 90 });
  });

  it("ignores a saved value that is not a place", () => {
    localStorage.setItem("sahaj-assistant-bot-spot", '{"x":"left","y":2}');
    expect(readSpot()).toBeNull();
    localStorage.setItem("sahaj-assistant-bot-spot", "not json");
    expect(readSpot()).toBeNull();
  });

  it("works when the browser blocks storage", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    expect(readSpot()).toBeNull();
    expect(() => writeSpot({ x: 1, y: 1 })).not.toThrow();
    vi.restoreAllMocks();
  });
});

describe("the bot", () => {
  it("is a round button that says what it does, for keyboards and screen readers", () => {
    render(<AgentLauncher />);
    const bot = screen.getByRole("button", { name: "Open the assistant" });
    expect(bot).toHaveAttribute("title", "SAHAJ Assistant");
    expect(bot.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("opens the assistant when tapped", () => {
    render(<AgentLauncher />);
    fireEvent.click(screen.getByRole("button", { name: "Open the assistant" }));
    expect(screen.getByRole("dialog", { name: "SAHAJ Assistant" })).not.toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("button", { name: "Open the assistant" })).toHaveAttribute("inert");
  });

  it("starts in the bottom right corner when it has never been moved", () => {
    render(<AgentLauncher />);
    const bot = screen.getByRole("button", { name: "Open the assistant" });
    expect(bot).toHaveStyle({ right: `${BOT_EDGE}px`, bottom: `${BOT_EDGE}px` });
  });

  it("starts where it was left", () => {
    writeSpot({ x: 300, y: 120 });
    render(<AgentLauncher />);
    expect(screen.getByRole("button", { name: "Open the assistant" })).toHaveStyle({ right: "300px", bottom: "120px" });
  });

  it("is dragged with the pointer and remembers the new place when released", () => {
    render(<AgentLauncher />);
    const bot = screen.getByRole("button", { name: "Open the assistant" });

    fireEvent.pointerDown(bot, { clientX: 500, clientY: 500 });
    fireEvent.pointerMove(bot, { clientX: 400, clientY: 450 });
    fireEvent.pointerUp(bot, { clientX: 400, clientY: 450 });

    // Moving left and up by 100 and 50 moves the bot away from the right and bottom edges by the same amounts.
    expect(bot).toHaveStyle({ right: "116px", bottom: "66px" });
    expect(readSpot()).toEqual({ x: 116, y: 66 });
  });

  it("does not open the assistant after it was dragged", () => {
    render(<AgentLauncher />);
    const bot = screen.getByRole("button", { name: "Open the assistant" });

    fireEvent.pointerDown(bot, { clientX: 500, clientY: 500 });
    fireEvent.pointerMove(bot, { clientX: 300, clientY: 500 });
    fireEvent.pointerUp(bot, { clientX: 300, clientY: 500 });
    fireEvent.click(bot);

    expect(screen.queryByRole("dialog", { hidden: true })).toBeNull();
    expect(screen.getByRole("button", { name: "Open the assistant" })).not.toHaveAttribute("inert");
  });

  it("opens again on the next tap after a drag", () => {
    render(<AgentLauncher />);
    const bot = screen.getByRole("button", { name: "Open the assistant" });
    fireEvent.pointerDown(bot, { clientX: 500, clientY: 500 });
    fireEvent.pointerMove(bot, { clientX: 300, clientY: 500 });
    fireEvent.pointerUp(bot, { clientX: 300, clientY: 500 });
    fireEvent.click(bot);

    fireEvent.click(screen.getByRole("button", { name: "Open the assistant" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("treats a small wobble of the finger as a tap, not a drag", () => {
    render(<AgentLauncher />);
    const bot = screen.getByRole("button", { name: "Open the assistant" });
    fireEvent.pointerDown(bot, { clientX: 500, clientY: 500 });
    fireEvent.pointerMove(bot, { clientX: 502, clientY: 501 });
    fireEvent.pointerUp(bot, { clientX: 502, clientY: 501 });
    fireEvent.click(bot);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(readSpot()).toBeNull();
  });

  it("cannot be dragged off the screen", () => {
    render(<AgentLauncher />);
    const bot = screen.getByRole("button", { name: "Open the assistant" });
    fireEvent.pointerDown(bot, { clientX: 500, clientY: 500 });
    fireEvent.pointerMove(bot, { clientX: 5000, clientY: 5000 });
    fireEvent.pointerUp(bot, { clientX: 5000, clientY: 5000 });
    expect(bot).toHaveStyle({ right: `${BOT_EDGE}px`, bottom: `${BOT_EDGE}px` });
  });

  it("moves back on screen when the window gets smaller", () => {
    writeSpot({ x: 800, y: 600 });
    render(<AgentLauncher />);
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 400 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 300 });
    fireEvent(window, new Event("resize"));
    expect(screen.getByRole("button", { name: "Open the assistant" })).toHaveStyle({
      right: `${400 - BOT_SIZE - BOT_EDGE}px`,
      bottom: `${300 - BOT_SIZE - BOT_EDGE}px`,
    });
  });

  it("is not shown to a student", () => {
    useAuthStore.setState({ user: makeUser({ role: "STUDENT" }) });
    render(<AgentLauncher />);
    expect(screen.queryByRole("button", { name: "Open the assistant" })).toBeNull();
  });
});
