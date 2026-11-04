"use client";

import React from "react";
import QuickAddList from "../QuickAddList";
import type { StepProps } from "./stepProps";

export default function SubjectsStep({ refresh }: StepProps): React.ReactElement {
  const onChanged = (): void => void refresh();

  return (
    <div className="space-y-4">
      {/* Subjects Section */}
      <section className="space-y-3 rounded-xl border border-border bg-surface/60 p-4 sm:p-5">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Subjects</h3>
          <p className="text-xs text-muted-foreground">Academic courses and teaching subjects.</p>
        </div>
        <QuickAddList
          endpoint="/admin/subjects"
          noun="subject"
          nameLabel="Subject name"
          placeholder="e.g. Data Structures"
          needsCode={false}
          onChanged={onChanged}
        />
      </section>

      {/* Classrooms Section */}
      <section className="space-y-3 rounded-xl border border-border bg-surface/60 p-4 sm:p-5">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Classrooms</h3>
          <p className="text-xs text-muted-foreground">Rooms, laboratories, and lecture halls.</p>
        </div>
        <QuickAddList
          endpoint="/admin/classrooms"
          noun="classroom"
          nameLabel="Room name"
          placeholder="e.g. Lab 101 or Room 204"
          needsCode={false}
          onChanged={onChanged}
        />
      </section>
    </div>
  );
}
