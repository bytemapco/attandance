import { ParsedBulkRecord, BulkImportEntityType } from "./bulkTypes";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseBulkCsvContent(
  content: string,
  entityType: BulkImportEntityType,
  onError: (msg: string) => void
): ParsedBulkRecord[] | null {
  const rawLines = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (rawLines.length < 2) {
    onError("The CSV file must contain a header row and at least 1 record row.");
    return null;
  }

  const records: ParsedBulkRecord[] = [];

  for (let i = 1; i < rawLines.length; i++) {
    const parts = rawLines[i].split(",").map((p) => p.trim().replace(/^["']|["']$/g, ""));
    if (parts.length < 2) continue;

    if (entityType === "departments") {
      const name = parts[0] || "";
      const code = parts[1] || "";
      const head = parts[2] || "";
      const description = parts[3] || "";
      const hasName = name.length >= 2;
      const hasCode = code.length >= 2;
      const isValid = hasName && hasCode;
      let validationError: string | undefined;
      if (!hasName) validationError = "Department name is required (min 2 characters)";
      else if (!hasCode) validationError = "Department code is required (min 2 characters)";

      records.push({
        id: `row-${i}-${Date.now()}`,
        email: description,
        identifier: code,
        first_name: name,
        last_name: head,
        isValid,
        validationError,
      });
    } else if (entityType === "subjects") {
      const name = parts[0] || "";
      const code = parts[1] || "";
      const description = parts[2] || "";
      const hasName = name.length >= 2;
      const hasCode = code.length >= 2;
      const isValid = hasName && hasCode;
      let validationError: string | undefined;
      if (!hasName) validationError = "Subject name is required (min 2 characters)";
      else if (!hasCode) validationError = "Subject code is required (min 2 characters)";

      records.push({
        id: `row-${i}-${Date.now()}`,
        email: description,
        identifier: code,
        first_name: name,
        last_name: "",
        isValid,
        validationError,
      });
    } else if (entityType === "classrooms") {
      const name = parts[0] || "";
      const building = parts[1] || "";
      const hasName = name.length >= 1;
      const isValid = hasName;
      let validationError: string | undefined;
      if (!hasName) validationError = "Classroom name / room number is required";

      records.push({
        id: `row-${i}-${Date.now()}`,
        email: "",
        identifier: building,
        first_name: name,
        last_name: "",
        isValid,
        validationError,
      });
    } else if (entityType === "designations") {
      const name = parts[0] || "";
      const code = parts[1] || "";
      const description = parts[2] || "";
      const hasName = name.length >= 2;
      const hasCode = code.length >= 2;
      const isValid = hasName && hasCode;
      let validationError: string | undefined;
      if (!hasName) validationError = "Designation title is required (min 2 characters)";
      else if (!hasCode) validationError = "Designation code is required (min 2 characters)";

      records.push({
        id: `row-${i}-${Date.now()}`,
        email: description,
        identifier: code,
        first_name: name,
        last_name: "",
        isValid,
        validationError,
      });
    } else if (entityType === "classes") {
      const name = parts[0] || "";
      const subjectCode = parts[1] || "";
      const teacherEmail = parts[2] || "";
      const classroomName = parts[3] || "";
      const semester = parts[4] ? parseInt(parts[4], 10) : undefined;
      const batch = parts[5] || undefined;
      const isValidEmail = emailRegex.test(teacherEmail);
      const hasName = name.length >= 2;
      const hasSubject = subjectCode.length >= 1;
      const isValid = isValidEmail && hasName && hasSubject;

      let validationError: string | undefined;
      if (!hasName) validationError = "Class name is required (min 2 characters)";
      else if (!hasSubject) validationError = "Subject code is required";
      else if (!isValidEmail) validationError = "A valid teacher email address is required";

      records.push({
        id: `row-${i}-${Date.now()}`,
        email: teacherEmail,
        identifier: subjectCode,
        first_name: name,
        last_name: classroomName,
        semester,
        batch,
        isValid,
        validationError,
      });
    } else {
      if (parts.length < 4) continue;
      const email = parts[0] || "";
      const identifier = parts[1] || "";
      const firstName = parts[2] || "";
      const lastName = parts[3] || "";
      const isValidEmail = emailRegex.test(email);
      const hasIdentifier = identifier.length >= 3;
      const isValid = isValidEmail && hasIdentifier && firstName.length > 0;

      let validationError: string | undefined;
      if (!isValidEmail) validationError = "Invalid email format";
      else if (!hasIdentifier) validationError = "ID too short (min 3 characters)";
      else if (!firstName) validationError = "First name is required";

      records.push({
        id: `row-${i}-${Date.now()}`,
        email,
        identifier,
        first_name: firstName,
        last_name: lastName,
        isValid,
        validationError,
      });
    }
  }

  if (records.length === 0) {
    onError("No valid records found in the uploaded file. Please check your headers and column format.");
    return null;
  }

  return records;
}
