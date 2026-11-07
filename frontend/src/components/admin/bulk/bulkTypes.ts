export type BulkImportEntityType =
  | "students"
  | "teachers"
  | "departments"
  | "subjects"
  | "classrooms"
  | "designations";

/** One data row of the file. `values` are keyed by column key; `error` is why the row cannot be imported yet. */
export interface BulkRow {
  id: string;
  number: number; // position among the file's data rows, starting at 1
  values: Record<string, string>;
  error?: string;
}

export interface FailedRow {
  row: BulkRow;
  reason: string;
}

export type ImportStage = "upload" | "preview" | "importing" | "completed";

export interface BatchProgressItem {
  batchNumber: number;
  totalBatches: number;
  startIndex: number;
  endIndex: number;
  status: "queued" | "processing" | "success" | "warning" | "failed";
  importedCount: number;
  failedCount: number;
  invitationsSent: number;
  errorMessages: string[];
}

export interface BulkImportSummary {
  totalProcessed: number;
  totalImported: number;
  totalFailed: number;
  totalInvited: number;
  allErrors: string[];
  failedRecords: FailedRow[];
}

/** What the server answers for one request. `failures[].row` counts from 1 within that request. */
export interface BulkImportResponse {
  imported_count: number;
  failed_count: number;
  invitations_sent: number;
  errors: string[];
  failures: { row: number; message: string }[];
}
