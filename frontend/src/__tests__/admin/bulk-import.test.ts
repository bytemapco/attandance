import { describe, expect, it, vi } from "vitest";
import { humanizeImportError } from "@/components/admin/bulk/humanizeImportError";
import { parseBulkCsvContent } from "@/components/admin/bulk/parseBulkCsv";

function parse(content: string, type: Parameters<typeof parseBulkCsvContent>[1]) {
  const onError = vi.fn();
  return { records: parseBulkCsvContent(content, type, onError), onError };
}

describe("parseBulkCsvContent", () => {
  it("needs a header row and at least one record", () => {
    const { records, onError } = parse("email,id,first,last", "teachers");
    expect(records).toBeNull();
    expect(onError).toHaveBeenCalledWith("The CSV file must contain a header row and at least 1 record row.");
  });

  it("reads students: email, enrollment number, names, department and batch", () => {
    const { records } = parse(
      "email,enrollment,first,last,dept,batch\nasha@college.in,EN001,Asha,Rao,CE,CE-A-1",
      "students",
    );
    expect(records).toHaveLength(1);
    expect(records?.[0]).toMatchObject({
      email: "asha@college.in",
      identifier: "EN001",
      first_name: "Asha",
      last_name: "Rao",
      departmentCode: "CE",
      batchCode: "CE-A-1",
      isValid: true,
    });
  });

  it("handles Windows line endings, blank lines, spaces and quotes", () => {
    const { records } = parse('h\r\n\r\n "a@b.in" , "EMP01" , Ravi , Iyer , CE \r\n', "teachers");
    expect(records?.[0]).toMatchObject({ email: "a@b.in", identifier: "EMP01", first_name: "Ravi", departmentCode: "CE" });
  });

  it.each([
    ["not-an-email,EN001,Asha,Rao,CE", "Invalid email format"],
    ["a@b.in,E1,Asha,Rao,CE", "ID too short (min 3 characters)"],
    ["a@b.in,EN001,,Rao,CE", "First name is required"],
  ])("marks the row %j invalid with a reason", (row, reason) => {
    const { records } = parse(`header\n${row}`, "teachers");
    expect(records?.[0]).toMatchObject({ isValid: false, validationError: reason });
  });

  it("requires a department for a student but not for a teacher", () => {
    const student = parse("h\na@b.in,EN001,Asha,Rao,", "students").records?.[0];
    const teacher = parse("h\na@b.in,EMP01,Ravi,Iyer,", "teachers").records?.[0];
    expect(student).toMatchObject({ isValid: false, validationError: "Department code is required" });
    expect(teacher?.isValid).toBe(true);
  });

  it("skips rows with too few columns", () => {
    const { records, onError } = parse("h\na@b.in,EN001", "students");
    expect(records).toBeNull();
    expect(onError).toHaveBeenCalledWith(
      "No valid records found in the uploaded file. Please check your headers and column format.",
    );
  });

  it("reads departments: name, code, head, description", () => {
    const { records } = parse("h\nComputer Engineering,CE,Dr. Mehta,Core branch", "departments");
    expect(records?.[0]).toMatchObject({ first_name: "Computer Engineering", identifier: "CE", last_name: "Dr. Mehta", isValid: true });
  });

  it("flags a department with a one-letter code", () => {
    const { records } = parse("h\nComputer Engineering,C", "departments");
    expect(records?.[0]).toMatchObject({ isValid: false, validationError: "Department code is required (min 2 characters)" });
  });

  it("reads subjects, designations and classrooms", () => {
    expect(parse("h\nMathematics,MA101", "subjects").records?.[0]).toMatchObject({ first_name: "Mathematics", identifier: "MA101", isValid: true });
    expect(parse("h\nLecturer,LEC", "designations").records?.[0]).toMatchObject({ first_name: "Lecturer", identifier: "LEC", isValid: true });
    expect(parse("h\nRoom 101,Main Block", "classrooms").records?.[0]).toMatchObject({ first_name: "Room 101", identifier: "Main Block", isValid: true });
  });

  it("gives every row its own id", () => {
    const { records } = parse("h\nA1,AA\nB1,BB", "subjects");
    expect(new Set(records?.map((r) => r.id)).size).toBe(2);
  });
});

describe("humanizeImportError", () => {
  it("turns a server field path into a sentence about the row", () => {
    expect(humanizeImportError("teachers.0.department_id: Field required")).toBe("Row 1: Department is required");
    expect(humanizeImportError("students.4.enrollment_number: Field required")).toBe("Row 5: Enrollment number is required");
  });

  it("keeps the reason when the field is present but wrong", () => {
    expect(humanizeImportError("students.1.email: value is not a valid email address")).toBe(
      "Row 2: Email address — value is not a valid email address",
    );
  });

  it("makes an unknown field readable", () => {
    expect(humanizeImportError("subjects.2.credit_hours: Field required")).toBe("Row 3: credit hours is required");
  });

  it("passes other messages through and names an empty one", () => {
    expect(humanizeImportError("Department CE not found")).toBe("Department CE not found");
    expect(humanizeImportError("")).toBe("Unknown error");
  });
});
