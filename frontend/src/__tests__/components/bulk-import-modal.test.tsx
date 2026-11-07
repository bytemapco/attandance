import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { post, toastError } = vi.hoisted(() => ({ post: vi.fn(), toastError: vi.fn() }));

vi.mock("@/lib/api", () => ({
  default: { post },
  getApiErrorMessage: (err: unknown, fallback: string) => (err instanceof Error ? err.message : fallback),
}));
vi.mock("react-hot-toast", () => ({ default: { error: toastError } }));

import BulkImportModal from "@/components/admin/BulkImportModal";

const HEADER = "email,enrollment_number,first_name,last_name,department_code";

function open(entity: "students" | "departments" = "students") {
  const onSuccess = vi.fn();
  const view = render(<BulkImportModal isOpen onClose={vi.fn()} entityType={entity} onSuccess={onSuccess} />);
  const upload = (content: string, name = "people.csv") => {
    const input = view.container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File([content], name, { type: "text/csv" })] } });
  };
  return { ...view, upload, onSuccess };
}

beforeEach(() => {
  post.mockReset();
  toastError.mockReset();
});

describe("BulkImportModal", () => {
  it("lists the required and optional columns of the chosen import", () => {
    open();

    expect(screen.getByText(/Required columns/)).toHaveTextContent("email, enrollment_number, first_name, last_name, department_code");
    expect(screen.getByText(/Optional columns/)).toHaveTextContent("batch_code, gender, phone, date_of_birth");
  });

  it("shows the reason beside a row that needs fixing, and imports only the ready rows", async () => {
    const { upload } = open();

    upload(`${HEADER}\na@b.in,EN001,Asha,Rao,CE\nb@b.in,EN002,Ravi,,CE\nc@b.in,EN003,Meena,Das,CE`);

    expect(await screen.findByText("Last name is required")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Import 2 records" })).toBeEnabled();
    expect(screen.getByText(/1 to fix \(skipped\)/)).toBeInTheDocument();
  });

  it("will not import when no row is ready", async () => {
    const { upload } = open();

    upload(`${HEADER}\na@b.in,EN001,,Rao,CE`);

    expect(await screen.findByRole("button", { name: "Import 0 records" })).toBeDisabled();
  });

  it("names the columns it ignored", async () => {
    const { upload } = open();

    upload(`${HEADER},Remarks\na@b.in,EN001,Asha,Rao,CE,fine`);

    expect(await screen.findByText(/Ignored columns this import does not use: Remarks/)).toBeInTheDocument();
  });

  it("tells the admin which required column is missing and stays on the upload step", async () => {
    const { upload } = open();

    upload("email,enrollment_number,first_name,department_code\na@b.in,EN001,Asha,CE");

    await waitFor(() => expect(toastError).toHaveBeenCalledTimes(1));
    expect(toastError.mock.calls[0][0]).toContain("Missing required column: last_name.");
    expect(screen.getByText(/Click to choose a file/)).toBeInTheDocument();
  });

  it("refuses a file that is not a .csv", async () => {
    const { upload } = open();

    upload("anything", "people.xlsx");

    await waitFor(() => expect(toastError).toHaveBeenCalledWith("Please upload a valid .csv file."));
  });

  it("imports the ready rows and reports what happened", async () => {
    post.mockResolvedValue({ data: { imported_count: 2, failed_count: 0, invitations_sent: 2, errors: [], failures: [] } });
    const { upload, onSuccess } = open();
    upload(`${HEADER}\na@b.in,EN001,Asha,Rao,CE\nc@b.in,EN003,Meena,Das,CE`);

    fireEvent.click(await screen.findByRole("button", { name: "Import 2 records" }));

    expect(await screen.findByText("Import Completed Successfully")).toBeInTheDocument();
    expect(post).toHaveBeenCalledWith("/admin/users/students/bulk", expect.objectContaining({ send_invite: true }));
    expect(onSuccess).toHaveBeenCalled();
  });
});
