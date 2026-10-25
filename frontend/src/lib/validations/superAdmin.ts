import { z } from "zod";

export const tenantAdminItemSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Administrator name must be at least 2 characters")
    .max(100, "Administrator name cannot exceed 100 characters"),
  email: z
    .string()
    .trim()
    .email("Please provide a valid administrative email address"),
  role: z.literal("TENANT_ADMIN"),
});

export const tenantProvisionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Institution name must be at least 2 characters")
    .max(150, "Institution name cannot exceed 150 characters"),
  slug: z
    .string()
    .trim()
    .min(2, "Short web name must be at least 2 characters")
    .max(50, "Short web name cannot exceed 50 characters")
    .regex(/^[a-z0-9-]+$/, "Short name must only contain lowercase letters, numbers, and hyphens"),
  type: z.enum(["COLLEGE", "SCHOOL", "COACHING_CENTER"], {
    errorMap: () => ({ message: "Please select an institution type" }),
  }),
  domain: z
    .string()
    .trim()
    .max(100, "Domain cannot exceed 100 characters")
    .optional()
    .or(z.literal("")),
  license_count: z.coerce
    .number()
    .int("License count must be a whole number")
    .min(0, "License count cannot be negative"),
  admins: z
    .array(tenantAdminItemSchema)
    .min(1, "At least one administrator account must be configured")
    .superRefine((items, ctx) => {
      const emails = new Set<string>();
      items.forEach((item, index) => {
        const lower = item.email.toLowerCase().trim();
        if (emails.has(lower)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Administrator emails must be unique",
            path: [index, "email"],
          });
        }
        if (lower) emails.add(lower);
      });
    }),
});

export type TenantAdminItemFormData = z.infer<typeof tenantAdminItemSchema>;
export type TenantProvisionFormData = z.infer<typeof tenantProvisionSchema>;
