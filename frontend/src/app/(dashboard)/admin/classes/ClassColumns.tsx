"use client";

import React from "react";
import Link from "next/link";
import { Eye, Pencil } from "lucide-react";
import type { TableColumn } from "@/components/ui/GlassTable";
import type { ClassResponse } from "@/types";

export const classColumns: TableColumn<ClassResponse & Record<string, unknown>>[] = [
  {
    key: "name",
    header: "Course / Class",
    sortable: true,
    render: (r) => (
      <div>
        <p className="font-bold text-foreground text-xs leading-tight">{r.name}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {String((r as { schedule?: string }).schedule || "Schedule: Mon-Fri")}
        </p>
      </div>
    ),
  },
  {
    key: "subject_name",
    header: "Subject & Code",
    sortable: true,
    render: (r) => {
      const sub = r.subject_name || (r as { subjectName?: string }).subjectName || "—";
      const code = r.subject_code || (r as { subjectCode?: string }).subjectCode || (r as { code?: string }).code;
      return (
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-foreground text-xs">{sub}</span>
          {code && (
            <span className="font-mono text-[11px] bg-secondary/80 text-foreground px-1.5 py-0.5 rounded border border-border">
              {code}
            </span>
          )}
        </div>
      );
    },
  },
  {
    key: "enrolled_count",
    header: "Enrolled Students",
    render: (r) => {
      const count =
        r.enrolled_count ??
        (r as { studentCount?: number }).studentCount ??
        (r as { enrolledStudentsCount?: number }).enrolledStudentsCount ??
        0;
      return (
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold text-foreground">
            {count} enrolled
          </span>
          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-medium">
            Active
          </span>
        </div>
      );
    },
  },
  {
    key: "teacher_name",
    header: "Teacher",
    sortable: true,
    render: (r) => {
      let tName: string = typeof r.teacher_name === "string" ? r.teacher_name : "Unassigned";
      const teacherObj = (r as { teacher?: { firstName?: string; lastName?: string; name?: string } }).teacher;
      if (teacherObj) {
        const full = [teacherObj.firstName, teacherObj.lastName].filter(Boolean).join(" ");
        if (full) tName = full;
        else if (typeof teacherObj.name === "string") tName = teacherObj.name;
      }
      return (
        <span className="text-xs text-foreground font-medium">
          {tName}
        </span>
      );
    },
  },
  {
    key: "classroom_name",
    header: "Classroom / Hall",
    render: (r) => {
      let room: string =
        typeof r.classroom_name === "string"
          ? r.classroom_name
          : typeof (r as { classroomName?: string }).classroomName === "string"
          ? (r as { classroomName?: string }).classroomName!
          : "Main Hall";
      const roomObj = (r as { classroom?: { roomNumber?: string; name?: string } }).classroom;
      if (roomObj) {
        if (typeof roomObj.roomNumber === "string") room = roomObj.roomNumber;
        else if (typeof roomObj.name === "string") room = roomObj.name;
      }
      return (
        <span className="text-muted-foreground text-xs font-medium">
          {room}
        </span>
      );
    },
  },
  {
    key: "actions",
    header: "Actions",
    render: (row) => (
      <div className="flex items-center gap-1.5">
        <Link
          href={`/admin/classes/${row.id}`}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary border border-border transition-colors shadow-2xs"
          title="View Class"
        >
          <Eye size={12} /> View
        </Link>
        <Link
          href={`/admin/classes/${row.id}/edit`}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary border border-border transition-colors shadow-2xs"
          title="Edit Class"
        >
          <Pencil size={12} /> Edit
        </Link>
      </div>
    ),
  },
];
