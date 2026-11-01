"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, Trash2, Pencil } from "lucide-react";
import toast from "react-hot-toast";

import api, { getApiErrorMessage } from "@/lib/api";
import GlassBreadcrumb from "@/components/ui/GlassBreadcrumb";
import GlassPageHeader from "@/components/ui/GlassPageHeader";
import GlassButton from "@/components/ui/GlassButton";
import GlassTable, { type TableColumn } from "@/components/ui/GlassTable";
import GlassBadge, { statusToBadgeVariant } from "@/components/ui/GlassBadge";
import GlassConfirmDialog from "@/components/ui/GlassConfirmDialog";
import GlassLoader from "@/components/ui/GlassLoader";
import YearSemestersSection from "@/components/admin/academicCalendar/YearSemestersSection";
import type { AcademicYearResponse, CalendarEventResponse } from "@/types";

export default function AcademicYearDetailPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [year, setYear] = useState<AcademicYearResponse | null>(null);
  const [events, setEvents] = useState<CalendarEventResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async (): Promise<void> => {
    try {
      const [yearRes, eventsRes] = await Promise.all([
        api.get<AcademicYearResponse>(`/admin/academic-years/${id}`),
        api.get<CalendarEventResponse[]>(`/admin/calendar-events`, { params: { year_id: id } }),
      ]);
      setYear(yearRes.data);
      setEvents(eventsRes.data);
    } catch {
      toast.error("Failed to load academic year");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  async function handleDeleteEvent(): Promise<void> {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/calendar-events/${deleteTarget}`);
      toast.success("Calendar event deleted");
      setDeleteTarget(null);
      await fetchData();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Delete failed"));
    } finally {
      setDeleting(false);
    }
  }

  const columns: TableColumn<CalendarEventResponse & Record<string, unknown>>[] = [
    { key: "title", header: "Title", sortable: true },
    {
      key: "date",
      header: "Date",
      render: (row) => <span>{new Date(row.date).toLocaleDateString()}</span>,
    },
    {
      key: "event_type",
      header: "Type",
      render: (row) => <GlassBadge variant="info">{row.event_type.replace(/_/g, " ")}</GlassBadge>,
    },
    {
      key: "affects_all_courses",
      header: "Scope",
      render: (row) => <span>{row.affects_all_courses ? "All courses" : "Selected"}</span>,
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <GlassButton
          variant="ghost"
          size="sm"
          onClick={() => setDeleteTarget(String(row.id))}
          className="text-muted-foreground hover:text-[#b54242] hover:bg-[#f9eaea]"
          icon={<Trash2 size={13} />}
        />
      ),
    },
  ];

  if (loading) return <GlassLoader />;
  if (!year) return <div className="text-center py-20 text-slate-500">Academic year not found</div>;

  return (
    <div className="animate-fade-in-up space-y-5">
      <GlassBreadcrumb
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Master Data", href: "/admin/master-data/departments" },
          { label: "Academic Years", href: "/admin/master-data/academic-years" },
          { label: year.name },
        ]}
      />
      <GlassPageHeader
        title={year.name}
        description={`${new Date(year.start_date).toLocaleDateString()} – ${new Date(year.end_date).toLocaleDateString()}`}
        actions={
          <GlassButton
            variant="secondary"
            icon={<Pencil size={15} />}
            onClick={() => router.push(`/admin/master-data/academic-years/${id}/edit`)}
          >
            Edit
          </GlassButton>
        }
      />

      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-[#526f78]">
        <span className="flex items-center gap-1.5">
          <GlassBadge variant={statusToBadgeVariant(year.status)}>{year.status}</GlassBadge>
        </span>
        <span>Min attendance <strong className="text-[#202b30]">{year.min_attendance_pct}%</strong></span>
        <span>Verification window <strong className="text-[#202b30]">{year.verification_window_min} min</strong></span>
        <span>Saturday <strong className="text-[#202b30]">{year.saturday_enabled ? "Instructional" : "Off"}</strong></span>
      </div>

      <YearSemestersSection yearId={id} />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#202b30]">Calendar Events</h2>
          <GlassButton
            variant="primary"
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => router.push(`/admin/master-data/academic-years/${id}/events/create`)}
          >
            Add Event
          </GlassButton>
        </div>
        <GlassTable
          columns={columns}
          data={events as (CalendarEventResponse & Record<string, unknown>)[]}
          emptyMessage="No holidays or special events added yet"
        />
      </div>

      <GlassConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Calendar Event"
        message="Are you sure you want to delete this calendar event? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDeleteEvent}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
