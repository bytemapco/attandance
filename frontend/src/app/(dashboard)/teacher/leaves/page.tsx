"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, FileText, Image as ImageIcon, Eye } from "lucide-react";
import api from "@/lib/api";
import { useDebounce } from "@/hooks/useDebounce";
import PageHeader from "@/components/ui/PageHeader";
import DataTable, { type TableColumn } from "@/components/ui/DataTable";
import PageSkeleton from "@/components/ui/PageSkeleton";
import EmptyState from "@/components/ui/EmptyState";
import Card from "@/components/ui/Card";
import SearchInput from "@/components/ui/SearchInput";
import Pagination from "@/components/ui/Pagination";
import type { PendingLeaveItem } from "@/types";

export default function LeavesPage(): React.JSX.Element {
  const router = useRouter();
  const [leaves, setLeaves] = useState<PendingLeaveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    let mounted = true;
    async function fetchLeaves(): Promise<void> {
      try {
        const { data } = await api.get<PendingLeaveItem[]>("/teacher/leaves/pending");
        if (mounted) setLeaves(data);
      } catch {
        if (mounted) setLeaves([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void fetchLeaves();
    return () => { mounted = false; };
  }, []);

  const columns: TableColumn<PendingLeaveItem & Record<string, unknown>>[] = [
    { 
      key: "enrollment_number", 
      header: "Enrollment #",
      render: (r) => (
        <span className="font-mono text-xs text-foreground bg-secondary/80 px-2 py-0.5 rounded-sm border border-border">
          {r.enrollment_number}
        </span>
      )
    },
    { 
      key: "student_name", 
      header: "Student", 
      sortable: true,
      render: (r) => (
        <span className="font-semibold text-foreground text-xs">{r.student_name}</span>
      )
    },
    {
      key: "start_date",
      header: "From",
      render: (r) => <span className="text-xs text-muted-foreground">{new Date(r.start_date).toLocaleDateString()}</span>,
    },
    {
      key: "end_date",
      header: "To",
      render: (r) => <span className="text-xs text-muted-foreground">{new Date(r.end_date).toLocaleDateString()}</span>,
    },
    {
      key: "reason",
      header: "Reason",
      render: (r) => <span className="text-xs text-foreground font-medium truncate max-w-[200px] block">{r.reason}</span>,
    },
    {
      key: "document_url",
      header: "Proof Attached",
      render: (r) => r.document_url ? (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-success/10 text-success border border-success/20 text-xs font-semibold">
          {r.document_url.toLowerCase().split("?")[0].endsWith(".pdf") ? <FileText size={12} /> : <ImageIcon size={12} />}
          <span>Attached</span>
        </span>
      ) : <span className="text-muted-foreground text-xs italic">None</span>,
    },
    {
      key: "actions",
      header: "Action",
      render: (row) => (
        <button
          type="button"
          onClick={() => router.push(`/teacher/leaves/${row.id}`)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-secondary text-foreground transition-all text-xs font-semibold cursor-pointer"
          title="Review leave application"
        >
          <Eye size={13} className="text-primary" />
          <span>Review</span>
          <ArrowRight size={12} className="text-muted-foreground ml-0.5" />
        </button>
      ),
    },
  ];

  const filtered = useMemo(() => {
    if (!debouncedSearch.trim()) return leaves;
    const lower = debouncedSearch.toLowerCase();
    return leaves.filter((r) =>
      r.student_name.toLowerCase().includes(lower) ||
      r.enrollment_number.toLowerCase().includes(lower) ||
      r.reason.toLowerCase().includes(lower)
    );
  }, [leaves, debouncedSearch]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  if (loading) return <PageSkeleton text="Loading leave requests..." />;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Leave requests" 
      />

      <Card padding="sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchInput
              placeholder="Search by student name, enrollment, or reason..."
              value={searchTerm}
              onSearch={(val) => { setSearchTerm(val); setPage(1); }}
            />
          </div>
        </div>
      </Card>

      {leaves.length === 0 ? (
        <EmptyState title="All clear" message="No pending leave requests found." />
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <DataTable
            columns={columns}
            data={paginated as (PendingLeaveItem & Record<string, unknown>)[]}
            emptyMessage="No pending leaves match your search."
          />
          {filtered.length > 0 && (
            <Pagination
              totalItems={filtered.length}
              currentPage={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(sz) => { setPageSize(sz); setPage(1); }}
              itemName="leave requests"
            />
          )}
        </div>
      )}
    </div>
  );
}
