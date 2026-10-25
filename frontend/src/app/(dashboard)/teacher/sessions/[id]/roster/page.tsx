"use client";

import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { RefreshCw, ClipboardList, QrCode, Download } from "lucide-react";
import toast from "react-hot-toast";
import api, { getApiErrorMessage } from "@/lib/api";
import { getWebSocket } from "@/lib/websocket";
import GlassBreadcrumb from "@/components/ui/GlassBreadcrumb";
import GlassPageHeader from "@/components/ui/GlassPageHeader";
import GlassTable from "@/components/ui/GlassTable";
import GlassButton from "@/components/ui/GlassButton";
import GlassStatCard from "@/components/ui/GlassStatCard";
import GlassLoader from "@/components/ui/GlassLoader";
import GlassConfirmDialog from "@/components/ui/GlassConfirmDialog";
import SmartPassGeneratorModal from "@/components/scanner/SmartPassGeneratorModal";
import SmartPassScannerModal from "@/components/scanner/SmartPassScannerModal";
import { exportRosterToCSV } from "@/utils/exportUtils";
import { getRosterColumns } from "./roster-columns";
import type { SessionAttendanceResponse, StudentRosterItem, BulkMarkRequest } from "@/types";

export default function SessionRosterPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [roster, setRoster] = useState<SessionAttendanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [showConfirmBulk, setShowConfirmBulk] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);


  const fetchRoster = useCallback(async (): Promise<void> => {
    try {
      const { data } = await api.get<SessionAttendanceResponse>(`/teacher/sessions/${id}/attendance`);
      setRoster(data);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Failed to load roster"));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void (async () => {
      await fetchRoster();
    })();

    const ws = getWebSocket();
    ws.connect();
    const unsubscribe = ws.on("attendance_updated", () => {
      void fetchRoster();
    });

    intervalRef.current = setInterval(() => {
      void fetchRoster();
    }, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      unsubscribe();
    };
  }, [fetchRoster]);

  const handleOverride = useCallback(async (studentId: string, status: string): Promise<void> => {
    try {
      await api.post(`/teacher/sessions/${id}/override`, { student_id: studentId, status });
      toast.success(`Marked as ${status}`);
      await fetchRoster();
    } catch {
      toast.error("Failed to override attendance");
    }
  }, [id, fetchRoster]);

  async function handleBulkMarkConfirm(): Promise<void> {
    if (!roster) return;
    setShowConfirmBulk(false);
    const targets = roster.roster.filter((r) => r.status === "Absent" && r.marked_at === null);
    setMarkingAll(true);
    try {
      const payload: BulkMarkRequest = {
        records: targets.map((r) => ({ student_id: r.student_id, status: "Present" })),
      };
      await api.post(`/teacher/sessions/${id}/mark-bulk`, payload);
      toast.success(`${targets.length} student(s) marked Present`);
      await fetchRoster();
    } catch {
      toast.error("Bulk mark failed");
    } finally {
      setMarkingAll(false);
    }
  }

  const columns = useMemo(() => getRosterColumns({
    onOverride: (studentId, status) => void handleOverride(studentId, status),
  }), [handleOverride]);

  if (loading) return <GlassLoader text="Loading roster..." />;
  if (!roster) return <div className="text-center py-20 text-muted-foreground text-xs">Session not found</div>;

  const counts = roster.roster.reduce(
    (acc, r) => {
      if (r.status === "Present" || r.status === "Approved") acc.present++;
      else if (r.status === "Flagged") acc.flagged++;
      else if (r.status === "Absent") acc.absent++;
      return acc;
    },
    { present: 0, flagged: 0, absent: 0 }
  );

  return (
    <div className="animate-fade-in-up">
      <GlassBreadcrumb
        items={[
          { label: "Sessions", href: "/teacher/sessions" },
          { label: roster.class_name },
          { label: "Roster" },
        ]}
      />
      <GlassPageHeader
        title={`Live Roster — ${roster.class_name}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <GlassButton
              variant="primary"
              icon={<QrCode size={14} />}
              onClick={() => setShowQrModal(true)}
            >
              Smart Pass QR
            </GlassButton>
            <GlassButton
              variant="secondary"
              icon={<Download size={14} />}
              onClick={() => exportRosterToCSV(roster.class_name, roster.roster)}
            >
              Export CSV
            </GlassButton>
            <GlassButton
              variant="ghost"
              icon={<ClipboardList size={14} />}
              onClick={() => router.push(`/teacher/sessions/${id}/manual`)}
            >
              Manual Entry
            </GlassButton>
            <GlassButton
              variant="ghost"
              loading={markingAll}
              onClick={() => setShowConfirmBulk(true)}
            >
              Mark Absent → Present
            </GlassButton>
            <GlassButton
              variant="ghost"
              icon={<RefreshCw size={14} />}
              onClick={() => void fetchRoster()}
            >
              Refresh
            </GlassButton>
          </div>
        }
      />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <GlassStatCard icon={<span className="text-lg">✅</span>} label="Present" value={counts.present} accentColor="emerald" />
        <GlassStatCard icon={<span className="text-lg">⚠️</span>} label="Flagged" value={counts.flagged} accentColor="amber" />
        <GlassStatCard icon={<span className="text-lg">❌</span>} label="Absent" value={counts.absent} accentColor="rose" />
      </div>

      <GlassTable
        columns={columns}
        data={roster.roster as (StudentRosterItem & Record<string, unknown>)[]}
        emptyMessage="No students in roster"
        pageSize={20}
      />

      <SmartPassGeneratorModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        sessionId={id}
        className={roster.class_name}
        initialVerifiedCount={counts.present}
        onStudentVerified={() => {
          void fetchRoster();
        }}
      />

      <SmartPassScannerModal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        sessionId={id}
        onSuccess={() => {
          void fetchRoster();
        }}
      />


      <GlassConfirmDialog
        isOpen={showConfirmBulk}
        title="Mark All Absent as Present"
        message="Mark all unmarked absent students as Present?"
        confirmLabel="Mark All"
        variant="primary"
        onConfirm={handleBulkMarkConfirm}
        onCancel={() => setShowConfirmBulk(false)}
        loading={markingAll}
      />
    </div>
  );
}
