import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProposalCard from "@/components/agent/ProposalCard";
import TableBlock from "@/components/agent/TableBlock";
import type { ProposalData } from "@/types/agent";

const { confirmProposal, cancelProposal, downloadLinked, toastError } = vi.hoisted(() => ({
  confirmProposal: vi.fn(),
  cancelProposal: vi.fn(),
  downloadLinked: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("@/services/agent", () => ({ confirmProposal, cancelProposal, downloadLinked }));
vi.mock("react-hot-toast", () => ({ default: { error: toastError } }));

beforeEach(() => [confirmProposal, cancelProposal, downloadLinked, toastError].forEach((mock) => mock.mockReset()));

function proposal(overrides: Partial<ProposalData> = {}): ProposalData {
  return {
    type: "proposal", id: "p1", tool: "send_message", summary: 'Send "Low attendance" to 2 people', details: {}, editable: {},
    expires_at: "2030-01-01T00:00:00Z", ...overrides,
  };
}

const confirmButton = (): HTMLElement => screen.getByRole("button", { name: "Confirm" });
const cancelButton = (): HTMLElement => screen.getByRole("button", { name: "Cancel" });

describe("a prepared change", () => {
  it("says what it will do and that nothing changes until Confirm", () => {
    render(<ProposalCard proposal={proposal()} />);
    expect(screen.getByRole("heading", { name: 'Send "Low attendance" to 2 people' })).toBeInTheDocument();
    expect(screen.getByText("Nothing changes until you press Confirm.")).toBeInTheDocument();
  });

  it("lists who it goes to when there are recipients, and not otherwise", () => {
    const { rerender } = render(<ProposalCard proposal={proposal({ details: { recipients: ["Asha", "Ravi"] } })} />);
    expect(screen.getByText("To: Asha, Ravi")).toBeInTheDocument();
    rerender(<ProposalCard proposal={proposal({ details: {} })} />);
    expect(screen.queryByText(/^To:/)).toBeNull();
  });

  it("shows a warning note and a preview table", () => {
    render(<ProposalCard proposal={proposal({ details: { note: "Check this is the student's own phone.", table: { title: "Requests", columns: ["Student"], rows: [["Asha"]] } } })} />);
    expect(screen.getByText("Check this is the student's own phone.")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Requests" })).toHaveTextContent("Asha");
  });

  it("calls a preview table without a title Preview, and ignores one that is incomplete", () => {
    const { rerender } = render(<ProposalCard proposal={proposal({ details: { table: { columns: ["A"], rows: [["x"]] } } })} />);
    expect(screen.getByRole("region", { name: "Preview" })).toBeInTheDocument();
    rerender(<ProposalCard proposal={proposal({ details: { table: { title: "Broken" } } })} />);
    expect(screen.queryByRole("region", { name: "Broken" })).toBeNull();
  });

  it("ignores a recipients value that is not a list", () => {
    render(<ProposalCard proposal={proposal({ details: { recipients: "Asha" } })} />);
    expect(screen.queryByText(/^To:/)).toBeNull();
  });
});

describe("editing before confirming", () => {
  const editable = { title: "Low attendance", message: "Please attend.", urgent: false, count: 3 };

  it("offers a field for each editable value, in the right kind of box", () => {
    render(<ProposalCard proposal={proposal({ editable })} />);
    expect(screen.getByLabelText("title")).toHaveValue("Low attendance");
    expect(screen.getByLabelText("message").tagName).toBe("TEXTAREA");
    expect(screen.getByLabelText("title").tagName).toBe("INPUT");
    expect(screen.getByLabelText("urgent")).not.toBeChecked();
    expect(screen.getByLabelText("count")).toHaveValue("3");
  });

  it("uses a larger box for long text", () => {
    render(<ProposalCard proposal={proposal({ editable: { note: "x".repeat(80) } })} />);
    expect(screen.getByLabelText("note").tagName).toBe("TEXTAREA");
  });

  it("shows a field name with spaces instead of underscores", () => {
    render(<ProposalCard proposal={proposal({ editable: { reply_note: "hi" } })} />);
    expect(screen.getByLabelText("reply note")).toBeInTheDocument();
  });

  it("offers no fields when nothing can be edited", () => {
    render(<ProposalCard proposal={proposal()} />);
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.queryByRole("checkbox")).toBeNull();
  });

  it("sends the changed fields with Confirm, and the rest as they were", async () => {
    confirmProposal.mockResolvedValue({ status: "confirmed", message: "Sent to 2 people" });
    render(<ProposalCard proposal={proposal({ editable })} />);

    fireEvent.change(screen.getByLabelText("title"), { target: { value: "Reminder" } });
    fireEvent.click(screen.getByLabelText("urgent"));
    fireEvent.click(confirmButton());

    await screen.findByText("Sent to 2 people");
    expect(confirmProposal).toHaveBeenCalledExactlyOnceWith("p1", { title: "Reminder", message: "Please attend.", urgent: true, count: 3 });
  });

  it("sends no edits when there are none", async () => {
    confirmProposal.mockResolvedValue({ status: "confirmed", message: "Done it" });
    render(<ProposalCard proposal={proposal()} />);
    fireEvent.click(confirmButton());
    await screen.findByText("Done it");
    expect(confirmProposal).toHaveBeenCalledWith("p1", {});
  });
});

describe("confirming", () => {
  it("changes nothing until Confirm is pressed", () => {
    render(<ProposalCard proposal={proposal()} />);
    expect(confirmProposal).not.toHaveBeenCalled();
    expect(cancelProposal).not.toHaveBeenCalled();
  });

  it("shows the server's own words once it is done, and removes the buttons", async () => {
    confirmProposal.mockResolvedValue({ status: "confirmed", message: "Marked 3 present" });
    render(<ProposalCard proposal={proposal()} />);
    fireEvent.click(confirmButton());
    expect(await screen.findByRole("status")).toHaveTextContent("Marked 3 present");
    expect(screen.queryByRole("button", { name: "Confirm" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Cancel" })).toBeNull();
  });

  it("cannot be confirmed twice while it is being sent", async () => {
    let finish: (value: unknown) => void = () => undefined;
    confirmProposal.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    render(<ProposalCard proposal={proposal()} />);

    fireEvent.click(confirmButton());
    expect(confirmButton()).toBeDisabled();
    expect(cancelButton()).toBeDisabled();
    fireEvent.click(confirmButton());
    expect(confirmProposal).toHaveBeenCalledTimes(1);

    finish({ status: "confirmed", message: "Done" });
    await screen.findByText("Done");
  });

  it("shows why it failed, keeps the card, and lets the person try again", async () => {
    confirmProposal.mockRejectedValueOnce(new Error("This plan has expired. Ask again."));
    render(<ProposalCard proposal={proposal()} />);

    fireEvent.click(confirmButton());

    expect(await screen.findByRole("alert")).toHaveTextContent("This plan has expired. Ask again.");
    expect(confirmButton()).toBeEnabled();

    confirmProposal.mockResolvedValueOnce({ status: "confirmed", message: "Done now" });
    fireEvent.click(confirmButton());
    expect(await screen.findByText("Done now")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

describe("cancelling", () => {
  it("tells the server, says nothing was changed, and removes the buttons", async () => {
    cancelProposal.mockResolvedValue(undefined);
    render(<ProposalCard proposal={proposal()} />);

    fireEvent.click(cancelButton());

    expect(await screen.findByText(/Nothing was changed/)).toBeInTheDocument();
    expect(cancelProposal).toHaveBeenCalledExactlyOnceWith("p1");
    expect(confirmProposal).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Confirm" })).toBeNull();
  });

  it("shows an error and keeps the card when cancelling fails", async () => {
    cancelProposal.mockRejectedValue(new Error("Network down"));
    render(<ProposalCard proposal={proposal()} />);
    fireEvent.click(cancelButton());
    expect(await screen.findByRole("alert")).toHaveTextContent("Network down");
    expect(confirmButton()).toBeEnabled();
  });
});

describe("a table", () => {
  const rows = (count: number): string[][] => Array.from({ length: count }, (_, i) => [`Student ${i + 1}`, `${60 + i}%`]);
  const props = { title: "Below minimum", columns: ["Student", "Attendance"] };

  it("shows its title with the row count, headings and cells", () => {
    render(<TableBlock {...props} rows={rows(2)} />);
    const table = screen.getByRole("region", { name: "Below minimum" });
    expect(table).toHaveTextContent("Below minimum (2)");
    expect(screen.getAllByRole("columnheader").map((cell) => cell.textContent)).toEqual(["Student", "Attendance"]);
    expect(screen.getByText("Student 2")).toBeInTheDocument();
  });

  it("shows a dash for an empty cell and prints numbers and yes/no as they are", () => {
    render(<TableBlock title="T" columns={["A", "B", "C"]} rows={[[null, 5, true]]} />);
    expect(screen.getAllByRole("cell").map((cell) => cell.textContent)).toEqual(["-", "5", "true"]);
  });

  it("shows no rows without breaking when there are none", () => {
    render(<TableBlock {...props} rows={[]} />);
    expect(screen.getByRole("region", { name: "Below minimum" })).toHaveTextContent("(0)");
    expect(screen.queryAllByRole("cell")).toHaveLength(0);
  });

  it("shows the first eight rows, then all of them on request, and back", () => {
    render(<TableBlock {...props} rows={rows(12)} />);
    expect(screen.getAllByRole("row")).toHaveLength(1 + 8);

    fireEvent.click(screen.getByRole("button", { name: "Show all 12" }));
    expect(screen.getAllByRole("row")).toHaveLength(1 + 12);

    fireEvent.click(screen.getByRole("button", { name: "Show fewer" }));
    expect(screen.getAllByRole("row")).toHaveLength(1 + 8);
  });

  it("has no show-all button when every row already fits", () => {
    render(<TableBlock {...props} rows={rows(8)} />);
    expect(screen.queryByRole("button", { name: /Show/ })).toBeNull();
  });

  it("has no Excel button unless the server offered a file", () => {
    render(<TableBlock {...props} rows={rows(1)} />);
    expect(screen.queryByRole("button", { name: /Excel/ })).toBeNull();
  });

  it("downloads the file the server linked", async () => {
    downloadLinked.mockResolvedValue(undefined);
    render(<TableBlock {...props} rows={rows(1)} download="/reports/shortage/export" />);

    fireEvent.click(screen.getByRole("button", { name: /Excel/ }));

    await waitFor(() => expect(downloadLinked).toHaveBeenCalledExactlyOnceWith("/reports/shortage/export"));
    await waitFor(() => expect(screen.getByRole("button", { name: /Excel/ })).toBeEnabled());
  });

  it("is disabled while the file is being fetched, and shows the reason if it fails", async () => {
    let finish: (value?: unknown) => void = () => undefined;
    downloadLinked.mockReturnValueOnce(new Promise((resolve) => (finish = resolve)));
    render(<TableBlock {...props} rows={rows(1)} download="/reports/x" />);

    fireEvent.click(screen.getByRole("button", { name: /Excel/ }));
    expect(screen.getByRole("button", { name: /Excel/ })).toBeDisabled();
    finish();
    await waitFor(() => expect(screen.getByRole("button", { name: /Excel/ })).toBeEnabled());

    downloadLinked.mockRejectedValueOnce(new Error("Report is not ready"));
    fireEvent.click(screen.getByRole("button", { name: /Excel/ }));
    await waitFor(() => expect(toastError).toHaveBeenCalledWith("Report is not ready"));
    expect(screen.getByRole("button", { name: /Excel/ })).toBeEnabled();
  });
});
