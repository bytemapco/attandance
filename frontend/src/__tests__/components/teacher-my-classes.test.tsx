import type { InternalAxiosRequestConfig } from "axios";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SWRConfig } from "swr";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace: vi.fn() }) }));
vi.mock("react-hot-toast", () => ({ default: { success: vi.fn(), error: vi.fn() } }));

import MyClasses from "@/app/(dashboard)/teacher/dashboard/MyClasses";
import api from "@/lib/api";
import { swrDefaults } from "@/lib/api/swr";
import { todayIso } from "@/lib/teacher/weekDates";

const CLASSES = ["Maths", "Physics", "Chemistry"].map((name, index) => ({
  course_section_id: `s${index + 1}`, class_code: "CE-A", subject_name: name, subject_code: name.slice(0, 3), student_count: 30,
}));

let schedule: unknown[] = [];
let scheduleRequests: Record<string, string>[] = [];

function lesson(sectionId: string, start: string, end: string, status = "SCHEDULED"): unknown {
  return { id: `${sectionId}-${start}`, course_section_id: sectionId, status, start_time: start, end_time: end };
}

function installServer(): void {
  api.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
    const respond = (data: unknown) => ({ data, status: 200, statusText: "", headers: {}, config });
    if (config.url === "/faculty/classes") return respond(CLASSES);
    if (config.url === "/faculty/daily-schedule") {
      scheduleRequests.push(config.params);
      return respond(schedule);
    }
    throw new Error(`unexpected request ${config.url}`);
  };
}

function renderClasses(): void {
  render(
    <SWRConfig value={{ ...swrDefaults, provider: () => new Map(), dedupingInterval: 0 }}>
      <MyClasses refreshKey={0} />
    </SWRConfig>,
  );
}

beforeEach(() => {
  schedule = [lesson("s1", "09:00", "10:00"), lesson("s3", "11:00", "12:00", "CANCELLED")];
  scheduleRequests = [];
  installServer();
});

describe("the teacher's class list", () => {
  it("shows today's classes first, with when each meets", async () => {
    renderClasses();

    expect(await screen.findByText("Maths")).toBeTruthy();
    expect(screen.getByText("09:00–10:00")).toBeTruthy();
    expect(screen.queryByText("Physics")).toBeNull();
    expect(screen.queryByText("Chemistry")).toBeNull();
    expect(screen.getByRole("button", { name: "Today" }).getAttribute("aria-pressed")).toBe("true");
    expect(scheduleRequests[0]).toEqual({ target_date: todayIso(), end_date: todayIso() });
  });

  it("can switch to every class and back to today", async () => {
    renderClasses();
    await screen.findByText("Maths");

    fireEvent.click(screen.getByRole("button", { name: "All classes" }));
    expect(await screen.findByText("Physics")).toBeTruthy();
    expect(screen.getByText("Chemistry")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Today" }));
    await waitFor(() => expect(screen.queryByText("Physics")).toBeNull());
    expect(screen.getByText("Maths")).toBeTruthy();
  });

  it("says so when nothing is scheduled today and offers every class", async () => {
    schedule = [];
    renderClasses();

    expect(await screen.findByText("No classes today")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Show all classes" }));

    expect(await screen.findByText("Physics")).toBeTruthy();
  });
});
