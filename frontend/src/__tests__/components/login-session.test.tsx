import { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { push, toast } = vi.hoisted(() => ({ push: vi.fn(), toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace: vi.fn() }) }));
vi.mock("react-hot-toast", () => ({ default: toast }));

import LoginPage from "@/app/(auth)/login/page";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { makeUser } from "../helpers";

const SUPER_ADMIN = makeUser({ id: "owner", email: "owner@platform.in", role: "SUPER_ADMIN", tenant_id: null, tenant_slug: null });
const TEACHER = makeUser({ id: "teacher", email: "teacher@college.in", role: "TEACHER" });

/** A server that answers /auth/me with the profile of whoever the request's token belongs to. */
function installServer(): void {
  const owners: Record<string, ReturnType<typeof makeUser>> = {
    "Bearer owner-token": SUPER_ADMIN,
    "Bearer teacher-token": TEACHER,
  };
  api.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
    const respond = (data: unknown) => ({ data, status: 200, statusText: "", headers: {}, config });
    if (config.url === "/auth/login") return respond({ access_token: "teacher-token", must_change_password: false });
    const profile = owners[String(config.headers.Authorization)];
    if (config.url === "/auth/me" && profile) return respond(profile);
    throw new AxiosError("unauthorised", "ERR_BAD_REQUEST", config, null, { data: {}, status: 401, statusText: "", headers: {}, config });
  };
}

function signIn(): void {
  render(<LoginPage />);
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "teacher@college.in" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "Correct-Horse-9" } });
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
}

beforeEach(() => {
  push.mockReset();
  localStorage.clear();
  useAuthStore.getState().logout();
  installServer();
});

afterEach(() => {
  useAuthStore.getState().logout();
});

describe("signing in while another account is still signed in", () => {
  it("saves the new account's token together with the new account's profile", async () => {
    useAuthStore.getState().login("owner-token", SUPER_ADMIN);

    signIn();

    await waitFor(() => expect(push).toHaveBeenCalledWith("/teacher/dashboard"));
    const { token, user } = useAuthStore.getState();
    expect({ token, role: user?.role, email: user?.email }).toEqual({
      token: "teacher-token", role: "TEACHER", email: "teacher@college.in",
    });
  });

  it("sends a teacher to the teacher dashboard, not the dashboard of the account that was signed in before", async () => {
    useAuthStore.getState().login("owner-token", SUPER_ADMIN);

    signIn();

    await waitFor(() => expect(push).toHaveBeenCalledTimes(1));
    expect(push).toHaveBeenCalledWith("/teacher/dashboard");
  });

  it("works the same when nobody was signed in", async () => {
    signIn();

    await waitFor(() => expect(push).toHaveBeenCalledWith("/teacher/dashboard"));
    expect(useAuthStore.getState().user?.role).toBe("TEACHER");
  });
});
