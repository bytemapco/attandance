import { z } from "zod";

export const studentFormSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  enrollment_number: z
    .string()
    .trim()
    .min(3, "Enrollment number must be at least 3 characters")
    .max(30, "Enrollment number cannot exceed 30 characters"),
  first_name: z
    .string()
    .trim()
    .min(1, "First name is required")
    .max(100, "First name cannot exceed 100 characters"),
  last_name: z
    .string()
    .trim()
    .min(1, "Last name is required")
    .max(100, "Last name cannot exceed 100 characters"),
  department_id: z.string().min(1, "Please select a department"),
  batch_id: z.string().min(1, "Please select a batch"),
  semester: z.coerce
    .number()
    .int()
    .min(1, "Semester must be between 1 and 8")
    .max(8, "Semester must be between 1 and 8"),
  phone: z
    .string()
    .trim()
    .min(5, "Phone number is required")
    .max(20, "Phone number cannot exceed 20 characters"),
  gender: z.string().min(1, "Please select a gender"),
  date_of_birth: z.string().min(1, "Date of birth is required"),
  send_invite: z.boolean().optional(),
});

export type StudentFormData = z.infer<typeof studentFormSchema>;

export const studentUpdateSchema = z.object({
  enrollment_number: z
    .string()
    .trim()
    .min(3, "Enrollment number must be at least 3 characters")
    .max(30, "Enrollment number cannot exceed 30 characters"),
  first_name: z
    .string()
    .trim()
    .min(1, "First name is required")
    .max(100, "First name cannot exceed 100 characters"),
  last_name: z
    .string()
    .trim()
    .min(1, "Last name is required")
    .max(100, "Last name cannot exceed 100 characters"),
  phone: z.string().trim().max(20, "Phone number cannot exceed 20 characters").optional().or(z.literal("")),
  gender: z.string().optional().or(z.literal("")),
  date_of_birth: z.string().optional().or(z.literal("")),
  semester: z.union([z.number().int().min(1).max(8), z.literal(""), z.undefined()]).optional(),
  batch_id: z.string().min(1, "Please select a batch"),
  department_id: z.string().min(1, "Please select a department"),
});

export type StudentUpdateFormData = z.infer<typeof studentUpdateSchema>;
