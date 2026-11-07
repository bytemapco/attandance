const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DAY_FIRST_DATE = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const GENDERS: Record<string, string> = { m: "M", male: "M", f: "F", female: "F", o: "O", other: "O" };

export function lowerCase(value: string): string {
  return value.toLowerCase();
}

export function checkEmail(value: string): string | null {
  return EMAIL.test(value) ? null : "Email is not a valid address";
}

export function normalizeGender(value: string): string {
  return GENDERS[value.toLowerCase()] ?? value;
}

export function checkGender(value: string): string | null {
  return ["M", "F", "O"].includes(value) ? null : "Gender must be M, F or O";
}

/** Indian files write the day first (31/12/2005); the server wants 2005-12-31. */
export function normalizeDate(value: string): string {
  const match = DAY_FIRST_DATE.exec(value);
  if (!match) return value;
  const [, day, month, year] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

export function checkBirthDate(value: string): string | null {
  const match = ISO_DATE.exec(value);
  if (!match) return "Date of birth must be YYYY-MM-DD or DD/MM/YYYY";
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const isReal = date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  if (!isReal) return "Date of birth is not a real date";
  return date.getTime() > Date.now() ? "Date of birth is in the future" : null;
}
