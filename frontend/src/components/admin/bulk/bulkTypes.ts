export type BulkImportEntityType =
  | "students"
  | "teachers"
  | "departments"
  | "subjects"
  | "classrooms"
  | "designations";

export interface ParsedBulkRecord {
  id: string;
  email: string;
  identifier: string; // enrollment_number, employee_id, or subject_code
  first_name: string; // first_name, or the name of a department, subject, classroom or designation
  last_name: string; // last_name, or a department head
  departmentCode?: string; // students/teachers: department id, code or name
  batchCode?: string; // students: batch code within the department, e.g. CE-A-1
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
