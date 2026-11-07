import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AuditLogTable from "@/components/super-admin/AuditLogTable";
import type { SuperAdminAuditLog } from "@/types/tenant";

const longDescription = "Changed the minimum attendance from 75 to 80 for every class in the institution, reason: board decision of 7 November";

function log(overrides: Partial<SuperAdminAuditLog> = {}): SuperAdminAuditLog {
  return {
    id: "a1", event_type: "UPDATE_SYSTEM_CONFIG", severity: "WARNING", actor: "admin@example.edu",
    target: "SYSTEM_CONFIG", description: longDescription, timestamp: "2026-11-07T06:00:00Z",
    tenant_id: "t1", tenant_name: "Oxford", metadata: null, ...overrides,
  } as SuperAdminAuditLog;
}

describe("the audit log table", () => {
  it("has no severity column or badge", () => {
    render(<AuditLogTable logs={[log()]} loading={false} onSelectLog={() => undefined} />);
    expect(screen.queryByRole("columnheader", { name: "Severity" })).toBeNull();
    expect(screen.queryByText("WARNING")).toBeNull();
  });

  it("shows the whole description, not a cut-off one", () => {
    render(<AuditLogTable logs={[log()]} loading={false} onSelectLog={() => undefined} />);
    const text = screen.getByText(longDescription);
    expect(text.className).not.toContain("truncate");
  });
});
