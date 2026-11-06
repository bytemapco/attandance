import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AgentLauncher from "@/components/agent/AgentLauncher";
import SwrProvider from "@/components/providers/SwrProvider";
import { useAuthStore } from "@/store/authStore";
import type { AgentStatus, AgentStreamEvent } from "@/types/agent";
import { makeUser } from "../helpers";

const { apiGet, streamChat, acceptNotice, confirmProposal, cancelProposal } = vi.hoisted(() => ({
  apiGet: vi.fn(),
  streamChat: vi.fn(),
  acceptNotice: vi.fn(),
  confirmProposal: vi.fn(),
  cancelProposal: vi.fn(),
}));

vi.mock("@/lib/api/client", () => ({ default: { get: apiGet, post: vi.fn() }, sessionHeaders: () => ({}) }));
vi.mock("@/services/agent", () => ({
  AgentRequestError: class extends Error {},
  streamChat, acceptNotice, confirmProposal, cancelProposal, downloadLinked: vi.fn(),
}));
vi.mock("react-hot-toast", () => ({ default: { error: vi.fn() } }));

const READY: AgentStatus = { role: "teacher", model_configured: true, notice_accepted: true, accepted_at: "x", can_accept_notice: false };

function answerWith(status: AgentStatus): void {
  apiGet.mockImplementation(async (url: string) => ({
    data: url === "/agent/status" ? status : { suggestions: ["What is my schedule today?"] },
  }));
}

function mount(role: string): void {
  useAuthStore.setState({ user: makeUser({ role: role as never }) });
  render(<SwrProvider><AgentLauncher /></SwrProvider>);
}

async function open(role = "TEACHER"): Promise<void> {
  mount(role);
  fireEvent.click(screen.getByRole("button", { name: "Open the assistant" }));
}

/** Types into the chat box and presses Enter, as a person would. */
async function ask(text: string): Promise<void> {
  const box = await screen.findByLabelText("Ask the assistant");
  fireEvent.change(box, { target: { value: text } });
  fireEvent.keyDown(box, { key: "Enter" });
}

function reply(...events: AgentStreamEvent[]): void {
  streamChat.mockImplementation(async (_text: string, _id: string | null, onEvent: (e: AgentStreamEvent) => void) => {
    events.forEach(onEvent);
  });
}

beforeEach(() => {
  [apiGet, streamChat, acceptNotice, confirmProposal, cancelProposal].forEach((mock) => mock.mockReset());
  answerWith(READY);
});

describe("the assistant button", () => {
  it.each(["STUDENT", "SUPER_ADMIN"])("is not shown to a %s", (role) => {
    mount(role);
    expect(screen.queryByRole("button", { name: "Open the assistant" })).toBeNull();
  });

  it.each(["TEACHER", "ADMIN", "TENANT_ADMIN"])("is shown to a %s", (role) => {
    mount(role);
    expect(screen.getByRole("button", { name: "Open the assistant" })).toBeInTheDocument();
  });
});

describe("before the institution has switched it on", () => {
  it("asks an admin to accept the data notice", async () => {
    answerWith({ ...READY, role: "admin", notice_accepted: false, can_accept_notice: true });
    acceptNotice.mockResolvedValue({});
    await open("ADMIN");
    fireEvent.click(await screen.findByRole("button", { name: "I accept, switch it on" }));
    await waitFor(() => expect(acceptNotice).toHaveBeenCalledOnce());
  });

  it("tells a teacher to ask their admin and offers no way to accept", async () => {
    answerWith({ ...READY, notice_accepted: false });
    await open();
    expect(await screen.findByText(/Your institution admin has not switched the assistant on/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /accept/i })).toBeNull();
  });

  it("explains when the server has no model key", async () => {
    answerWith({ ...READY, model_configured: false });
    await open();
    expect(await screen.findByText(/not set up on this server/)).toBeInTheDocument();
  });
});

describe("chatting", () => {
  it("offers starter questions and sends the one picked", async () => {
    reply({ type: "conversation", id: "c1" }, { type: "text", text: "You have two classes." });
    await open();
    fireEvent.click(await screen.findByRole("button", { name: "What is my schedule today?" }));
    expect(await screen.findByText("You have two classes.")).toBeInTheDocument();
    expect(streamChat).toHaveBeenCalledWith("What is my schedule today?", null, expect.any(Function), expect.any(AbortSignal));
  });

  it("shows a table the assistant returned", async () => {
    reply({ type: "ui", kind: "table", title: "Absent", columns: ["Name"], rows: [["Asha"]] }, { type: "text", text: "One absent." });
    await open();
    await ask("who is absent");
    expect(await screen.findByRole("region", { name: "Absent" })).toHaveTextContent("Asha");
  });

  it("continues the same conversation on the next message", async () => {
    reply({ type: "conversation", id: "c1" }, { type: "text", text: "First." });
    await open();
    await ask("one");
    await screen.findByText("First.");
    await ask("two");
    await waitFor(() => expect(streamChat).toHaveBeenCalledTimes(2));
    expect(streamChat.mock.calls[1][1]).toBe("c1");
  });

  it("does not send an empty message", async () => {
    await open();
    await ask("   ");
    expect(streamChat).not.toHaveBeenCalled();
  });
});

describe("a prepared change", () => {
  const card: AgentStreamEvent = {
    type: "proposal", id: "p1", tool: "send_message", summary: 'Send "Low attendance" to 2 people',
    details: { recipients: ["Asha", "Ravi"] }, editable: { title: "Low attendance", message: "Please attend." }, expires_at: "2030-01-01T00:00:00Z",
  };

  it("sends nothing until Confirm, and sends the edited wording with it", async () => {
    reply(card, { type: "text", text: "Check the card." });
    confirmProposal.mockResolvedValue({ status: "confirmed", message: "Sent to 2 people" });
    await open();
    await ask("tell them");
    expect(await screen.findByText("To: Asha, Ravi")).toBeInTheDocument();
    expect(confirmProposal).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("title"), { target: { value: "Reminder" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

    expect(await screen.findByText("Sent to 2 people")).toBeInTheDocument();
    expect(confirmProposal).toHaveBeenCalledWith("p1", { title: "Reminder", message: "Please attend." });
  });

  it("can be cancelled and then changes nothing", async () => {
    reply(card, { type: "text", text: "Check the card." });
    cancelProposal.mockResolvedValue(undefined);
    await open();
    await ask("tell them");
    fireEvent.click(await screen.findByRole("button", { name: "Cancel" }));
    expect(await screen.findByText(/Nothing was changed/)).toBeInTheDocument();
    expect(confirmProposal).not.toHaveBeenCalled();
  });
});

describe("a prepared change with a warning", () => {
  it("shows the note and the preview table before Confirm", async () => {
    reply({
      type: "proposal", id: "p2", tool: "decide_device_changes", summary: "Approve 1 device request",
      details: { note: "Approve only if you know this is the student's own new phone.", table: { title: "Device requests", columns: ["Student"], rows: [["Asha"]] } },
      editable: {}, expires_at: "2030-01-01T00:00:00Z",
    });
    await open();
    await ask("approve the phone");
    expect(await screen.findByText(/own new phone/)).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Device requests" })).toHaveTextContent("Asha");
  });
});
