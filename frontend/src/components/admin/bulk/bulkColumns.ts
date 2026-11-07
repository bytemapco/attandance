import { BulkImportEntityType } from "./bulkTypes";
import {
  checkBirthDate,
  checkEmail,
  checkGender,
  lowerCase,
  normalizeDate,
  normalizeGender,
} from "./bulkFieldRules";

/** One column of an import file. `key` is the header the sample uses, `field` the name the server takes. */
export interface BulkColumn {
  key: string;
  field: string;
  label: string;
  aliases: string[];
  required: boolean;
  min?: number;
  max?: number;
  normalize?: (value: string) => string;
  check?: (value: string) => string | null;
}

export interface BulkEntity {
  endpoint: string;
  rowsKey: string;
  columns: BulkColumn[];
  /** Columns that may not repeat in one file. A group of keys is compared together. */
  unique: string[][];
  /** Whether imported people get an invitation e-mail. */
  invites: boolean;
}

type ColumnOptions = Partial<Omit<BulkColumn, "key" | "label">>;

function column(key: string, label: string, options: ColumnOptions = {}): BulkColumn {
  return { key, field: key, label, aliases: [], required: false, ...options };
}

const email = column("email", "Email", {
  required: true,
  max: 254,
  aliases: ["email_address", "e_mail"],
  normalize: lowerCase,
  check: checkEmail,
});
const firstName = column("first_name", "First name", { required: true, max: 100, aliases: ["firstname", "first"] });
const lastName = column("last_name", "Last name", { required: true, max: 100, aliases: ["lastname", "surname", "last"] });
const phone = column("phone", "Phone", {
  max: 20,
  aliases: ["phone_number", "mobile", "mobile_number", "contact_number"],
});
function departmentColumn(required: boolean): BulkColumn {
  return column("department_code", "Department", {
    field: "department_id",
    required,
    max: 100,
    aliases: ["department", "department_id", "dept", "dept_code", "department_name"],
  });
}

function nameColumn(label: string, min: number): BulkColumn {
  return column("name", label, { required: true, min, max: 100, aliases: ["title"] });
}

function codeColumn(label: string): BulkColumn {
  return column("code", label, { required: true, min: 2, max: 20 });
}

export const BULK_ENTITIES: Record<BulkImportEntityType, BulkEntity> = {
  students: {
    endpoint: "/admin/users/students/bulk",
    rowsKey: "students",
    invites: true,
    unique: [["email"], ["enrollment_number"]],
    columns: [
      email,
      column("enrollment_number", "Enrollment number", {
        required: true,
        min: 3,
        max: 30,
        aliases: ["enrollment", "enrollment_no", "enrolment_number", "enrolment_no"],
      }),
      firstName,
      lastName,
      departmentColumn(true),
      column("batch_code", "Batch code", { max: 50, aliases: ["batch"] }),
      column("gender", "Gender", { aliases: ["sex"], normalize: normalizeGender, check: checkGender }),
      phone,
      column("date_of_birth", "Date of birth", {
        aliases: ["dob", "birth_date", "birthdate"],
        normalize: normalizeDate,
        check: checkBirthDate,
      }),
    ],
  },
  teachers: {
    endpoint: "/admin/users/teachers/bulk",
    rowsKey: "teachers",
    invites: true,
    unique: [["email"], ["employee_id"]],
    columns: [
      email,
      column("employee_id", "Employee ID", {
        required: true,
        min: 3,
        max: 30,
        aliases: ["employee", "employee_no", "employee_number", "emp_id", "staff_id"],
      }),
      firstName,
      lastName,
      departmentColumn(false),
      column("designation_code", "Designation", {
        field: "designation_id",
        max: 100,
        aliases: ["designation", "designation_id", "designation_name"],
      }),
      column("name_initials", "Initials", { max: 30, aliases: ["initials"] }),
      phone,
    ],
  },
  departments: {
    endpoint: "/admin/departments/bulk",
    rowsKey: "departments",
    invites: false,
    unique: [["code"]],
    columns: [nameColumn("Department name", 2), codeColumn("Department code")],
  },
  subjects: {
    endpoint: "/admin/subjects/bulk",
    rowsKey: "subjects",
    invites: false,
    unique: [["code"]],
    columns: [nameColumn("Subject name", 2), codeColumn("Subject code"), departmentColumn(false)],
  },
  classrooms: {
    endpoint: "/admin/classrooms/bulk",
    rowsKey: "classrooms",
    invites: false,
    unique: [["name"]],
    columns: [nameColumn("Classroom name", 1)],
  },
  designations: {
    endpoint: "/admin/designations/bulk",
    rowsKey: "designations",
    invites: false,
    unique: [["code"]],
    columns: [nameColumn("Designation title", 2), codeColumn("Designation code")],
  },
};
