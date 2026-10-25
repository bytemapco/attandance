"use client";

import React, { useState, useMemo } from "react";
import { CheckCircle2, SearchX } from "lucide-react";
import api, { getApiErrorMessage } from "@/lib/api";
import toast from "react-hot-toast";
import GlassBreadcrumb from "@/components/ui/GlassBreadcrumb";
import GlassPageHeader from "@/components/ui/GlassPageHeader";
import GlassCard from "@/components/ui/GlassCard";
import ScannerControls from "./ScannerControls";
import ScannerStats from "./ScannerStats";
import ScannerEmptyState from "./ScannerEmptyState";
import ScannerLoadingState from "./ScannerLoadingState";
import AnomalyCard from "./AnomalyCard";
import type { AnomalyResult } from "@/types";

export default function ScannerPage(): React.ReactElement {
  const [contamination, setContamination] = useState<number>(0.1);
  const [results, setResults] = useState<AnomalyResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasRun, setHasRun] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortBy, setSortBy] = useState<"score" | "absences" | "name">("score");

  async function runScan(): Promise<void> {
    setLoading(true);
    try {
      const { data } = await api.post<AnomalyResult[]>(
        `/admin/scan-absentees?contamination=${contamination}`
      );
      setResults(data);
      setHasRun(true);
      if (data.length === 0) {
        toast.success("No irregular patterns found");
      } else {
        toast.success(`Found ${data.length} flagged students`);
      }
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Scan failed"));
    } finally {
      setLoading(false);
    }
  }

  const filteredAndSortedResults = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const matched = results.filter((item) => {
      if (!term) return true;
      const name = (item.student_name || "").toLowerCase();
      const prn = (item.enrollment_number || "").toLowerCase();
      const id = item.student_id.toLowerCase();
      return name.includes(term) || prn.includes(term) || id.includes(term);
    });

    return matched.sort((a, b) => {
      if (sortBy === "absences") {
        return (b.total_absences || 0) - (a.total_absences || 0);
      }
      if (sortBy === "name") {
        return (a.student_name || "").localeCompare(b.student_name || "");
      }
      return (b.anomaly_score || 0) - (a.anomaly_score || 0);
    });
  }, [results, searchTerm, sortBy]);

  const avgScore = useMemo(() => {
    if (results.length === 0) return 0;
    return results.reduce((acc, curr) => acc + (curr.anomaly_score || 0), 0) / results.length;
  }, [results]);

  const maxScore = useMemo(() => {
    if (results.length === 0) return 0;
    return Math.max(...results.map((r) => r.anomaly_score || 0));
  }, [results]);

  return (
    <div className="space-y-6">
      <GlassBreadcrumb
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Attendance Scanner" },
        ]}
      />

      <GlassPageHeader
        title="Attendance Scanner"
        description="Find irregular absences and attendance patterns."
      />

      {/* Controls */}
      <ScannerControls
        contamination={contamination}
        onContaminationChange={setContamination}
        onRunScan={runScan}
        loading={loading}
      />

      {/* Main Content Area */}
      {loading && <ScannerLoadingState />}

      {!loading && !hasRun && (
        <ScannerEmptyState onRunScan={runScan} loading={loading} />
      )}

      {!loading && hasRun && results.length === 0 && (
        <GlassCard className="flex flex-col items-center justify-center py-16 text-center bg-card border-border/80">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 mb-3 border border-emerald-500/20">
            <CheckCircle2 size={24} />
          </div>
          <h4 className="text-sm font-semibold text-foreground">No Anomalies Found</h4>
          <p className="text-xs text-muted-foreground max-w-sm mt-1">
            All student attendance patterns are within normal thresholds.
          </p>
        </GlassCard>
      )}

      {!loading && hasRun && results.length > 0 && (
        <div className="space-y-4">
          <ScannerStats
            totalFlagged={results.length}
            avgScore={avgScore}
            maxScore={maxScore}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />

          {filteredAndSortedResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredAndSortedResults.map((item) => (
                <AnomalyCard key={item.student_id} result={item} />
              ))}
            </div>
          ) : (
            <GlassCard className="flex flex-col items-center justify-center py-12 text-center bg-card">
              <SearchX size={22} className="text-muted-foreground mb-2" />
              <p className="text-xs font-medium text-foreground">No matching students</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Try a different search term.
              </p>
            </GlassCard>
          )}
        </div>
      )}
    </div>
  );
}
