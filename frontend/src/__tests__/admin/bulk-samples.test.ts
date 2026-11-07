import { describe, expect, it } from "vitest";
import { BULK_ENTITIES } from "@/components/admin/bulk/bulkColumns";
import { buildBulkPayload } from "@/components/admin/bulk/bulkPayloadBuilder";
import { getSampleCsv } from "@/components/admin/bulk/bulkCsvSamples";
import { parseBulkCsvContent } from "@/components/admin/bulk/parseBulkCsv";
import { parseCsv } from "@/components/admin/bulk/csv";
import type { BulkImportEntityType } from "@/components/admin/bulk/bulkTypes";

const ENTITIES = Object.keys(BULK_ENTITIES) as BulkImportEntityType[];

describe.each(ENTITIES)("the %s sample file", (type) => {
  const entity = BULK_ENTITIES[type];
  const csv = getSampleCsv(type);

  it("has a header for every column, in the order the guide lists them", () => {
    expect(parseCsv(csv)[0]).toEqual(entity.columns.map((column) => column.key));
  });

  it("imports cleanly: every row is valid, none repeats, no column is ignored", () => {
    const result = parseBulkCsvContent(csv, type);
    if ("error" in result) throw new Error(result.error);

    expect(result.rows).toHaveLength(3);
    expect(result.rows.map((row) => row.error)).toEqual([undefined, undefined, undefined]);
    expect(result.ignoredColumns).toEqual([]);
  });

  it("gives a value for every required column on every row", () => {
    const required = entity.columns.filter((column) => column.required).map((column) => column.key);
    const [header, ...records] = parseCsv(csv);

    for (const record of records) {
      for (const key of required) expect(record[header.indexOf(key)]).not.toBe("");
    }
  });

  it("builds a request that uses only fields the server knows", () => {
    const result = parseBulkCsvContent(csv, type);
    if ("error" in result) throw new Error(result.error);
    const { payload } = buildBulkPayload(type, result.rows, true);

    const fields = new Set(entity.columns.map((column) => column.field));
    for (const row of payload[entity.rowsKey] as Record<string, string>[]) {
      expect(Object.keys(row).every((key) => fields.has(key))).toBe(true);
    }
  });
});

describe("the column guide", () => {
  it("marks exactly the columns the server insists on as required", () => {
    const required = (type: BulkImportEntityType) => BULK_ENTITIES[type].columns.filter((c) => c.required).map((c) => c.field);

    expect(required("students")).toEqual(["email", "enrollment_number", "first_name", "last_name", "department_id"]);
    expect(required("teachers")).toEqual(["email", "employee_id", "first_name", "last_name"]);
    expect(required("departments")).toEqual(["name", "code"]);
    expect(required("subjects")).toEqual(["name", "code"]);
    expect(required("classrooms")).toEqual(["name"]);
    expect(required("designations")).toEqual(["name", "code"]);
  });
});
