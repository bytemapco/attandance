import React from "react";
import { useRouter } from "next/navigation";
import { Users, BookOpen, Square, QrCode } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import GlassBadge from "@/components/ui/GlassBadge";
import GlassButton from "@/components/ui/GlassButton";
import type { SessionWithClassResponse } from "@/types";

interface ActiveSessionsCardProps {
  sessions: SessionWithClassResponse[];
  onStop: (id: string) => void;
  onOpenQr?: (session: SessionWithClassResponse) => void;
}

export default function ActiveSessionsCard({
  sessions,
  onStop,
  onOpenQr,
}: ActiveSessionsCardProps): React.ReactElement {
  const router = useRouter();

  return (
    <GlassCard>
      <h3 className="text-base font-semibold text-foreground mb-4">Active Sessions</h3>
      {sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No active sessions</p>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const endTimeStr = new Date(session.endTime).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={session.id}
                className="p-4 rounded-xl border border-border bg-card shadow-2xs flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <GlassBadge variant="success">Live</GlassBadge>
                      <h4 className="text-sm font-semibold text-foreground truncate">
                        {session.class_name || "Class Session"}
                      </h4>
                    </div>
                    {session.subject && (
                      <p className="text-xs text-muted-foreground truncate">{session.subject}</p>
                    )}
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground bg-[#28363b]/5 border border-[#e3e1dc] px-2.5 py-1 rounded-lg shrink-0">
                    Ends at {endTimeStr}
                  </span>
                </div>

                <div className="pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {onOpenQr && (
                      <GlassButton
                        variant="primary"
                        size="sm"
                        icon={<QrCode size={14} />}
                        onClick={() => onOpenQr(session)}
                      >
                        Smart Pass QR
                      </GlassButton>
                    )}
                    <GlassButton
                      variant="ghost"
                      size="sm"
                      icon={<Users size={14} />}
                      onClick={() => router.push(`/teacher/sessions/${session.id}/attendance-roll`)}
                    >
                      Live Attendance
                    </GlassButton>
                    <GlassButton
                      variant="ghost"
                      size="sm"
                      icon={<BookOpen size={14} />}
                      onClick={() => router.push(`/teacher/sessions/${session.id}/manual`)}
                    >
                      Manual Entry
                    </GlassButton>
                  </div>
                  <GlassButton
                    variant="danger"
                    size="sm"
                    onClick={() => onStop(session.id)}
                    icon={<Square size={14} />}
                  >
                    End Session
                  </GlassButton>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
}
