export type BulkImportEntityType =
  | "students"
  | "teachers"
  | "classes"
  | "departments"
  | "subjects"
  | "classrooms"
  | "designations";

export interface ParsedBulkRecord {
  id: string;
  email: string;
  identifier: string; // enrollment_number, employee_id, or subject_code
  first_name: string; // first_name or class_name
  last_name: string; // last_name or classroom_name
  semester?: number;
  batch?: string;
  isValid: boolean;
  validationError?: string;
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
  failedRecords: ParsedBulkRecord[];
}
