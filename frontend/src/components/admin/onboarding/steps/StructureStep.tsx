"use client";

import React from "react";
import QuickAddList from "../QuickAddList";
import type { StepProps } from "./stepProps";

export default function StructureStep({ refresh }: StepProps): React.ReactElement {
  const onChanged = (): void => void refresh();
  return (
    <div className="space-y-4">
      <section className="space-y-3 rounded-lg border border-border bg-surface/60 p-4 sm:p-5">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Departments</h3>
          <p className="text-xs text-muted-foreground">Academic divisions for students, teachers, and classrooms.</p>
        </div>
        <QuickAddList
          endpoint="/admin/departments"
          noun="department"
          nameLabel="Department name"
          placeholder="e.g. Computer Science and Engineering"
          codeLabel="Code"
          codePlaceholder="e.g. CSE"
          codeExample="e.g. CE, IT, ME"
          needsCode
          onChanged={onChanged}
        />
      </section>

      <section className="space-y-3 rounded-lg border border-border bg-surface/60 p-4 sm:p-5">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Teacher</h3>
          <p className="text-xs text-muted-foreground">Faculty designations and academic ranks.</p>
        </div>
        <QuickAddList
          endpoint="/admin/designations"
          noun="teacher"
          nameLabel="Title name"
          placeholder="e.g. Assistant Professor"
          codeLabel="Code"
          codePlaceholder="e.g. PROF"
          codeExample="e.g. PROF, ASST, LEC"
          needsCode
          onChanged={onChanged}
        />
      </section>
    </div>
  );
}
