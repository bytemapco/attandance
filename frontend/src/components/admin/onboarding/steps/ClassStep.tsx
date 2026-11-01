import React from "react";
import Link from "next/link";
import type { StepProps } from "./stepProps";

export default function ClassStep({ status }: StepProps): React.ReactElement {
  const count = status.checks.find((c) => c.id === "classes")?.count ?? 0;
  return (
    <div className="space-y-4">
      <p className="text-sm text-[#526f78]">
        Create a class now, or add one later from Classes. You can assign students, subjects and a weekly schedule there.
      </p>
      <p className="text-sm font-medium text-[#202b30]">
        {count > 0 ? `${count} class${count === 1 ? "" : "es"} created.` : "No classes yet."}
      </p>
      <Link
        href="/admin/class-management/create"
        className="inline-flex min-h-10 items-center justify-center rounded-md border border-[#e3e1dc] bg-card px-4 text-sm font-medium text-[#202b30] shadow-xs transition-colors hover:bg-[#f5f2ed] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#526f78]"
      >
        Create class
      </Link>
    </div>
  );
}
