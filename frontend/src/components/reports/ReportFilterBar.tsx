"use client";

import React from "react";
import Input from "@/components/ui/Input";
import SelectField from "@/components/ui/SelectField";
import type { ReportClass, ReportSubject } from "@/types";

export const ALL_SUBJECTS = "all";

interface ReportFilterBarProps {
  classes: ReportClass[];
  subjects: ReportSubject[];
  classId: string;
  sectionId: string;
  dateFrom: string;
  dateTo: string;
  showSubject: boolean;
  allowAllSubjects: boolean;
  onClass: (id: string) => void;
  onSection: (id: string) => void;
  onDateFrom: (value: string) => void;
  onDateTo: (value: string) => void;
}

export default function ReportFilterBar(props: ReportFilterBarProps): React.ReactElement {
  const classOptions = props.classes.map((c) => ({ value: c.id, label: `${c.code} · Semester ${c.semester}` }));
  const subjectOptions = [
    ...(props.allowAllSubjects ? [{ value: ALL_SUBJECTS, label: "All subjects" }] : []),
    ...props.subjects.map((s) => ({ value: s.section_id, label: `${s.subject_code} · ${s.subject_name}` })),
  ];
  return (
    <div className="grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
      <SelectField label="Class" options={classOptions} value={props.classId} onChange={props.onClass} placeholder="Choose a class" />
      {props.showSubject ? (
        <SelectField
          label="Subject"
          options={subjectOptions}
          value={props.sectionId || (props.allowAllSubjects ? ALL_SUBJECTS : "")}
          onChange={(value) => props.onSection(value === ALL_SUBJECTS ? "" : value)}
          placeholder="Choose a subject"
        />
      ) : (
        <div className="hidden lg:block" />
      )}
      <Input label="From" type="date" value={props.dateFrom} max={props.dateTo || undefined} onChange={(e) => props.onDateFrom(e.target.value)} />
      <Input label="To" type="date" value={props.dateTo} min={props.dateFrom || undefined} onChange={(e) => props.onDateTo(e.target.value)} />
    </div>
  );
}
