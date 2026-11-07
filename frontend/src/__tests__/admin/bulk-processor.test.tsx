import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BulkImportEntityType, BulkImportResponse } from "@/components/admin/bulk/bulkTypes";
import { parseBulkCsvContent } from "@/components/admin/bulk/parseBulkCsv";

const { post } = vi.hoisted(() => ({ post: vi.fn() }));

vi.mock("@/lib/api", () => ({
  default: { post },
  getApiErrorMessage: (err: unknown, fallback: string) => (err instanceof Error ? err.message : fallback),
}));

import { useBulkImportProcessor } from "@/components/admin/bulk/useBulkImportProcessor";

const HEADER = "email,enrollment_number,first_name,last_name,department_code";

function students(count: number, bad: Record<number, string> = {}): string {
  const rows = Array.from({ length: count }, (_, i) => {
    const n = i + 1;
    return bad[n] ?? `s${n}@b.in,EN${String(n).padStart(3, "0")},First${n},Last${n},CE`;
  });
  return [HEADER, ...rows].join("\n");
}

function reply(imported: number, failures: { row: number; message: string }[] = [], errors: string[] = []): { data: BulkImportResponse } {
  const lines = errors.length ? errors : failures.map((f) => `Row ${f.row}: ${f.message}`);
  return { data: { imported_count: imported, failed_count: failures.length, invitations_sent: 0, errors: lines, failures } };
}

async function run(csv: string, type: BulkImportEntityType = "students") {
  const onSuccess = vi.fn();
  const hook = renderHook(() => useBulkImportProcessor(type, onSuccess));
  const parsed = parseBulkCsvContent(csv, type);
  if ("error" in parsed) throw new Error(parsed.error);
  act(() => hook.result.current.handleRecordsParsed(parsed.rows, "file.csv", parsed.ignoredColumns));
  await act(async () => {
    await hook.result.current.executeBulkImport();
  });
  return { ...hook, onSuccess };
}

beforeEach(() => post.mockReset());

describe("useBulkImportProcessor", () => {
  it("sends only the rows that passed the checks and reports the others as failed", async () => {
    post.mockResolvedValue(reply(3));

    const { result, onSuccess } = await run(students(4, { 2: "not-an-email,EN002,First2,Last2,CE" }));

    expect(post).toHaveBeenCalledTimes(1);
    expect(post.mock.calls[0][1].students).toHaveLength(3);
    expect(result.current.stage).toBe("completed");
    expect(result.current.summary).toMatchObject({ totalProcessed: 4, totalImported: 3, totalFailed: 1 });
    expect(result.current.summary?.allErrors).toEqual(["Row 2: Email is not a valid address"]);
    expect(result.current.summary?.failedRecords.map((f) => [f.row.number, f.reason])).toEqual([[2, "Email is not a valid address"]]);
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("matches each server failure to the exact row, even row 10 against row 1", async () => {
    post
      .mockResolvedValueOnce(reply(9, [{ row: 10, message: "Department 'ZZ' not found." }]))
      .mockResolvedValueOnce(reply(1, [{ row: 1, message: "Enrollment 'EN011' already exists." }]));

    const { result } = await run(students(11));

    const failed = result.current.summary?.failedRecords ?? [];
    expect(failed.map((f) => [f.row.number, f.reason])).toEqual([
      [10, "Department 'ZZ' not found."],
      [11, "Enrollment 'EN011' already exists."],
    ]);
    expect(failed.map((f) => f.row.values.enrollment_number)).toEqual(["EN010", "EN011"]);
  });

  it("numbers every error line by the row's place in the file, across batches", async () => {
    post
      .mockResolvedValueOnce(reply(10))
      .mockResolvedValueOnce(reply(1, [{ row: 2, message: "Email 'x@y.in' already registered." }], [
        "Row 2: Email 'x@y.in' already registered.",
        "Row 1: account created, but invitation email delivery failed. Check SMTP settings.",
      ]));

    const { result } = await run(students(12));

    expect(result.current.summary?.allErrors).toEqual([
      "Row 12: Email 'x@y.in' already registered.",
      "Row 11: account created, but invitation email delivery failed. Check SMTP settings.",
    ]);
    expect(result.current.batches[1].errorMessages).toHaveLength(2);
  });

  it("fails every row of a batch whose request fails and carries on with the next batch", async () => {
    post.mockRejectedValueOnce(new Error("Network down")).mockResolvedValueOnce(reply(2));

    const { result } = await run(students(12));

    expect(result.current.batches.map((b) => b.status)).toEqual(["failed", "success"]);
    expect(result.current.summary).toMatchObject({ totalImported: 2, totalFailed: 10, totalProcessed: 12 });
    expect(result.current.summary?.failedRecords).toHaveLength(10);
    expect(result.current.summary?.failedRecords.every((f) => f.reason === "Network down")).toBe(true);
  });

  it("marks a batch with failed rows as a warning and a clean one as a success", async () => {
    post.mockResolvedValueOnce(reply(9, [{ row: 3, message: "no" }])).mockResolvedValueOnce(reply(2));

    const { result } = await run(students(12));

    expect(result.current.batches.map((b) => b.status)).toEqual(["warning", "success"]);
  });

  it("sends the invitation choice for students and not for departments", async () => {
    post.mockResolvedValue(reply(1));

    await run(students(1));
    await run("name,code\nCivil,CE", "departments");

    expect(post.mock.calls[0][1]).toHaveProperty("send_invite", true);
    expect(post.mock.calls[1][1]).not.toHaveProperty("send_invite");
    expect(post.mock.calls[1][0]).toBe("/admin/departments/bulk");
  });

  it("does not report success when nothing was imported", async () => {
    post.mockResolvedValue(reply(0, [{ row: 1, message: "no" }]));

    const { onSuccess, result } = await run(students(1));

    expect(onSuccess).not.toHaveBeenCalled();
    expect(result.current.summary?.totalImported).toBe(0);
  });

  it("goes back to the upload step when the last row is removed", () => {
    const hook = renderHook(() => useBulkImportProcessor("students", vi.fn()));
    const parsed = parseBulkCsvContent(students(1), "students");
    if ("error" in parsed) throw new Error(parsed.error);
    act(() => hook.result.current.handleRecordsParsed(parsed.rows, "file.csv", []));

    act(() => hook.result.current.handleRemoveRecord(parsed.rows[0].id));

    expect(hook.result.current.stage).toBe("upload");
    expect(hook.result.current.records).toEqual([]);
  });
});
