import { z } from "zod";

const tenantAdminItemSchema = z.object({
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
}).strict();

export const tenantProvisionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Institution name must be at least 2 characters")
    .max(150, "Institution name cannot exceed 150 characters"),
  slug: z
    .string()
    .trim()
    .min(2, "Institution name must include at least 2 letters or numbers")
    .max(50, "Institution name is too long for its login address")
    .regex(/^[a-z0-9-]+$/, "Institution name must include letters or numbers"),
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
}).strict();

export type TenantProvisionFormData = z.infer<typeof tenantProvisionSchema>;
