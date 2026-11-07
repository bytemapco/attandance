import { describe, expect, it } from "vitest";
import {
  forgotPasswordSchema,
  loginSchema,
  onboardingSchema,
  resetPasswordSchema,
} from "@/lib/validations/auth";
import { classCreateSchema, reasonSchema, studentsForClass } from "@/lib/validations/classManagement";
import { leaveRequestSchema } from "@/lib/validations/leave";
import { studentFormSchema, studentUpdateSchema } from "@/lib/validations/student";
import { geofenceSchema, teacherFormSchema } from "@/lib/validations/teacher";

function firstMessage(result: { success: boolean; error?: { issues: { message: string }[] } }): string | undefined {
  return result.success ? undefined : result.error?.issues[0].message;
}

describe("login", () => {
  it("accepts a valid email and password", () => {
    expect(loginSchema.safeParse({ email: "a@b.in", password: "longenough" }).success).toBe(true);
  });

  it("trims the email before checking it", () => {
    const parsed = loginSchema.parse({ email: "  a@b.in  ", password: "longenough" });
    expect(parsed.email).toBe("a@b.in");
  });

  it.each([
    ["", "Email is required"],
    ["not-an-email", "Please enter a valid email address"],
  ])("rejects the email %j", (email, message) => {
    expect(firstMessage(loginSchema.safeParse({ email, password: "longenough" }))).toBe(message);
  });

  it("asks for a password, then for at least 8 characters, and caps it at 128", () => {
    expect(firstMessage(loginSchema.safeParse({ email: "a@b.in", password: "" }))).toBe("Password is required");
    expect(firstMessage(loginSchema.safeParse({ email: "a@b.in", password: "short" }))).toBe(
      "Password must be at least 8 characters",
    );
    expect(loginSchema.safeParse({ email: "a@b.in", password: "x".repeat(128) }).success).toBe(true);
    expect(loginSchema.safeParse({ email: "a@b.in", password: "x".repeat(129) }).success).toBe(false);
  });
});

describe("forgot password", () => {
  it("needs a valid email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "a@b.in" }).success).toBe(true);
    expect(forgotPasswordSchema.safeParse({ email: "nope" }).success).toBe(false);
  });
});

