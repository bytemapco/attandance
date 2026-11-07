import { BULK_ENTITIES } from "./bulkColumns";
import { BatchProgressItem, BulkImportEntityType, BulkRow } from "./bulkTypes";

const BULK_BATCH_SIZE = 10;

export function buildBatches(list: BulkRow[], batchSize = BULK_BATCH_SIZE): BatchProgressItem[] {
  const total = Math.ceil(list.length / batchSize);
  return Array.from({ length: total }, (_, i) => ({
    batchNumber: i + 1,
    totalBatches: total,
    startIndex: i * batchSize,
    endIndex: Math.min((i + 1) * batchSize, list.length),
    status: "queued",
    importedCount: 0,
    failedCount: 0,
    invitationsSent: 0,
    errorMessages: [],
  }));
}

/** The request for one batch of rows. A blank cell is left out, so the server sees it as not given. */
export function buildBulkPayload(
  entityType: BulkImportEntityType,
  slice: BulkRow[],
  sendInvite: boolean
): { endpoint: string; payload: Record<string, unknown> } {
  const entity = BULK_ENTITIES[entityType];
  const rows = slice.map((row) =>
    Object.fromEntries(
      entity.columns.filter((column) => row.values[column.key]).map((column) => [column.field, row.values[column.key]])
    )
  );
  return {
    endpoint: entity.endpoint,
    payload: { [entity.rowsKey]: rows, ...(entity.invites ? { send_invite: sendInvite } : {}) },
  };
}
