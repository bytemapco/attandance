import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ScheduleField from "@/components/announcements/ScheduleField";
import BroadcastHistoryTable from "@/components/super-admin/BroadcastHistoryTable";
import type { BroadcastHistoryItem } from "@/types/tenant";

const { getBroadcasts } = vi.hoisted(() => ({ getBroadcasts: vi.fn() }));

vi.mock("@/services/superAdminService", () => ({ superAdminService: { getBroadcasts } }));

describe("the schedule field", () => {
  it("starts on send now, with no time to pick", () => {
    render(<ScheduleField onChange={() => undefined} />);
    expect(screen.getByRole("button", { name: "Send now" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByLabelText("Send at")).toBeNull();
  });

  it("choosing later suggests a time and shows the picker", () => {
    const onChange = vi.fn();
    render(<ScheduleField onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Schedule for later" }));

    const suggested = new Date(onChange.mock.calls[0][0] as string);
    expect(suggested.getTime()).toBeGreaterThan(Date.now());
    expect([suggested.getMinutes(), suggested.getSeconds()]).toEqual([0, 0]); // a whole hour on the person's own clock
  });

  it("shows the chosen time and reports a changed one as a moment in UTC", () => {
    const onChange = vi.fn();
    const chosen = new Date(2030, 0, 15, 18, 30);
    render(<ScheduleField value={chosen.toISOString()} onChange={onChange} />);

    const picker = screen.getByLabelText("Send at") as HTMLInputElement;
    expect(picker.value).toBe("2030-01-15T18:30");

    fireEvent.change(picker, { target: { value: "2030-01-16T08:00" } });
    expect(onChange).toHaveBeenCalledWith(new Date(2030, 0, 16, 8, 0).toISOString());
  });

  it("send now clears the time", () => {
    const onChange = vi.fn();
    render(<ScheduleField value={new Date(2030, 0, 15, 18, 30).toISOString()} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Send now" }));

    expect(onChange).toHaveBeenCalledWith(undefined);
  });
});

describe("the platform announcement history", () => {
  function row(overrides: Partial<BroadcastHistoryItem> = {}): BroadcastHistoryItem {
    return {
      id: "h1", publish_at: "2026-11-08T06:00:00Z", title: "Maintenance", message: "Down at ten", type: "warning",
      audience: "ADMIN", tenant_name: null, sender: "owner.platform@example.com", audience_count: 14, status: "sent", ...overrides,
    };
  }

  it("shows the audience, the institution, how many people and who sent it", async () => {
    getBroadcasts.mockResolvedValue({ items: [row()], total_items: 1, page: 1, page_size: 15, total_pages: 1 });
    render(<BroadcastHistoryTable />);

    expect(await screen.findByText("Maintenance")).toBeInTheDocument();
    expect(screen.getByText("Institution admins · All institutions")).toBeInTheDocument();
    expect(screen.getByText("14 people")).toBeInTheDocument();
    expect(screen.getByText("Owner")).toBeInTheDocument();
    expect(screen.queryByText("Scheduled")).toBeNull();
  });

  it("marks one that has not been shown yet as scheduled, and names the institution", async () => {
    getBroadcasts.mockResolvedValue({ items: [row({ status: "scheduled", tenant_name: "Oxford College", audience: "STUDENT" })], total_items: 1, page: 1, page_size: 15, total_pages: 1 });
    render(<BroadcastHistoryTable />);

    expect(await screen.findByText("Scheduled")).toBeInTheDocument();
    expect(screen.getByText("Students · Oxford College")).toBeInTheDocument();
  });
});
