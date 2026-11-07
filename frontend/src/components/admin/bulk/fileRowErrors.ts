import { BulkRow } from "./bulkTypes";
import { humanizeImportError } from "./humanizeImportError";

const ROW_PREFIX = /^Row (\d+): /;

/**
 * The server numbers rows by their place in one request. The admin knows them by their place in the file,
 * so each "Row n:" is rewritten to the file's row number.
 */
export function fileRowErrors(slice: BulkRow[], errors: string[]): string[] {
  return errors.map((line) =>
    humanizeImportError(line).replace(ROW_PREFIX, (_, n: string) => `Row ${slice[Number(n) - 1]?.number ?? n}: `)
  );
}
