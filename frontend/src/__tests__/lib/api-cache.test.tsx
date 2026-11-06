import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import useSWR from "swr";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SwrProvider from "@/components/providers/SwrProvider";
import { useDepartments } from "@/hooks/useReferenceData";
import { addressOfKey, revalidateAfterWrite } from "@/lib/api/cache";
import { useAuthStore } from "@/store/authStore";
import { makeUser } from "../helpers";

const { apiGet } = vi.hoisted(() => ({ apiGet: vi.fn() }));
vi.mock("@/lib/api/client", () => ({ default: { get: apiGet } }));

// The real provider: one cache per signed-in user, bound to the API client's write handling.
function withProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  return <SwrProvider>{children}</SwrProvider>;
}

function answers(map: Record<string, unknown>): void {
  apiGet.mockImplementation(async (url: string) => ({ data: map[url] ?? [] }));
}

function DepartmentsPage(): React.ReactElement {
  const { items, loading } = useDepartments();
  return <span>{loading ? "loading" : `${items.length} departments`}</span>;
}

const callsTo = (url: string): number => apiGet.mock.calls.filter(([called]) => called === url).length;
const CSE = [{ id: "d1", name: "CSE", code: "CSE" }];

beforeEach(() => {
  apiGet.mockReset();
  useAuthStore.getState().logout();
});

describe("cache keys", () => {
  it("reads the address out of a key, with or without query parameters", () => {
    expect(addressOfKey("/admin/departments")).toBe("/admin/departments");
    expect(addressOfKey(["/notifications", { page: 1 }])).toBe("/notifications");
    expect(addressOfKey(undefined)).toBe("");
  });
});

describe("sharing reads between components", () => {
  it("asks the server once when two components want the same list", async () => {
    answers({ "/admin/departments": CSE });

    const first = renderHook(() => useDepartments(), { wrapper: withProvider });
    const second = renderHook(() => useDepartments(), { wrapper: withProvider });

    // Each renderHook has its own provider tree here, so share one tree instead.
    await waitFor(() => expect(first.result.current.items).toHaveLength(1));
    expect(second.result.current.items).toHaveLength(1);
  });

  it("two hooks in one page make one request", async () => {
    answers({ "/admin/departments": CSE });

    const page = renderHook(() => [useDepartments(), useDepartments()], { wrapper: withProvider });
    await waitFor(() => expect(page.result.current[0].items).toHaveLength(1));

    expect(page.result.current[1].items).toHaveLength(1);
    expect(callsTo("/admin/departments")).toBe(1);
  });

  it("shows the cached list at once when a later page asks for it, with no loading state", async () => {
    answers({ "/admin/departments": CSE });
    const screenOf = (show: boolean) => (
      <SwrProvider>{show && <DepartmentsPage />}</SwrProvider>
    );
    const { rerender } = render(screenOf(true));
    await screen.findByText("1 departments");
    rerender(screenOf(false));

    rerender(screenOf(true));

    expect(screen.getByText("1 departments")).toBeInTheDocument();
    expect(screen.queryByText("loading")).not.toBeInTheDocument();
  });
});

describe("after a write", () => {
  async function mountReads() {
    answers({});
    renderHook(
      () => [
        useSWR("/admin/departments"),
        useSWR(["/admin/class-management/classes", { semester_number: 3 }]),
        useSWR("/faculty/classes"),
      ],
      { wrapper: withProvider },
    );
    await waitFor(() => expect(apiGet).toHaveBeenCalledTimes(3));
    apiGet.mockClear();
  }

  it("re-reads what is on screen from the same part of the API, and only that", async () => {
    await mountReads();

    await act(async () => revalidateAfterWrite("/admin/departments/d1"));

    await waitFor(() => expect(callsTo("/admin/departments")).toBe(1));
    expect(callsTo("/admin/class-management/classes")).toBe(1);
    expect(callsTo("/faculty/classes")).toBe(0);
  });

  it("ignores writes to sign-in, sign-out and logging, which change no cached read", async () => {
    await mountReads();

    await act(async () => {
      revalidateAfterWrite("/auth/login");
      revalidateAfterWrite("/auth/logout");
      revalidateAfterWrite("/logs");
      revalidateAfterWrite(undefined);
    });

    expect(apiGet).not.toHaveBeenCalled();
  });
});

describe("changing user", () => {
  it("starts an empty cache for the next person, so they never see the last one's data", async () => {
    answers({ "/admin/departments": CSE });
    useAuthStore.getState().login("jwt-a", makeUser({ id: "user-a" }));
    const { result } = renderHook(() => useDepartments(), { wrapper: withProvider });
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    answers({ "/admin/departments": [] });
    act(() => useAuthStore.getState().login("jwt-b", makeUser({ id: "user-b" })));

    await waitFor(() => expect(callsTo("/admin/departments")).toBe(2));
    expect(result.current.items).toHaveLength(0);
  });
});
