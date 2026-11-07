import { describe, expect, it } from "vitest";
import { buildBatches, buildBulkPayload } from "@/components/admin/bulk/bulkPayloadBuilder";
import { fileRowErrors } from "@/components/admin/bulk/fileRowErrors";
import { humanizeImportError } from "@/components/admin/bulk/humanizeImportError";
import { parseBulkCsvContent } from "@/components/admin/bulk/parseBulkCsv";
import type { BulkImportEntityType, BulkRow } from "@/components/admin/bulk/bulkTypes";

function rowsOf(content: string, type: BulkImportEntityType): BulkRow[] {
  const result = parseBulkCsvContent(content, type);
  if ("error" in result) throw new Error(result.error);
  return result.rows;
}

function payloadOf(content: string, type: BulkImportEntityType, sendInvite = false) {
  return buildBulkPayload(type, rowsOf(content, type), sendInvite);
}

describe("buildBulkPayload", () => {
  it("sends a student with the server's field names and every cell that has a value", () => {
    const { endpoint, payload } = payloadOf(
      "email,enrollment_number,first_name,last_name,department_code,batch_code,gender,phone,date_of_birth\n" +
        "a@b.in,EN001,Asha,Rao,CE,CE-A-1,F,9876543210,31/12/2005",
      "students",
      true,
    );

    expect(endpoint).toBe("/admin/users/students/bulk");
    expect(payload).toEqual({
      students: [
        {
          email: "a@b.in", enrollment_number: "EN001", first_name: "Asha", last_name: "Rao", department_id: "CE",
          batch_code: "CE-A-1", gender: "F", phone: "9876543210", date_of_birth: "2005-12-31",
        },
      ],
      send_invite: true,
    });
  });

  it("leaves out a blank cell so the server sees it as not given", () => {
    const { payload } = payloadOf("email,enrollment_number,first_name,last_name,department_code,phone\na@b.in,EN001,Asha,Rao,CE,", "students");

    expect(payload.students).toEqual([{ email: "a@b.in", enrollment_number: "EN001", first_name: "Asha", last_name: "Rao", department_id: "CE" }]);
  });

  it("sends a teacher with department, designation and initials", () => {
    const { endpoint, payload } = payloadOf(
      "email,employee_id,first_name,last_name,department_code,designation_code,name_initials\na@b.in,EMP01,Ravi,Iyer,CE,PROF,rai",
      "teachers",
    );

    expect(endpoint).toBe("/admin/users/teachers/bulk");
    expect(payload.teachers).toEqual([
      { email: "a@b.in", employee_id: "EMP01", first_name: "Ravi", last_name: "Iyer", department_id: "CE", designation_id: "PROF", name_initials: "rai" },
    ]);
  });

  it("sends a subject with its department", () => {
    const { payload } = payloadOf("name,code,department_code\nMathematics,MA101,CE", "subjects");

    expect(payload.subjects).toEqual([{ name: "Mathematics", code: "MA101", department_id: "CE" }]);
  });

  it.each([
    ["departments", "/admin/departments/bulk", "name,code\nCivil,CE", { name: "Civil", code: "CE" }],
    ["classrooms", "/admin/classrooms/bulk", "name\nRoom 101", { name: "Room 101" }],
    ["designations", "/admin/designations/bulk", "name,code\nProfessor,PROF", { name: "Professor", code: "PROF" }],
  ] as const)("sends %s, and no invitation flag", (type, endpoint, csv, row) => {
    const built = payloadOf(csv, type, true);

    expect(built.endpoint).toBe(endpoint);
    expect(built.payload).toEqual({ [type]: [row] });
  });
});

describe("buildBatches", () => {
  it("splits the rows into batches of ten", () => {
    const rows = Array.from({ length: 23 }, (_, i) => ({ id: `r${i}`, number: i + 1, values: {} }));

    const batches = buildBatches(rows);

    expect(batches.map((b) => [b.startIndex, b.endIndex])).toEqual([[0, 10], [10, 20], [20, 23]]);
    expect(batches.every((b) => b.totalBatches === 3 && b.status === "queued")).toBe(true);
  });

  it("makes no batch for no rows", () => {
    expect(buildBatches([])).toEqual([]);
  });
});

describe("fileRowErrors", () => {
  const slice: BulkRow[] = [{ id: "a", number: 11, values: {} }, { id: "b", number: 12, values: {} }];

  it("names a row by its place in the file, not its place in the request", () => {
    expect(fileRowErrors(slice, ["Row 2: Email 'x@y.in' already registered."])).toEqual([
      "Row 12: Email 'x@y.in' already registered.",
    ]);
  });

  it("does not confuse row 1 with row 10", () => {
    const ten: BulkRow[] = Array.from({ length: 10 }, (_, i) => ({ id: `r${i}`, number: i + 1, values: {} }));

    expect(fileRowErrors(ten, ["Row 10: no", "Row 1: no"])).toEqual(["Row 10: no", "Row 1: no"]);
  });

  it("keeps a line that names no row", () => {
    expect(fileRowErrors(slice, ["Bulk import exceeds license capacity."])).toEqual(["Bulk import exceeds license capacity."]);
  });

  it("rewrites a server field path as a sentence about the file's row", () => {
    expect(fileRowErrors(slice, ["students.1.last_name: Field required"])).toEqual(["Row 12: Last name is required"]);
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
