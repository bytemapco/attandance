"use client";

import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Download } from "lucide-react";
import useSWR from "swr";
import { getApiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { downloadReport, type ExportFormat } from "@/lib/reports";
import { useReport } from "@/hooks/useReport";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import PageSkeleton from "@/components/ui/PageSkeleton";
import PageHeader from "@/components/ui/PageHeader";
import ReportFilterBar from "@/components/reports/ReportFilterBar";
import RegisterTable from "@/components/reports/RegisterTable";
import ShortageTable from "@/components/reports/ShortageTable";
import SummaryTable from "@/components/reports/SummaryTable";
import type { RegisterReport, ReportFilters, ReportParams, ReportTab, ShortageReport, SummaryReport } from "@/types";

const TABS: { id: ReportTab; label: string }[] = [
  { id: "shortage", label: "Shortage list" },
  { id: "register", label: "Lecture register" },
  { id: "subject-summary", label: "Subject summary" },
];

interface ReportsPageProps {
  description: string;
}

export default function ReportsPage({ description }: ReportsPageProps): React.ReactElement {
  const { data: filters, error: filtersError, mutate: loadFilters } = useSWR<ReportFilters>("/reports/filters");
  const loadError = filtersError && !filters ? getApiErrorMessage(filtersError, "Could not load your classes") : null;
  const [tab, setTab] = useState<ReportTab>("shortage");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [exporting, setExporting] = useState<ExportFormat | null>(null);

  useEffect(() => {
    if (filters) setClassId((current) => current || filters.classes[0]?.id || "");
  }, [filters]);

  const subjects = useMemo(() => (filters?.subjects ?? []).filter((s) => s.class_id === classId), [filters, classId]);
  const firstSubject = subjects[0]?.section_id ?? "";

  const params = useMemo<ReportParams>(
    () => ({
      class_id: tab === "register" ? undefined : classId || undefined,
      section_id: tab === "subject-summary" ? undefined : sectionId || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    }),
    [tab, classId, sectionId, dateFrom, dateTo]
  );
  const ready = classId !== "" && (tab !== "register" || sectionId !== "");
  const shortage = useReport<ShortageReport>(ready && tab === "shortage" ? "/reports/shortage" : null, params);
  const register = useReport<RegisterReport>(ready && tab === "register" ? "/reports/register" : null, params);
  const summary = useReport<SummaryReport>(ready && tab === "subject-summary" ? "/reports/subject-summary" : null, params);
  const active = { shortage, register, "subject-summary": summary }[tab];

  const changeClass = (id: string): void => {
    setClassId(id);
    const next = (filters?.subjects ?? []).find((s) => s.class_id === id)?.section_id ?? "";
    setSectionId(tab === "register" ? next : "");
  };

  const changeTab = (next: ReportTab): void => {
    setTab(next);
    if (next === "register" && !sectionId) setSectionId(firstSubject);
  };

  const exportAs = async (format: ExportFormat): Promise<void> => {
    setExporting(format);
    try {
      await downloadReport(tab, format, params);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Could not export the report"));
    } finally {
      setExporting(null);
    }
  };

  if (loadError) return <ErrorState message={loadError} onRetry={() => void loadFilters()} />;
  if (!filters) return <PageSkeleton />;
  if (filters.classes.length === 0) {
    return <EmptyState title="No classes yet" message="Reports appear once a class with subjects and a timetable exists." />;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Attendance reports"
        description={description}
        actions={
          <div className="flex gap-2">
            {(["xlsx", "pdf"] as const).map((format) => (
              <Button
                key={format}
                variant="secondary"
                size="sm"
                icon={<Download size={14} />}
                loading={exporting === format}
                disabled={!active.data || exporting !== null}
                onClick={() => void exportAs(format)}
              >
                {format === "xlsx" ? "Excel" : "PDF"}
              </Button>
            ))}
          </div>
        }
      />
      <ReportFilterBar
        classes={filters.classes}
        subjects={subjects}
        classId={classId}
        sectionId={sectionId}
        dateFrom={dateFrom}
        dateTo={dateTo}
        showSubject={tab !== "subject-summary"}
        allowAllSubjects={tab === "shortage"}
        onClass={changeClass}
        onSection={setSectionId}
        onDateFrom={setDateFrom}
        onDateTo={setDateTo}
      />
      <div role="tablist" className="inline-flex flex-wrap rounded-lg border border-border bg-card p-1">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => changeTab(id)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors",
              tab === id ? "bg-muted-foreground text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {!ready ? (
        <EmptyState title="Choose a subject" message="The lecture register shows one subject at a time." />
      ) : active.error ? (
        <ErrorState message={active.error} />
      ) : active.loading || !active.data ? (
        <PageSkeleton />
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            {active.data.meta.scope} · {active.data.meta.date_from ?? "start of term"} to {active.data.meta.date_to} · required{" "}
            {active.data.meta.threshold}%
          </p>
          {tab === "shortage" && shortage.data && <ShortageTable report={shortage.data} />}
          {tab === "register" && register.data && <RegisterTable report={register.data} />}
          {tab === "subject-summary" && summary.data && <SummaryTable report={summary.data} />}
        </>
      )}
    </div>
  );
}
