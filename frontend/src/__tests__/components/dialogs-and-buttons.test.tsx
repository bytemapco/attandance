import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ReasonDialog from "@/components/ui/ReasonDialog";

describe("Button", () => {
  it("runs its handler when clicked", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it("cannot be clicked while loading, and says it is busy", () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Save
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Save" });

    fireEvent.click(button);

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(onClick).not.toHaveBeenCalled();
  });

  it("can be disabled", () => {
    render(<Button disabled>Save</Button>);
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });
});

describe("ConfirmDialog", () => {
  const props = { title: "Remove student", message: "This cannot be undone.", onConfirm: vi.fn(), onCancel: vi.fn() };

  it("renders nothing while closed", () => {
    const { container } = render(<ConfirmDialog {...props} isOpen={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the question and calls confirm or cancel", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<ConfirmDialog {...props} isOpen confirmLabel="Remove" onConfirm={onConfirm} onCancel={onCancel} />);

    expect(screen.getByText("This cannot be undone.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("locks both buttons while the action runs", () => {
    render(<ConfirmDialog {...props} isOpen loading confirmLabel="Remove" />);

    expect(screen.getByRole("button", { name: "Remove" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
  });
});

describe("ReasonDialog", () => {
  function open(onConfirm = vi.fn()) {
    render(<ReasonDialog title="Remove from class" confirmLabel="Remove" loading={false} onConfirm={onConfirm} onCancel={vi.fn()} />);
    return { onConfirm, box: screen.getByLabelText("Reason"), confirm: screen.getByRole("button", { name: "Remove" }) };
  }

  it("refuses a reason that is too short and says why", () => {
    const { onConfirm, box, confirm } = open();

    fireEvent.change(box, { target: { value: "ab" } });
    fireEvent.click(confirm);

    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByText("Reason must be at least 3 characters")).toBeInTheDocument();
  });

  it("refuses an empty reason, so no change is made without one", () => {
    const { onConfirm, confirm } = open();

    fireEvent.click(confirm);

    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("passes a valid reason on, trimmed", () => {
    const { onConfirm, box, confirm } = open();

    fireEvent.change(box, { target: { value: "  Moved to section B  " } });
    fireEvent.click(confirm);

    expect(onConfirm).toHaveBeenCalledWith("Moved to section B");
  });
});
