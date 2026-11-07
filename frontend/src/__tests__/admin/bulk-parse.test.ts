import { describe, expect, it } from "vitest";
import { parseBulkCsvContent } from "@/components/admin/bulk/parseBulkCsv";
import type { BulkImportEntityType } from "@/components/admin/bulk/bulkTypes";

const STUDENT_HEADER = "email,enrollment_number,first_name,last_name,department_code";

function rowsOf(content: string, type: BulkImportEntityType) {
  const result = parseBulkCsvContent(content, type);
  if ("error" in result) throw new Error(result.error);
  return result.rows;
}

function errorOf(content: string, type: BulkImportEntityType): string {
  const result = parseBulkCsvContent(content, type);
  if (!("error" in result)) throw new Error("expected the file to be refused");
  return result.error;
}

function studentProblem(cells: string): string | undefined {
  return rowsOf(`${STUDENT_HEADER}\n${cells}`, "students")[0].error;
}

describe("the file as a whole", () => {
  it("needs a header row and at least one record", () => {
    expect(errorOf("email,id,first,last", "teachers")).toBe("The CSV file must contain a header row and at least 1 record row.");
  });

  it("names every required column that is missing", () => {
    expect(errorOf("email,enrollment_number,first_name\na@b.in,EN001,Asha", "students")).toBe(
      "Missing required columns: last_name, department_code. Download the sample file to see the format.",
    );
    expect(errorOf("email,enrollment_number,first_name,department_code\na@b.in,EN001,Asha,CE", "students")).toContain(
      "Missing required column: last_name.",
    );
  });

  it("refuses a file that has no header, because its first record would be read as headers", () => {
    expect(errorOf("a@b.in,EN001,Asha,Rao,CE\nc@d.in,EN002,Ravi,Iyer,CE", "students")).toContain("Missing required columns");
  });

  it("matches columns by header name, in any order, in any case", () => {
    const [row] = rowsOf("Last Name,EMAIL,Department_Code,first_name,Enrollment_Number\nRao,a@b.in,CE,Asha,EN001", "students");

    expect(row.values).toMatchObject({ email: "a@b.in", enrollment_number: "EN001", first_name: "Asha", last_name: "Rao", department_code: "CE" });
    expect(row.error).toBeUndefined();
  });

  it("accepts the other spellings people use for a header", () => {
    const [row] = rowsOf("E-mail,Enrollment No.,First,Surname,Dept,DOB,Mobile,Sex\na@b.in,EN001,Asha,Rao,CE,31/12/2005,98765,female", "students");

    expect(row.values).toMatchObject({ enrollment_number: "EN001", last_name: "Rao", department_code: "CE", phone: "98765" });
    expect(row.error).toBeUndefined();
  });

  it("reports the columns it does not use instead of dropping them silently", () => {
    const result = parseBulkCsvContent(`${STUDENT_HEADER},Roll Number,Remarks\na@b.in,EN001,Asha,Rao,CE,7,fine`, "students");

    expect("rows" in result && result.ignoredColumns).toEqual(["Roll Number", "Remarks"]);
  });

  it("ignores a column that appears twice after the first", () => {
    const result = parseBulkCsvContent(`${STUDENT_HEADER},email\na@b.in,EN001,Asha,Rao,CE,other@b.in`, "students");

    expect("rows" in result && result.rows[0].values.email).toBe("a@b.in");
    expect("rows" in result && result.ignoredColumns).toEqual(["email"]);
  });

  it("numbers the rows from 1 and gives each its own id", () => {
    const rows = rowsOf(`${STUDENT_HEADER}\na@b.in,EN001,A,R,CE\nb@b.in,EN002,B,R,CE`, "students");

    expect(rows.map((row) => row.number)).toEqual([1, 2]);
    expect(new Set(rows.map((row) => row.id)).size).toBe(2);
  });

  it("handles Windows line endings, blank lines, a byte order mark and quoted cells", () => {
    const rows = rowsOf(`﻿${STUDENT_HEADER}\r\n\r\n "a@b.in" , "EN001" , Asha , Rao , CE \r\n`, "students");

    expect(rows[0].values).toMatchObject({ email: "a@b.in", enrollment_number: "EN001", first_name: "Asha" });
  });

  it("keeps a comma inside a quoted cell", () => {
    const [row] = rowsOf('name,code\n"Civil, Structural",CE', "departments");

    expect(row.values.name).toBe("Civil, Structural");
  });
});

