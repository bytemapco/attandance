"use client";

import React from "react";
import { AlertTriangle, Clock, Maximize2, Play, QrCode, X } from "lucide-react";
import GlassBadge from "@/components/ui/GlassBadge";
import GlassButton from "@/components/ui/GlassButton";
import type { OccurrenceQrData } from "@/types";
import type { OccurrenceState } from "../occurrenceState";
import QrCodeTile from "./QrCodeTile";
import type { Counts } from "./registerStatus";
import ShortcutHints from "./ShortcutHints";
import { useRotatingQr } from "./useRotatingQr";

interface SessionPanelProps {
  occurrenceId: string;
  state: OccurrenceState;
  counts: Counts;
  closesAt?: string | null;
  starting: boolean;
  fullscreen: boolean;
  onStart: () => void;
  onFullscreenChange: (open: boolean) => void;
}

function closingTime(iso?: string | null): string | null {
  return iso ? new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }) : null;
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }): React.ReactElement {
  return (
    <div className="rounded-[10px] bg-secondary px-3 py-2">
      <p className="text-lg font-semibold tabular-nums leading-tight text-foreground">{value}</p>
      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
        {icon}
        {label}
      </p>
    </div>
  );
}

function Progress({ counts }: { counts: Counts }): React.ReactElement {
  const percent = counts.ALL > 0 ? Math.round((counts.PRESENT / counts.ALL) * 100) : 0;
  return (
    <div>
      <p className="text-4xl font-bold tabular-nums leading-none text-foreground">
        {counts.PRESENT}
        <span className="ml-1.5 text-base font-medium text-muted-foreground">of {counts.ALL} present</span>
      </p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Students present">
        <div className="h-full rounded-full bg-success transition-all duration-500" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function Stats({ counts }: { counts: Counts }): React.ReactElement {
  return (
    <div className="grid grid-cols-3 gap-2">
      <Stat icon={<Clock size={12} />} label="Waiting" value={counts.WAITING} />
      <Stat icon={<AlertTriangle size={12} />} label="To verify" value={counts.FLAGGED} />
      <Stat icon={<X size={12} />} label="Absent" value={counts.ABSENT} />
    </div>
  );
}

function FullscreenView({ qr, failed, counts, onClose }: { qr: OccurrenceQrData | null; failed: boolean; counts: Counts; onClose: () => void }): React.ReactElement {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background p-6" role="dialog" aria-label="Attendance QR code, full screen">
      <p className="text-2xl font-bold text-foreground">Scan to mark your attendance</p>
      <div className="w-full max-w-md">
        <QrCodeTile qr={qr} failed={failed} />
      </div>
      <p className="text-3xl font-bold tabular-nums text-foreground">
        {counts.PRESENT} <span className="text-lg font-medium text-muted-foreground">of {counts.ALL} present</span>
      </p>
      <GlassButton variant="secondary" size="md" icon={<X size={15} />} onClick={onClose}>
        Close <kbd className="ml-1 rounded border border-border px-1.5 text-[11px] text-muted-foreground">Esc</kbd>
      </GlassButton>
    </div>
  );
}

export default function SessionPanel({
  occurrenceId, state, counts, closesAt, starting, fullscreen, onStart, onFullscreenChange,
}: SessionPanelProps): React.ReactElement {
  const live = state === "LIVE";
  const { qr, failed } = useRotatingQr(occurrenceId, live);
  const closes = closingTime(closesAt);

  if (live && fullscreen) return <FullscreenView qr={qr} failed={failed} counts={counts} onClose={() => onFullscreenChange(false)} />;

  return (
    <aside className="flex flex-col gap-5 rounded-[14px] border border-border bg-card p-5 shadow-[0_2px_8px_rgba(40,54,59,0.05)] lg:min-h-0 lg:overflow-y-auto">
      {live && (
        <>
          <div className="flex items-center justify-between gap-2">
            <GlassBadge variant="success" icon={<span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden />}>Live</GlassBadge>
            <button
              type="button"
              onClick={() => onFullscreenChange(true)}
              className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md px-2 text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring outline-none"
            >
              <Maximize2 size={14} /> Full screen
              <kbd className="rounded border border-border px-1.5 text-[11px] font-medium">F</kbd>
            </button>
          </div>
          <QrCodeTile qr={qr} failed={failed} />
        </>
      )}
      {state === "NOT_STARTED" && (
        <div className="flex flex-col items-center gap-3 rounded-[10px] border border-dashed border-border px-4 py-8 text-center">
          <QrCode size={28} className="text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">Attendance hasn&apos;t started</p>
          <p className="text-xs text-muted-foreground">Start to show the QR code and let students mark themselves.</p>
          <GlassButton variant="primary" size="md" loading={starting} icon={<Play size={14} />} onClick={onStart}>
            Start attendance
          </GlassButton>
        </div>
      )}
      <Progress counts={counts} />
      <Stats counts={counts} />
      {live && closes && <p className="text-xs text-muted-foreground">Students can mark until {closes}.</p>}
      {state === "COMPLETED" && <p className="text-xs text-muted-foreground">Attendance is submitted and locked.</p>}
      {live && <ShortcutHints />}
    </aside>
  );
}