describe.each([
  ["reset password", resetPasswordSchema, "password", "confirmPassword"],
  ["onboarding", onboardingSchema, "password", "confirmPassword"],
] as const)("%s", (_name, schema, passwordKey, confirmKey) => {
  it("accepts matching passwords", () => {
    const input = { [passwordKey]: "password-1", [confirmKey]: "password-1" };
    expect(schema.safeParse(input).success).toBe(true);
  });

  it("reports the mismatch on the confirmation field", () => {
    const result = schema.safeParse({ [passwordKey]: "password-1", [confirmKey]: "password-2" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual([confirmKey]);
      expect(result.error.issues[0].message).toBe("Passwords do not match");
    }
  });

  it("rejects a password under 8 characters", () => {
    expect(schema.safeParse({ [passwordKey]: "short", [confirmKey]: "short" }).success).toBe(false);
  });
});

describe("class creation", () => {
  const valid = { department_id: "d1", semester_number: 3, batch_id: "b1" };

  it("accepts a department, semester and batch", () => {
    expect(classCreateSchema.safeParse(valid).success).toBe(true);
  });

  it("reads the semester from a form string", () => {
    expect(classCreateSchema.parse({ ...valid, semester_number: "4" }).semester_number).toBe(4);
  });

  it("rejects semester 0, a fraction, and a missing department or batch", () => {
    expect(classCreateSchema.safeParse({ ...valid, semester_number: 0 }).success).toBe(false);
    expect(classCreateSchema.safeParse({ ...valid, semester_number: 2.5 }).success).toBe(false);
    expect(firstMessage(classCreateSchema.safeParse({ ...valid, department_id: "" }))).toBe("Select a department");
    expect(firstMessage(classCreateSchema.safeParse({ ...valid, batch_id: "" }))).toBe("Select a batch");
  });
});

describe("reason", () => {
  it("needs between 3 and 500 characters once trimmed", () => {
    expect(reasonSchema.safeParse({ reason: "  ab  " }).success).toBe(false);
    expect(reasonSchema.safeParse({ reason: "abc" }).success).toBe(true);
    expect(reasonSchema.safeParse({ reason: "x".repeat(501) }).success).toBe(false);
  });
});

describe("studentsForClass", () => {
  // A student with no class has no semester yet (it is the class's), so the list must not depend on it.
  const students = [
    { id: 1, department_id: "d1", semester: null, batch_id: "b1" },
    { id: 2, department_id: "d1", semester: null, batch_id: "b2" },
    { id: 3, department_id: "d1", semester: 4, batch_id: "b1" },
    { id: 4, department_id: "d2", semester: null, batch_id: "b1" },
  ];

  it("keeps the students of the same department, whatever their semester", () => {
    expect(studentsForClass(students, "d1").map((s) => s.id)).toEqual([1, 2, 3]);
  });

  it("narrows to a batch when one is given", () => {
    expect(studentsForClass(students, "d1", "b1").map((s) => s.id)).toEqual([1, 3]);
  });
});

describe("leave request", () => {
  const valid = { start_date: "2026-11-02", end_date: "2026-11-04", reason: "Fever and doctor advice" };

  it("accepts a range of days", () => {
    expect(leaveRequestSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts a single day", () => {
    expect(leaveRequestSchema.safeParse({ ...valid, end_date: valid.start_date }).success).toBe(true);
  });

  it("rejects an end date before the start date, on the end date field", () => {
    const result = leaveRequestSchema.safeParse({ ...valid, end_date: "2026-11-01" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].path).toEqual(["end_date"]);
  });

  it("needs a reason of at least 10 characters", () => {
    expect(leaveRequestSchema.safeParse({ ...valid, reason: "too short" }).success).toBe(false);
  });
});

describe("student form", () => {
  const valid = {
    email: "s@college.in",
    enrollment_number: "EN001",
    first_name: "Asha",
    last_name: "Rao",
    department_id: "d1",
    batch_id: "b1",
    phone: "9876543210",
    gender: "F",
    date_of_birth: "2006-01-02",
  };

  it("accepts a complete student", () => {
    expect(studentFormSchema.safeParse(valid).success).toBe(true);
  });

  it("takes no semester: it comes from the student's class", () => {
    expect(studentFormSchema.parse({ ...valid, semester: 3 })).not.toHaveProperty("semester");
    expect(studentUpdateSchema.parse({ ...valid, semester: 3 })).not.toHaveProperty("semester");
  });

  it("rejects a short enrollment number and a missing batch", () => {
    expect(studentFormSchema.safeParse({ ...valid, enrollment_number: "ab" }).success).toBe(false);
    expect(firstMessage(studentFormSchema.safeParse({ ...valid, batch_id: "" }))).toBe("Please select a batch");
  });
});

describe("teacher form and geofence", () => {
  it("accepts a complete teacher and does not require a phone number", () => {
    const teacher = {
      email: "t@college.in",
      employee_id: "EMP01",
      first_name: "Ravi",
      last_name: "Iyer",
      department_id: "d1",
      designation_id: "g1",
    };
    expect(teacherFormSchema.safeParse(teacher).success).toBe(true);
  });

  it("limits a geofence to real coordinates and a radius up to 5000 m", () => {
    const fence = { latitude: 28.6, longitude: 77.2, radius_meters: 100 };
    expect(geofenceSchema.safeParse(fence).success).toBe(true);
    expect(geofenceSchema.safeParse({ ...fence, latitude: 91 }).success).toBe(false);
    expect(geofenceSchema.safeParse({ ...fence, longitude: -181 }).success).toBe(false);
    expect(geofenceSchema.safeParse({ ...fence, radius_meters: 0 }).success).toBe(false);
    expect(geofenceSchema.safeParse({ ...fence, radius_meters: 5001 }).success).toBe(false);
  });
});
