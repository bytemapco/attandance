import { BULK_ENTITIES, BulkColumn } from "./bulkColumns";
import { parseCsv } from "./csv";
import { BulkImportEntityType, BulkRow } from "./bulkTypes";
import { firstProblem, flagRepeats } from "./validateBulkRow";

export type ParseResult = { rows: BulkRow[]; ignoredColumns: string[] } | { error: string };

interface HeaderLayout {
  positions: Map<string, number>;
  ignored: string[];
}

function headerName(header: string): string {
  return header.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function findColumn(columns: BulkColumn[], header: string): BulkColumn | undefined {
  const name = headerName(header);
  return columns.find((column) => column.key === name || column.field === name || column.aliases.includes(name));
}

/** Where each known column sits in the file, by header name, whatever the order. Other headers are ignored. */
function readHeader(headers: string[], columns: BulkColumn[]): HeaderLayout {
  const positions = new Map<string, number>();
  const ignored: string[] = [];
  headers.forEach((header, index) => {
    const column = findColumn(columns, header);
    if (column && !positions.has(column.key)) positions.set(column.key, index);
    else if (header.trim()) ignored.push(header.trim());
  });
  return { positions, ignored };
}

function readRow(columns: BulkColumn[], positions: Map<string, number>, cells: string[], number: number): BulkRow {
  const values: Record<string, string> = {};
  for (const column of columns) {
    const index = positions.get(column.key);
    const cell = index === undefined ? "" : (cells[index] ?? "").trim();
    values[column.key] = cell && column.normalize ? column.normalize(cell) : cell;
  }
  return { id: `row-${number}`, number, values, error: firstProblem(columns, values) };
}

export function parseBulkCsvContent(content: string, entityType: BulkImportEntityType): ParseResult {
  const table = parseCsv(content);
  if (table.length < 2) return { error: "The CSV file must contain a header row and at least 1 record row." };

  const entity = BULK_ENTITIES[entityType];
  const { positions, ignored } = readHeader(table[0], entity.columns);
  const missing = entity.columns.filter((column) => column.required && !positions.has(column.key));
  if (missing.length > 0) {
    const names = missing.map((column) => column.key).join(", ");
    return { error: `Missing required column${missing.length > 1 ? "s" : ""}: ${names}. Download the sample file to see the format.` };
  }

  const rows = table.slice(1).map((cells, index) => readRow(entity.columns, positions, cells, index + 1));
  return { rows: flagRepeats(rows, entity), ignoredColumns: ignored };
}
