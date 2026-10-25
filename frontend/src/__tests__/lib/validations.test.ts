import { describe, it, expect } from "vitest";
import { loginSchema, resetPasswordSchema, forgotPasswordSchema } from "@/lib/validations/auth";
import { leaveRequestSchema } from "@/lib/validations/leave";

describe("loginSchema", () => {
  it("validates valid email and password", () => {
    const valid = {
      email: "user@example.com",
      password: "StrongPassword123!",
    };
    const result = loginSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("fails when email is invalid", () => {
    const invalid = {
      email: "not-an-email",
      password: "StrongPassword123!",
    };
    const result = loginSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Please enter a valid email address");
    }
  });

  it("fails when password is shorter than 8 characters", () => {
    const invalid = {
      email: "user@example.com",
      password: "short",
    };
    const result = loginSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Password must be at least 8 characters");
    }
  });
});

describe("resetPasswordSchema", () => {
  it("validates matching passwords", () => {
    const valid = {
      password: "SecurePassword123!",
      confirmPassword: "SecurePassword123!",
    };
    const result = resetPasswordSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("fails when passwords do not match", () => {
    const invalid = {
      password: "SecurePassword123!",
      confirmPassword: "DifferentPassword123!",
    };
    const result = resetPasswordSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Passwords do not match");
    }
  });
});

describe("forgotPasswordSchema", () => {
  it("validates valid email", () => {
    const result = forgotPasswordSchema.safeParse({ email: "valid@edu.org" });
    expect(result.success).toBe(true);
  });

  it("fails when email is empty", () => {
    const result = forgotPasswordSchema.safeParse({ email: "   " });
    expect(result.success).toBe(false);
  });
});

describe("leaveRequestSchema", () => {
  it("validates when end date is on or after start date", () => {
    const valid = {
      start_date: "2026-10-25",
      end_date: "2026-10-28",
      reason: "Medical leave due to viral fever diagnosed by physician.",
    };
    const result = leaveRequestSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("fails when end date is before start date", () => {
    const invalid = {
      start_date: "2026-10-28",
      end_date: "2026-10-25",
      reason: "Medical leave due to viral fever diagnosed by physician.",
    };
    const result = leaveRequestSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("End date must be on or after start date");
    }
  });

  it("fails when reason is less than 10 characters", () => {
    const invalid = {
      start_date: "2026-10-25",
      end_date: "2026-10-26",
      reason: "Sick",
    };
    const result = leaveRequestSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Reason must be at least 10 characters");
    }
  });
});