describe("a row's cells", () => {
  it("never drops a row that is missing cells; it flags it", () => {
    expect(rowsOf(`${STUDENT_HEADER}\na@b.in,EN001`, "students")[0].error).toBe("First name is required");
  });

  it("lowercases the email, and trims every cell", () => {
    const [row] = rowsOf(`${STUDENT_HEADER}\n  Asha@College.IN ,  EN001  , Asha ,Rao,CE`, "students");

    expect(row.values).toMatchObject({ email: "asha@college.in", enrollment_number: "EN001", first_name: "Asha" });
  });

  it.each([
    ["not-an-email,EN001,Asha,Rao,CE", "Email is not a valid address"],
    ["a@b.in,E1,Asha,Rao,CE", "Enrollment number is too short (min 3 characters)"],
    [`a@b.in,${"E".repeat(31)},Asha,Rao,CE`, "Enrollment number is too long (max 30 characters)"],
    ["a@b.in,EN001,,Rao,CE", "First name is required"],
    ["a@b.in,EN001,Asha,,CE", "Last name is required"],
    ["a@b.in,EN001,Asha,Rao,", "Department is required"],
    [`a@b.in,EN001,${"A".repeat(101)},Rao,CE`, "First name is too long (max 100 characters)"],
  ])("flags the student row %j", (cells, reason) => {
    expect(studentProblem(cells)).toBe(reason);
  });

  it("reads gender words and codes as M, F or O and refuses anything else", () => {
    const header = `${STUDENT_HEADER},gender`;
    const genders = ["Male", "female", "O", "other", "m"].map((g) => rowsOf(`${header}\na@b.in,EN001,A,R,CE,${g}`, "students")[0].values.gender);

    expect(genders).toEqual(["M", "F", "O", "O", "M"]);
    expect(rowsOf(`${header}\na@b.in,EN001,A,R,CE,X`, "students")[0].error).toBe("Gender must be M, F or O");
  });

  it("reads a day-first date as an ISO date and refuses impossible or future ones", () => {
    const header = `${STUDENT_HEADER},date_of_birth`;
    const dob = (value: string) => rowsOf(`${header}\na@b.in,EN001,A,R,CE,${value}`, "students")[0];

    expect(dob("31/12/2005").values.date_of_birth).toBe("2005-12-31");
    expect(dob("5-4-2006").values.date_of_birth).toBe("2006-04-05");
    expect(dob("2005-12-31").error).toBeUndefined();
    expect(dob("31/02/2005").error).toBe("Date of birth is not a real date");
    expect(dob("12 March 2005").error).toBe("Date of birth must be YYYY-MM-DD or DD/MM/YYYY");
    expect(dob("2999-01-01").error).toBe("Date of birth is in the future");
  });

  it("needs a department for a student but not for a teacher", () => {
    const teacher = rowsOf("email,employee_id,first_name,last_name\na@b.in,EMP01,Ravi,Iyer", "teachers")[0];

    expect(studentProblem("a@b.in,EN001,Asha,Rao,")).toBe("Department is required");
    expect(teacher.error).toBeUndefined();
  });
});

describe("a name or code that appears twice in the file", () => {
  it("flags the later student row and names the earlier one", () => {
    const rows = rowsOf(`${STUDENT_HEADER}\na@b.in,EN001,A,R,CE\nb@b.in,EN001,B,R,CE\nA@B.IN,EN003,C,R,CE`, "students");

    expect(rows.map((row) => row.error)).toEqual([undefined, "Same enrollment number as row 1", "Same email as row 1"]);
  });

  it("does not let a row that cannot be imported claim a name", () => {
    const rows = rowsOf(`${STUDENT_HEADER}\na@b.in,EN001,,R,CE\nb@b.in,EN001,B,R,CE`, "students");

    expect(rows.map((row) => row.error)).toEqual(["First name is required", undefined]);
  });

  it("compares codes without regard to case", () => {
    const rows = rowsOf("name,code\nCivil,CE\nCivil again,ce", "departments");

    expect(rows[1].error).toBe("Same department code as row 1");
  });

  it("compares a classroom by its name, without regard to case", () => {
    const rows = rowsOf("name\nRoom 1\nRoom 2\nroom 1", "classrooms");

    expect(rows.map((row) => row.error)).toEqual([undefined, undefined, "Same classroom name as row 1"]);
  });
});

describe("each import", () => {
  it("reads teachers: department and designation are optional", () => {
    const [row] = rowsOf(
      "email,employee_id,first_name,last_name,department_code,designation_code,name_initials,phone\na@b.in,EMP01,Ravi,Iyer,CE,PROF,rai,9123456780",
      "teachers",
    );

    expect(row.values).toMatchObject({ department_code: "CE", designation_code: "PROF", name_initials: "rai", phone: "9123456780" });
    expect(row.error).toBeUndefined();
  });

  it("reads departments: name and code", () => {
    const [row] = rowsOf("name,code\nComputer Engineering,CE", "departments");

    expect(row.values).toEqual({ name: "Computer Engineering", code: "CE" });
  });

  it("reports the head and description columns of an older file as ignored", () => {
    const result = parseBulkCsvContent("name,code,head,description\nComputer Engineering,CE,Dr. Mehta,Core branch", "departments");

    expect("rows" in result && result.rows[0].values).toEqual({ name: "Computer Engineering", code: "CE" });
    expect("rows" in result && result.ignoredColumns).toEqual(["head", "description"]);
  });

  it("flags a department with a one-letter code or name", () => {
    expect(rowsOf("name,code\nComputer Engineering,C", "departments")[0].error).toBe("Department code is too short (min 2 characters)");
    expect(rowsOf("name,code\nC,CE", "departments")[0].error).toBe("Department name is too short (min 2 characters)");
  });

  it("reads a subject with its department", () => {
    const [row] = rowsOf("name,code,department_code\nMathematics,MA101,CE", "subjects");

    expect(row.values).toEqual({ name: "Mathematics", code: "MA101", department_code: "CE" });
  });

  it("reads classrooms: a name is all there is", () => {
    const rows = rowsOf("name\nRoom 101\nSeminar hall", "classrooms");

    expect(rows.map((row) => row.values)).toEqual([{ name: "Room 101" }, { name: "Seminar hall" }]);
    expect(rows.every((row) => !row.error)).toBe(true);
  });

  it("reads designations", () => {
    expect(rowsOf("name,code\nLecturer,LEC", "designations")[0].values).toEqual({ name: "Lecturer", code: "LEC" });
  });
});
