import { describe, it, expect } from "vitest";
import {
  classCreateSchema,
  reasonSchema,
  studentsForClass,
} from "@/lib/validations/classManagement";

const valid = {
  department_id: "dept-1",
  academic_year_id: "year-1",
  semester_number: "4",
  batch_id: "batch-cse-a-1",
};

const students = [
  { department_id: "cse", semester: 4, batch_id: "batch-cse-a-1" },
  { department_id: "cse", semester: 4, batch_id: "batch-cse-a-1" },
  { department_id: "cse", semester: 4, batch_id: "batch-cse-a-2" },
  { department_id: "cse", semester: 3, batch_id: "batch-cse-a-1" },
  { department_id: "it", semester: 4, batch_id: "batch-it-a-1" },
  { department_id: "cse", semester: 4, batch_id: null },
];

describe("classCreateSchema", () => {
  it("coerces the semester", () => {
    const result = classCreateSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.semester_number).toBe(4);
      expect(result.data.batch_id).toBe("batch-cse-a-1");
    }
  });

  it("requires a department, academic year and batch", () => {
    const result = classCreateSchema.safeParse({ ...valid, department_id: "", academic_year_id: "", batch_id: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain("Select a department");
      expect(messages).toContain("Select an academic year");
      expect(messages).toContain("Select a batch");
    }
  });

  it("rejects an out-of-range semester", () => {
    expect(classCreateSchema.safeParse({ ...valid, semester_number: "13" }).success).toBe(false);
  });
});

describe("student matching", () => {
  it("selects every student of the chosen batch in the chosen semester and nobody else", () => {
    expect(studentsForClass(students, "cse", 4, "batch-cse-a-1")).toHaveLength(2);
    expect(studentsForClass(students, "cse", 4, "batch-cse-a-2")).toHaveLength(1);
    expect(studentsForClass(students, "it", 4, "batch-cse-a-1")).toHaveLength(0);
  });

  it("without a batch returns the department's students for the semester", () => {
    expect(studentsForClass(students, "cse", 4)).toHaveLength(4);
  });
});

describe("reasonSchema", () => {
  it("requires at least 3 characters", () => {
    expect(reasonSchema.safeParse({ reason: "ab" }).success).toBe(false);
    expect(reasonSchema.safeParse({ reason: "Division change" }).success).toBe(true);
  });
});
