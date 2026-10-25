"use client";

import React, { useEffect, useState } from "react";
import { X, Calendar, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Clock } from "lucide-react";
import api, { getApiErrorMessage } from "@/lib/api";
import GlassLoader from "@/components/ui/GlassLoader";
import GlassEmptyState from "@/components/ui/GlassEmptyState";
import type { StudentClassHistoryResponse, StudentClassSessionLog } from "@/types";

interface StudentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  studentId: string;
  studentName?: string;
  enrollmentNumber?: string;
}

export default function StudentHistoryModal({
  isOpen,
  onClose,
  classId,
  studentId,
  studentName = "Student",
  enrollmentNumber = "—",
}: StudentHistoryModalProps): React.ReactElement | null {
  const [history, setHistory] = useState<StudentClassHistoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !classId || !studentId) {
      setHistory(null);
      setError(null);
      return;
    }

    async function fetchHistory(): Promise<void> {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get<StudentClassHistoryResponse>(
          `/teacher/classes/${classId}/students/${studentId}/history`
        );
        setHistory(data);
      } catch (err: unknown) {
        setError(getApiErrorMessage(err, "Failed to load student attendance history"));
      } finally {
        setLoading(false);
      }
    }

    void fetchHistory();
  }, [isOpen, classId, studentId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-card/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center font-bold text-sm">
              {studentName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground">{studentName}</h3>
                {history?.at_risk && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                    Defaulter (&lt;75%)
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {enrollmentNumber} • {history?.class_name ?? "Class"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Area */}
        <div className="overflow-y-auto p-5 space-y-5">
          {loading ? (
            <div className="py-12"><GlassLoader text="Fetching student session logs..." /></div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-center">
              {error}
            </div>
          ) : history ? (
            <>
              {/* Metrics Summary Strip */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-secondary/50 border border-border/50 text-center">
                  <span className="text-[11px] text-muted-foreground block font-medium">Attendance Rate</span>
                  <span className={`text-lg font-extrabold ${history.attendance_percentage >= 75 ? "text-emerald-500" : "text-rose-400"}`}>
                    {history.attendance_percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-secondary/50 border border-border/50 text-center">
                  <span className="text-[11px] text-muted-foreground block font-medium">Classes Attended</span>
                  <span className="text-lg font-extrabold text-foreground">
                    {history.attended_sessions} / {history.total_sessions}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-secondary/50 border border-border/50 text-center">
                  <span className="text-[11px] text-muted-foreground block font-medium">Absences / Missed</span>
                  <span className="text-lg font-extrabold text-muted-foreground">
                    {Math.max(0, history.total_sessions - history.attended_sessions)}
                  </span>
                </div>
              </div>

              {/* Sessions Table */}
              <div className="border border-border rounded-xl overflow-hidden">
                <div className="p-3 bg-secondary/30 border-b border-border flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Calendar size={14} className="text-emerald-500" /> Session-by-Session History
                  </span>
                  <span className="text-[11px] text-muted-foreground">{history.sessions.length} recorded classes</span>
                </div>

                {history.sessions.length === 0 ? (
                  <div className="p-6 text-center">
                    <GlassEmptyState title="No Sessions Yet" message="No attendance sessions have been conducted for this class." />
                  </div>
                ) : (
                  <div className="divide-y divide-border/50 max-h-72 overflow-y-auto">
                    {history.sessions.map((sessionLog) => (
                      <SessionLogRow key={sessionLog.session_id} log={sessionLog} />
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SessionLogRow({ log }: { log: StudentClassSessionLog }): React.ReactElement {
  const isPresent = log.status === "Present" || log.status === "Approved";
  const isFlagged = log.status === "Flagged";

  return (
    <div className="p-3.5 flex items-center justify-between hover:bg-secondary/30 transition-colors text-xs">
      <div className="flex items-center gap-3">
        <div className={`p-1.5 rounded-lg border ${
          isPresent
            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
            : isFlagged
            ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
            : "bg-rose-500/10 text-rose-400 border-rose-500/20"
        }`}>
          {isPresent ? <CheckCircle2 size={16} /> : isFlagged ? <AlertTriangle size={16} /> : <XCircle size={16} />}
        </div>
        <div>
          <div className="font-semibold text-foreground flex items-center gap-1.5">
            {log.session_name}
          </div>
          <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
            <span className="flex items-center gap-1"><Clock size={11} /> {new Date(log.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            {log.remarks && <span className="truncate max-w-[200px] text-muted-foreground/80">• {log.remarks}</span>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-right">
        {log.final_ai_score > 0 && (
          <span className="text-[10px] text-muted-foreground flex items-center gap-1 bg-secondary px-2 py-0.5 rounded border border-border/50">
            <ShieldCheck size={11} className="text-emerald-500" /> {(log.final_ai_score * 100).toFixed(0)}% Match
          </span>
        )}
        <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
          isPresent
            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
            : isFlagged
            ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
            : "bg-rose-500/15 text-rose-400 border-rose-500/30"
        }`}>
          {log.status}
        </span>
      </div>
    </div>
  );
}
