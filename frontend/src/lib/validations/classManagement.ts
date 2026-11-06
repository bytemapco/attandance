import { z } from "zod";

export const classCreateSchema = z.object({
  department_id: z.string().min(1, "Select a department"),
  semester_number: z.coerce.number().int().min(1, "Select a semester").max(12, "Semester must be 1-12"),
  batch_id: z.string().min(1, "Select a batch"),
});

export type ClassCreateFormInput = z.input<typeof classCreateSchema>;
export type ClassCreateFormData = z.output<typeof classCreateSchema>;

export const reasonSchema = z.object({
  reason: z.string().trim().min(3, "Reason must be at least 3 characters").max(500, "Reason cannot exceed 500 characters"),
});

interface StudentFilterFields {
  department_id?: string | null;
  batch_id?: string | null;
}

/** The students a new class starts with: those of its department and batch. A student's semester is the class's. */
export function studentsForClass<T extends StudentFilterFields>(students: T[], departmentId: string, batchId?: string): T[] {
  return students.filter((s) => s.department_id === departmentId && (!batchId || s.batch_id === batchId));
}
