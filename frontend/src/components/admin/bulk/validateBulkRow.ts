import { BulkColumn, BulkEntity } from "./bulkColumns";
import { BulkRow } from "./bulkTypes";

/** The first thing wrong with a row's cells, or undefined. These are the rules the server checks again. */
export function firstProblem(columns: BulkColumn[], values: Record<string, string>): string | undefined {
  for (const column of columns) {
    const value = values[column.key];
    if (!value) {
      if (column.required) return `${column.label} is required`;
      continue;
    }
    if (column.min !== undefined && value.length < column.min) {
      return `${column.label} is too short (min ${column.min} characters)`;
    }
    if (column.max !== undefined && value.length > column.max) {
      return `${column.label} is too long (max ${column.max} characters)`;
    }
    const problem = column.check?.(value);
    if (problem) return problem;
  }
  return undefined;
}

function identity(row: BulkRow, group: string[]): string | null {
  const parts = group.map((key) => (row.values[key] ?? "").toLowerCase());
  return parts.every((part) => part === "") ? null : `${group.join("+")}=${parts.join("|")}`;
}

/** Marks a row that repeats an email, ID or code of an earlier row that can be imported, naming that row. */
export function flagRepeats(rows: BulkRow[], entity: BulkEntity): BulkRow[] {
  const labels = new Map(entity.columns.map((column) => [column.key, column.label.toLowerCase()]));
  const firstSeen = new Map<string, number>();

  return rows.map((row) => {
    if (row.error) return row;
    const identities = entity.unique.flatMap((group) => {
      const id = identity(row, group);
      return id ? [{ id, group }] : [];
    });
    const repeat = identities.find(({ id }) => firstSeen.has(id));
    if (repeat) {
      const what = repeat.group.map((key) => labels.get(key)).join(" and ");
      return { ...row, error: `Same ${what} as row ${firstSeen.get(repeat.id)}` };
    }
    identities.forEach(({ id }) => firstSeen.set(id, row.number));
    return row;
  });
}
