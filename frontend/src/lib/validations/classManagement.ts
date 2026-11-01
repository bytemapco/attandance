import { z } from "zod";

export const classCreateSchema = z.object({
  department_id: z.string().min(1, "Select a department"),
  academic_year_id: z.string().min(1, "Select an academic year"),
  semester_number: z.coerce.number().int().min(1, "Select a semester").max(12, "Semester must be 1-12"),
  batch_id: z.string().min(1, "Select a batch"),
});

export type ClassCreateFormInput = z.input<typeof classCreateSchema>;
export type ClassCreateFormData = z.output<typeof classCreateSchema>;

export const classSectionSchema = z.object({
  subject_id: z.string().min(1, "Select a subject"),
  primary_teacher_id: z.string().optional(),
});

export type ClassSectionFormData = z.infer<typeof classSectionSchema>;

export const reasonSchema = z.object({
  reason: z.string().trim().min(3, "Reason must be at least 3 characters").max(500, "Reason cannot exceed 500 characters"),
});

interface StudentFilterFields {
  department_id?: string | null;
  semester?: number | null;
  batch_id?: string | null;
}

export function studentsForClass<T extends StudentFilterFields>(
  students: T[],
  departmentId: string,
  semester: number,
  batchId?: string
): T[] {
  return students.filter(
    (s) => s.department_id === departmentId && s.semester === semester && (!batchId || s.batch_id === batchId)
  );
}
