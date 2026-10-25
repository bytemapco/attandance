"use client";

import React from "react";
import Link from "next/link";
import { Eye, Pencil } from "lucide-react";
import type { TableColumn } from "@/components/ui/GlassTable";
import type { TeacherResponse } from "@/types";

export const teacherColumns: TableColumn<TeacherResponse & Record<string, unknown>>[] = [
  {
    key: "name",
    header: "Faculty / User",
    sortable: true,
    render: (r) => {
      const firstName = r.first_name || (r as { firstName?: string }).firstName;
      const lastName = r.last_name || (r as { lastName?: string }).lastName;
      const combined = [firstName, lastName].filter(Boolean).join(" ");
      const name = String(
        combined ||
        (r as { fullName?: string }).fullName ||
        (r as { full_name?: string }).full_name ||
        (r as { name?: string }).name ||
        r.email ||
        "Teacher"
      );
      const initial = name.charAt(0).toUpperCase();
      return (
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-foreground text-xs leading-tight">{name}</p>
            <p className="text-[11px] text-muted-foreground truncate">{r.email}</p>
          </div>
        </div>
      );
    },
  },
  {
    key: "employee_id",
    header: "Employee ID",
    sortable: true,
    render: (r) => {
      const empId = r.employee_id || (r as { employeeId?: string }).employeeId || "FAC-000";
      return (
        <span className="font-mono text-xs text-foreground bg-secondary/80 px-2 py-0.5 rounded border border-border">
          {String(empId)}
        </span>
      );
    },
  },
  {
    key: "designation",
    header: "Academic Rank",
    sortable: true,
    render: (r) => {
      let desig = "Faculty Member";
      if (typeof r.designation === "string") {
        desig = r.designation;
      } else if (r.designation && typeof (r.designation as { title?: string }).title === "string") {
        desig = (r.designation as { title: string }).title;
      }
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md border border-border bg-card text-[11px] font-medium text-foreground shadow-2xs">
          {desig}
        </span>
      );
    },
  },
  {
    key: "department",
    header: "Department",
    sortable: true,
    render: (r) => {
      let dept = "Academic Faculty";
      if (typeof r.department === "string") {
        dept = r.department;
      } else if (r.department && typeof (r.department as { name?: string }).name === "string") {
        dept = (r.department as { name: string }).name;
      }
      return (
        <span className="text-xs text-muted-foreground font-medium">
          {dept}
        </span>
      );
    },
  },
  {
    key: "status",
    header: "Status",
    render: (r) => {
      const isActive = r.is_active !== false;
      return isActive ? (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          Active
        </span>
      ) : (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-500/10 text-zinc-500 dark:text-zinc-400 border border-zinc-500/20">
          Inactive
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
          href={`/admin/users/teachers/${row.id}`}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary border border-border transition-colors shadow-2xs"
          title="View Profile"
        >
          <Eye size={12} /> View
        </Link>
        <Link
          href={`/admin/users/teachers/${row.id}/edit`}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary border border-border transition-colors shadow-2xs"
          title="Edit Teacher"
        >
          <Pencil size={12} /> Edit
        </Link>
      </div>
    ),
  },
];
