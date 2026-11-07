import type { InternalAxiosRequestConfig } from "axios";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SWRConfig } from "swr";
import { swrDefaults } from "@/lib/api/swr";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { toast } = vi.hoisted(() => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("react-hot-toast", () => ({ default: toast }));

import TeacherProfilePage from "@/app/(dashboard)/teacher/profile/page";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { makeUser } from "../helpers";

const TEACHER = makeUser({ email: "teacher@college.in", role: "TEACHER" });
let requests: { method?: string; url?: string; data?: string }[] = [];

function installServer(): void {
  api.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
    requests.push({ method: config.method, url: config.url, data: config.data });
    const respond = (data: unknown) => ({ data, status: 200, statusText: "", headers: {}, config });
    if (config.url === "/auth/me") return respond(TEACHER);
    if (config.url === "/auth/forgot-password") return respond({ message: "sent" });
    throw new Error(`unexpected request ${config.url}`);
  };
}

function renderPage(): void {
  render(
    <SWRConfig value={{ ...swrDefaults, provider: () => new Map(), dedupingInterval: 0 }}>
      <TeacherProfilePage />
    </SWRConfig>,
  );
}

beforeEach(() => {
  requests = [];
  toast.success.mockReset();
  toast.error.mockReset();
  useAuthStore.getState().login("teacher-token", TEACHER);
  installServer();
});

afterEach(() => {
  useAuthStore.getState().logout();
});

describe("teacher profile password section", () => {
  it("no longer asks for the current or new password on the page", async () => {
    renderPage();
    await screen.findByText("Email me a password change link");

    expect(screen.queryByLabelText("Current Password")).toBeNull();
    expect(screen.queryByLabelText("New Password")).toBeNull();
    expect(document.querySelector("input[type=password]")).toBeNull();
  });

  it("emails a change link to the signed-in teacher's own address", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Email me a password change link" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    const sent = requests.find((request) => request.url === "/auth/forgot-password");
    expect(sent?.method).toBe("post");
    expect(JSON.parse(sent?.data ?? "{}")).toEqual({ email: "teacher@college.in" });
  });
});
