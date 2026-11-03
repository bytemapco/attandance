export interface ReportClass {
  id: string;
  code: string;
  department_name: string;
  semester: number;
}

export interface ReportSubject {
  section_id: string;
  class_id?: string | null;
  class_code: string;
  subject_code: string;
  subject_name: string;
}

export interface ReportFilters {
  threshold: number;
  classes: ReportClass[];
  subjects: ReportSubject[];
}

export interface ReportMeta {
  scope: string;
  threshold: number;
  date_from?: string | null;
  date_to: string;
  generated_at: string;
}

export interface ShortageRow {
  student_id: string;
  student_name: string;
  roll: string;
  class_code: string;
  attended: number;
  held: number;
  percentage: number;
  classes_needed?: number | null;
}

export interface ShortageReport {
  meta: ReportMeta;
  students_counted: number;
  average_percentage?: number | null;
  rows: ShortageRow[];
}

export interface RegisterLecture {
  id: string;
  day: string;
  start: string;
  end: string;
  present: number;
}

export interface RegisterRow {
  student_id: string;
  student_name: string;
  roll: string;
  marks: (string | null)[];
  attended: number;
  held: number;
  percentage?: number | null;
}

export interface RegisterReport {
  meta: ReportMeta;
  lectures: RegisterLecture[];
  rows: RegisterRow[];
}

export interface SummaryCell {
  attended: number;
  held: number;
  percentage?: number | null;
}

export interface SummaryRow {
  student_id: string;
  student_name: string;
  roll: string;
  cells: (SummaryCell | null)[];
  overall: SummaryCell;
}

export interface SummaryReport {
  meta: ReportMeta;
  subjects: ReportSubject[];
  rows: SummaryRow[];
}

export type ReportTab = "shortage" | "register" | "subject-summary";

export interface ReportParams {
  class_id?: string;
  section_id?: string;
  date_from?: string;
  date_to?: string;
}
