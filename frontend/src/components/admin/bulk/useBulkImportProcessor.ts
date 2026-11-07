"use client";

import { useState, useRef } from "react";
import api, { getApiErrorMessage } from "@/lib/api";
import {
  BatchProgressItem,
  BulkImportEntityType,
  BulkImportResponse,
  BulkImportSummary,
  BulkRow,
  FailedRow,
  ImportStage,
} from "./bulkTypes";
import { buildBatches, buildBulkPayload } from "./bulkPayloadBuilder";
import { fileRowErrors } from "./fileRowErrors";
import { humanizeImportError } from "./humanizeImportError";

export function useBulkImportProcessor(entityType: BulkImportEntityType, onSuccess: () => void) {
  const [stage, setStage] = useState<ImportStage>("upload");
  const [records, setRecords] = useState<BulkRow[]>([]);
  const [ignoredColumns, setIgnoredColumns] = useState<string[]>([]);
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
    setIgnoredColumns([]);
    setFileName("");
    setBatches([]);
    setSummary(null);
    abortRef.current = false;
    setIsAborting(false);
  };

  const handleRecordsParsed = (parsed: BulkRow[], name: string, ignored: string[]): void => {
    setRecords(parsed);
    setIgnoredColumns(ignored);
    setFileName(name);
    setStage("preview");
  };

  const handleRemoveRecord = (id: string): void => {
    const updated = records.filter((r) => r.id !== id);
    setRecords(updated);
    if (updated.length === 0) handleReset();
  };

  const executeBulkImport = async (): Promise<void> => {
    // Rows that failed the checks never leave the browser; they are reported with the others at the end.
    const ready = records.filter((r) => !r.error);
    const skipped = records.filter((r) => r.error);
    const initialBatches = buildBatches(ready);
    setBatches(initialBatches);
    setStage("importing");
    abortRef.current = false;
    setIsAborting(false);

    let runningImported = 0;
    let runningFailed = skipped.length;
    let runningInvites = 0;
    let runningProcessed = skipped.length;
    const allCollectedErrors = skipped.map((row) => `Row ${row.number}: ${row.error}`);
    const failedItems: FailedRow[] = skipped.map((row) => ({ row, reason: row.error ?? "Needs fixing" }));

    for (let i = 0; i < initialBatches.length; i++) {
      if (abortRef.current) break;
      setCurrentBatchIdx(i);
      const batchItem = initialBatches[i];
      const slice = ready.slice(batchItem.startIndex, batchItem.endIndex);

      setBatches((prev) => prev.map((b, idx) => (idx === i ? { ...b, status: "processing" } : b)));

      try {
        const { endpoint, payload } = buildBulkPayload(entityType, slice, sendInvite);
        const { data } = await api.post<BulkImportResponse>(endpoint, payload);
        const lines = fileRowErrors(slice, data.errors);

        runningImported += data.imported_count;
        runningFailed += data.failed_count;
        runningInvites += data.invitations_sent;
        runningProcessed += slice.length;
        allCollectedErrors.push(...lines);
        data.failures.forEach((failure) => {
          const row = slice[failure.row - 1];
          if (row) failedItems.push({ row, reason: failure.message });
        });

        setBatches((prev) =>
          prev.map((b, idx) =>
            idx === i
              ? {
                  ...b,
                  status: data.failed_count > 0 ? "warning" : "success",
                  importedCount: data.imported_count,
                  failedCount: data.failed_count,
                  invitationsSent: data.invitations_sent,
                  errorMessages: lines,
                }
              : b
          )
        );
      } catch (err: unknown) {
        const msg = humanizeImportError(getApiErrorMessage(err, `Batch ${i + 1} encountered an issue`));
        allCollectedErrors.push(msg);
        runningFailed += slice.length;
        runningProcessed += slice.length;
        slice.forEach((row) => failedItems.push({ row, reason: msg }));

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
    ignoredColumns,
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
