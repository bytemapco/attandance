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
