import { z } from "zod";

export const teacherFormSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  employee_id: z
    .string()
    .trim()
    .min(3, "Employee ID must be at least 3 characters")
    .max(30, "Employee ID cannot exceed 30 characters"),
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
  designation_id: z.string().min(1, "Please select a designation"),
  phone: z.string().trim().max(20, "Phone number cannot exceed 20 characters").optional().or(z.literal("")),
  send_invite: z.boolean().optional(),
});

export type TeacherFormData = z.infer<typeof teacherFormSchema>;

export const teacherUpdateSchema = z.object({
  employee_id: z
    .string()
    .trim()
    .min(3, "Employee ID must be at least 3 characters")
    .max(30, "Employee ID cannot exceed 30 characters"),
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
  designation_id: z.string().min(1, "Please select a designation"),
  phone: z.string().trim().max(20, "Phone number cannot exceed 20 characters").optional().or(z.literal("")),
});

export type TeacherUpdateFormData = z.infer<typeof teacherUpdateSchema>;

export const sessionStartSchema = z.object({
  academic_class_id: z.string().min(1, "Class is required"),
  duration_minutes: z.coerce.number().int().min(1, "Duration must be at least 1 minute").max(180, "Duration cannot exceed 180 minutes").default(10),
});

export type SessionStartFormData = z.infer<typeof sessionStartSchema>;

export const geofenceSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90, "Latitude must be between -90 and 90"),
  longitude: z.coerce.number().min(-180).max(180, "Longitude must be between -180 and 180"),
  radius_meters: z.coerce.number().positive("Radius must be greater than 0").max(5000, "Radius cannot exceed 5000 meters"),
});

export type GeofenceFormData = z.infer<typeof geofenceSchema>;
