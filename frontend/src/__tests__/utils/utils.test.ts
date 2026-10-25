import { describe, it, expect, vi } from "vitest";
import { cn } from "@/lib/utils";
import { exportToCSV } from "@/utils/exportUtils";

describe("cn utility", () => {
  it("merges classes correctly", () => {
    expect(cn("px-2 py-1", "bg-red-500")).toBe("px-2 py-1 bg-red-500");
  });

  it("handles conditional class values", () => {
    const isPrimary = true;
    const isLarge = false;
    expect(cn("base-class", isPrimary && "text-primary", isLarge && "text-lg")).toBe("base-class text-primary");
  });

  it("resolves Tailwind conflicting classes using tailwind-merge", () => {
    expect(cn("p-4", "p-2")).toBe("p-2");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });
});

describe("exportToCSV", () => {
  it("generates CSV download link and clicks it", () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const appendChildSpy = vi.spyOn(document.body, "appendChild");
    const removeChildSpy = vi.spyOn(document.body, "removeChild");

    window.URL.createObjectURL = vi.fn().mockReturnValue("blob:mock-url");
    window.URL.revokeObjectURL = vi.fn();

    const data = [
      { name: "John Doe", score: 95 },
      { name: "Jane Smith", score: 88 },
    ];

    exportToCSV("report", data);

    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(appendChildSpy).toHaveBeenCalledTimes(1);
    expect(removeChildSpy).toHaveBeenCalledTimes(1);
  });

  it("does nothing when rows are empty", () => {
    const createElementSpy = vi.spyOn(document, "createElement");
    exportToCSV("empty", []);
    expect(createElementSpy).not.toHaveBeenCalled();
  });
});
