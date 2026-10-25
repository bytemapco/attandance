import { z } from "zod";

export const classFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Class name must be at least 2 characters")
    .max(100, "Class name cannot exceed 100 characters"),
  subject_id: z.string().min(1, "Please select a subject"),
  teacher_id: z.string().min(1, "Please assign a teacher"),
  classroom_id: z.string().optional().or(z.literal("")),
  semester: z.union([z.number().int().min(1).max(8), z.literal(""), z.undefined()]).optional(),
  batch: z.string().trim().max(20, "Batch cannot exceed 20 characters").optional().or(z.literal("")),
});

export type ClassFormData = z.infer<typeof classFormSchema>;

export const classEditSchema = classFormSchema.extend({
  teacher_id: z.string().optional().or(z.literal("")),
});

export type ClassEditFormData = z.infer<typeof classEditSchema>;

export const assignTeacherSchema = z.object({
  teacher_id: z.string().min(1, "Please select a teacher to assign"),
});

export type AssignTeacherFormData = z.infer<typeof assignTeacherSchema>;

export const systemConfigSchema = z.object({
  is_face_recognition_enabled: z.boolean(),
  is_gps_verification_enabled: z.boolean(),
  is_ai_background_validation_enabled: z.boolean(),
});

export type SystemConfigFormData = z.infer<typeof systemConfigSchema>;
