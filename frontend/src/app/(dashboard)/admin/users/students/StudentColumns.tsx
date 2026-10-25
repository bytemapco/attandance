"use client";

import React from "react";
import Link from "next/link";
import { Eye, Pencil } from "lucide-react";
import type { TableColumn } from "@/components/ui/GlassTable";
import type { StudentResponse } from "@/types";

export const studentColumns: TableColumn<StudentResponse & Record<string, unknown>>[] = [
  {
    key: "full_name",
    header: "User",
    sortable: true,
    render: (r) => {
      const firstName = r.first_name || (r as { firstName?: string }).firstName;
      const lastName = r.last_name || (r as { lastName?: string }).lastName;
      const name = [firstName, lastName].filter(Boolean).join(" ") || r.email || "Student";
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
    key: "enrollment_number",
    header: "Login / ID",
    sortable: true,
    render: (r) => (
      <span className="font-mono text-xs text-foreground bg-secondary/80 px-2 py-0.5 rounded border border-border">
        {String(r.enrollment_number || (r as { enrollmentNumber?: string }).enrollmentNumber || "stu-000")}
      </span>
    ),
  },
  {
    key: "role",
    header: "System Role",
    render: () => (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-border bg-card text-[11px] font-medium text-muted-foreground shadow-2xs">
        Enrolled Student
      </span>
    ),
  },
  {
    key: "branch",
    header: "Branch",
    sortable: true,
    render: (r) => {
      const branch = r.branch || (r as { branch?: string }).branch;
      return branch ? (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
          {branch}
        </span>
      ) : (
        <span className="text-muted-foreground text-xs">—</span>
      );
    },
  },
  {
    key: "department",
    header: "Department",
    sortable: true,
    render: (r) => {
      const deptName =
        r.department_name ||
        (typeof r.department === "string" ? r.department : (r.department as { name?: string })?.name) ||
        "—";
      return (
        <span className="text-xs text-foreground font-medium">
          {deptName}
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
          href={`/admin/users/students/${row.id}`}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary border border-border transition-colors shadow-2xs"
          title="View Details"
        >
          <Eye size={12} /> View
        </Link>
        <Link
          href={`/admin/users/students/${row.id}/edit`}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary border border-border transition-colors shadow-2xs"
          title="Edit Student"
        >
          <Pencil size={12} /> Edit
        </Link>
      </div>
    ),
  },
];
