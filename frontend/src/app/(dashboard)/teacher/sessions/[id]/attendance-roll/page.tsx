"use client";

import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import api, { getApiErrorMessage } from "@/lib/api";
import { getWebSocket } from "@/lib/websocket";
import GlassBreadcrumb from "@/components/ui/GlassBreadcrumb";
import GlassTable from "@/components/ui/GlassTable";
import GlassLoader from "@/components/ui/GlassLoader";
import { exportAttendanceRollToCSV } from "@/utils/csvExport";
import { getAttendanceRollColumns } from "./AttendanceRollColumns";
import AttendanceRollActionsBar from "./AttendanceRollActionsBar";
import AttendanceRollSummaryBar from "./AttendanceRollSummaryBar";
import AttendanceRollSearchFilter, { type AttendanceRollFilterStatus } from "./AttendanceRollSearchFilter";
import AttendanceRollModals from "./AttendanceRollModals";
import { useAttendanceRollFilter } from "./useAttendanceRollFilter";
import type { SessionAttendanceResponse, SessionStudentAttendanceItem, BulkMarkRequest } from "@/types";

export default function SessionAttendanceRollPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const [sessionData, setSessionData] = useState<SessionAttendanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [showConfirmBulk, setShowConfirmBulk] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AttendanceRollFilterStatus>("all");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchAttendanceRoll = useCallback(async (): Promise<void> => {
    try {
      const { data } = await api.get<SessionAttendanceResponse>(`/teacher/sessions/${id}/attendance`);
      setSessionData(data);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Failed to load attendance roll"));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void (async () => {
      await fetchAttendanceRoll();
    })();

    const ws = getWebSocket();
    ws.connect();
    const unsubscribe = ws.on("attendance_updated", () => {
      void fetchAttendanceRoll();
    });

    intervalRef.current = setInterval(() => {
      void fetchAttendanceRoll();
    }, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      unsubscribe();
    };
  }, [fetchAttendanceRoll]);

  const rollItems = useMemo(
    () => sessionData?.attendance_roll || sessionData?.roster || [],
    [sessionData]
  );

  const { counts, filteredItems } = useAttendanceRollFilter({
    rollItems,
    statusFilter,
    searchQuery,
  });

  const handleOverride = useCallback(
    async (studentId: string, targetStatus: string): Promise<void> => {
      try {
        await api.post(`/teacher/sessions/${id}/override`, {
          student_id: studentId,
          status: targetStatus,
        });
        toast.success(`Marked as ${targetStatus}`);
        await fetchAttendanceRoll();
      } catch (err: unknown) {
        toast.error(getApiErrorMessage(err, "Failed to update attendance"));
      }
    },
    [id, fetchAttendanceRoll]
  );

  const handleBulkMarkConfirm = useCallback(async (): Promise<void> => {
    if (!sessionData) return;
    setMarkingAll(true);
    try {
      const absentStudents = rollItems.filter((r) => r.status === "Absent");
      if (absentStudents.length === 0) {
        toast("No absent students to mark.", { icon: "ℹ️" });
        return;
      }
      const bulkPayload: BulkMarkRequest = {
        records: absentStudents.map((s) => ({
          student_id: s.student_id,
          status: "Present",
        })),
      };
      await api.post(`/teacher/sessions/${id}/mark-bulk`, bulkPayload);
      toast.success(`Marked ${absentStudents.length} student(s) as Present`);
      await fetchAttendanceRoll();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Failed to bulk mark attendance"));
    } finally {
      setMarkingAll(false);
      setShowConfirmBulk(false);
    }
  }, [sessionData, rollItems, id, fetchAttendanceRoll]);


  const columns = useMemo(() => getAttendanceRollColumns({ onOverride: handleOverride }), [handleOverride]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <GlassLoader text="Loading attendance roll..." />
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p>Attendance roll not found or session does not exist.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <GlassBreadcrumb
        items={[
          { label: "Dashboard", href: "/teacher" },
          { label: "Sessions", href: "/teacher/sessions" },
          { label: sessionData.class_name },
          { label: "Attendance Roll" },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#e3e1dc]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#28363b] tracking-tight">Live Attendance Roll</h1>
          <p className="text-xs sm:text-sm text-[#526f78] mt-0.5">{sessionData.class_name}</p>
        </div>
        <AttendanceRollActionsBar
          markingAll={markingAll}
          onOpenQr={() => setShowQrModal(true)}
          onExportCsv={() => exportAttendanceRollToCSV(sessionData.class_name, rollItems)}
          onMarkAllPresent={() => setShowConfirmBulk(true)}
          onRefresh={() => void fetchAttendanceRoll()}
        />
      </div>

      <AttendanceRollSummaryBar total={counts.all} present={counts.present} absent={counts.absent} flagged={counts.flagged} />

      <AttendanceRollSearchFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        counts={counts}
      />

      <GlassTable
        columns={columns}
        data={filteredItems as (SessionStudentAttendanceItem & Record<string, unknown>)[]}
        emptyMessage="No students match the selected filter."
        pageSize={25}
      />

      <AttendanceRollModals
        showQrModal={showQrModal}
        onCloseQrModal={() => setShowQrModal(false)}
        sessionId={id}
        className={sessionData.class_name}
        presentCount={counts.present}
        onStudentVerified={() => void fetchAttendanceRoll()}
        showScanner={showScanner}
        onCloseScanner={() => setShowScanner(false)}
        showConfirmBulk={showConfirmBulk}
        onCloseConfirmBulk={() => setShowConfirmBulk(false)}
        onConfirmBulk={handleBulkMarkConfirm}
        markingAll={markingAll}
      />
    </div>
  );
}

