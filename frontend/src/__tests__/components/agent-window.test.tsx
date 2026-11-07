import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AgentLauncher from "@/components/agent/AgentLauncher";
import NoticeGate from "@/components/agent/NoticeGate";
import SwrProvider from "@/components/providers/SwrProvider";
import { useAuthStore } from "@/store/authStore";
import type { AgentStatus, AgentStreamEvent } from "@/types/agent";
import { makeUser } from "../helpers";

const { apiGet, streamChat, acceptNotice, loadConversation, toastError } = vi.hoisted(() => ({
  apiGet: vi.fn(),
  streamChat: vi.fn(),
  acceptNotice: vi.fn(),
  loadConversation: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("@/lib/api/client", () => ({ default: { get: apiGet, post: vi.fn() }, sessionHeaders: () => ({}) }));
vi.mock("@/services/agent", () => ({
  AgentRequestError: class extends Error {},
  streamChat, acceptNotice, loadConversation, confirmProposal: vi.fn(), cancelProposal: vi.fn(), downloadLinked: vi.fn(),
}));
vi.mock("react-hot-toast", () => ({ default: { error: toastError } }));

const READY: AgentStatus = { role: "teacher", model_configured: true, notice_accepted: true, accepted_at: "x", can_accept_notice: false };
type OnEvent = (event: AgentStreamEvent) => void;

function serve(status: AgentStatus = READY): void {
  apiGet.mockImplementation(async (url: string) => ({
    data: url === "/agent/status" ? status : { suggestions: ["What is my schedule today?", "Who is at risk in my classes?"] },
  }));
}

async function openAssistant(role = "TEACHER"): Promise<void> {
  useAuthStore.setState({ user: makeUser({ role: role as never }) });
  render(<SwrProvider><AgentLauncher /></SwrProvider>);
  fireEvent.click(screen.getByRole("button", { name: "Open the assistant" }));
  await screen.findByLabelText("Ask the assistant");
}

const dialog = (): HTMLElement => screen.getByRole("dialog", { hidden: true });

/** A stream the test feeds by hand, so it can look at the screen between pieces. */
function manualStream(): { push: OnEvent; end: () => Promise<void> } {
  let push: OnEvent = () => undefined;
  let end: () => void = () => undefined;
  streamChat.mockImplementation((_t: string, _i: string | null, onEvent: OnEvent) => {
    push = onEvent;
    return new Promise<void>((resolve) => (end = resolve));
  });
  return { push: (event) => act(() => push(event)), end: async () => void (await act(async () => end())) };
}

beforeEach(() => {
  [apiGet, streamChat, acceptNotice, loadConversation, toastError].forEach((mock) => mock.mockReset());
  localStorage.clear();
  serve();
});

describe("what the window shows", () => {
  it("offers starter questions in an empty chat and hides them once there are messages", async () => {
    streamChat.mockImplementation(async (_t: string, _i: string | null, onEvent: OnEvent) => onEvent({ type: "text", text: "Two classes." }));
    await openAssistant();
    expect(screen.getByText("Suggested questions")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Who is at risk in my classes?" }));

    await screen.findByText("Two classes.");
    expect(screen.queryByText("Suggested questions")).toBeNull();
  });

  it("shows no question box while the institution has not switched the assistant on", async () => {
    serve({ ...READY, notice_accepted: false });
    useAuthStore.setState({ user: makeUser({ role: "TEACHER" }) });
    render(<SwrProvider><AgentLauncher /></SwrProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Open the assistant" }));

    await screen.findByText(/has not switched the assistant on/);
    expect(screen.queryByLabelText("Ask the assistant")).toBeNull();
  });

  it("shows nothing but the title bar while it is finding out whether the assistant is on", () => {
    apiGet.mockImplementation(() => new Promise(() => undefined));
    useAuthStore.setState({ user: makeUser({ role: "TEACHER" }) });
    render(<SwrProvider><AgentLauncher /></SwrProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Open the assistant" }));
    expect(screen.queryByLabelText("Ask the assistant")).toBeNull();
    expect(screen.queryByText(/loading/i)).toBeNull();
  });

  it("works the same for an admin", async () => {
    serve({ ...READY, role: "admin" });
    await openAssistant("TENANT_ADMIN");
    expect(screen.getByText("Suggested questions")).toBeInTheDocument();
  });

  it("starts fresh after New chat and shows the starter questions again", async () => {
    streamChat.mockImplementation(async (_t: string, _i: string | null, onEvent: OnEvent) => onEvent({ type: "text", text: "First." }));
    await openAssistant();
    fireEvent.change(screen.getByLabelText("Ask the assistant"), { target: { value: "one" } });
    fireEvent.keyDown(screen.getByLabelText("Ask the assistant"), { key: "Enter" });
    await screen.findByText("First.");

    fireEvent.click(screen.getByRole("button", { name: "New chat" }));

    expect(screen.queryByText("First.")).toBeNull();
    expect(screen.getByText("Suggested questions")).toBeInTheDocument();
  });

  it("keeps working in the background while closed, and shows the answer when opened again", async () => {
    const stream = manualStream();
    await openAssistant();
    fireEvent.change(screen.getByLabelText("Ask the assistant"), { target: { value: "one" } });
    fireEvent.keyDown(screen.getByLabelText("Ask the assistant"), { key: "Enter" });
    fireEvent.keyDown(document, { key: "Escape" });

    stream.push({ type: "delta", text: "Answer written while closed." });
    await stream.end();
    fireEvent.click(screen.getByRole("button", { name: "Open the assistant" }));

    expect(await screen.findByText("Answer written while closed.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Send" })).toBeInTheDocument();
  });


});

describe("following the answer", () => {
  function scroller(): HTMLElement {
    return dialog().querySelector(".overflow-y-auto") as HTMLElement;
  }

  function size(box: HTMLElement, height: { scroll: number; client: number }): void {
    Object.defineProperty(box, "scrollHeight", { configurable: true, get: () => height.scroll });
    Object.defineProperty(box, "clientHeight", { configurable: true, get: () => height.client });
  }

  async function startAnswer(height = { scroll: 1000, client: 400 }) {
    const stream = manualStream();
    await openAssistant();
    size(scroller(), height);
    fireEvent.change(screen.getByLabelText("Ask the assistant"), { target: { value: "go" } });
    fireEvent.keyDown(screen.getByLabelText("Ask the assistant"), { key: "Enter" });
    return stream;
  }

  it("stays at the newest line as the answer grows", async () => {
    const stream = await startAnswer();
    stream.push({ type: "delta", text: "First piece. " });
    expect(scroller().scrollTop).toBe(1000);

    stream.push({ type: "delta", text: "Second piece." });
    expect(scroller().scrollTop).toBe(1000);
  });

  it("stops following once the person scrolls up to read", async () => {
    const stream = await startAnswer();
    stream.push({ type: "delta", text: "First piece. " });
    scroller().scrollTop = 100;
    fireEvent.scroll(scroller());

    stream.push({ type: "delta", text: "Second piece." });

    expect(scroller().scrollTop).toBe(100);
  });

  it("keeps following while the person is near the bottom", async () => {
    const stream = await startAnswer();
    stream.push({ type: "delta", text: "First piece. " });
    scroller().scrollTop = 560;
    fireEvent.scroll(scroller());

    stream.push({ type: "delta", text: "Second piece." });

    expect(scroller().scrollTop).toBe(1000);
  });

  it("follows again once the person sends a new question", async () => {
    const stream = await startAnswer();
    stream.push({ type: "delta", text: "First piece. " });
    scroller().scrollTop = 100;
    fireEvent.scroll(scroller());
    await stream.end();
    await waitFor(() => expect(screen.getByRole("button", { name: "Send" })).toBeInTheDocument());

    manualStream();
    fireEvent.change(screen.getByLabelText("Ask the assistant"), { target: { value: "again" } });
    fireEvent.keyDown(screen.getByLabelText("Ask the assistant"), { key: "Enter" });

    expect(scroller().scrollTop).toBe(1000);
  });
});

describe("the data notice", () => {
  const status = (overrides: Partial<AgentStatus> = {}): AgentStatus => ({ ...READY, notice_accepted: false, ...overrides });

  it("tells everyone the assistant is not set up when the server has no model key", () => {
    render(<NoticeGate status={status({ model_configured: false, can_accept_notice: true })} onAccepted={vi.fn()} />);
    expect(screen.getByText(/not set up on this server/)).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("tells a teacher to ask their admin, with no way to accept", () => {
    render(<NoticeGate status={status()} onAccepted={vi.fn()} />);
    expect(screen.getByText(/Your institution admin has not switched the assistant on/)).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("explains to an admin what is sent and what is never sent", () => {
    render(<NoticeGate status={status({ can_accept_notice: true })} onAccepted={vi.fn()} />);
    expect(screen.getByText(/Gemini/)).toBeInTheDocument();
    expect(screen.getByText(/never sends face data, photos, passwords or login/)).toBeInTheDocument();
    expect(screen.getByText(/waits for a person to confirm/)).toBeInTheDocument();
  });

  it("switches the assistant on when an admin accepts", async () => {
    acceptNotice.mockResolvedValue({});
    const onAccepted = vi.fn();
    render(<NoticeGate status={status({ can_accept_notice: true })} onAccepted={onAccepted} />);

    fireEvent.click(screen.getByRole("button", { name: "I accept, switch it on" }));

    await waitFor(() => expect(onAccepted).toHaveBeenCalledOnce());
    expect(acceptNotice).toHaveBeenCalledOnce();
  });

  it("stays on the notice and shows the reason when accepting fails", async () => {
    acceptNotice.mockRejectedValue(new Error("Only an admin can do this"));
    const onAccepted = vi.fn();
    render(<NoticeGate status={status({ can_accept_notice: true })} onAccepted={onAccepted} />);

    fireEvent.click(screen.getByRole("button", { name: "I accept, switch it on" }));

    await waitFor(() => expect(toastError).toHaveBeenCalledWith("Only an admin can do this"));
    expect(onAccepted).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "I accept, switch it on" })).toBeEnabled();
  });

  it("cannot be accepted twice while it is being saved", async () => {
    let finish: (value?: unknown) => void = () => undefined;
    acceptNotice.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    render(<NoticeGate status={status({ can_accept_notice: true })} onAccepted={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "I accept, switch it on" }));
    expect(screen.getByRole("button", { name: "I accept, switch it on" })).toBeDisabled();
    finish();
    await waitFor(() => expect(acceptNotice).toHaveBeenCalledTimes(1));
  });
});
