/** College/University defaults. Everything here is editable by the admin before it is saved. */

export interface PresetItem {
  name: string;
  code: string;
}

export const COLLEGE_DEPARTMENTS: PresetItem[] = [
  { name: "Computer Science and Engineering", code: "CSE" },
  { name: "Information Technology", code: "IT" },
  { name: "Electronics and Communication Engineering", code: "ECE" },
  { name: "Electrical Engineering", code: "EE" },
  { name: "Mechanical Engineering", code: "ME" },
  { name: "Civil Engineering", code: "CE" },
  { name: "Chemical Engineering", code: "CHE" },
  { name: "Biotechnology", code: "BT" },
  { name: "Artificial Intelligence and Data Science", code: "AIDS" },
  { name: "Artificial Intelligence and Machine Learning", code: "AIML" },
  { name: "Data Science", code: "DS" },
];

export const COLLEGE_DESIGNATIONS: PresetItem[] = [
  { name: "Professor", code: "PROF" },
  { name: "Associate Professor", code: "ASSOC" },
  { name: "Assistant Professor", code: "ASST" },
  { name: "Lecturer", code: "LECT" },
  { name: "Head of Department", code: "HOD" },
  { name: "Dean", code: "DEAN" },
  { name: "Principal", code: "PRIN" },
  { name: "Lab Assistant", code: "LA" },
];

export const COLLEGE_SUBJECTS: PresetItem[] = [
  { name: "Data Structures and Algorithms", code: "CS102" },
  { name: "Database Management Systems", code: "CS201" },
  { name: "Operating Systems", code: "CS202" },
  { name: "Computer Networks", code: "CS203" },
  { name: "Engineering Mathematics", code: "MATH101" },
  { name: "Engineering Physics", code: "PHY101" },
  { name: "Engineering Chemistry", code: "CHEM101" },
  { name: "Basic Electrical Engineering", code: "EE101" },
];

export const COLLEGE_CLASSROOMS: PresetItem[] = [
  { name: "Seminar Hall", code: "SH" },
  { name: "Auditorium", code: "AUD" },
  { name: "Computer Lab 1", code: "CL1" },
  { name: "Computer Lab 2", code: "CL2" },
  { name: "Physics Lab", code: "PL" },
  { name: "Chemistry Lab", code: "CLAB" },
  { name: "Conference Room", code: "CR" },
  { name: "Library Hall", code: "LIB" },
];

/** A short unique-looking code from a name, such as "Database Management" to "DM". */
export function suggestCode(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  const letters = words.length === 1 ? words[0].slice(0, 4) : words.map((w) => w[0]).join("");
  return letters.toUpperCase().slice(0, 8);
}
