import { z } from "zod";

export const leaveRequestSchema = z
  .object({
    start_date: z.string().min(1, "Start date is required"),
    end_date: z.string().min(1, "End date is required"),
    reason: z
      .string()
      .trim()
      .min(10, "Reason must be at least 10 characters")
      .max(500, "Reason cannot exceed 500 characters"),
    document: z.any().optional(),
  })
  .refine(
    (data) => {
      if (data.start_date && data.end_date) {
        return new Date(data.end_date) >= new Date(data.start_date);
      }
      return true;
    },
    {
      message: "End date must be on or after start date",
      path: ["end_date"],
    }
  );

export type LeaveRequestFormData = z.infer<typeof leaveRequestSchema>;

export const leaveApprovalSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  approver_note: z.string().trim().max(300, "Note cannot exceed 300 characters").optional(),
});

export type LeaveApprovalFormData = z.infer<typeof leaveApprovalSchema>;
