export function humanizeImportError(errorMsg: string): string {
  if (!errorMsg) return "Unknown error";

  // Clean up Pydantic validation paths like "teachers.0.department_id: Field required"
  const pydanticMatch = errorMsg.match(
    /^(?:teachers|students|departments|subjects|classrooms|designations)\.(\d+)\.([a-zA-Z_]+):\s*(.*)$/i
  );
  if (pydanticMatch) {
    const rowNum = parseInt(pydanticMatch[1], 10) + 1;
    const fieldRaw = pydanticMatch[2];
    const reason = pydanticMatch[3];

    const fieldMap: Record<string, string> = {
      email: "Email address",
      employee_id: "Employee ID",
      enrollment_number: "Enrollment number",
      first_name: "First name",
      last_name: "Last name",
      department_id: "Department",
      designation_id: "Designation",
      subject_code: "Subject code",
      teacher_email: "Teacher email",
      classroom_name: "Classroom",
      name: "Name",
      code: "Code",
      capacity: "Capacity",
    };

    const cleanField = fieldMap[fieldRaw] || fieldRaw.replace(/_/g, " ");
    if (reason.toLowerCase().includes("field required") || reason.toLowerCase().includes("missing")) {
      return `Row ${rowNum}: ${cleanField} is required`;
    }
    return `Row ${rowNum}: ${cleanField} — ${reason}`;
  }

  return errorMsg;
}
