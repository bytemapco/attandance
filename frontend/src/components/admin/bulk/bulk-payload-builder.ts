import { ParsedBulkRecord, BatchProgressItem, BulkImportEntityType } from "./bulk-types";

export const BULK_BATCH_SIZE = 10;

export function buildBatches(list: ParsedBulkRecord[], batchSize = BULK_BATCH_SIZE): BatchProgressItem[] {
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

export function buildBulkPayload(
  entityType: BulkImportEntityType,
  slice: ParsedBulkRecord[],
  sendInvite: boolean
): { endpoint: string; payload: Record<string, unknown> } {
  if (entityType === "students") {
    return {
      endpoint: "/admin/users/students/bulk",
      payload: {
        students: slice.map((s) => ({
          email: s.email,
          enrollment_number: s.identifier,
          first_name: s.first_name,
          last_name: s.last_name,
        })),
        send_invite: sendInvite,
      },
    };
  }

  if (entityType === "teachers") {
    return {
      endpoint: "/admin/users/teachers/bulk",
      payload: {
        teachers: slice.map((t) => ({
          email: t.email,
          employee_id: t.identifier,
          first_name: t.first_name,
          last_name: t.last_name,
        })),
        send_invite: sendInvite,
      },
    };
  }

  if (entityType === "departments") {
    return {
      endpoint: "/admin/departments/bulk",
      payload: {
        departments: slice.map((d) => ({
          name: d.first_name,
          code: d.identifier,
          head: d.last_name || null,
          description: d.email || null,
        })),
      },
    };
  }

  if (entityType === "subjects") {
    return {
      endpoint: "/admin/subjects/bulk",
      payload: {
        subjects: slice.map((s) => ({
          name: s.first_name,
          code: s.identifier,
          description: s.email || null,
        })),
      },
    };
  }

  if (entityType === "classrooms") {
    return {
      endpoint: "/admin/classrooms/bulk",
      payload: {
        classrooms: slice.map((c) => ({
          name: c.first_name,
          building: c.identifier || null,
        })),
      },
    };
  }

  if (entityType === "designations") {
    return {
      endpoint: "/admin/designations/bulk",
      payload: {
        designations: slice.map((d) => ({
          name: d.first_name,
          code: d.identifier,
          description: d.email || null,
        })),
      },
    };
  }

  return {
    endpoint: "/admin/classes/bulk",
    payload: {
      classes: slice.map((c) => ({
        name: c.first_name,
        subject_code: c.identifier,
        teacher_email: c.email,
        classroom_name: c.last_name || undefined,
        semester: c.semester,
        batch: c.batch,
      })),
    },
  };
}
