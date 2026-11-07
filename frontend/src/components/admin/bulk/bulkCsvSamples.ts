import { BULK_ENTITIES } from "./bulkColumns";
import { toCsv } from "./csv";
import { BulkImportEntityType } from "./bulkTypes";

type SampleRow = Record<string, string>;

const SAMPLE_ROWS: Record<BulkImportEntityType, SampleRow[]> = {
  students: [
    {
      email: "alex.carter@example.com", enrollment_number: "STU2026001", first_name: "Alex", last_name: "Carter",
      department_code: "CSE", batch_code: "CSE-A-1", gender: "M", phone: "9876543210", date_of_birth: "2006-04-12",
    },
    {
      email: "brooke.hayes@example.com", enrollment_number: "STU2026002", first_name: "Brooke", last_name: "Hayes",
      department_code: "CSE", batch_code: "CSE-A-1", gender: "F", phone: "9876543211", date_of_birth: "2006-08-30",
    },
    {
      email: "connor.reed@example.com", enrollment_number: "STU2026003", first_name: "Connor", last_name: "Reed",
      department_code: "CSE", batch_code: "CSE-A-2", gender: "O", phone: "", date_of_birth: "",
    },
  ],
  teachers: [
    {
      email: "alan.turing@example.com", employee_id: "FAC2026001", first_name: "Alan", last_name: "Turing",
      department_code: "CSE", designation_code: "PROF", name_initials: "amt", phone: "9123456780",
    },
    {
      email: "ada.lovelace@example.com", employee_id: "FAC2026002", first_name: "Ada", last_name: "Lovelace",
      department_code: "IT", designation_code: "ASSOC_PROF", name_initials: "anl", phone: "",
    },
    {
      email: "grace.hopper@example.com", employee_id: "FAC2026003", first_name: "Grace", last_name: "Hopper",
      department_code: "CSE", designation_code: "ASST_PROF", name_initials: "gmh", phone: "",
    },
  ],
  departments: [
    { name: "Computer Science & Engineering", code: "CSE" },
    { name: "Electronics & Communication", code: "ECE" },
    { name: "Mechanical Engineering", code: "MECH" },
  ],
  subjects: [
    { name: "Data Structures & Algorithms", code: "CS201", department_code: "CSE" },
    { name: "Database Management Systems", code: "CS301", department_code: "CSE" },
    { name: "Digital Communication", code: "EC201", department_code: "ECE" },
  ],
  classrooms: [{ name: "Room 101" }, { name: "CS Lab 204" }, { name: "Main Auditorium" }],
  designations: [
    { name: "Assistant Professor", code: "ASST_PROF" },
    { name: "Associate Professor", code: "ASSOC_PROF" },
    { name: "Professor", code: "PROF" },
  ],
};

export function getSampleCsv(entityType: BulkImportEntityType): string {
  const keys = BULK_ENTITIES[entityType].columns.map((column) => column.key);
  return toCsv([keys, ...SAMPLE_ROWS[entityType].map((row) => keys.map((key) => row[key] ?? ""))]);
}
