"use client";

import { useState, useRef } from "react";
import api, { getApiErrorMessage } from "@/lib/api";
import { ParsedBulkRecord, ImportStage, BatchProgressItem, BulkImportSummary, BulkImportEntityType } from "./bulk-types";
import { buildBatches, buildBulkPayload } from "./bulk-payload-builder";

export function humanizeImportError(errorMsg: string): string {
  if (!errorMsg) return "Unknown error";

  // Clean up Pydantic validation paths like "teachers.0.department_id: Field required"
  const pydanticMatch = errorMsg.match(/^(?:teachers|students|classes|departments|subjects|classrooms|designations)\.(\d+)\.([a-zA-Z_]+):\s*(.*)$/i);
  if (pydanticMatch) {
    const rowNum = parseInt(pydanticMatch[1], 10) + 1;
    const fieldRaw = pydanticMatch[2];
    const reason = pydanticMatch[3];

    const fieldMap: Record<string, string> = {
      email: "Email address",
      employee_id: "Employee ID",
      enrollment_number: "Enrollment number",
      first_name: "First name",
      last_name: "Last name",
      department_id: "Department",
      designation_id: "Designation",
      subject_code: "Subject code",
      teacher_email: "Teacher email",
      classroom_name: "Classroom",
      name: "Name",
      code: "Code",
      building: "Building",
      capacity: "Capacity",
    };

    const cleanField = fieldMap[fieldRaw] || fieldRaw.replace(/_/g, " ");
    if (reason.toLowerCase().includes("field required") || reason.toLowerCase().includes("missing")) {
      return `Row ${rowNum}: ${cleanField} is required`;
    }
    return `Row ${rowNum}: ${cleanField} — ${reason}`;
  }

  return errorMsg;
}

export function useBulkImportProcessor(entityType: BulkImportEntityType, onSuccess: () => void) {
  const [stage, setStage] = useState<ImportStage>("upload");
  const [records, setRecords] = useState<ParsedBulkRecord[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [sendInvite, setSendInvite] = useState<boolean>(true);
  const [batches, setBatches] = useState<BatchProgressItem[]>([]);
  const [currentBatchIdx, setCurrentBatchIdx] = useState<number>(0);
  const [processedCount, setProcessedCount] = useState<number>(0);
  const [importedTotal, setImportedTotal] = useState<number>(0);
  const [failedTotal, setFailedTotal] = useState<number>(0);
  const [invitesTotal, setInvitesTotal] = useState<number>(0);
  const [summary, setSummary] = useState<BulkImportSummary | null>(null);
  const [isAborting, setIsAborting] = useState<boolean>(false);
  const abortRef = useRef<boolean>(false);

  const handleReset = (): void => {
    setStage("upload");
    setRecords([]);
    setFileName("");
    setBatches([]);
    setSummary(null);
    abortRef.current = false;
    setIsAborting(false);
  };

  const handleRecordsParsed = (parsed: ParsedBulkRecord[], name: string): void => {
    setRecords(parsed);
    setFileName(name);
    setStage("preview");
  };

  const handleRemoveRecord = (id: string): void => {
    const updated = records.filter((r) => r.id !== id);
    setRecords(updated);
    if (updated.length === 0) handleReset();
  };

  const executeBulkImport = async (): Promise<void> => {
    const initialBatches = buildBatches(records);
    setBatches(initialBatches);
    setStage("importing");
    abortRef.current = false;
    setIsAborting(false);

    let runningImported = 0;
    let runningFailed = 0;
    let runningInvites = 0;
    let runningProcessed = 0;
    const allCollectedErrors: string[] = [];
    const failedItems: ParsedBulkRecord[] = [];

    for (let i = 0; i < initialBatches.length; i++) {
      if (abortRef.current) break;
      setCurrentBatchIdx(i);
      const batchItem = initialBatches[i];
      const slice = records.slice(batchItem.startIndex, batchItem.endIndex);

      setBatches((prev) =>
        prev.map((b, idx) => (idx === i ? { ...b, status: "processing" } : b))
      );

      try {
        const { endpoint, payload } = buildBulkPayload(entityType, slice, sendInvite);

        const { data } = await api.post<{
          imported_count: number;
          failed_count: number;
          invitations_sent: number;
          errors: string[];
        }>(endpoint, payload);

        runningImported += data.imported_count || 0;
        runningFailed += data.failed_count || 0;
        runningInvites += data.invitations_sent || 0;
        runningProcessed += slice.length;

        if (data.errors && data.errors.length > 0) {
          const cleanErrors = data.errors.map(humanizeImportError);
          allCollectedErrors.push(...cleanErrors);
          slice.forEach((s, itemIdx) => {
            const rowPrefix = `Row ${itemIdx + 1}`;
            const matchedErr = cleanErrors.find(
              (errStr) =>
                errStr.startsWith(rowPrefix) ||
                (s.email && errStr.includes(s.email)) ||
                (s.identifier && errStr.includes(s.identifier))
            );
            if (matchedErr) {
              failedItems.push({ ...s, validationError: matchedErr });
            } else if (data.failed_count === slice.length) {
              failedItems.push({ ...s, validationError: cleanErrors[0] });
            }
          });
        }

        setBatches((prev) =>
          prev.map((b, idx) =>
            idx === i
              ? {
                  ...b,
                  status: data.failed_count > 0 ? "warning" : "success",
                  importedCount: data.imported_count || 0,
                  failedCount: data.failed_count || 0,
                  invitationsSent: data.invitations_sent || 0,
                  errorMessages: (data.errors || []).map(humanizeImportError),
                }
              : b
          )
        );
      } catch (err: unknown) {
        const rawMsg = getApiErrorMessage(err, `Batch ${i + 1} encountered an issue`);
        const msg = humanizeImportError(rawMsg);
        allCollectedErrors.push(msg);
        runningFailed += slice.length;
        runningProcessed += slice.length;
        slice.forEach((s) => failedItems.push({ ...s, validationError: msg }));

        setBatches((prev) =>
          prev.map((b, idx) => (idx === i ? { ...b, status: "failed", errorMessages: [msg] } : b))
        );
      }

      setProcessedCount(runningProcessed);
      setImportedTotal(runningImported);
      setFailedTotal(runningFailed);
      setInvitesTotal(runningInvites);
    }

    setSummary({
      totalProcessed: runningProcessed,
      totalImported: runningImported,
      totalFailed: runningFailed,
      totalInvited: runningInvites,
      allErrors: allCollectedErrors,
      failedRecords: failedItems,
    });
    setStage("completed");
    if (runningImported > 0) onSuccess();
  };

  const handleAbort = (): void => {
    abortRef.current = true;
    setIsAborting(true);
  };

  return {
    stage,
    records,
    fileName,
    sendInvite,
    batches,
    currentBatchIdx,
    processedCount,
    importedTotal,
    failedTotal,
    invitesTotal,
    summary,
    isAborting,
    setSendInvite,
    handleReset,
    handleRecordsParsed,
    handleRemoveRecord,
    executeBulkImport,
    handleAbort,
  };
}
