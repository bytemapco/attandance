import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SystemMetricsGrid from "@/components/super-admin/SystemMetricsGrid";
import SystemServicesGrid from "@/components/super-admin/SystemServicesGrid";
import type { PlatformHealth } from "@/types/tenant";

function health(overrides: Partial<PlatformHealth["services"]> = {}, status: PlatformHealth["status"] = "healthy"): PlatformHealth {
  return {
    status,
    timestamp: "2026-11-07T06:00:00Z",
    server_uptime_seconds: 3 * 3600 + 25 * 60,
    services: {
      postgresql: { status: "healthy", latency_ms: 2.1, details: { version: "16.4", connections: 7, max_connections: 100 } },
      redis_cache: { status: "healthy", latency_ms: 0.3, details: { memory_used: "1.5M", clients: 4 } },
      object_storage: { status: "healthy", latency_ms: 40, details: { provider: "S3", bucket: "attendance-prod" } },
      email_worker: { status: "healthy", latency_ms: 1, details: { online: true, jobs_waiting: 0 } },
      ai_hardware: { status: "healthy", latency_ms: null, details: { device: "/device:CPU:0", target: "auto" } },
      ...overrides,
    },
  };
}

describe("the system status shows what was measured", () => {
  it("shows the real connection count, cache memory, uptime and queue", () => {
    render(<SystemMetricsGrid health={health()} />);
    expect(screen.getByText("3h 25m")).toBeInTheDocument();
    expect(screen.getByText("7 / 100")).toBeInTheDocument();
    expect(screen.getByText("1.5M")).toBeInTheDocument();
    expect(screen.getByText("Worker online")).toBeInTheDocument();
  });

  it("says Unknown rather than inventing a figure when the check gave none", () => {
    const missing = health({ postgresql: { status: "down", latency_ms: null, details: { error: "db down" } }, email_worker: { status: "down", latency_ms: null, details: null } });
    render(<SystemMetricsGrid health={missing} />);
    expect(screen.getAllByText("Unknown")).toHaveLength(2);
  });

  it("shows storage as not configured when no bucket is set, never as ready", () => {
    render(<SystemServicesGrid health={health({ object_storage: { status: "not_configured", latency_ms: null, details: { provider: "S3", note: "No bucket is set" } } })} />);
    expect(screen.getByText("Not configured")).toBeInTheDocument();
    expect(screen.queryByText(/Local Media|Ready/)).toBeNull();
  });

  it("lists the five real services and no placeholder", () => {
    render(<SystemServicesGrid health={health()} />);
    ["PostgreSQL database", "Redis cache", "File storage (S3)", "E-mail worker", "AI compute"].forEach((name) =>
      expect(screen.getByText(name)).toBeInTheDocument(),
    );
    expect(screen.queryByText(/Biometric/)).toBeNull();
    expect(screen.getByText("5 of 5 operational")).toBeInTheDocument();
  });

  it("the latency is shown as a dash when the check did not measure one", () => {
    render(<SystemServicesGrid health={health({ ai_hardware: { status: "healthy", latency_ms: null, details: { device: "CPU" } } })} />);
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(1);
  });
});
