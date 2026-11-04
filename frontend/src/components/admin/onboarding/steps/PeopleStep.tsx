import React from "react";
import Link from "next/link";
import { GraduationCap, Users } from "lucide-react";
import GlassBadge from "@/components/ui/GlassBadge";
import type { StepProps } from "./stepProps";

function countOf(status: StepProps["status"], id: string): number {
  return status.checks.find((c) => c.id === id)?.count ?? 0;
}

export default function PeopleStep({ status }: StepProps): React.ReactElement {
  const noSeats = status.license_remaining === 0;
  const cards = [
    { id: "teachers", title: "Teachers", icon: Users, add: "/admin/users/teachers/add", list: "/admin/users/teachers" },
    { id: "students", title: "Students", icon: GraduationCap, add: "/admin/users/students/add", list: "/admin/users/students" },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Add teachers and students now or later. Use their list pages to import a spreadsheet.
      </p>
      {noSeats && (
        <p className="rounded-lg border border-warning-border bg-warning-soft px-4 py-3 text-sm text-warning">
          No seats are available.{" "}
          <Link href="/admin/licenses" className="font-medium underline">
            Request seats
          </Link>{" "}
          before adding people.
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map(({ id, title, icon: Icon, add, list }) => (
          <div key={id} className="space-y-3 rounded-xl border border-border p-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-medium text-foreground">
                <Icon size={18} aria-hidden /> {title}
              </span>
              <GlassBadge variant={countOf(status, id) > 0 ? "success" : "neutral"}>{countOf(status, id)} added</GlassBadge>
            </div>
            <div className="flex gap-3 text-sm">
              <Link href={add} className="font-medium text-accent-strong hover:underline">Add one</Link>
              <Link href={list} className="font-medium text-muted-foreground underline-offset-4 hover:text-primary hover:underline">Import or view all</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
