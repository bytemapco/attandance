import { z } from "zod";

export const departmentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Department name must be at least 3 characters")
    .max(100, "Department name cannot exceed 100 characters"),
  code: z
    .string()
    .trim()
    .min(2, "Department code must be at least 2 characters")
    .max(20, "Department code cannot exceed 20 characters")
    .toUpperCase(),
  description: z.string().trim().max(500, "Description cannot exceed 500 characters").optional().or(z.literal("")),
});

export type DepartmentFormData = z.infer<typeof departmentSchema>;

export const subjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Subject name must be at least 2 characters")
    .max(100, "Subject name cannot exceed 100 characters"),
  code: z
    .string()
    .trim()
    .min(2, "Subject code must be at least 2 characters")
    .max(20, "Subject code cannot exceed 20 characters")
    .toUpperCase(),
  department_id: z.string().optional().or(z.literal("")),
  description: z.string().trim().max(500, "Description cannot exceed 500 characters").optional().or(z.literal("")),
});

export type SubjectFormData = z.infer<typeof subjectSchema>;

export const classroomSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Room name/number is required")
    .max(100, "Room name cannot exceed 100 characters"),
  building: z.string().trim().max(100, "Building cannot exceed 100 characters").optional().or(z.literal("")),
  capacity: z.number().int().positive().optional().or(z.literal(0)),
});

export type ClassroomFormData = z.infer<typeof classroomSchema>;

export const designationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Designation title must be at least 2 characters")
    .max(100, "Designation title cannot exceed 100 characters"),
  code: z
    .string()
    .trim()
    .min(2, "Designation code must be at least 2 characters")
    .max(20, "Designation code cannot exceed 20 characters")
    .toUpperCase(),
  description: z.string().trim().max(500, "Description cannot exceed 500 characters").optional().or(z.literal("")),
});

export type DesignationFormData = z.infer<typeof designationSchema>;

export const academicYearSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "Name must be at least 3 characters")
      .max(100, "Name cannot exceed 100 characters"),
    start_date: z.string().min(1, "Start date is required"),
    end_date: z.string().min(1, "End date is required"),
    saturday_enabled: z.boolean(),
  })
  .refine((data) => new Date(data.end_date) > new Date(data.start_date), {
    message: "End date must be after start date",
    path: ["end_date"],
  });

export type AcademicYearFormData = z.infer<typeof academicYearSchema>;

export const calendarEventSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(120, "Title cannot exceed 120 characters"),
  date: z.string().min(1, "Date is required"),
  event_type: z.enum(["HOLIDAY", "EXAM_DAY", "NON_INSTRUCTIONAL", "TIMETABLE_OVERRIDE"]),
  affects_all_courses: z.boolean(),
  description: z.string().trim().max(500, "Description cannot exceed 500 characters").optional().or(z.literal("")),
});

export type CalendarEventFormData = z.infer<typeof calendarEventSchema>;

export const timeSlotSchema = z.object({
  slot_number: z.coerce.number().int().min(1).max(50),
  name: z.string().trim().min(1, "Name is required").max(50, "Name cannot exceed 50 characters"),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM format"),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM format"),
  is_break: z.boolean(),
  is_lab_block: z.boolean(),
});

export type TimeSlotFormData = z.infer<typeof timeSlotSchema>;

export const semesterSchema = z
  .object({
    number: z.coerce.number().int().min(1, "Semester number must be at least 1").max(12),
    start_date: z.string().min(1, "Start date is required"),
    end_date: z.string().min(1, "End date is required"),
  })
  .refine((data) => new Date(data.end_date) > new Date(data.start_date), {
    message: "End date must be after start date",
    path: ["end_date"],
  });

export type SemesterFormData = z.infer<typeof semesterSchema>;
